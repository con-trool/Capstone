<?php
session_start();
require '../db_supabase.php';  // Changed to Supabase connection
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    // Updated query for PostgreSQL
    $sql = "SELECT * FROM account WHERE username_email = :email";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $user = $stmt->fetch();
  
    if ($user && $user['password'] === $password) {
        $_SESSION['username'] = $user['username_email'];
        $_SESSION['role'] = strtolower($user['role']);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['name'] = $user['name'] ?? $user['username_email'];

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username_email'],
                'role' => strtolower($user['role']),
                'name' => $user['name'] ?? $user['username_email']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password.'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method.'
    ]);
}
?>
