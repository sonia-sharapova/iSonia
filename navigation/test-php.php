<?php
// Simple test to see if PHP is working
echo json_encode([
    'status' => 'success',
    'message' => 'PHP is working!',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
?>
