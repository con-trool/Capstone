<?php
session_start();
require '../../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'requester') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$pdo = new PDO("mysql:host=localhost;dbname=budget_database_schema", "root", "");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$username = $_SESSION['username'];
$stmt = $pdo->prepare("SELECT id FROM account WHERE username_email = ?");
$stmt->execute([$username]);
$account_id = $stmt->fetchColumn();

if (!$account_id) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

// Handle filter parameters
$status_filter = $_GET['status'] ?? 'all';
$sort_by = $_GET['sort'] ?? 'latest';

$sql = "SELECT br.*, 
        CASE WHEN ap.status IN ('approved', 'rejected', 'request_info') THEN 1 ELSE 0 END as level1_processed,
        COALESCE(ba_count.amendment_count, 0) as amendment_count
        FROM budget_request br 
        LEFT JOIN approval_progress ap ON br.request_id = ap.request_id AND ap.approval_level = 1
        LEFT JOIN (
            SELECT request_id, COUNT(*) as amendment_count 
            FROM budget_amendments 
            GROUP BY request_id
        ) ba_count ON br.request_id = ba_count.request_id
        WHERE br.account_id = ?";

$params = [$account_id];

// Apply status filter
if ($status_filter !== 'all') {
    $status_map = [
        'pending' => 'pending',
        'submitted' => 'pending',
        'approved' => 'approved', 
        'rejected' => 'rejected',
        'more_information' => 'more_info_requested',
        'more_info_requested' => 'more_info_requested'
    ];
    
    if (isset($status_map[$status_filter])) {
        $sql .= " AND br.status = ?";
        $params[] = $status_map[$status_filter];
    }
}

// Apply sorting
switch ($sort_by) {
    case 'oldest':
        $sql .= " ORDER BY br.timestamp ASC";
        break;
    case 'latest':
    default:
        $sql .= " ORDER BY br.timestamp DESC";
        break;
}

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'requests' => $requests
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
