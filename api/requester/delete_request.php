<?php
session_start();
require '../../db_supabase.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'requester') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $request_id = $input['request_id'] ?? '';

    if (empty($request_id)) {
        echo json_encode(['success' => false, 'message' => 'Request ID is required']);
        exit;
    }

    try {
        // Check if user owns this request
        $stmt = $conn->prepare("SELECT account_id FROM budget_database_schema.budget_request WHERE request_id = ?");
        $stmt->execute([$request_id]);
        $request = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$request || $request['account_id'] != $_SESSION['user_id']) {
            echo json_encode(['success' => false, 'message' => 'Request not found or unauthorized']);
            exit;
        }

        // Check if request can be deleted (only pending requests that haven't been processed)
        $stmt = $conn->prepare("SELECT status FROM budget_database_schema.budget_request WHERE request_id = ?");
        $stmt->execute([$request_id]);
        $status = $stmt->fetchColumn();

        if ($status !== 'pending') {
            echo json_encode(['success' => false, 'message' => 'Only pending requests can be deleted']);
            exit;
        }

        // Start transaction
        $conn->beginTransaction();

        // Delete related records
        $conn->prepare("DELETE FROM budget_database_schema.budget_amendments WHERE request_id = ?")->execute([$request_id]);
        $conn->prepare("DELETE FROM budget_database_schema.approval_progress WHERE request_id = ?")->execute([$request_id]);
        $conn->prepare("DELETE FROM budget_database_schema.budget_entries WHERE request_id = ?")->execute([$request_id]);
        $conn->prepare("DELETE FROM budget_database_schema.budget_request WHERE request_id = ?")->execute([$request_id]);

        $conn->commit();

        echo json_encode(['success' => true, 'message' => 'Request deleted successfully']);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error deleting request: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
