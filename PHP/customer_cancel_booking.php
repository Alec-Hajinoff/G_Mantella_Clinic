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
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Please log in.']);
    exit;
}

$user_id   = $_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'customer';

if ($user_role !== 'customer') {
    echo json_encode(['status' => 'error', 'message' => 'Access denied.']);
    exit;
}

$input          = json_decode(file_get_contents('php://input'), true);
$appointment_id = $input['appointment_id'] ?? null;

if (! $appointment_id) {
    echo json_encode(['status' => 'error', 'message' => 'Appointment ID is required.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('
        SELECT
            a.id,
            a.slot_id,
            a.vehicle_reg,
            a.notes,
            s.date,
            s.start_time,
            s.end_time,
            srv.name AS service_name,
            u.first_name,
            u.surname,
            u.phone
        FROM appointments a
        JOIN availability_slots s ON a.slot_id = s.id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN services srv ON a.service_id = srv.id
        WHERE a.id = :id AND a.user_id = :user_id
    ');
    $stmt->execute([
        ':id'      => $appointment_id,
        ':user_id' => $user_id,
    ]);
    $appointment = $stmt->fetch();

    if (! $appointment) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Booking not found or access denied.']);
        exit;
    }

    $slot_id = $appointment['slot_id'];

    $deleteStmt = $pdo->prepare('DELETE FROM appointments WHERE id = :id');
    $deleteStmt->execute([':id' => $appointment_id]);

    $updateStmt = $pdo->prepare("UPDATE availability_slots SET status = 'available', updated_at = NOW() WHERE id = :slot_id");
    $updateStmt->execute([':slot_id' => $slot_id]);

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
            'message' => 'Unable to process cancellation right now. Please call the garage directly on 01234 567890.',
        ]);
        exit;
    }

    $formatted_date  = date('d/m/Y', strtotime($appointment['date']));
    $formatted_start = date('H:i', strtotime($appointment['start_time']));
    $formatted_end   = date('H:i', strtotime($appointment['end_time']));
    $service_name    = $appointment['service_name'] ?? 'Not Specified';

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
        $mail->Subject = 'Booking Cancelled - ' . $appointment['first_name'] . ' ' . $appointment['surname'] . ' (' . $appointment['vehicle_reg'] . ')';
        $mail->Body    = "Hello,\n\nA customer has cancelled an appointment.\n\n"
            . "--- CUSTOMER DETAILS ---\n"
            . "Name: {$appointment['first_name']} {$appointment['surname']}\n"
            . "Phone: {$appointment['phone']}\n\n"
            . "--- CANCELLED APPOINTMENT DETAILS ---\n"
            . "Service: {$service_name}\n"
            . "Vehicle Registration: {$appointment['vehicle_reg']}\n"
            . "Date: {$formatted_date}\n"
            . "Time: {$formatted_start} - {$formatted_end}\n\n"
            . "The corresponding slot has been made available again in the schedule.\n";

        $mail->send();

        $pdo->commit();

        echo json_encode([
            'status'  => 'success',
            'message' => 'Booking cancelled and slot released successfully.',
        ]);

    } catch (Exception $e) {

        $pdo->rollBack();
        error_log('Cancellation Notification Email Error: ' . $e->getMessage());
        echo json_encode([
            'status'  => 'error',
            'message' => 'Unable to cancel the booking due to a notification error. Please call the garage directly on 01234 567890.',
        ]);
        exit;
    }

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to cancel the booking.']);
} finally {
    $pdo = null;
}
