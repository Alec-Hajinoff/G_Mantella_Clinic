<?php
require_once 'session_config.php';

$allowed_origins = [
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;

if ($origin === null || $origin === '') {
} elseif (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$isAuthenticated = isset($_SESSION['id']);

$userRole = $isAuthenticated && isset($_SESSION['role']) ? $_SESSION['role'] : null;

echo json_encode([
    'authenticated' => $isAuthenticated,
    'userId'        => $isAuthenticated ? $_SESSION['id'] : null,
    'role'          => $userRole,
]);
