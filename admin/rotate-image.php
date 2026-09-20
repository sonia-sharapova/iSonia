<?php
// Bakes a 90/180/270 rotation into an actual new image file, replacing the
// original — same "physically replace the pixels" approach as crop-image.php,
// so the result persists everywhere the photo is rendered (album, gallery,
// individual view) since they all read the same src/thumb/display fields.
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

$input   = json_decode(file_get_contents('php://input'), true);
$src     = $input['src'] ?? '';
$degrees = (int) ($input['degrees'] ?? 0);

// Only 90° increments — no background-fill/canvas-resize math needed, and it
// covers the only rotations anyone actually wants for a photo.
if (!in_array($degrees, [90, -90, 180], true)) {
    echo json_encode(['success' => false, 'error' => 'Invalid rotation']);
    exit;
}

// Same containment check as crop-image.php — only ever touch files under images/.
if (!preg_match('#^/images/[a-zA-Z0-9_\-./ ]+\.(jpe?g|png|gif|webp)$#i', $src)) {
    echo json_encode(['success' => false, 'error' => 'Invalid image path']);
    exit;
}

$imagesRoot = realpath(__DIR__ . '/../images');
$srcPath = realpath(__DIR__ . '/..' . $src);
if (!$srcPath || !$imagesRoot || strpos($srcPath, $imagesRoot . DIRECTORY_SEPARATOR) !== 0 || !is_file($srcPath)) {
    echo json_encode(['success' => false, 'error' => 'Source image not found']);
    exit;
}

if (!function_exists('imagerotate')) {
    echo json_encode(['success' => false, 'error' => 'Server image library does not support rotation']);
    exit;
}

// Normalize any pending EXIF orientation into the actual pixels first, so
// the +/-90 the admin asked for applies on top of what they're actually
// seeing rather than compounding with an uncorrected raw orientation.
normalizeOrientationInPlace($srcPath);

$info = @getimagesize($srcPath);
if (!$info) { echo json_encode(['success' => false, 'error' => 'Could not read image']); exit; }
[, , $imgType] = $info;

switch ($imgType) {
    case IMAGETYPE_JPEG: $im = @imagecreatefromjpeg($srcPath); break;
    case IMAGETYPE_PNG:  $im = @imagecreatefrompng($srcPath); break;
    case IMAGETYPE_GIF:  $im = @imagecreatefromgif($srcPath); break;
    case IMAGETYPE_WEBP: $im = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($srcPath) : false; break;
    default: $im = false;
}
if (!$im) { echo json_encode(['success' => false, 'error' => 'Unsupported or unreadable image type']); exit; }

// imagerotate() spins counter-clockwise for a positive angle, so a clockwise
// "rotate right" (+90 in our UI/API) needs a negated angle here.
$rotated = imagerotate($im, -$degrees, 0);
imagedestroy($im);
if (!$rotated) { echo json_encode(['success' => false, 'error' => 'Rotation failed']); exit; }
imagealphablending($rotated, false);
imagesavealpha($rotated, true);

$destDir  = dirname($srcPath) . '/';
$urlDir   = dirname($src) . '/';
$slug     = preg_replace('/[^a-z0-9\-]/', '', strtolower(pathinfo($srcPath, PATHINFO_FILENAME)));
$ext      = strtolower(pathinfo($srcPath, PATHINFO_EXTENSION));
$newFilename = $slug . '_rot' . time() . '.' . $ext;
$newPath  = $destDir . $newFilename;

$saved = false;
switch ($ext) {
    case 'png':  $saved = imagepng($rotated, $newPath); break;
    case 'webp': $saved = function_exists('imagewebp') ? imagewebp($rotated, $newPath) : imagejpeg($rotated, $newPath, 90); break;
    default:     $saved = imagejpeg($rotated, $newPath, 90);
}
imagedestroy($rotated);

if (!$saved) {
    echo json_encode(['success' => false, 'error' => 'Could not save rotated image']);
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
