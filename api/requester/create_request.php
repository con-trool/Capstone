<?php
session_start();
require '../../db_supabase.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'requester') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle FormData (multipart/form-data) from React component
    $academic_year = $_POST['academic_year'] ?? '';
    $budget_title = $_POST['budget_title'] ?? '';
    $description = $_POST['description'] ?? '';
    $fund_account = $_POST['fund_account'] ?? '';
    $fund_name = $_POST['fund_name'] ?? '';
    $duration = $_POST['duration'] ?? 'Annually';
    $campus = $_POST['campus'] ?? '';
    $department = $_POST['department'] ?? '';
    
    // Parse budget entries from JSON string
    $budget_entries = [];
    if (!empty($_POST['budget_entries'])) {
        $budget_entries = json_decode($_POST['budget_entries'], true) ?? [];
    }

    // Enhanced validation
    if (empty($academic_year) || empty($budget_title) || empty($description) || 
        empty($fund_account) || empty($fund_name) || empty($campus) || empty($department)) {
        echo json_encode(['success' => false, 'message' => 'Required fields are missing']);
        exit;
    }
    
    if (empty($budget_entries)) {
        echo json_encode(['success' => false, 'message' => 'At least one budget entry is required']);
        exit;
    }

    try {
        // Start transaction
        $conn->beginTransaction();
        
        // Generate request ID
        $request_id = 'BR-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 4));
        
        // Calculate total budget
        $total_budget = 0;
        foreach ($budget_entries as $entry) {
            $total_budget += floatval($entry['amount'] ?? 0);
        }
        
        // Insert budget request
        $stmt = $conn->prepare("
            INSERT INTO budget_database_schema.budget_request 
            (request_id, account_id, academic_year, budget_title, description, fund_account, fund_name, duration, 
             campus_code, department_code, proposed_budget, status, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        ");
        
        $stmt->execute([
            $request_id,
            $_SESSION['user_id'],
            $academic_year,
            $budget_title,
            $description,
            $fund_account,
            $fund_name,
            $duration,
            $campus,
            $department,
            $total_budget
        ]);

        // Insert budget entries
        $stmt = $conn->prepare("
            INSERT INTO budget_database_schema.budget_entries 
            (request_id, row_num, gl_code, budget_description, remarks, amount) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($budget_entries as $index => $entry) {
            $stmt->execute([
                $request_id,
                $index + 1,
                $entry['gl_code'] ?? '',
                $entry['label'] ?? '',
                $entry['remarks'] ?? '',
                floatval($entry['amount'] ?? 0)
            ]);
        }

        // Handle file uploads if any
        if (!empty($_FILES)) {
            $upload_dir = '../../uploads/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            
            foreach ($_FILES as $key => $file) {
                if (is_array($file['name'])) {
                    // Handle multiple files
                    for ($i = 0; $i < count($file['name']); $i++) {
                        if ($file['error'][$i] === UPLOAD_ERR_OK) {
                            $filename = uniqid() . '_' . $file['name'][$i];
                            $filepath = $upload_dir . $filename;
                            
                            if (move_uploaded_file($file['tmp_name'][$i], $filepath)) {
                                // Insert attachment record
                                $stmt = $conn->prepare("
                                    INSERT INTO budget_database_schema.attachments 
                                    (request_id, original_filename, filename, file_size, uploaded_by, upload_timestamp) 
                                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                                ");
                                $stmt->execute([
                                    $request_id,
                                    $file['name'][$i],
                                    $filename,
                                    $file['size'][$i],
                                    $_SESSION['user_id']
                                ]);
                            }
                        }
                    }
                } else {
                    // Handle single file
                    if ($file['error'] === UPLOAD_ERR_OK) {
                        $filename = uniqid() . '_' . $file['name'];
                        $filepath = $upload_dir . $filename;
                        
                        if (move_uploaded_file($file['tmp_name'], $filepath)) {
                            // Insert attachment record
                            $stmt = $conn->prepare("
                                INSERT INTO budget_database_schema.attachments 
                                (request_id, original_filename, filename, file_size, uploaded_by, upload_timestamp) 
                                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                            ");
                            $stmt->execute([
                                $request_id,
                                $file['name'],
                                $filename,
                                $file['size'],
                                $_SESSION['user_id']
                            ]);
                        }
                    }
                }
            }
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Budget request created successfully',
            'request_id' => $request_id
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
