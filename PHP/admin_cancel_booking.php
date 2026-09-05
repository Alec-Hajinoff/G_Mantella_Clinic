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

$user_role    = $_SESSION['role'] ?? null;
$user_role_id = $_SESSION['role_id'] ?? null;

$is_authorized = false;
if ($user_role !== null && in_array(strtolower($user_role), ['owner', 'admin'], true)) {
    $is_authorized = true;
}
if ($user_role_id !== null && in_array((int) $user_role_id, [1, 2], true)) {
    $is_authorized = true;
}

if (! $is_authorized) {
    echo json_encode(['status' => 'error', 'message' => 'Access denied. Only admins can perform this cancellation.']);
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
            u.email AS customer_email
        FROM appointments a
        JOIN availability_slots s ON a.slot_id = s.id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN services srv ON a.service_id = srv.id
        WHERE a.id = :id
    ');
    $stmt->execute([':id' => $appointment_id]);
    $appointment = $stmt->fetch();

    if (! $appointment) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Booking not found.']);
        exit;
    }

    $slot_id = $appointment['slot_id'];

    $deleteStmt = $pdo->prepare('DELETE FROM appointments WHERE id = :id');
    $deleteStmt->execute([':id' => $appointment_id]);

    $updateStmt = $pdo->prepare("UPDATE availability_slots SET status = 'available', updated_at = NOW() WHERE id = :slot_id");
    $updateStmt->execute([':slot_id' => $slot_id]);

    $customer_email = $appointment['customer_email'];
    if (empty($customer_email)) {
        $pdo->rollBack();
        echo json_encode([
            'status'  => 'error',
            'message' => 'Customer email address is missing. Cannot process cancellation notification.',
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
        $mail->addAddress($customer_email);

        $mail->isHTML(false);
        $mail->Subject = 'Appointment Cancellation Notice - ' . $formatted_date;
        $mail->Body    = "Dear {$appointment['first_name']} {$appointment['surname']},\n\n"
            . "Please be advised that your booking at Hertford Standard has been cancelled by the garage.\n\n"
            . "--- CANCELLED APPOINTMENT DETAILS ---\n"
            . "Service: {$service_name}\n"
            . "Vehicle Registration: {$appointment['vehicle_reg']}\n"
            . "Date: {$formatted_date}\n"
            . "Time: {$formatted_start} - {$formatted_end}\n\n"
            . "If you have any questions or wish to reschedule, please contact us or visit our booking portal.\n\n"
            . "Kind regards,\nHertford Standard Team\n";

        $mail->send();

        $pdo->commit();

        echo json_encode([
            'status'  => 'success',
            'message' => 'Booking cancelled and customer notified successfully.',
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Admin Cancellation Notification Email Error: ' . $e->getMessage());
        echo json_encode([
            'status'  => 'error',
            'message' => 'Unable to cancel the booking due to an email notification failure.',
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
