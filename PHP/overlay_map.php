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
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

$servername     = '127.0.0.1';
$username       = 'root';
$passwordServer = '';
$dbname         = 'g_mantella_clinic';

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $passwordServer);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$svgKey = $input['svg_key'] ?? null;

if (! $svgKey) {
    echo json_encode(['status' => 'error', 'message' => 'Missing svg_key parameter.']);
    exit;
}

try {

    $sql = "SELECT
                p.id,
                p.name,
                p.description,
                p.price_gbp,
                p.image_url,
                p.stripe_product_id,
                p.stripe_price_id
            FROM products p
            INNER JOIN product_hotspots ph ON p.id = ph.product_id
            INNER JOIN hotspots h ON ph.hotspot_id = h.id
            WHERE h.svg_key = :svg_key AND p.is_active = 1
            ORDER BY p.name ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':svg_key', $svgKey);
    $stmt->execute();

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($products as &$product) {
        $product['id']        = (int) $product['id'];
        $product['price_gbp'] = (float) $product['price_gbp'];
    }

    echo json_encode([
        'status'   => 'success',
        'products' => $products,
    ]);
} catch (PDOException $e) {
    error_log('overlay_map error: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch products.']);
} finally {
    $conn = null;
}
