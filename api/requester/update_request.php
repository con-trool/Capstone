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

        // If this request was in 'more_info_requested', resume the workflow
        require_once '../../workflow_manager.php';
        $workflow = new WorkflowManager($pdo);

        // Find the level that requested info
        $stmt = $pdo->prepare("SELECT approval_level FROM approval_progress WHERE request_id = ? AND status = 'request_info' ORDER BY approval_level DESC LIMIT 1");
        $stmt->execute([$request_id]);
        $requesting_level = $stmt->fetchColumn();

        if (!empty($requesting_level)) {
            $workflow->resumeWorkflowAfterInfoProvidedWithTransaction($request_id, (int)$requesting_level);
        } else {
            // Fallback: if status is still more_info_requested but no row flagged, push back to pending
            $stmt = $pdo->prepare("UPDATE budget_request SET status = 'pending' WHERE request_id = ? AND status = 'more_info_requested'");
            $stmt->execute([$request_id]);
            // Reset any request_info rows just in case
            $stmt = $pdo->prepare("UPDATE approval_progress SET status = 'pending' WHERE request_id = ? AND status = 'request_info'");
            $stmt->execute([$request_id]);
        }

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
