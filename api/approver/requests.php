<?php
session_start();
require '../../db.php';
header('Content-Type: application/json');

$allowed_roles = ['approver', 'department_head', 'dean', 'vp_finance'];
if (!isset($_SESSION['username']) || !in_array($_SESSION['role'], $allowed_roles)) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$pdo = new PDO("mysql:host=localhost;dbname=budget_database_schema", "root", "");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

require_once '../../workflow_manager.php';
$workflow = new WorkflowManager($pdo);

$username = $_SESSION['username'];
$stmt = $pdo->prepare("SELECT id FROM account WHERE username_email = ?");
$stmt->execute([$username]);
$approver_id = $stmt->fetchColumn();

// Handle filter parameters
$status_filter = $_GET['status'] ?? 'all';
$search_query = $_GET['search'] ?? '';
$sort_by = $_GET['sort'] ?? 'latest';
$view_mode = $_GET['view'] ?? ($_SESSION['role'] === 'vp_finance' ? 'all' : 'pending');

if ($view_mode === 'pending') {
    // Show only requests that this approver can act on
    $requests = $workflow->getRequestsForApprover($approver_id);
    
    // Apply additional filters to pending requests
    if ($status_filter !== 'all' || !empty($search_query)) {
        $requests = array_filter($requests, function($req) use ($status_filter, $search_query) {
            $status_match = ($status_filter === 'all') || (strtolower($req['status']) === $status_filter);
            $search_match = empty($search_query) || 
                           stripos($req['request_id'], $search_query) !== false ||
                           stripos($req['requester_name'], $search_query) !== false ||
                           stripos($req['college'], $search_query) !== false;
            return $status_match && $search_match;
        });
    }
} else {
    // Show all requests (for reference/history)
    if ($_SESSION['role'] === 'vp_finance') {
        // VP Finance can see ALL requests regardless of approval workflow
        $sql = "SELECT br.*, a.name as requester_name, a.username_email as requester_email, 
                       d.college, d.budget_deck, 'vp_finance' as user_role,
                       COALESCE(ba_count.amendment_count, 0) as amendment_count
                FROM budget_request br 
                LEFT JOIN account a ON br.account_id = a.id 
                LEFT JOIN department d ON br.department_code = d.code 
                LEFT JOIN (
                    SELECT request_id, COUNT(*) as amendment_count 
                    FROM budget_amendments 
                    GROUP BY request_id
                ) ba_count ON br.request_id = ba_count.request_id
                WHERE 1=1";
        $params = [];
    } else {
        // Other roles see requests based on approval workflow
        $sql = "SELECT br.*, a.name as requester_name, a.username_email as requester_email, 
                       d.college, d.budget_deck,
                       CASE WHEN ap.approver_id = ? AND ap.status = 'pending' THEN 'can_approve' ELSE 'view_only' END as user_role,
                       COALESCE(ba_count.amendment_count, 0) as amendment_count
                FROM budget_request br 
                LEFT JOIN account a ON br.account_id = a.id 
                LEFT JOIN department d ON br.department_code = d.code 
                LEFT JOIN approval_progress ap ON br.request_id = ap.request_id 
                    AND ap.approval_level = br.current_approval_level 
                    AND ap.approver_id = ?
                LEFT JOIN (
                    SELECT request_id, COUNT(*) as amendment_count 
                    FROM budget_amendments 
                    GROUP BY request_id
                ) ba_count ON br.request_id = ba_count.request_id
                WHERE 1=1";
        $params = [$approver_id, $approver_id];
    }

    if ($status_filter !== 'all') {
        $sql .= " AND br.status = ?";
        $params[] = $status_filter;
    }

    if (!empty($search_query)) {
        $sql .= " AND (br.request_id LIKE ? OR a.name LIKE ? OR d.college LIKE ?)";
        $search_param = '%' . $search_query . '%';
        $params[] = $search_param;
        $params[] = $search_param;
        $params[] = $search_param;
    }

    // Add sorting
    switch ($sort_by) {
        case 'oldest':
            $sql .= " ORDER BY br.timestamp ASC";
            break;
        case 'amount_high':
            $sql .= " ORDER BY br.proposed_budget DESC";
            break;
        case 'amount_low':
            $sql .= " ORDER BY br.proposed_budget ASC";
            break;
        default:
            $sql .= " ORDER BY br.timestamp DESC";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode([
    'success' => true,
    'requests' => $requests
]);
?>
