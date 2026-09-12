<?php
require_once 'session_config.php';

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\SMTP;

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
if ($config === false) {
    error_log('Failed to parse .env file');
    echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
    exit;
}

$mailUsername      = $config['MAIL_USERNAME'];
$mailPassword      = $config['MAIL_PASSWORD'];
$stripe_secret_key = $config['STRIPE_SECRET_KEY'] ?? '';

if (empty($mailUsername) || empty($mailPassword)) {
    error_log('Gmail credentials not found in .env file');
    echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
    exit;
}

if (empty($stripe_secret_key)) {
    error_log('Stripe secret key not found in .env file');
    echo json_encode(['status' => 'error', 'message' => 'Stripe configuration error']);
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
    echo json_encode(['status' => 'error', 'message' => 'You must be logged in to book an appointment.']);
    exit;
}

$user_id   = $_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'customer';

if ($user_role !== 'customer') {
    echo json_encode(['status' => 'error', 'message' => 'Access denied. Only customers can book appointments.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (! isset($input['slot_id']) || empty($input['slot_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Please select an appointment slot.']);
    exit;
}

$slot_id         = (int) $input['slot_id'];
$service_id      = isset($input['service_id']) ? (int) $input['service_id'] : null;
$service_name    = $input['service_name'] ?? 'Not Specified';
$service_price   = isset($input['service_price']) ? (float) $input['service_price'] : 0;
$stripe_price_id = $input['stripe_price_id'] ?? null;

$notes = isset($input['notes']) ? trim($input['notes']) : null;

$first_name = isset($input['first_name']) ? trim($input['first_name']) : '';
$surname    = isset($input['surname']) ? trim($input['surname']) : '';
$phone      = isset($input['phone']) ? trim($input['phone']) : '';

$consent_answers = isset($input['consent_answers']) && is_array($input['consent_answers']) ? $input['consent_answers'] : [];

if (empty($first_name) || empty($surname) || empty($phone)) {
    echo json_encode(['status' => 'error', 'message' => 'First name, surname, and phone number are required.']);
    exit;
}

if (empty($stripe_price_id) && $service_price <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Service price is required for payment processing.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=g_mantella_clinic', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $check_stmt = $pdo->prepare("SELECT id, date, start_time, end_time FROM availability_slots WHERE id = ? AND status = 'available'");
    $check_stmt->execute([$slot_id]);
    $slot_data = $check_stmt->fetch();

    if (! $slot_data) {
        echo json_encode(['status' => 'error', 'message' => 'Selected slot is no longer available.']);
        exit;
    }

    $user_stmt = $pdo->prepare('
        UPDATE users
        SET first_name = :first_name,
            surname = :surname,
            phone = :phone,
            updated_at = NOW()
        WHERE id = :user_id
    ');
    $user_stmt->execute([
        ':first_name' => $first_name,
        ':surname'    => $surname,
        ':phone'      => $phone,
        ':user_id'    => $user_id,
    ]);

    $user_email_stmt = $pdo->prepare('SELECT email FROM users WHERE id = ?');
    $user_email_stmt->execute([$user_id]);
    $user_data  = $user_email_stmt->fetch();
    $user_email = $user_data['email'] ?? '';

    $formatted_date   = date('d/m/Y', strtotime($slot_data['date']));
    $formatted_start  = date('H:i', strtotime($slot_data['start_time']));
    $formatted_end    = date('H:i', strtotime($slot_data['end_time']));
    $slot_description = "{$formatted_date} - {$formatted_start} to {$formatted_end}";

    $metadata = [
        'user_id'         => (string) $user_id,
        'slot_id'         => (string) $slot_id,
        'service_id'      => (string) ($service_id ?? ''),
        'service_name'    => $service_name,
        'first_name'      => $first_name,
        'surname'         => $surname,
        'phone'           => $phone,
        'booking_notes'   => $notes ?? '',
        'slot_date'       => $slot_data['date'],
        'slot_start'      => $slot_data['start_time'],
        'slot_end'        => $slot_data['end_time'],

        'consent_answers' => json_encode($consent_answers),
    ];

    $ngrok_domain = $config['NGROK_DOMAIN'] ?? 'https://impulsive-spirits-overpay.ngrok-free.dev';

    $postData = http_build_query([
        'mode'                => 'payment',
        'success_url'         => $ngrok_domain . '/G_Mantella_Clinic/PHP/success_redirect.php?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url'          => $ngrok_domain . '/G_Mantella_Clinic/PHP/cancel_redirect.php',
        'ui_mode'             => 'hosted_page',
        'customer_email'      => $user_email,
        'payment_intent_data' => [
            'metadata' => $metadata,
        ],
        'metadata'            => $metadata,
    ]);

    if (! empty($stripe_price_id)) {

        $postData .= '&' . urlencode('line_items[0][price]') . '=' . urlencode($stripe_price_id);
        $postData .= '&' . urlencode('line_items[0][quantity]') . '=1';
    } else {

        $postData .= '&' . urlencode('line_items[0][price_data][currency]') . '=gbp';
        $postData .= '&' . urlencode('line_items[0][price_data][product_data][name]') . '=' . urlencode('Booking: ' . $service_name . ' - ' . $slot_description);
        $postData .= '&' . urlencode('line_items[0][price_data][unit_amount]') . '=' . urlencode($service_price * 100);
        $postData .= '&' . urlencode('line_items[0][quantity]') . '=1';
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
            'message' => 'Payment processing error: ' . $curlError,
        ]);
        exit;
    }

    $responseData = json_decode($response, true);

    if ($httpCode === 200 && isset($responseData['url'])) {

        echo json_encode([
            'status'     => 'success',
            'url'        => $responseData['url'],
            'session_id' => $responseData['id'],
        ]);
    } else {
        $errorMsg = $responseData['error']['message'] ?? 'Failed to create payment session.';
        http_response_code($httpCode >= 400 ? $httpCode : 500);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Payment initialization failed: ' . $errorMsg,
        ]);
    }

} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to process booking request.']);
} finally {
    $pdo = null;
}
