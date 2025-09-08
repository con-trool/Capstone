<?php
/**
 * Migration Helper Script
 * This script helps migrate from MySQL to Supabase PostgreSQL
 */

// Include both database configurations
require_once 'db.php';  // Original MySQL connection
require_once 'db_supabase.php';  // New Supabase connection

echo "<h2>Database Migration Helper</h2>";

// Test both connections
echo "<h3>Testing Connections:</h3>";

// Test MySQL connection
if ($conn) {
    echo "✅ MySQL Connection: SUCCESS<br>";
} else {
    echo "❌ MySQL Connection: FAILED<br>";
}

// Test Supabase connection
if ($conn) {
    echo "✅ Supabase Connection: SUCCESS<br>";
} else {
    echo "❌ Supabase Connection: FAILED<br>";
}

echo "<h3>Migration Steps:</h3>";
echo "1. Update your Supabase credentials in db_supabase.php<br>";
echo "2. Replace 'require_once \"db.php\";' with 'require_once \"db_supabase.php\";' in your PHP files<br>";
echo "3. Update any MySQL-specific queries to PostgreSQL syntax<br>";
echo "4. Test your application<br>";

echo "<h3>Key Differences to Watch For:</h3>";
echo "• AUTO_INCREMENT → SERIAL<br>";
echo "• ENUM → CHECK constraints<br>";
echo "• BOOLEAN handling (MySQL: 0/1, PostgreSQL: true/false)<br>";
echo "• Date/Time functions<br>";
echo "• String concatenation (MySQL: CONCAT(), PostgreSQL: ||)<br>";
echo "• LIMIT syntax differences<br>";

echo "<h3>Files to Update:</h3>";
$files_to_update = [
    'api/login.php',
    'api/requester/create_request.php',
    'api/requester/update_request.php',
    'api/requester/delete_request.php',
    'api/requester/get_request.php',
    'api/requester/requests.php',
    'api/approver/requests.php',
    'api/process_approval.php',
    'api/request_details.php',
    'create_request.php',
    'edit_request.php',
    'update_request.php',
    'delete_request.php',
    'submit_request.php',
    'process_approval.php',
    'fetch_request_details.php',
    'fetch_approval_details.php',
    'get_request_data.php',
    'workflow_manager.php',
    'process_amendment.php',
    'load_category_template.php',
    'analytics.php'
];

foreach ($files_to_update as $file) {
    if (file_exists($file)) {
        echo "• $file<br>";
    }
}

echo "<h3>Next Steps:</h3>";
echo "1. Update your Supabase credentials in db_supabase.php<br>";
echo "2. Run this script to test connections<br>";
echo "3. Start updating your PHP files one by one<br>";
echo "4. Test each file after updating<br>";
?>
