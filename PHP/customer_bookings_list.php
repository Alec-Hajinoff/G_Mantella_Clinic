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

$user_id   = $_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'customer';

if ($user_role !== 'customer') {
    echo json_encode(['status' => 'error', 'message' => 'Access denied.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $stmt = $pdo->prepare('
        SELECT
            a.id AS appointment_id,
            a.slot_id,
            a.service_id,
            a.vehicle_reg,
            a.notes,
            s.date,
            s.start_time,
            s.end_time,
            srv.name AS service_name
        FROM appointments a
        JOIN availability_slots s ON a.slot_id = s.id
        LEFT JOIN services srv ON a.service_id = srv.id
        WHERE a.user_id = :user_id
        ORDER BY s.date DESC, s.start_time DESC
    ');
    $stmt->execute([':user_id' => $user_id]);
    $all_bookings = $stmt->fetchAll();

    $current_date = date('Y-m-d');
    $upcoming     = [];
    $past         = [];

    foreach ($all_bookings as $booking) {
        if ($booking['date'] >= $current_date) {
            $upcoming[] = $booking;
        } else {
            $past[] = $booking;
        }
    }

    usort($upcoming, function ($a, $b) {
        return strcmp($a['date'] . ' ' . $a['start_time'], $b['date'] . ' ' . $b['start_time']);
    });

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
