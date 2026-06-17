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

if (!preg_match('/^[a-z0-9\-]+$/', $file)) {
    echo json_encode(['success' => false, 'error' => 'Invalid filename']);
    exit;
}

$path = __DIR__ . '/../navigation/resources/markdown/' . $file . '.md';

if (file_put_contents($path, $content) !== false) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Could not write file']);
}
