<?php
session_start();
if (file_exists(__DIR__ . '/config.local.php')) {
    require __DIR__ . '/config.local.php';
} else {
    require __DIR__ . '/config.php';
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = $input['password'] ?? '';

if (!ADMIN_PASSWORD_HASH) {
    echo json_encode(['success' => false, 'error' => 'Admin not configured. Run setup.php first.']);
    exit;
}

if (password_verify($password, ADMIN_PASSWORD_HASH)) {
    $_SESSION['admin'] = true;
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Incorrect password.']);
}
