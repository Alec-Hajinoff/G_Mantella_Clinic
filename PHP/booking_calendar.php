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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

$user_id   = $_SESSION['id'] ?? null;
$user_role = $_SESSION['role'] ?? null;

$start_date = $_GET['start_date'] ?? null;
$end_date   = $_GET['end_date'] ?? null;

if (! $start_date || ! $end_date) {
    echo json_encode(['status' => 'error', 'message' => 'start_date and end_date query parameters are required']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $stmt = $pdo->prepare('
        SELECT id, date, DATE_FORMAT(start_time, "%H:%i") AS start_time, DATE_FORMAT(end_time, "%H:%i") AS end_time, status
        FROM availability_slots
        WHERE date >= :start_date AND date <= :end_date AND date >= CURDATE()
        ORDER BY date ASC, start_time ASC
    ');

    $stmt->execute([
        ':start_date' => $start_date,
        ':end_date'   => $end_date,
    ]);

    $slots = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'slots'  => $slots,
    ]);

} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch calendar slots']);
} finally {
    $pdo = null;
}
