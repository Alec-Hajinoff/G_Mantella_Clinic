<?php

require_once __DIR__ . '/../vendor/autoload.php';

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

    $metadata = $session['metadata'] ?? [];

    $is_product = isset($metadata['fulfillment_type']) && ! empty($metadata['fulfillment_type']);

    $raw_user_id = $metadata['user_id'] ?? null;
    $user_id     = (is_numeric($raw_user_id) && (int) $raw_user_id > 0) ? (int) $raw_user_id : null;

    try {
        $pdo = new PDO('mysql:host=localhost;dbname=g_mantella_clinic', 'root', '', [
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

        if (! $is_product) {

            $slot_id       = isset($metadata['slot_id']) ? (int) $metadata['slot_id'] : null;
            $service_id    = isset($metadata['service_id']) && ! empty($metadata['service_id']) ? (int) $metadata['service_id'] : null;
            $first_name    = $metadata['first_name'] ?? '';
            $surname       = $metadata['surname'] ?? '';
            $phone         = $metadata['phone'] ?? '';
            $booking_notes = $metadata['booking_notes'] ?? null;
            $service_name  = $metadata['service_name'] ?? 'Not Specified';

            if (! $slot_id) {
                throw new Exception('Missing slot_id in webhook metadata');
            }

            $pdo->beginTransaction();

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

            $update_stmt = $pdo->prepare('
                UPDATE availability_slots
                SET status = "booked", updated_at = NOW()
                WHERE id = ? AND status = "available"
            ');
            $update_stmt->execute([$slot_id]);

            if ($update_stmt->rowCount() === 0) {
                throw new Exception('Slot was already booked or does not exist');
            }

            $app_stmt = $pdo->prepare('
                INSERT INTO appointments (user_id, slot_id, service_id, notes, created_at, updated_at)
                VALUES (:user_id, :slot_id, :service_id, :notes, NOW(), NOW())
            ');
            $app_stmt->execute([
                ':user_id'    => $user_id,
                ':slot_id'    => $slot_id,
                ':service_id' => $service_id,
                ':notes'      => $booking_notes,
            ]);

            $mailUsername = $config['MAIL_USERNAME'] ?? '';
            $mailPassword = $config['MAIL_PASSWORD'] ?? '';

            if (! empty($mailUsername) && ! empty($mailPassword)) {

                $slot_stmt = $pdo->prepare('SELECT date, start_time, end_time FROM availability_slots WHERE id = ?');
                $slot_stmt->execute([$slot_id]);
                $slot_data = $slot_stmt->fetch();

                $staff_stmt = $pdo->prepare('
                    SELECT email FROM users
                    WHERE role_id IN (1, 2) AND is_deleted = 0 AND is_verified = 1
                ');
                $staff_stmt->execute();
                $staff_recipients = $staff_stmt->fetchAll(PDO::FETCH_COLUMN);

                if (! empty($staff_recipients)) {
                    $formatted_date  = date('d/m/Y', strtotime($slot_data['date']));
                    $formatted_start = date('H:i', strtotime($slot_data['start_time']));
                    $formatted_end   = date('H:i', strtotime($slot_data['end_time']));

                    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
                    $mail->isSMTP();
                    $mail->Host       = 'smtp.gmail.com';
                    $mail->SMTPAuth   = true;
                    $mail->Username   = $mailUsername;
                    $mail->Password   = $mailPassword;
                    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                    $mail->Port       = 587;
                    $mail->setFrom($mailUsername, 'G. Mantella Clinic Booking System');

                    foreach ($staff_recipients as $recipient_email) {
                        $mail->addAddress($recipient_email);
                    }

                    $mail->isHTML(false);
                    $mail->Subject = 'New Booking Alert (PAID) - ' . $first_name . ' ' . $surname;
                    $mail->Body    = "Hello,\n\nA new client appointment has been booked and paid for.\n\n"
                    . "--- CLIENT DETAILS ---\n"
                    . "Name: {$first_name} {$surname}\n"
                    . "Phone: {$phone}\n"
                    . "Email: " . ($session['customer_details']['email'] ?? 'Not provided') . "\n\n"
                    . "--- APPOINTMENT DETAILS ---\n"
                    . "Service: {$service_name}\n"
                    . "Date: {$formatted_date}\n"
                    . "Time: {$formatted_start} - {$formatted_end}\n"
                    . "Notes: " . ($booking_notes ? $booking_notes : 'None') . "\n\n"
                    . "Payment Status: PAID - £" . number_format($amount_total / 100, 2) . " " . strtoupper($currency);

                    $mail->send();
                }
            }

            $pdo->commit();
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Booking confirmed and recorded']);
            exit;
        }

        if ($is_product) {
            $fulfillment_type     = $metadata['fulfillment_type'] ?? 'collection';
            $recipient_first_name = $metadata['recipient_first_name'] ?? null;
            $recipient_surname    = $metadata['recipient_surname'] ?? null;
            $recipient_email      = $metadata['recipient_email'] ?? ($session['customer_details']['email'] ?? null);
            $recipient_phone      = $metadata['recipient_phone'] ?? null;
            $address_line1        = ($fulfillment_type === 'delivery' && ! empty($metadata['address_line1'])) ? $metadata['address_line1'] : null;
            $city                 = ($fulfillment_type === 'delivery' && ! empty($metadata['city'])) ? $metadata['city'] : null;
            $postcode             = ($fulfillment_type === 'delivery' && ! empty($metadata['postcode'])) ? $metadata['postcode'] : null;

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

                if (empty($stripe_price_id)) {
                    continue;
                }

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
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Product transaction recorded']);
            exit;
        }

    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        file_put_contents('error_log.txt', 'Webhook Error: ' . $e->getMessage() . PHP_EOL, FILE_APPEND);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        exit;
    } finally {
        $pdo = null;
    }
}

http_response_code(200);
echo json_encode(['status' => 'success']);
