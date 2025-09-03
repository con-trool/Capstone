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

    // Determine assignment and whether current user can act
    $can_act = false;
    $current_level_status = null;
    $assigned_approver = [
        'id' => null,
        'name' => null,
        'email' => null,
        'role' => null
    ];
    $stmt = $pdo->prepare("SELECT ap.status, ap.approver_id, a.name, a.username_email, a.role
                            FROM approval_progress ap
                            LEFT JOIN account a ON ap.approver_id = a.id
                            WHERE ap.request_id = ? AND ap.approval_level = ?
                            LIMIT 1");
    $stmt->execute([$request_id, $request['current_approval_level']]);
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $current_level_status = $row['status'];
        $assigned_approver = [
            'id' => $row['approver_id'],
            'name' => $row['name'],
            'email' => $row['username_email'],
            'role' => $row['role']
        ];

        // Lazy auto-assignment: if pending level has no approver, assign based on workflow rules
        if ($current_level_status === 'pending' && empty($row['approver_id'])) {
            // Find expected role for this department and level
            $stmtRole = $pdo->prepare("SELECT approver_role FROM approval_workflow WHERE department_code = ? AND approval_level = ? LIMIT 1");
            $stmtRole->execute([$request['department_code'], $request['current_approval_level']]);
            $expected_role = $stmtRole->fetchColumn();

            if ($expected_role) {
                // Prefer approver in same department
                $stmtAcc = $pdo->prepare("SELECT id, name, username_email, role FROM account WHERE role = ? AND department_code = ? LIMIT 1");
                $stmtAcc->execute([$expected_role, $request['department_code']]);
                $acc = $stmtAcc->fetch(PDO::FETCH_ASSOC);

                if (!$acc) {
                    // Fallback: any user with that role
                    $stmtAcc = $pdo->prepare("SELECT id, name, username_email, role FROM account WHERE role = ? LIMIT 1");
                    $stmtAcc->execute([$expected_role]);
                    $acc = $stmtAcc->fetch(PDO::FETCH_ASSOC);
                }

                if ($acc) {
                    $upd = $pdo->prepare("UPDATE approval_progress SET approver_id = ? WHERE request_id = ? AND approval_level = ?");
                    $upd->execute([$acc['id'], $request_id, $request['current_approval_level']]);
                    $assigned_approver = [
                        'id' => $acc['id'],
                        'name' => $acc['name'],
                        'email' => $acc['username_email'],
                        'role' => $acc['role']
                    ];
                    // Re-evaluate can_act after assignment
                    if (isset($_SESSION['user_id'])) {
                        $can_act = ((int)$_SESSION['user_id'] === (int)$acc['id'] && $request['status'] === 'pending');
                    }
                } else {
                    // No concrete user, at least expose expected role
                    $assigned_approver['role'] = $expected_role;
                }
            }
        }
        // Evaluate capability: by assignment OR expected role match when unassigned
        $stmtRole2 = $pdo->prepare("SELECT approver_role FROM approval_workflow WHERE department_code = ? AND approval_level = ? LIMIT 1");
        $stmtRole2->execute([$request['department_code'], $request['current_approval_level']]);
        $expected_role2 = $stmtRole2->fetchColumn();
        if (isset($_SESSION['user_id'])) {
            $is_assigned_to_me = !empty($assigned_approver['id']) && (int)$assigned_approver['id'] === (int)$_SESSION['user_id'];
            $matches_role_and_unassigned = empty($assigned_approver['id']) && $expected_role2 && $expected_role2 === $_SESSION['role'];
            $can_act = ($request['status'] === 'pending' && $current_level_status === 'pending' && ($is_assigned_to_me || $matches_role_and_unassigned));
        }
    }

    echo json_encode([
        'success' => true,
        'details' => [
            ...$request,
            'budget_entries' => $budget_entries,
            'approval_history' => $approval_history,
            'amendments' => $amendments,
            'can_act' => $can_act,
            'current_level_status' => $current_level_status,
            'assigned_approver' => $assigned_approver
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
