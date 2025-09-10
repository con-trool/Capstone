<?php
// Supabase PostgreSQL Database Configuration
// Replace these values with your actual Supabase credentials

$host = "aws-1-ap-southeast-1.pooler.supabase.com";  // Supavisor Session Pooler host (IPv4-friendly)
$port = "5432";  // PostgreSQL port (Session Pooler)
$database = "postgres";  // Default Supabase database name
$user = "postgres.ofpajqubjoxvqsxldpvo";  // Session pooler username (project-scoped)
$password = "nfrvNZjs2akopOVk";  // Your Supabase database password

// Create connection using PDO for PostgreSQL
try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$database;sslmode=require";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Session pooler supports server-side prepares; keep emulate_prepares disabled
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $conn = new PDO($dsn, $user, $password, $options);
} catch(PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database connection failed ' . $e->getMessage()]));
}

// Helper function to execute queries (similar to mysqli)
function executeQuery($conn, $sql, $params = []) {
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch(PDOException $e) {
        error_log("Query failed: " . $e->getMessage());
        return false;
    }
}

// Helper function to fetch all results
function fetchAll($stmt) {
    return $stmt->fetchAll();
}

// Helper function to fetch single result
function fetchOne($stmt) {
    return $stmt->fetch();
}

// Helper function to get last insert ID
function getLastInsertId($conn) {
    return $conn->lastInsertId();
}

// Helper function to get affected rows
function getAffectedRows($stmt) {
    return $stmt->rowCount();
}

// Helper function to escape strings (though PDO handles this automatically with prepared statements)
function escapeString($conn, $string) {
    return $string; // PDO prepared statements handle escaping
}

// Helper function to check if connection is alive
function isConnectionAlive($conn) {
    try {
        $stmt = $conn->query("SELECT 1");
        return $stmt !== false;
    } catch(PDOException $e) {
        return false;
    }
}

// Close connection function
function closeConnection($conn) {
    $conn = null;
}
?>
