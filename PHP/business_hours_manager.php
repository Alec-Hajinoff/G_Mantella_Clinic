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
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
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

if (! in_array(strtolower($user_role), ['owner', 'admin'])) {
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Admin access required.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (! isset($input['business_hours']) || ! is_array($input['business_hours'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid input data']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $pdo->beginTransaction();

    $sql = 'INSERT INTO business_hours (day_of_week, open_time, close_time, created_at, updated_at)
            VALUES (:day_of_week, :open_time, :close_time, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                open_time = VALUES(open_time),
                close_time = VALUES(close_time),
                updated_at = NOW()';

    $stmt = $pdo->prepare($sql);

    foreach ($input['business_hours'] as $entry) {
        $stmt->execute([
            ':day_of_week' => (int) $entry['day_of_week'],
            ':open_time'   => $entry['open_time'],
            ':close_time'  => $entry['close_time'],
        ]);
    }

    $hours_by_day = [];
    foreach ($input['business_hours'] as $entry) {
        $hours_by_day[(int) $entry['day_of_week']] = [
            'open_time'  => $entry['open_time'],
            'close_time' => $entry['close_time'],
        ];
    }

    $slot_sql = 'INSERT IGNORE INTO availability_slots (date, start_time, end_time, status, created_at, updated_at)
                 VALUES (:date, :start_time, :end_time, \'available\', NOW(), NOW())';
    $slot_stmt = $pdo->prepare($slot_sql);

    $start_date = new DateTime('today');
    $end_date   = (new DateTime('today'))->modify('+3 months');

    $interval = new DateInterval('P1D');
    $period   = new DatePeriod($start_date, $interval, $end_date);

    foreach ($period as $current_day) {
        $day_num = (int) $current_day->format('N');

        if (isset($hours_by_day[$day_num])) {
            $date_str   = $current_day->format('Y-m-d');
            $open_time  = new DateTime($date_str . ' ' . $hours_by_day[$day_num]['open_time']);
            $close_time = new DateTime($date_str . ' ' . $hours_by_day[$day_num]['close_time']);

            $slot_interval = new DateInterval('PT30M');

            while ($open_time < $close_time) {
                $slot_start = $open_time->format('H:i:s');
                $open_time->add($slot_interval);

                if ($open_time > $close_time) {
                    break;
                }

                $slot_end = $open_time->format('H:i:s');

                $slot_stmt->execute([
                    ':date'       => $date_str,
                    ':start_time' => $slot_start,
                    ':end_time'   => $slot_end,
                ]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Business hours and 3-month availability slots saved successfully.']);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save business hours and slots.']);
} finally {
    $pdo = null;
}
