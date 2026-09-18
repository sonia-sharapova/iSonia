<?php
// Shared by upload-image.php and sync-incoming-photos.php. Generates a small
// grid thumbnail and a larger display/lightbox version so pages don't have
// to load the full-size original. Best-effort: if GD isn't available on this
// server, callers just skip derivatives and serve the original.

function makeDerivative($srcPath, $destPath, $maxDim, $quality) {
    if (!function_exists('imagecreatetruecolor')) return false;

    $info = @getimagesize($srcPath);
    if (!$info) return false;
    [$width, $height, $imgType] = $info;

    switch ($imgType) {
        case IMAGETYPE_JPEG: $src = @imagecreatefromjpeg($srcPath); break;
        case IMAGETYPE_PNG:  $src = @imagecreatefrompng($srcPath); break;
        case IMAGETYPE_GIF:  $src = @imagecreatefromgif($srcPath); break;
        case IMAGETYPE_WEBP: $src = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($srcPath) : false; break;
        default: $src = false;
    }
    if (!$src) return false;

    $ratio = min(1, $maxDim / max($width, $height));
    $dstW = max(1, (int) round($width * $ratio));
    $dstH = max(1, (int) round($height * $ratio));

    $dst = imagecreatetruecolor($dstW, $dstH);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $dstW, $dstH, $width, $height);
    imagedestroy($src);

    $ok = function_exists('imagewebp')
        ? imagewebp($dst, $destPath, $quality)
        : imagejpeg($dst, $destPath, $quality);
    imagedestroy($dst);
    return $ok;
}

function derivativeExt() {
    return function_exists('imagewebp') ? 'webp' : 'jpg';
}

// Generates thumb + display derivatives next to $destPath (same dir, based on
// $slug), returning ['thumb' => url-or-null, 'display' => url-or-null,
// 'width' => int-or-null, 'height' => int-or-null], all paths relative to
// $urlPrefix (e.g. '/images/albums/').
function generateDerivatives($destPath, $destDir, $slug, $urlPrefix) {
    $ext = derivativeExt();
    $thumbName   = $slug . '_' . time() . '_thumb.'   . $ext;
    $displayName = $slug . '_' . time() . '_display.' . $ext;

    $thumbOk   = makeDerivative($destPath, $destDir . $thumbName,   500,  75);
    $displayOk = makeDerivative($destPath, $destDir . $displayName, 1920, 82);
    $dims = @getimagesize($destPath);

    return [
        'thumb'   => $thumbOk   ? $urlPrefix . $thumbName   : null,
        'display' => $displayOk ? $urlPrefix . $displayName : null,
        'width'   => $dims ? $dims[0] : null,
        'height'  => $dims ? $dims[1] : null,
    ];
}
