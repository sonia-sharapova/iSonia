<?php
// One-time setup: generates a bcrypt hash and writes it to config.php
// DELETE THIS FILE after you've set your password

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    $confirm  = $_POST['confirm'] ?? '';

    if (strlen($password) < 8) {
        $error = 'Password must be at least 8 characters.';
    } elseif ($password !== $confirm) {
        $error = 'Passwords do not match.';
    } else {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $config = "<?php\n// Run setup.php once to generate this hash, then delete setup.php\ndefine('ADMIN_PASSWORD_HASH', '$hash');\n";
        if (file_put_contents(__DIR__ . '/config.php', $config) !== false) {
            $message = 'Password set. <strong>Delete this file (setup.php) from your server now.</strong>';
        } else {
            $error = 'Could not write config.php — check file permissions.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Setup</title>
  <style>
    body { font-family: 'Courier New', monospace; background:#f5f5f5; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
    .box { background:white; border:1px solid #d5d5d5; padding:40px; max-width:380px; width:95%; }
    h2 { margin:0 0 6px; font-size:16px; text-transform:uppercase; letter-spacing:2px; font-weight:normal; }
    p.sub { margin:0 0 24px; font-size:12px; color:#888; }
    label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#666; display:block; margin-bottom:4px; }
    input { width:100%; padding:9px; border:1px solid #d5d5d5; font-family:'Courier New',monospace; font-size:13px; box-sizing:border-box; margin-bottom:14px; }
    button { width:100%; padding:10px; background:#414141; color:white; border:none; font-family:'Courier New',monospace; font-size:12px; text-transform:uppercase; letter-spacing:1px; cursor:pointer; }
    .error { color:#c0392b; font-size:12px; margin-bottom:12px; }
    .success { color:#27ae60; font-size:13px; }
    .warn { background:#fffbea; border:1px solid #f0d060; padding:12px; font-size:12px; margin-bottom:20px; }
  </style>
</head>
<body>
<div class="box">
  <h2>Admin Setup</h2>
  <p class="sub">Set your admin password. Run this once, then delete the file.</p>
  <div class="warn">⚠ Delete <code>setup.php</code> from your server after use.</div>
  <?php if ($error): ?><div class="error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
  <?php if ($message): ?><p class="success"><?= $message ?></p>
  <?php else: ?>
  <form method="POST">
    <label>New Password</label>
    <input type="password" name="password" required minlength="8">
    <label>Confirm Password</label>
    <input type="password" name="confirm" required>
    <button type="submit">Set Password</button>
  </form>
  <?php endif; ?>
</div>
</body>
</html>
