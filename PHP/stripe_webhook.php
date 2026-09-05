<?php

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
if ($config === false) {
    error_log('Failed to parse .env file');
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
    exit;
}

$stripe_secret_key     = $config['STRIPE_SECRET_KEY'] ?? '';
$stripe_webhook_secret = $config['STRIPE_WEBHOOK_SECRET'] ?? '';

if (empty($stripe_secret_key) || empty($stripe_webhook_secret)) {
    error_log('Stripe API credentials or Webhook Secret missing in .env');
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
    exit;
}

header('Content-Type: application/json');

$payload    = file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if (empty($payload) || empty($sig_header)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request payload or signature missing']);
    exit;
}

$sig_items = [];
foreach (explode(',', $sig_header) as $item) {
    $pair = explode('=', trim($item), 2);
    if (count($pair) === 2) {
        $sig_items[$pair[0]] = $pair[1];
    }
}

$timestamp     = $sig_items['t'] ?? '';
$stripe_v1_sig = $sig_items['v1'] ?? '';

if (empty($timestamp) || empty($stripe_v1_sig) || abs(time() - (int) $timestamp) > 300) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Signature verification failed (timestamp mismatch)']);
    exit;
}

$signed_payload = $timestamp . '.' . $payload;
$computed_sig   = hash_hmac('sha256', $signed_payload, $stripe_webhook_secret);

if (! hash_equals($computed_sig, $stripe_v1_sig)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Signature verification failed']);
    exit;
}

$event      = json_decode($payload, true);
$event_type = $event['type'] ?? '';

if ($event_type === 'checkout.session.completed') {
    $session = $event['data']['object'];

    $stripe_session_id        = $session['id'] ?? '';
    $stripe_payment_intent_id = $session['payment_intent'] ?? '';
    $amount_total             = $session['amount_total'] ?? 0;
    $currency                 = strtoupper($session['currency'] ?? 'GBP');
    $payment_status           = ($session['payment_status'] === 'paid') ? 'paid' : 'pending';

    $raw_user_id = $session['metadata']['user_id'] ?? null;
    $user_id     = (is_numeric($raw_user_id) && (int) $raw_user_id > 0) ? (int) $raw_user_id : null;

    $metadata             = $session['metadata'] ?? [];
    $fulfillment_type     = ! empty($metadata['fulfillment_type']) ? $metadata['fulfillment_type'] : 'collection';
    $recipient_first_name = ! empty($metadata['recipient_first_name']) ? $metadata['recipient_first_name'] : null;
    $recipient_surname    = ! empty($metadata['recipient_surname']) ? $metadata['recipient_surname'] : null;
    $recipient_email      = ! empty($metadata['recipient_email']) ? $metadata['recipient_email'] : ($session['customer_details']['email'] ?? null);
    $recipient_phone      = ! empty($metadata['recipient_phone']) ? $metadata['recipient_phone'] : null;

    $address_line1 = ($fulfillment_type === 'delivery' && ! empty($metadata['address_line1'])) ? $metadata['address_line1'] : null;
    $city          = ($fulfillment_type === 'delivery' && ! empty($metadata['city'])) ? $metadata['city'] : null;
    $postcode      = ($fulfillment_type === 'delivery' && ! empty($metadata['postcode'])) ? $metadata['postcode'] : null;

    try {

        $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);

        $check_stmt = $pdo->prepare('SELECT id FROM transactions WHERE stripe_session_id = ?');
        $check_stmt->execute([$stripe_session_id]);
        if ($check_stmt->fetch()) {
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Transaction already processed']);
            exit;
        }

        $ch = curl_init("https://api.stripe.com/v1/checkout/sessions/{$stripe_session_id}/line_items");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret_key . ':');
        $line_items_response = curl_exec($ch);
        $http_code           = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200 || ! $line_items_response) {
            file_put_contents('error_log.txt', "Webhook fetch line items error ($http_code): " . $line_items_response . PHP_EOL, FILE_APPEND);
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Could not fetch line items from Stripe']);
            exit;
        }

        $line_items_data = json_decode($line_items_response, true);
        $line_items      = $line_items_data['data'] ?? [];

        $pdo->beginTransaction();

        $now = date('Y-m-d H:i:s');

        $trx_stmt = $pdo->prepare('
            INSERT INTO transactions (
                user_id,
                stripe_session_id,
                stripe_payment_intent_id,
                amount_total,
                currency,
                status,
                fulfillment_type,
                recipient_first_name,
                recipient_surname,
                recipient_email,
                recipient_phone,
                address_line1,
                city,
                postcode,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        $trx_stmt->execute([
            $user_id,
            $stripe_session_id,
            $stripe_payment_intent_id,
            $amount_total,
            $currency,
            $payment_status,
            $fulfillment_type,
            $recipient_first_name,
            $recipient_surname,
            $recipient_email,
            $recipient_phone,
            $address_line1,
            $city,
            $postcode,
            $now,
            $now,
        ]);

        $transaction_id = $pdo->lastInsertId();

        $product_lookup_stmt = $pdo->prepare('SELECT id FROM products WHERE stripe_price_id = ? LIMIT 1');
        $item_stmt           = $pdo->prepare('
            INSERT INTO transaction_items (
                transaction_id,
                product_id,
                quantity,
                unit_amount,
                total_amount,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ');

        foreach ($line_items as $item) {
            $stripe_price_id = $item['price']['id'] ?? '';
            $quantity        = $item['quantity'] ?? 1;
            $unit_amount     = $item['price']['unit_amount'] ?? 0;
            $total_amount    = $item['amount_total'] ?? ($unit_amount * $quantity);

            $product_lookup_stmt->execute([$stripe_price_id]);
            $product = $product_lookup_stmt->fetch();

            if ($product) {
                $product_id = $product['id'];

                $item_stmt->execute([
                    $transaction_id,
                    $product_id,
                    $quantity,
                    $unit_amount,
                    $total_amount,
                    $now,
                    $now,
                ]);
            } else {
                file_put_contents('error_log.txt', "Product missing in local DB for stripe_price_id: {$stripe_price_id}" . PHP_EOL, FILE_APPEND);
            }
        }

        $pdo->commit();

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        file_put_contents('error_log.txt', 'Webhook DB Error: ' . $e->getMessage() . PHP_EOL, FILE_APPEND);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
        exit;
    } finally {
        $pdo = null;
    }
}

http_response_code(200);
echo json_encode(['status' => 'success']);
