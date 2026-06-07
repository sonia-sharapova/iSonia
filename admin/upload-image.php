<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$type = $_POST['type'] ?? 'books'; // 'books' or 'movies' etc.
$allowedTypes = ['books', 'movies', 'music'];
if (!in_array($type, $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Invalid type']);
    exit;
}

if (empty($_FILES['image'])) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['image'];

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

// Max 5MB
if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'File too large (max 5MB)']);
    exit;
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower(pathinfo($file['name'], PATHINFO_FILENAME)));
$filename = $slug . '_' . time() . '.' . $ext;
$destDir = __DIR__ . '/../images/' . $type . '/';
$destPath = $destDir . $filename;

if (!is_dir($destDir)) mkdir($destDir, 0755, true);

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    echo json_encode(['success' => false, 'error' => 'Could not save file']);
    exit;
}

echo json_encode(['success' => true, 'path' => '/images/' . $type . '/' . $filename]);
