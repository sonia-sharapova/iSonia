<?php
session_start();
header('Content-Type: application/json');
echo json_encode(['admin' => !empty($_SESSION['admin'])]);
