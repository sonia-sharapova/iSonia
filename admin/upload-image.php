<?php
session_start();
header('Content-Type: application/json');

// Never let a PHP warning/notice leak into the response body — that breaks
// JSON.parse() on the client and shows up there as an opaque "unknown error".
// Errors still go to the server's error log (log_errors is untouched).
ini_set('display_errors', '0');
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (!headers_sent()) header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Server error: ' . $e['message']]);
    }
});

if (empty($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$type = $_POST['type'] ?? 'books';
$allowedTypes = ['books', 'movies', 'music', 'albums', 'resources'];
if (!in_array($type, $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Invalid type']);
    exit;
}

// Accept field name 'image' (books/movies/music) or 'file' (photos)
$file = null;
if (!empty($_FILES['image'])) {
    $file = $_FILES['image'];
} elseif (!empty($_FILES['file'])) {
    $file = $_FILES['file'];
} else {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Upload error ' . $file['error']]);
    exit;
}

// Validate mime type
$allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$mime = mime_content_type($file['tmp_name']);
if (!in_array($mime, $allowed)) {
    echo json_encode(['success' => false, 'error' => 'Only JPEG, PNG, GIF, WEBP allowed']);
    exit;
}

// Max 20MB — matches the server's nginx/php-fpm upload limits
if ($file['size'] > 20 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'File too large (max 20MB)']);
    exit;
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower(pathinfo($file['name'], PATHINFO_FILENAME)));
$filename = $slug . '_' . time() . '.' . $ext;
$destDir = __DIR__ . '/../images/' . $type . '/';
$destPath = $destDir . $filename;

if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
    echo json_encode(['success' => false, 'error' => "Could not create images/$type/ — check its parent directory is writable by the web server user"]);
    exit;
}

if (!is_writable($destDir)) {
    echo json_encode(['success' => false, 'error' => "images/$type/ is not writable by the web server user (likely owned by a different user, e.g. from an SSH/rsync upload) — fix its permissions on the server"]);
    exit;
}

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    echo json_encode(['success' => false, 'error' => 'Could not save file (move_uploaded_file failed after the writability check passed — check server disk space and error log)']);
    exit;
}

require __DIR__ . '/lib/image-derivatives.php';
$deriv = generateDerivatives($destPath, $destDir, $slug, '/images/' . $type . '/');

echo json_encode([
    'success' => true,
    'path'    => '/images/' . $type . '/' . $filename,
    'thumb'   => $deriv['thumb'],
    'display' => $deriv['display'],
    'width'   => $deriv['width'],
    'height'  => $deriv['height'],
]);
