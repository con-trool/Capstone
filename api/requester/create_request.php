<?php
session_start();
require '../../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'requester') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $academic_year = $input['academic_year'] ?? '';
    $budget_title = $input['budget_title'] ?? '';
    $description = $input['description'] ?? '';
    $fund_account = $input['fund_account'] ?? '';
    $fund_name = $input['fund_name'] ?? '';
    $duration = $input['duration'] ?? 'Annually';

    if (empty($academic_year) || empty($budget_title) || empty($description)) {
        echo json_encode(['success' => false, 'message' => 'Required fields are missing']);
        exit;
    }

    $pdo = new PDO("mysql:host=localhost;dbname=budget_database_schema", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    try {
        // Generate request ID
        $request_id = 'BR-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 4));
        
        // Insert budget request
        $stmt = $pdo->prepare("
            INSERT INTO budget_request 
            (request_id, account_id, academic_year, budget_title, description, fund_account, fund_name, duration, status, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        
        $stmt->execute([
            $request_id,
            $_SESSION['user_id'],
            $academic_year,
            $budget_title,
            $description,
            $fund_account,
            $fund_name,
            $duration
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Budget request created successfully',
            'request_id' => $request_id
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
