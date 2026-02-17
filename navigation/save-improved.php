<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);

// Set headers first, before any output
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuration
define('PASSWORD_HASH', 'YOUR_PASSWORD_HASH_HERE'); // UPDATE THIS
define('FILES_PATH', __DIR__ . '/resources/markdown/');

// Allowed files (whitelist for security)
$allowedFiles = [
    'general.md',
    'media.md',
    'music.md',
    'opensource.md',
    'technology.md',
    'web.md'
];

try {
    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Get POST data
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Validate input
    if (!isset($input['file']) || !isset($input['content']) || !isset($input['session'])) {
        throw new Exception('Missing required fields (file, content, or session)');
    }

    // Verify session
    if ($input['session'] !== PASSWORD_HASH) {
        http_response_code(401);
        throw new Exception('Unauthorized - Invalid session');
    }

    // Validate file name
    $fileName = basename($input['file']); // Prevent directory traversal
    if (!in_array($fileName, $allowedFiles)) {
        throw new Exception('Invalid file name: ' . $fileName);
    }

    // Check if files path exists
    if (!is_dir(FILES_PATH)) {
        throw new Exception('Files directory does not exist: ' . FILES_PATH);
    }

    // Get file path
    $filePath = FILES_PATH . $fileName;

    // Try to create backup directory if it doesn't exist
    $backupPath = FILES_PATH . 'backups/';
    $backupCreated = false;
    
    if (!is_dir($backupPath)) {
        // Try to create the directory
        $backupCreated = @mkdir($backupPath, 0755, true);
    } else {
        $backupCreated = true;
    }

    // Try to backup existing file (non-fatal if it fails)
    if (file_exists($filePath) && $backupCreated && is_writable($backupPath)) {
        $timestamp = date('Y-m-d_H-i-s');
        $backupFile = $backupPath . pathinfo($fileName, PATHINFO_FILENAME) . '_' . $timestamp . '.md';
        
        // Attempt backup, but don't fail the save if backup fails
        if (@copy($filePath, $backupFile)) {
            // Keep only last 10 backups per file
            cleanupBackups($backupPath, $fileName);
        }
        // If backup fails, continue anyway - saving is more important
    }

    // Check if file is writable
    if (file_exists($filePath) && !is_writable($filePath)) {
        throw new Exception('File is not writable: ' . $fileName);
    }

    // Save file
    $result = file_put_contents($filePath, $input['content']);

    if ($result === false) {
        throw new Exception('Failed to write file');
    }

    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'File saved successfully',
        'file' => $fileName,
        'bytes' => $result,
        'timestamp' => date('Y-m-d H:i:s'),
        'backup_created' => $backupCreated && is_writable($backupPath)
    ]);

} catch (Exception $e) {
    // Error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

// Cleanup old backups
function cleanupBackups($backupPath, $fileName) {
    $baseName = pathinfo($fileName, PATHINFO_FILENAME);
    $pattern = $backupPath . $baseName . '_*.md';
    $backups = glob($pattern);
    
    if ($backups && count($backups) > 10) {
        // Sort by modification time (oldest first)
        usort($backups, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        // Remove oldest backups
        $toRemove = array_slice($backups, 0, count($backups) - 10);
        foreach ($toRemove as $file) {
            @unlink($file);
        }
    }
}
?>
