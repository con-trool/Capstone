<?php
// Test Supabase connection
require 'db_supabase.php';

echo "Testing Supabase connection...\n";

try {
    // Test basic connection
    $stmt = $conn->query("SELECT 1 as test");
    $result = $stmt->fetch();
    echo "✓ Basic connection test passed\n";
    
    // Test schema access
    $stmt = $conn->query("SELECT COUNT(*) as count FROM budget_database_schema.account");
    $result = $stmt->fetch();
    echo "✓ Schema access test passed - Found {$result['count']} accounts\n";
    
    // Test specific account lookup
    $stmt = $conn->prepare("SELECT * FROM budget_database_schema.account WHERE username_email = :email");
    $stmt->bindParam(':email', 'testuser@example.com');
    $stmt->execute();
    $user = $stmt->fetch();
    
    if ($user) {
        echo "✓ User lookup test passed - Found user: {$user['name']}\n";
    } else {
        echo "⚠ User lookup test - No user found with testuser@example.com\n";
    }
    
    echo "\nAll tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Error details: " . print_r($e, true) . "\n";
}
?>
