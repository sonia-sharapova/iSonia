<?php
// One-time utility: fills in width/height (needed to tell portrait from
// landscape for the row layout) and an "added" date (needed for the All
// Albums date filter) for photos that predate those features. "added" is
// approximated from the image file's last-modified time on the server,
// since there's no earlier record of when each photo was uploaded.
// Visit this URL once while logged in as admin, then it's safe to delete
// this file — re-running it is harmless, it only fills in what's missing.
session_start();
header('Content-Type: application/json');
ini_set('display_errors', '0');

if (empty($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$path = __DIR__ . '/../data/albums.json';
$albums = json_decode(file_get_contents($path), true);
if (!is_array($albums)) {
    echo json_encode(['success' => false, 'error' => 'Could not read albums.json']);
    exit;
}

$dimsUpdated  = 0;
$addedUpdated = 0;
$failed       = [];

foreach ($albums as &$album) {
    if (empty($album['photos'])) continue;
    foreach ($album['photos'] as &$photo) {
        if (empty($photo['src'])) continue;
        $fsPath = __DIR__ . '/../' . ltrim($photo['src'], '/');

        if (!isset($photo['width'], $photo['height'])) {
            $dims = @getimagesize($fsPath);
            if ($dims) {
                $photo['width']  = $dims[0];
                $photo['height'] = $dims[1];
                $dimsUpdated++;
            } else {
                $failed[] = $photo['src'];
            }
        }

        if (empty($photo['added'])) {
            $mtime = @filemtime($fsPath);
            if ($mtime) {
                $photo['added'] = date('Y-m-d', $mtime);
                $addedUpdated++;
            }
        }
    }
    unset($photo);
}
unset($album);

if ($dimsUpdated > 0 || $addedUpdated > 0) {
    $backupDir = __DIR__ . '/../data/backups/';
    if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
    copy($path, $backupDir . 'albums_' . date('Y-m-d_H-i-s') . '.json');

    if (file_put_contents($path, json_encode($albums, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        echo json_encode(['success' => false, 'error' => 'Could not write albums.json']);
        exit;
    }
}

echo json_encode([
    'success'       => true,
    'width_height_updated' => $dimsUpdated,
    'added_date_updated'   => $addedUpdated,
    'failed'        => $failed,
]);
