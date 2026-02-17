<?php
// Minimal save script - no backups, just saves files
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuration - UPDATE THESE
define('PASSWORD_HASH', 'YOUR_PASSWORD_HASH_HERE');
define('FILES_PATH', __DIR__ . '/resources/markdown/');

// Allowed files
$allowedFiles = [
    'general.md',
    'media.md',
    'music.md',
    'opensource.md',
    'technology.md',
    'web.md'
];

try {
    // Only POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Get and parse input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON');
    }

    // Validate fields
    if (!isset($input['file']) || !isset($input['content']) || !isset($input['session'])) {
        throw new Exception('Missing required fields');
    }

    // Check auth
    if ($input['session'] !== PASSWORD_HASH) {
        http_response_code(401);
        throw new Exception('Unauthorized');
    }

    // Validate filename
    $fileName = basename($input['file']);
    if (!in_array($fileName, $allowedFiles)) {
        throw new Exception('Invalid file: ' . $fileName);
    }

    // Check directory exists
    if (!is_dir(FILES_PATH)) {
        throw new Exception('Directory not found: ' . FILES_PATH);
    }

    // Build file path
    $filePath = FILES_PATH . $fileName;

    // Check if writable
    if (file_exists($filePath) && !is_writable($filePath)) {
        throw new Exception('File not writable: ' . $fileName);
    }

    // Save file
    $bytes = file_put_contents($filePath, $input['content']);

    if ($bytes === false) {
        throw new Exception('Failed to save file');
    }

    // Success!
    echo json_encode([
        'success' => true,
        'message' => 'Saved successfully',
        'file' => $fileName,
        'bytes' => $bytes,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
