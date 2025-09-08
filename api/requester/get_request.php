<?php
session_start();
require '../../db_supabase.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'requester') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$request_id = $_GET['request_id'] ?? '';

if (empty($request_id)) {
    echo json_encode(['success' => false, 'message' => 'Request ID is required']);
    exit;
}

try {
    // Get request details
    $stmt = $conn->prepare("SELECT * FROM budget_database_schema.budget_request WHERE request_id = ? AND account_id = ?");
    $stmt->execute([$request_id, $_SESSION['user_id']]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request) {
        echo json_encode(['success' => false, 'message' => 'Request not found or unauthorized']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'request' => $request
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
