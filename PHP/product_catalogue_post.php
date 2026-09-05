<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/session_config.php';

$user_id = $_SESSION['id'] ?? 'guest';

$envPath = __DIR__ . '/../.env';

if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }

        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name               = trim($name);
            $value              = trim($value, " \t\n\r\0\x0B\"'");
            $_ENV[$name]        = $value;
            putenv("{$name}={$value}");
        }
    }
}

$stripe_secret_key = $_ENV['STRIPE_SECRET_KEY'] ?? getenv('STRIPE_SECRET_KEY') ?? $_SERVER['STRIPE_SECRET_KEY'] ?? null;

if (! $stripe_secret_key) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Stripe secret key is not configured on the server.',
        'debug'   => [
            'checked_path' => realpath($envPath) ?: $envPath,
            'file_exists'  => file_exists($envPath),
        ],
    ]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$line_items = [];

if (isset($input['items']) && is_array($input['items']) && count($input['items']) > 0) {
    foreach ($input['items'] as $item) {
        if (! empty($item['stripe_price_id']) && ! empty($item['quantity'])) {
            $line_items[] = [
                'price'    => $item['stripe_price_id'],
                'quantity' => (int) $item['quantity'],
            ];
        }
    }
} elseif (isset($input['stripe_price_id']) && ! empty($input['stripe_price_id'])) {
    $quantity     = isset($input['quantity']) ? (int) $input['quantity'] : 1;
    $line_items[] = [
        'price'    => $input['stripe_price_id'],
        'quantity' => max(1, $quantity),
    ];
}

if (empty($line_items)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid request payload. Missing item price details.',
    ]);
    exit();
}

if (isset($input['fulfillment']) && $input['fulfillment'] === 'delivery') {
    $line_items[] = [
        'price_data' => [
            'currency'     => 'gbp',
            'product_data' => [
                'name' => 'Standard Delivery Fee',
            ],
            'unit_amount'  => 500,
        ],
        'quantity'   => 1,
    ];
}

$ngrok_domain = 'https://impulsive-spirits-overpay.ngrok-free.dev';

$customerDetails = $input['customer_details'] ?? [];

$fulfillment = $input['fulfillment'] ?? 'collection';

$postData = http_build_query([
    'mode'        => 'payment',
    'success_url' => $ngrok_domain . '/Loveday_Auto/PHP/success_redirect.php?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url'  => $ngrok_domain . '/Loveday_Auto/PHP/cancel_redirect.php',
    'ui_mode'     => 'hosted_page',
    'metadata'    => [
        'user_id'              => $user_id,
        'fulfillment_type'     => $fulfillment,
        'recipient_first_name' => $customerDetails['firstName'] ?? '',
        'recipient_surname'    => $customerDetails['lastName'] ?? '',
        'recipient_email'      => $customerDetails['email'] ?? '',
        'recipient_phone'      => $customerDetails['phone'] ?? '',
        'address_line1'        => $customerDetails['addressLine1'] ?? '',
        'city'                 => $customerDetails['city'] ?? '',
        'postcode'             => $customerDetails['postcode'] ?? '',
    ],
]);

if (! empty($customerDetails['email'])) {
    $postData .= '&' . urlencode('customer_email') . '=' . urlencode($customerDetails['email']);
}

foreach ($line_items as $index => $item) {
    if (isset($item['price'])) {
        $postData .= '&' . urlencode("line_items[{$index}][price]") . '=' . urlencode($item['price']);
        $postData .= '&' . urlencode("line_items[{$index}][quantity]") . '=' . urlencode($item['quantity']);
    } elseif (isset($item['price_data'])) {
        $postData .= '&' . urlencode("line_items[{$index}][price_data][currency]") . '=' . urlencode($item['price_data']['currency']);
        $postData .= '&' . urlencode("line_items[{$index}][price_data][product_data][name]") . '=' . urlencode($item['price_data']['product_data']['name']);
        $postData .= '&' . urlencode("line_items[{$index}][price_data][unit_amount]") . '=' . urlencode($item['price_data']['unit_amount']);
        $postData .= '&' . urlencode("line_items[{$index}][quantity]") . '=' . urlencode($item['quantity']);
    }
}

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret_key . ':');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'cURL error connecting to Stripe: ' . $curlError,
    ]);
    exit();
}

$responseData = json_decode($response, true);

if ($httpCode === 200 && isset($responseData['url'])) {
    echo json_encode([
        'status'     => 'success',
        'url'        => $responseData['url'],
        'session_id' => $responseData['id'],
    ]);
} else {
    http_response_code($httpCode >= 400 ? $httpCode : 500);
    echo json_encode([
        'status'  => 'error',
        'message' => $responseData['error']['message'] ?? 'Failed to create Stripe checkout session.',
    ]);
}
