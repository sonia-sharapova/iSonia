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

// Sort newest first (lexicographic on date string is fine for "Month YYYY" format)
usort($posts, fn($a, $b) => strcmp($b['date'], $a['date']));

echo json_encode($posts);
