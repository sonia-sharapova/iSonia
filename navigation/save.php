<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration
define('PASSWORD_HASH', 'a796d16cd05e917f54070cfb47ef5d7b90a5515473f2af9244116d9ef17b72ce'); // Same hash as in HTML
define('FILES_PATH', './resources/markdown/');

// Allowed files (whitelist for security)
$allowedFiles = [
    'general.md',
    'media.md',
    'music.md',
    'opensource.md',
    'tech.md',
    'web.md'
];

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['file']) || !isset($input['content']) || !isset($input['session'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// Verify session
if ($input['session'] !== PASSWORD_HASH) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Validate file name
$fileName = basename($input['file']); // Prevent directory traversal
if (!in_array($fileName, $allowedFiles)) {
    echo json_encode(['success' => false, 'error' => 'Invalid file name']);
    exit;
}

// Get file path
$filePath = FILES_PATH . $fileName;

// Backup existing file
if (file_exists($filePath)) {
    $backupPath = FILES_PATH . 'backups/';
    if (!is_dir($backupPath)) {
        mkdir($backupPath, 0755, true);
    }
    $timestamp = date('Y-m-d_H-i-s');
    $backupFile = $backupPath . pathinfo($fileName, PATHINFO_FILENAME) . '_' . $timestamp . '.md';
    copy($filePath, $backupFile);
    
    // Keep only last 10 backups per file
    cleanupBackups($backupPath, $fileName);
}

// Save file
$result = file_put_contents($filePath, $input['content']);

if ($result !== false) {
    echo json_encode([
        'success' => true,
        'message' => 'File saved successfully',
        'bytes' => $result
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to write file'
    ]);
}

// Cleanup old backups
function cleanupBackups($backupPath, $fileName) {
    $baseName = pathinfo($fileName, PATHINFO_FILENAME);
    $backups = glob($backupPath . $baseName . '_*.md');
    
    if (count($backups) > 10) {
        // Sort by modification time
        usort($backups, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        // Remove oldest backups
        $toRemove = array_slice($backups, 0, count($backups) - 10);
        foreach ($toRemove as $file) {
            unlink($file);
        }
    }
}
?>
