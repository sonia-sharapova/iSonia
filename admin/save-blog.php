<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

define('BLOGS_PATH', __DIR__ . '/../creations/blogs/');

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

if ($action === 'save') {
    $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($input['slug'] ?? ''));
    if (!$slug) {
        echo json_encode(['success' => false, 'error' => 'Invalid slug']);
        exit;
    }

    $content = $input['content'] ?? '';
    $path = BLOGS_PATH . $slug . '.md';

    if (file_exists($path)) {
        $backupDir = BLOGS_PATH . 'backups/';
        if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
        copy($path, $backupDir . $slug . '_' . date('Y-m-d_H-i-s') . '.md');
    }

    if (file_put_contents($path, $content) !== false) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Could not write file']);
    }

} elseif ($action === 'list') {
    $files = glob(BLOGS_PATH . '*.md');
    $posts = [];
    foreach ($files as $file) {
        $raw = file_get_contents($file);
        $slug = basename($file, '.md');
        $fm = [];
        if (preg_match('/^---\n(.*?)\n---/s', $raw, $m)) {
            foreach (explode("\n", $m[1]) as $line) {
                [$k, $v] = array_pad(explode(':', $line, 2), 2, '');
                if (trim($k)) $fm[trim($k)] = trim($v);
            }
        }
        $posts[] = ['slug' => $slug, 'title' => $fm['title'] ?? $slug, 'date' => $fm['date'] ?? ''];
    }
    echo json_encode(['success' => true, 'posts' => $posts]);

} else {
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
}
