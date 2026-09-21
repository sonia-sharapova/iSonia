<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$file    = $input['file']    ?? '';
$content = $input['content'] ?? '';
$folder  = $input['dir']     ?? 'resources';   // 'resources' (Saved Links) or 'learning' (Guides)

if (!in_array($folder, ['resources', 'learning'], true)) {
    echo json_encode(['success' => false, 'error' => 'Invalid folder']);
    exit;
}

if (!preg_match('/^[a-z0-9\-]+$/', $file)) {
    echo json_encode(['success' => false, 'error' => 'Invalid filename']);
    exit;
}

$dir = __DIR__ . '/../navigation/' . $folder . '/markdown';
if (!is_dir($dir)) mkdir($dir, 0755, true);   // not there on a fresh checkout — the first save creates it
$path = $dir . '/' . $file . '.md';

if (file_put_contents($path, $content) !== false) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Could not write file']);
}
