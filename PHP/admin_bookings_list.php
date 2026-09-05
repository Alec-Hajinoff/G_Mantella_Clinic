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

    $allowed_roles = ['owner', 'admin', 'mechanic'];
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
    echo json_encode(['status' => 'error', 'message' => 'Access denied. Only garage staff can view all bookings.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $current_date = date('Y-m-d');
    $current_time = date('H:i:s');

    $stmt = $pdo->prepare('
        SELECT
            a.id AS appointment_id,
            a.vehicle_reg,
            a.notes,
            a.created_at AS booked_at,
            s.id AS slot_id,
            s.date,
            s.start_time,
            s.end_time,
            srv.name AS service_name,
            u.first_name,
            u.surname,
            u.email AS customer_email,
            u.phone AS customer_phone
        FROM appointments a
        JOIN availability_slots s ON a.slot_id = s.id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN services srv ON a.service_id = srv.id
        ORDER BY s.date ASC, s.start_time ASC
    ');
    $stmt->execute();
    $all_appointments = $stmt->fetchAll();

    $upcoming = [];
    $past     = [];

    foreach ($all_appointments as $booking) {

        if ($booking['date'] > $current_date || ($booking['date'] === $current_date && $booking['start_time'] >= $current_time)) {
            $upcoming[] = $booking;
        } else {
            $past[] = $booking;
        }
    }

    echo json_encode([
        'status'   => 'success',
        'upcoming' => $upcoming,
        'past'     => $past,
    ]);

} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to load bookings.']);
} finally {
    $pdo = null;
}
