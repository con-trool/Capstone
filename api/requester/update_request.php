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
    
    $request_id = $input['request_id'] ?? '';
    $academic_year = $input['academic_year'] ?? '';
    $budget_title = $input['budget_title'] ?? '';
    $description = $input['description'] ?? '';
    $fund_account = $input['fund_account'] ?? '';
    $fund_name = $input['fund_name'] ?? '';
    $duration = $input['duration'] ?? 'Annually';

    if (empty($request_id) || empty($academic_year) || empty($budget_title) || empty($description)) {
        echo json_encode(['success' => false, 'message' => 'Required fields are missing']);
        exit;
    }

    $pdo = new PDO("mysql:host=localhost;dbname=budget_database_schema", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    try {
        // Check if user owns this request
        $stmt = $pdo->prepare("SELECT account_id FROM budget_request WHERE request_id = ?");
        $stmt->execute([$request_id]);
        $request = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$request || $request['account_id'] != $_SESSION['user_id']) {
            echo json_encode(['success' => false, 'message' => 'Request not found or unauthorized']);
            exit;
        }

        // Update request
        $stmt = $pdo->prepare("
            UPDATE budget_request 
            SET academic_year = ?, budget_title = ?, description = ?, fund_account = ?, fund_name = ?, duration = ?
            WHERE request_id = ? AND account_id = ?
        ");
        
        $stmt->execute([
            $academic_year,
            $budget_title,
            $description,
            $fund_account,
            $fund_name,
            $duration,
            $request_id,
            $_SESSION['user_id']
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Budget request updated successfully'
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
