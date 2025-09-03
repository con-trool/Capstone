<?php
session_start();
require '../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$request_id = $_GET['request_id'] ?? '';

if (empty($request_id)) {
    echo json_encode(['success' => false, 'message' => 'Request ID is required']);
    exit;
}

$pdo = new PDO("mysql:host=localhost;dbname=budget_database_schema", "root", "");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    // Get basic request details
    $stmt = $pdo->prepare("SELECT * FROM budget_request WHERE request_id = ?");
    $stmt->execute([$request_id]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request) {
        echo json_encode(['success' => false, 'message' => 'Request not found']);
        exit;
    }

    // Check if user has access to this request
    $user_id = $_SESSION['user_id'];
    $user_role = $_SESSION['role'];
    
    // Requester can only see their own requests
    if ($user_role === 'requester' && $request['account_id'] != $user_id) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    // Get budget entries
    $stmt = $pdo->prepare("SELECT * FROM budget_entries WHERE request_id = ? ORDER BY row_num");
    $stmt->execute([$request_id]);
    $budget_entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get approval history
    $stmt = $pdo->prepare("
        SELECT ap.*, a.name as approver_name, a.username_email as approver_email
        FROM approval_progress ap
        LEFT JOIN account a ON ap.approver_id = a.id
        WHERE ap.request_id = ?
        ORDER BY ap.timestamp ASC
    ");
    $stmt->execute([$request_id]);
    $approval_history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get amendments (schema uses created_timestamp, not created_at)
    $stmt = $pdo->prepare("SELECT * FROM budget_amendments WHERE request_id = ? ORDER BY created_timestamp DESC");
    $stmt->execute([$request_id]);
    $amendments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'details' => [
            ...$request,
            'budget_entries' => $budget_entries,
            'approval_history' => $approval_history,
            'amendments' => $amendments
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
