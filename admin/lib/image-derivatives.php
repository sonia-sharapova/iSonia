<?php
// Shared by upload-image.php, sync-incoming-photos.php, crop-image.php and
// rotate-image.php. Generates a small grid thumbnail and a larger
// display/lightbox version so pages don't have to load the full-size
// original. Best-effort: if GD isn't available on this server, callers just
// skip derivatives and serve the original.

// Loads a JPEG/PNG/GIF/WEBP file into a GD resource, auto-correcting for
// EXIF orientation (the rotation tag phone cameras write into JPEGs) so the
// returned resource's pixel data is already right-side-up.
function loadImageAutoOriented($path, $imgType) {
    switch ($imgType) {
        case IMAGETYPE_JPEG: $im = @imagecreatefromjpeg($path); break;
        case IMAGETYPE_PNG:  $im = @imagecreatefrompng($path); break;
        case IMAGETYPE_GIF:  $im = @imagecreatefromgif($path); break;
        case IMAGETYPE_WEBP: $im = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false; break;
        default: $im = false;
    }
    if (!$im) return false;

    if ($imgType === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $exif = @exif_read_data($path);
        $orientation = $exif['Orientation'] ?? 1;
        switch ($orientation) {
            case 2: imageflip($im, IMG_FLIP_HORIZONTAL); break;
            case 3: $im = imagerotate($im, 180, 0); break;
            case 4: imageflip($im, IMG_FLIP_VERTICAL); break;
            case 5: imageflip($im, IMG_FLIP_HORIZONTAL); $im = imagerotate($im, -90, 0); break;
            case 6: $im = imagerotate($im, -90, 0); break;
            case 7: imageflip($im, IMG_FLIP_HORIZONTAL); $im = imagerotate($im, 90, 0); break;
            case 8: $im = imagerotate($im, 90, 0); break;
        }
    }
    return $im;
}

// Physically bakes EXIF-orientation correction into $path itself, in place —
// GD's own imagejpeg()/imagewebp() never write the orientation tag back out,
// so anything downstream that only reads the tag (rather than the corrected
// pixels) silently loses it: derivatives come out sideways even though the
// original, viewed directly, looked fine via browser-side EXIF handling.
// Called from generateDerivatives() below, which is every upload/sync/crop/
// rotate endpoint's shared last step — so the original file and everything
// derived from it end up consistently right-side-up. No-op for anything
// without EXIF or a non-default orientation tag (the overwhelmingly common
// case, and cheap to check).
function normalizeOrientationInPlace($path) {
    $info = @getimagesize($path);
    if (!$info) return;
    [, , $imgType] = $info;
    if ($imgType !== IMAGETYPE_JPEG || !function_exists('exif_read_data')) return;

    $exif = @exif_read_data($path);
    $orientation = $exif['Orientation'] ?? 1;
    if ($orientation === 1) return;

    $im = loadImageAutoOriented($path, $imgType);
    if (!$im) return;
    imagejpeg($im, $path, 92);
    imagedestroy($im);
}

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
// $urlPrefix (e.g. '/images/albums/'). Normalizes $destPath's own EXIF
// orientation in place first — every caller (upload, sync, crop, rotate)
// goes through here, so this is the one place that guarantees it happens.
function generateDerivatives($destPath, $destDir, $slug, $urlPrefix) {
    normalizeOrientationInPlace($destPath);

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
