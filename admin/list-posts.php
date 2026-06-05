<?php
header('Content-Type: application/json');

define('BLOGS_PATH', __DIR__ . '/../creations/blogs/');

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

    // First non-empty, non-heading line as excerpt
    $excerpt = '';
    foreach (explode("\n", $body) as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#') {
            $excerpt = $line;
            break;
        }
    }
    // Strip markdown links/bold/italic from excerpt
    $excerpt = preg_replace('/\[([^\]]+)\]\([^\)]+\)/', '$1', $excerpt);
    $excerpt = preg_replace('/[*_]{1,2}([^*_]+)[*_]{1,2}/', '$1', $excerpt);
    if (strlen($excerpt) > 140) $excerpt = substr($excerpt, 0, 137) . '…';

    $posts[] = [
        'slug'     => $slug,
        'title'    => $fm['title'] ?? $slug,
        'date'     => $fm['date'] ?? '',
        'readTime' => $fm['readTime'] ?? '',
        'excerpt'  => $excerpt,
    ];
}

// Sort newest first (lexicographic on date string is fine for "Month YYYY" format)
usort($posts, fn($a, $b) => strcmp($b['date'], $a['date']));

echo json_encode($posts);
