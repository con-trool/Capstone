<?php
echo "Testing basic PHP...\n";

try {
    echo "Loading db_supabase.php...\n";
    require 'db_supabase.php';
    echo "Successfully loaded db_supabase.php\n";
    echo "Connection object created: " . (isset($conn) ? "Yes" : "No") . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
