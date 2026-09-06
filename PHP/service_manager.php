<?php
require_once 'session_config.php';

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
if ($config === false) {
    error_log('Failed to parse .env file');
    echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
    exit;
}

$stripe_secret_key = $config['STRIPE_SECRET_KEY'] ?? '';

if (empty($stripe_secret_key)) {
    error_log('Stripe API credentials not found in .env file');
    echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
    exit;
}

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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

if (! isset($_SESSION['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Please log in.']);
    exit;
}

$user_role    = $_SESSION['role'] ?? null;
$user_role_id = $_SESSION['role_id'] ?? null;

$is_staff = false;

if ($user_role !== null) {
    $allowed_roles = ['owner', 'admin'];
    if (in_array(strtolower($user_role), $allowed_roles, true)) {
        $is_staff = true;
    }
}

if ($user_role_id !== null) {
    if (in_array((int) $user_role_id, [1, 2, 3], true)) {
        $is_staff = true;
    }
}

if (! $is_staff) {
    echo json_encode(['status' => 'error', 'message' => 'Access denied. Only clinic staff can perform this action.']);
    exit;
}

$name             = trim($_POST['name'] ?? '');
$description      = trim($_POST['description'] ?? '');
$duration_minutes = filter_var($_POST['duration_minutes'] ?? '', FILTER_VALIDATE_INT);
$service_price    = filter_var($_POST['service_price'] ?? '', FILTER_VALIDATE_FLOAT);

if (empty($name) || $duration_minutes === false || $duration_minutes <= 0 || $service_price === false || $service_price < 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid service input values provided.']);
    exit;
}

$image_url = null;

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $file_tmp  = $_FILES['image']['tmp_name'];
    $file_name = $_FILES['image']['name'];
    $file_size = $_FILES['image']['size'];
    $file_ext  = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    $allowed_extensions = ['jpg', 'jpeg', 'png', 'webp'];

    if (! in_array($file_ext, $allowed_extensions, true)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid image file type. Allowed formats: JPG, PNG, WEBP.']);
        exit;
    }

    if ($file_size > 5 * 1024 * 1024) {
        echo json_encode(['status' => 'error', 'message' => 'Image file size exceeds the 5MB limit.']);
        exit;
    }

    $target_dir = __DIR__ . '/Images/';
    if (! file_exists($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    $new_file_name = uniqid('serv_', true) . '.' . $file_ext;
    $target_file   = $target_dir . $new_file_name;

    if (move_uploaded_file($file_tmp, $target_file)) {
        $image_url = 'Images/' . $new_file_name;
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to upload service image.']);
        exit;
    }
}

$ch = curl_init('https://api.stripe.com/v1/products');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret_key . ':');
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'name'        => $name,
    'description' => $description,
]));

$stripe_product_response = curl_exec($ch);
$product_http_code       = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch) || $product_http_code !== 200) {
    curl_close($ch);
    echo json_encode(['status' => 'error', 'message' => 'Failed to create service product in Stripe API.']);
    exit;
}

$product_data      = json_decode($stripe_product_response, true);
$stripe_product_id = $product_data['id'] ?? null;

$amount_in_pence = (int) round($service_price * 100);

curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/prices');
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'unit_amount' => $amount_in_pence,
    'currency'    => 'gbp',
    'product'     => $stripe_product_id,
]));

$stripe_price_response = curl_exec($ch);
$price_http_code       = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($price_http_code !== 200) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to create service price record in Stripe API.']);
    exit;
}

$price_data      = json_decode($stripe_price_response, true);
$stripe_price_id = $price_data['id'] ?? null;

if (! $stripe_product_id || ! $stripe_price_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing product or price identifiers from Stripe.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=g_mantella_clinic', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $stmt = $pdo->prepare('
        INSERT INTO services (
            name,
            description,
            service_price,
            duration_minutes,
            image_url,
            is_active,
            stripe_product_id,
            stripe_price_id,
            created_at,
            updated_at
        ) VALUES (
            :name,
            :description,
            :service_price,
            :duration_minutes,
            :image_url,
            1,
            :stripe_product_id,
            :stripe_price_id,
            NOW(),
            NOW()
        )
    ');

    $stmt->execute([
        ':name'              => $name,
        ':description'       => $description,
        ':service_price'     => $service_price,
        ':duration_minutes'  => $duration_minutes,
        ':image_url'         => $image_url,
        ':stripe_product_id' => $stripe_product_id,
        ':stripe_price_id'   => $stripe_price_id,
    ]);

    echo json_encode([
        'status'  => 'success',
        'message' => 'Service successfully created and synced with Stripe.',
    ]);

} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Database error encountered while saving service.']);
} finally {
    $pdo = null;
}
