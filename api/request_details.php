<?php
session_start();
header('Content-Type: application/json');

try {
  if (!isset($_GET['request_id'])) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Missing request_id']);
    exit;
  }
  $request_id = $_GET['request_id'];

  // DB
  $pdo = new PDO("mysql:host=localhost;dbname=budget_database_schema", "root", "");
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // who am I (optional access check for requester)
  $username = $_SESSION['username'] ?? null;
  $role = $_SESSION['role'] ?? null;
  $account_id = null;
  if ($username) {
    $st = $pdo->prepare("SELECT id FROM account WHERE username_email=? LIMIT 1");
    $st->execute([$username]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    $account_id = $row['id'] ?? null;
  }

  // request
  $st = $pdo->prepare("
    SELECT br.*, a.name AS requester_name, a.username_email AS requester_email,
           d.college, d.budget_deck, c.name AS campus_name
    FROM budget_request br
    LEFT JOIN account a   ON br.account_id = a.id
    LEFT JOIN department d ON br.department_code = d.code
    LEFT JOIN campus c     ON br.campus_code = c.code
    WHERE br.request_id = ?
  ");
  $st->execute([$request_id]);
  $req = $st->fetch(PDO::FETCH_ASSOC);
  if (!$req) {
    http_response_code(404);
    echo json_encode(['success'=>false,'message'=>'Request not found']);
    exit;
  }

  // if requester, restrict to own requests (optional but safer)
  if ($role === 'requester' && $account_id && $req['account_id'] != $account_id) {
    http_response_code(403);
    echo json_encode(['success'=>false,'message'=>'Forbidden']);
    exit;
  }

  // entries
  $st = $pdo->prepare("
    SELECT row_num, gl_code, budget_description, remarks, amount, approved_amount
    FROM budget_entries
    WHERE request_id = ?
    ORDER BY row_num
  ");
  $st->execute([$request_id]);
  $entries = $st->fetchAll(PDO::FETCH_ASSOC);

  // approval history
  $st = $pdo->prepare("
    SELECT ap.approval_level, ap.status, ap.timestamp, ap.comments,
           acc.name AS approver_name
    FROM approval_progress ap
    LEFT JOIN account acc ON ap.approver_id = acc.id
    WHERE ap.request_id = ?
    ORDER BY ap.approval_level ASC
  ");
  $st->execute([$request_id]);
  $approval_history = $st->fetchAll(PDO::FETCH_ASSOC);

  // attachments
  $st = $pdo->prepare("
    SELECT t.id, t.original_filename, t.filename, t.file_size, t.upload_timestamp,
           a.name AS uploader_name
    FROM attachments t
    LEFT JOIN account a ON t.uploaded_by = a.id
    WHERE t.request_id = ?
    ORDER BY t.upload_timestamp ASC
  ");
  $st->execute([$request_id]);
  $attachments = $st->fetchAll(PDO::FETCH_ASSOC);

  // activity history
  $st = $pdo->prepare("
    SELECT h.timestamp, h.action, a.name AS approver_name
    FROM history h
    LEFT JOIN account a ON h.account_id = a.id
    WHERE h.request_id = ?
    ORDER BY h.timestamp DESC
  ");
  $st->execute([$request_id]);
  $history = $st->fetchAll(PDO::FETCH_ASSOC);

  // amendments (shown only for VP Finance in UI, but OK to return always)
  $st = $pdo->prepare("
    SELECT ba.*, crt.name AS created_by_name, appr.name AS approved_by_name
    FROM budget_amendments ba
    LEFT JOIN account crt  ON ba.created_by  = crt.id
    LEFT JOIN account appr ON ba.approved_by = appr.id
    WHERE ba.request_id = ?
    ORDER BY ba.amendment_number DESC
  ");
  $st->execute([$request_id]);
  $amendments = $st->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([
    'success' => true,
    'request' => $req,
    'entries' => $entries,
    'approval_history' => $approval_history,
    'attachments' => $attachments,
    'history' => $history,
    'amendments' => $amendments
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>'Server error','error'=>$e->getMessage()]);
}
