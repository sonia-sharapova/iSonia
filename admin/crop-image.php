<?php
// Bakes a crop into an actual new image file, replacing the original —
// unlike the old cropX/cropY/cropZoom fields (CSS-only, never touched the
// real pixels). Takes the crop rectangle as percentages of the source
// image's own width/height so the client never has to know exact pixel
// dimensions.
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

$input = json_decode(file_get_contents('php://input'), true);
$src  = $input['src'] ?? '';
$xPct = floatval($input['x'] ?? 0);
$yPct = floatval($input['y'] ?? 0);
$wPct = floatval($input['w'] ?? 100);
$hPct = floatval($input['h'] ?? 100);

// Only ever crop files we ourselves manage under images/albums/ — never an
// arbitrary path handed in by the client.
if (!preg_match('#^/images/albums/[a-zA-Z0-9_\-.]+$#', $src)) {
    echo json_encode(['success' => false, 'error' => 'Invalid image path']);
    exit;
}

$srcPath = __DIR__ . '/..' . $src;
if (!is_file($srcPath)) {
    echo json_encode(['success' => false, 'error' => 'Source image not found']);
    exit;
}

$info = @getimagesize($srcPath);
if (!$info) { echo json_encode(['success' => false, 'error' => 'Could not read image']); exit; }
[$origW, $origH, $imgType] = $info;

switch ($imgType) {
    case IMAGETYPE_JPEG: $im = @imagecreatefromjpeg($srcPath); break;
    case IMAGETYPE_PNG:  $im = @imagecreatefrompng($srcPath); break;
    case IMAGETYPE_GIF:  $im = @imagecreatefromgif($srcPath); break;
    case IMAGETYPE_WEBP: $im = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($srcPath) : false; break;
    default: $im = false;
}
if (!$im) { echo json_encode(['success' => false, 'error' => 'Unsupported or unreadable image type']); exit; }

$cropX = max(0, min($origW - 1, (int) round($origW * $xPct / 100)));
$cropY = max(0, min($origH - 1, (int) round($origH * $yPct / 100)));
$cropW = max(1, min($origW - $cropX, (int) round($origW * $wPct / 100)));
$cropH = max(1, min($origH - $cropY, (int) round($origH * $hPct / 100)));

$cropped = imagecreatetruecolor($cropW, $cropH);
imagealphablending($cropped, false);
imagesavealpha($cropped, true);
imagecopyresampled($cropped, $im, 0, 0, $cropX, $cropY, $cropW, $cropH, $cropW, $cropH);
imagedestroy($im);

$destDir  = dirname($srcPath) . '/';
$urlDir   = dirname($src) . '/';
$slug     = preg_replace('/[^a-z0-9\-]/', '', strtolower(pathinfo($srcPath, PATHINFO_FILENAME)));
$ext      = strtolower(pathinfo($srcPath, PATHINFO_EXTENSION));
$newFilename = $slug . '_crop' . time() . '.' . $ext;
$newPath  = $destDir . $newFilename;

$saved = false;
switch ($ext) {
    case 'png':  $saved = imagepng($cropped, $newPath); break;
    case 'webp': $saved = function_exists('imagewebp') ? imagewebp($cropped, $newPath) : imagejpeg($cropped, $newPath, 90); break;
    default:     $saved = imagejpeg($cropped, $newPath, 90);
}
imagedestroy($cropped);

if (!$saved) {
    echo json_encode(['success' => false, 'error' => 'Could not save cropped image']);
    exit;
}

// Old thumb/display derivatives were keyed off the old filename and are now
// orphaned (not overwritten) — clean them up, then replace the original.
$oldBase = pathinfo($srcPath, PATHINFO_FILENAME);
foreach (glob($destDir . $oldBase . '_{thumb,display}.*', GLOB_BRACE) as $old) @unlink($old);
@unlink($srcPath);

$newSlug = preg_replace('/[^a-z0-9\-]/', '', strtolower(pathinfo($newPath, PATHINFO_FILENAME)));
$deriv = generateDerivatives($newPath, $destDir, $newSlug, $urlDir);

echo json_encode([
    'success' => true,
    'src'     => $urlDir . $newFilename,
    'thumb'   => $deriv['thumb'],
    'display' => $deriv['display'],
    'width'   => $deriv['width'],
    'height'  => $deriv['height'],
]);
