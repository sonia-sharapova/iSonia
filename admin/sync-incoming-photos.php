<?php
// Bulk-drop sync: rsync/scp a folder straight onto the server at
//   images/incoming/<Album Name>/<Group Name>/*.jpg      (grouped)
//   images/incoming/<Album Name>/*.jpg                   (ungrouped)
// then visit this URL once while logged in as admin. Each new file is moved
// into images/albums/, gets thumb/display derivatives generated, and is
// registered into data/albums.json under an album/group matching the folder
// names it came from (created if they don't exist yet) — with caption, date,
// city, tags and notes left blank for you to fill in via the admin panel.
// Re-running is safe: already-synced files (tracked by their original
// incoming/ path) are skipped.
session_start();
header('Content-Type: application/json');
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

require __DIR__ . '/lib/image-derivatives.php';

$incomingRoot = __DIR__ . '/../images/incoming';
$albumsPath   = __DIR__ . '/../data/albums.json';
$destDir      = __DIR__ . '/../images/albums/';
$allowedExt   = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

if (!is_dir($incomingRoot)) {
    echo json_encode(['success' => true, 'synced' => 0, 'message' => 'No images/incoming/ folder found — nothing to sync.']);
    exit;
}

$albums = json_decode(file_get_contents($albumsPath), true);
if (!is_array($albums)) {
    echo json_encode(['success' => false, 'error' => 'Could not read albums.json']);
    exit;
}

// Every sourcePath already registered, so re-running this script is a no-op
// for files it's already synced.
$alreadySynced = [];
foreach ($albums as $album) {
    foreach (($album['photos'] ?? []) as $p) {
        if (!empty($p['sourcePath'])) $alreadySynced[$p['sourcePath']] = true;
    }
}

function slugify($s) {
    return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($s)), '-');
}

$albumsCreated = [];
$groupsUsed    = [];
$synced        = [];
$skipped       = 0;
$failed        = [];

$albumDirs = array_filter(glob($incomingRoot . '/*'), 'is_dir');
foreach ($albumDirs as $albumDir) {
    $albumName = basename($albumDir);
    $albumRef  = null;
    foreach ($albums as $i => $a) if ($a['name'] === $albumName) { $albumRef = $i; break; }
    $isNewAlbum = $albumRef === null;

    // Files directly inside the album folder (no group) + one level of group subfolders.
    $entries = glob($albumDir . '/*');
    $ungroupedFiles = array_filter($entries, 'is_file');
    $groupDirs      = array_filter($entries, 'is_dir');

    $jobs = []; // [sourcePath, fsPath, rowId-or-null, rowLabel-or-null]
    foreach ($ungroupedFiles as $f) {
        $rel = $albumName . '/' . basename($f);
        $jobs[] = [$rel, $f, null, null];
    }
    foreach ($groupDirs as $groupDir) {
        $groupName = basename($groupDir);
        $rowId = slugify($albumName) . '-' . slugify($groupName);
        foreach (glob($groupDir . '/*') as $f) {
            if (!is_file($f)) continue;
            $rel = $albumName . '/' . $groupName . '/' . basename($f);
            $jobs[] = [$rel, $f, $rowId, $groupName];
        }
    }

    $albumHadWork = false;
    foreach ($jobs as [$sourcePath, $fsPath, $rowId, $rowLabel]) {
        $ext = strtolower(pathinfo($fsPath, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExt, true)) continue;
        if (isset($alreadySynced[$sourcePath])) { $skipped++; continue; }

        if ($albumRef === null) {
            $albums[] = ['id' => bin2hex(random_bytes(5)), 'name' => $albumName, 'desc' => '', 'cover' => null, 'photos' => []];
            $albumRef = count($albums) - 1;
            $albumsCreated[] = $albumName;
        }
        $albumHadWork = true;

        $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower(pathinfo($fsPath, PATHINFO_FILENAME)));
        $filename = $slug . '_' . time() . '_' . substr(md5($sourcePath), 0, 6) . '.' . $ext;
        $newPath = $destDir . $filename;

        if (!is_dir($destDir)) mkdir($destDir, 0755, true);
        $mtime = @filemtime($fsPath) ?: time();

        if (!copy($fsPath, $newPath)) { $failed[] = $sourcePath; continue; }
        @unlink($fsPath);

        $deriv = generateDerivatives($newPath, $destDir, $slug, '/images/albums/');

        $photo = [
            'id' => bin2hex(random_bytes(5)),
            'src' => '/images/albums/' . $filename,
            'thumb' => $deriv['thumb'], 'display' => $deriv['display'],
            'width' => $deriv['width'], 'height' => $deriv['height'],
            'caption' => '', 'date' => '', 'added' => date('Y-m-d', $mtime),
            'sourcePath' => $sourcePath,
        ];
        if ($rowId) {
            $photo['rowId'] = $rowId;
            $photo['rowLabel'] = $rowLabel;
            if (!in_array("$albumName/$rowLabel", $groupsUsed, true)) $groupsUsed[] = "$albumName/$rowLabel";
        }

        $albums[$albumRef]['photos'][] = $photo;
        $synced[] = $sourcePath;
    }

    // Clean up now-empty group/album folders left behind in incoming/.
    foreach ($groupDirs as $groupDir) if (count(glob($groupDir . '/*')) === 0) @rmdir($groupDir);
    if ($albumHadWork && count(glob($albumDir . '/*')) === 0) @rmdir($albumDir);
}

if (count($synced) > 0) {
    $backupDir = __DIR__ . '/../data/backups/';
    if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
    copy($albumsPath, $backupDir . 'albums_' . date('Y-m-d_H-i-s') . '.json');

    if (file_put_contents($albumsPath, json_encode($albums, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        echo json_encode(['success' => false, 'error' => 'Could not write albums.json']);
        exit;
    }
}

echo json_encode([
    'success' => true,
    'albums_created' => $albumsCreated,
    'groups_used'    => $groupsUsed,
    'photos_synced'  => count($synced),
    'already_synced_skipped' => $skipped,
    'failed'         => $failed,
]);
