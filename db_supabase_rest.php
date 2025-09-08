<?php
// Supabase REST API Database Configuration
// This bypasses direct PostgreSQL connection issues

$supabaseUrl = "https://ofpajqubjoxvqsxldpvo.supabase.co";
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcGFqcXViam94dnFzeGxkcHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODA4MDcsImV4cCI6MjA3MjU1NjgwN30.5yGW8zCeCclbtmArDbR1X6YabGvCsLx0QR6KVjw2PCI";

// Helper function to make Supabase REST API calls
function supabaseQuery($endpoint, $method = 'GET', $data = null) {
    global $supabaseUrl, $supabaseKey;
    
    $url = $supabaseUrl . '/rest/v1/' . $endpoint;
    
    $headers = [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return json_decode($response, true);
    } else {
        throw new Exception("Supabase API error: HTTP $httpCode - $response");
    }
}

// Test connection
try {
    $result = supabaseQuery('account?select=count');
    echo "✓ Supabase REST API connection successful\n";
    echo "Found " . count($result) . " accounts\n";
} catch (Exception $e) {
    echo "✗ Supabase REST API connection failed: " . $e->getMessage() . "\n";
}
?>
