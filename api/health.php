<?php
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../db_supabase.php';

    // Basic ping
    $ping = $conn->query('SELECT 1 AS ok')->fetch();

    // Gather server details
    $stmt = $conn->query("SELECT 
        current_user AS current_user,
        current_database() AS current_db,
        version() AS version,
        inet_server_addr()::text AS server_ip,
        inet_server_port() AS server_port,
        now() AT TIME ZONE 'UTC' AS utc_now,
        current_setting('server_version', true) AS server_version,
        current_setting('ssl', true) AS ssl_setting,
        current_setting('ssl_is_used', true) AS ssl_is_used
    ");
    $info = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Database connection OK',
        'pool_hint' => 'This app is configured to use Supavisor session mode (shared pooler).',
        'connection' => [
            'host' => $host ?? null,
            'port' => $port ?? null,
            'database' => $database ?? null,
            'user' => $user ?? null,
            'sslmode' => 'require'
        ],
        'server' => $info,
        'ping' => $ping['ok'] ?? 0
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Health check failed',
        'error' => $e->getMessage()
    ]);
}
?>


