<?php
// Test login API
$data = [
    'email' => 'testuser@example.com',
    'password' => 'testpass'
];

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents('http://localhost/Capstone/api/login.php', false, $context);

echo "Login test result:\n";
echo $result . "\n";
?>
