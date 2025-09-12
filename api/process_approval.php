<?php
session_start();
require '../db_supabase.php';
header('Content-Type: application/json');

$allowed_roles = ['approver', 'department_head', 'dean', 'vp_finance'];
if (!isset($_SESSION['username']) || !in_array($_SESSION['role'], $allowed_roles)) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

require_once __DIR__ . '/workflow_manager.php';
$workflow = new WorkflowManager($conn);

$request_id = $_POST['request_id'] ?? '';
$action = $_POST['action'] ?? '';
$comments = $_POST['comments'] ?? '';
$approved_amounts = $_POST['approved_amounts'] ?? [];

if (empty($request_id) || empty($action)) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT id FROM budget_database_schema.account WHERE username_email = ?");
    $stmt->execute([$_SESSION['username']]);
    $approver_id = $stmt->fetchColumn();

    if (!$approver_id) {
        throw new Exception('Approver not found');
    }

    $stmt = $conn->prepare("
        SELECT br.*, ap.status as approval_status, ap.approver_id, ap.approval_level 
        FROM budget_database_schema.budget_request br
        LEFT JOIN budget_database_schema.approval_progress ap ON br.request_id = ap.request_id 
            AND ap.approval_level = br.current_approval_level 
        WHERE br.request_id = ?
    ");
    $stmt->execute([$request_id]);
    $request_data = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request_data) {
        throw new Exception('Request not found or you are not authorized to approve it');
    }

    if (is_null($request_data['current_approval_level'])) {
        $workflow->initializeWorkflow($request_id);
    }

    if ($request_data['approval_status'] !== 'pending') {
        throw new Exception('This request is not pending your approval');
    }

    // If pending but assigned to different approver, allow reassignment when current user matches expected role
    if (!empty($request_data['approver_id']) && (int)$request_data['approver_id'] !== (int)$approver_id) {
        $stmt = $conn->prepare("SELECT approver_role FROM budget_database_schema.approval_workflow WHERE department_code = ? AND approval_level = ? LIMIT 1");
        $stmt->execute([$request_data['department_code'], $request_data['approval_level']]);
        $expected_role = $stmt->fetchColumn();

        if ($expected_role && $expected_role === $_SESSION['role']) {
            $stmt = $conn->prepare("UPDATE budget_database_schema.approval_progress SET approver_id = ? WHERE request_id = ? AND approval_level = ?");
            $stmt->execute([$approver_id, $request_id, $request_data['approval_level']]);
        } else {
            throw new Exception('This request is assigned to a different approver');
        }
    }

    // If row exists but is unassigned (NULL approver_id), assign to current user when role matches expected
    if (empty($request_data['approver_id'])) {
        $stmt = $conn->prepare("SELECT approver_role FROM budget_database_schema.approval_workflow WHERE department_code = ? AND approval_level = ? LIMIT 1");
        $stmt->execute([$request_data['department_code'], $request_data['approval_level']]);
        $expected_role = $stmt->fetchColumn();
        if ($expected_role && $expected_role === $_SESSION['role']) {
            $stmt = $conn->prepare("UPDATE budget_database_schema.approval_progress SET approver_id = ? WHERE request_id = ? AND approval_level = ?");
            $stmt->execute([$approver_id, $request_id, $request_data['approval_level']]);
        }
    }

    if ($request_data['workflow_complete']) {
        throw new Exception('Request workflow has already been completed');
    }

    if ($_SESSION['role'] === 'vp_finance' && $action === 'approve' && !empty($approved_amounts)) {
        foreach ($approved_amounts as $row_num => $approved_amount) {
            if (!empty($approved_amount) && is_numeric($approved_amount) && $approved_amount > 0) {
                $stmt = $conn->prepare("UPDATE budget_database_schema.budget_entries SET approved_amount = ? WHERE request_id = ? AND row_num = ?");
                $stmt->execute([$approved_amount, $request_id, $row_num]);
            }
        }

        $stmt = $conn->prepare("SELECT COALESCE(SUM(CASE WHEN approved_amount IS NOT NULL THEN approved_amount ELSE amount END), 0) as total_approved FROM budget_database_schema.budget_entries WHERE request_id = ?");
        $stmt->execute([$request_id]);
        $total_approved = $stmt->fetchColumn();

        if ($total_approved > 0) {
            $stmt = $conn->prepare("UPDATE budget_database_schema.budget_request SET approved_budget = ? WHERE request_id = ?");
            $stmt->execute([$total_approved, $request_id]);
        }
    }

    $success = $workflow->processApproval($request_id, $approver_id, $action, $comments);

    if (!$success) {
        // Gather debug context to help troubleshoot why it failed
        $dbg = [];
        $dbg['request_data'] = $request_data;
        $dbg['session_role'] = $_SESSION['role'] ?? null;
        $dbg['approver_id'] = $approver_id;
        // Snapshot current level rows
        $stDbg = $conn->prepare("SELECT * FROM budget_database_schema.approval_progress WHERE request_id = ? AND approval_level = ? ORDER BY approver_id NULLS FIRST");
        $stDbg->execute([$request_id, $request_data['approval_level']]);
        $dbg['approval_progress_rows'] = $stDbg->fetchAll(PDO::FETCH_ASSOC);

        $dbg['workflow_last_error'] = $workflow->lastError ?? null;
        echo json_encode(['success' => false, 'message' => 'Failed to process approval for request ' . $request_id, 'debug' => $dbg]);
        exit;
    }

    $stmt = $conn->prepare("SELECT status, current_approval_level, total_approval_levels, workflow_complete FROM budget_database_schema.budget_request WHERE request_id = ?");
    $stmt->execute([$request_id]);
    $updated_request = $stmt->fetch(PDO::FETCH_ASSOC);

    $success_messages = [
        'approve' => $updated_request['workflow_complete'] ? 'Request has been fully approved and completed' : 'Request approved and forwarded to next approval level (' . $updated_request['current_approval_level'] . '/' . $updated_request['total_approval_levels'] . ')',
        'reject' => 'Request has been rejected',
        'request_info' => 'Information request sent to requester'
    ];

    echo json_encode([
        'success' => true,
        'message' => $success_messages[$action] ?? 'Action completed',
        'workflow_status' => [
            'current_level' => $updated_request['current_approval_level'],
            'total_levels' => $updated_request['total_approval_levels'],
            'complete' => $updated_request['workflow_complete'],
            'status' => $updated_request['status']
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


