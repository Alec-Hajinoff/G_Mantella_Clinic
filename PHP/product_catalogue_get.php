<?php
require_once 'session_config.php';

$allowed_origins = [
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $stmt = $pdo->prepare('
        SELECT
            id,
            name,
            description,
            price_gbp,
            image_url,
            stripe_product_id,
            stripe_price_id
        FROM products
        WHERE is_active = 1
        ORDER BY name ASC
    ');

    $stmt->execute();
    $products = $stmt->fetchAll();

    echo json_encode([
        'status'   => 'success',
        'products' => $products,
    ]);

} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode([
        'status'  => 'error',
        'message' => 'An error occurred while fetching products.',
    ]);
} finally {
    $pdo = null;
}
