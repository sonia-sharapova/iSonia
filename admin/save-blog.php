<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

define('BLOGS_PATH', __DIR__ . '/../creations/blogs/');
define('POSTS_JSON', __DIR__ . '/../data/posts.json');

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
        rebuildPostsJson();
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Could not write file']);
    }

} else {
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
}

function rebuildPostsJson() {
    $files = glob(BLOGS_PATH . '*.md');
    $posts = [];
    foreach ($files as $file) {
        $raw = file_get_contents($file);
        $slug = basename($file, '.md');
        $fm = [];
        $body = $raw;

        if (preg_match('/^---\n(.*?)\n---\n?([\s\S]*)/s', $raw, $m)) {
            foreach (explode("\n", $m[1]) as $line) {
                [$k, $v] = array_pad(explode(':', $line, 2), 2, '');
                if (trim($k)) $fm[trim($k)] = trim($v);
            }
            $body = trim($m[2]);
        }

        $excerpt = '';
        foreach (explode("\n", $body) as $line) {
            $line = trim($line);
            if ($line && $line[0] !== '#' && $line[0] !== '>') {
                $excerpt = $line;
                break;
            }
        }
        $excerpt = preg_replace('/\[([^\]]+)\]\([^\)]+\)/', '$1', $excerpt);
        $excerpt = preg_replace('/[*_]{1,2}([^*_]+)[*_]{1,2}/', '$1', $excerpt);
        if (strlen($excerpt) > 140) $excerpt = substr($excerpt, 0, 137) . '…';

        // First image in the post body (its markdown src), if any — the homepage's forum-style
        // thread list (index.html) shows it as the post's thumbnail, same as an imageboard OP
        // image, with a "File: name (size, WxH)" line built from the real file when it's local.
        // Blog markdown is rendered from creations/blogs/entry.html, so a relative src is written
        // relative to that page — normalize it here to also resolve from the site root (index.html).
        $image = '';
        $imageMeta = '';
        if (preg_match('/!\[[^\]]*\]\(([^)]+)\)/', $body, $im)) {
            $image = $im[1];
            if (!preg_match('#^(https?:)?/#', $image)) {
                $image = 'creations/blogs/' . $image;
            }
            if (!preg_match('#^https?:#', $image)) {
                $imagePath = __DIR__ . '/../' . $image;
                if (file_exists($imagePath)) {
                    $bytes = filesize($imagePath);
                    $size = $bytes >= 1048576 ? round($bytes / 1048576, 2) . ' MB' : round($bytes / 1024) . ' KB';
                    $dims = @getimagesize($imagePath);
                    $imageMeta = $dims ? "$size, {$dims[0]}x{$dims[1]}" : $size;
                }
            }
        }

        // First "> " line in the body, if any — shown as a lainchan-style greentext line in the
        // homepage's thread list (separate from $excerpt, which deliberately skips these lines).
        $greentext = '';
        foreach (explode("\n", $body) as $line) {
            $line = trim($line);
            if ($line !== '' && $line[0] === '>') {
                $greentext = ltrim($line, '> ');
                break;
            }
        }

        $posts[] = [
            'slug'      => $slug,
            'title'     => $fm['title'] ?? $slug,
            'date'      => $fm['date'] ?? '',
            'readTime'  => $fm['readTime'] ?? '',
            'excerpt'   => $excerpt,
            'image'     => $image,
            'imageMeta' => $imageMeta,
            'greentext' => $greentext,
        ];
    }

    usort($posts, fn($a, $b) => strcmp($b['date'], $a['date']));
    file_put_contents(POSTS_JSON, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
