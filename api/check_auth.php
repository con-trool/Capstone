<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['username']) && isset($_SESSION['role']) && isset($_SESSION['user_id'])) {
    echo json_encode([
        'authenticated' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role'],
            'name' => $_SESSION['name'] ?? $_SESSION['username']
        ]
    ]);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
?>
