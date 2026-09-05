<?php
require_once 'session_config.php';

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
if ($config === false) {
    error_log('Failed to parse .env file');
    echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
    exit;
}

$mailUsername = $config['MAIL_USERNAME'];
$mailPassword = $config['MAIL_PASSWORD'];

if (empty($mailUsername) || empty($mailPassword)) {
    error_log('Gmail credentials not found in .env file');
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

if (! isset($input['slot_ids']) || ! is_array($input['slot_ids']) || empty($input['slot_ids'])) {
    echo json_encode(['status' => 'error', 'message' => 'Please select at least one appointment slot.']);
    exit;
}

$slot_ids    = array_map('intval', $input['slot_ids']);
$service_id  = isset($input['service_id']) ? (int) $input['service_id'] : null;
$vehicle_reg = isset($input['vehicle_reg']) ? trim($input['vehicle_reg']) : null;
$notes       = isset($input['notes']) ? trim($input['notes']) : null;

$first_name = isset($input['first_name']) ? trim($input['first_name']) : '';
$surname    = isset($input['surname']) ? trim($input['surname']) : '';
$phone      = isset($input['phone']) ? trim($input['phone']) : '';

if (empty($vehicle_reg)) {
    echo json_encode(['status' => 'error', 'message' => 'Vehicle registration is required.']);
    exit;
}

if (empty($first_name) || empty($surname) || empty($phone)) {
    echo json_encode(['status' => 'error', 'message' => 'First name, surname, and phone number are required.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

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

    $in_clause  = implode(',', array_fill(0, count($slot_ids), '?'));
    $check_stmt = $pdo->prepare("SELECT id, date, start_time, end_time FROM availability_slots WHERE id IN ($in_clause) AND status = 'available' FOR UPDATE");
    $check_stmt->execute($slot_ids);

    $available_slots = $check_stmt->fetchAll();

    if (count($available_slots) !== count($slot_ids)) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'One or more selected slots are no longer available.']);
        exit;
    }

    $update_stmt = $pdo->prepare("UPDATE availability_slots SET status = 'booked', updated_at = NOW() WHERE id IN ($in_clause)");
    $update_stmt->execute($slot_ids);

    $app_stmt = $pdo->prepare('
        INSERT INTO appointments (user_id, slot_id, service_id, vehicle_reg, notes, created_at, updated_at)
        VALUES (:user_id, :slot_id, :service_id, :vehicle_reg, :notes, NOW(), NOW())
    ');

    foreach ($slot_ids as $slot_id) {
        $app_stmt->execute([
            ':user_id'     => $user_id,
            ':slot_id'     => $slot_id,
            ':service_id'  => $service_id,
            ':vehicle_reg' => $vehicle_reg,
            ':notes'       => $notes,
        ]);
    }

    $service_name = 'Not Specified';
    if ($service_id) {
        $service_stmt = $pdo->prepare('SELECT name FROM services WHERE id = ?');
        $service_stmt->execute([$service_id]);
        $service_row = $service_stmt->fetch();
        if ($service_row) {
            $service_name = $service_row['name'];
        }
    }

    $staff_stmt = $pdo->prepare('
        SELECT email
        FROM users
        WHERE role_id IN (1, 2)
          AND is_deleted = 0
          AND is_verified = 1
    ');
    $staff_stmt->execute();
    $staff_recipients = $staff_stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($staff_recipients)) {

        $pdo->rollBack();
        echo json_encode([
            'status'  => 'error',
            'message' => 'Your booking could not be completed at this time. Please call the garage directly on 01234 567890 to book your appointment.',
        ]);
        exit;
    }

    $slot_details_list = [];
    foreach ($available_slots as $slot) {
        $formatted_date      = date('d/m/Y', strtotime($slot['date']));
        $formatted_start     = date('H:i', strtotime($slot['start_time']));
        $formatted_end       = date('H:i', strtotime($slot['end_time']));
        $slot_details_list[] = "• Date: {$formatted_date} | Time: {$formatted_start} - {$formatted_end}";
    }
    $slots_text = implode("\n", $slot_details_list);

    $mail = new PHPMailer(true);

    try {
        $mail->SMTPDebug = SMTP::DEBUG_OFF;
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = $mailUsername;
        $mail->Password   = $mailPassword;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom($mailUsername, 'Hertford Standard Booking System');

        foreach ($staff_recipients as $recipient_email) {
            $mail->addAddress($recipient_email);
        }

        $mail->isHTML(false);
        $mail->Subject = 'New Booking Alert - ' . $first_name . ' ' . $surname . ' (' . $vehicle_reg . ')';
        $mail->Body    = "Hello,\n\nA new customer appointment has been booked.\n\n"
            . "--- CUSTOMER DETAILS ---\n"
            . "Name: {$first_name} {$surname}\n"
            . "Phone: {$phone}\n\n"
            . "--- APPOINTMENT DETAILS ---\n"
            . "Service: {$service_name}\n"
            . "Vehicle Registration: {$vehicle_reg}\n"
            . "Notes: " . ($notes ? $notes : 'None') . "\n\n"
            . "--- BOOKED SLOTS ---\n"
            . "{$slots_text}\n";

        $mail->send();

        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'Appointment booked successfully!']);

    } catch (Exception $e) {

        $pdo->rollBack();
        error_log('Booking Notification Email Error: ' . $e->getMessage());
        echo json_encode([
            'status'  => 'error',
            'message' => 'Your booking could not be completed due to a notification error. Please call the garage directly on 01234 567890 to complete your booking.',
        ]);
        exit;
    }

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to process appointment booking.']);
} finally {
    $pdo = null;
}
