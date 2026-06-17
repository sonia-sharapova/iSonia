<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$path = __DIR__ . '/../data/resources.json';
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

if (file_put_contents($path, json_encode($input, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Could not write file']);
}
