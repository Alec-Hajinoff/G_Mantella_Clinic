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
    echo json_encode(['status' => 'error', 'message' => 'Access denied. Only garage staff can generate availability slots.']);
    exit;
}

try {

    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $pdo->beginTransaction();

    $stmt           = $pdo->query('SELECT day_of_week, open_time, close_time FROM business_hours');
    $business_hours = $stmt->fetchAll();

    if (empty($business_hours)) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'No business hours set. Please configure business hours first.']);
        exit;
    }

    $hours_by_day = [];
    foreach ($business_hours as $row) {
        $hours_by_day[(int) $row['day_of_week']] = [
            'open_time'  => $row['open_time'],
            'close_time' => $row['close_time'],
        ];
    }

    $max_stmt   = $pdo->query('SELECT MAX(date) AS max_date FROM availability_slots');
    $max_result = $max_stmt->fetch();

    if ($max_result && $max_result['max_date']) {

        $start_date = (new DateTime($max_result['max_date']))->modify('+1 day');
    } else {

        $start_date = new DateTime('today');
    }

    $end_date = (clone $start_date)->modify('+3 months');

    $slot_sql = 'INSERT IGNORE INTO availability_slots (date, start_time, end_time, status, created_at, updated_at)
                 VALUES (:date, :start_time, :end_time, \'available\', NOW(), NOW())';
    $slot_stmt = $pdo->prepare($slot_sql);

    $interval = new DateInterval('P1D');
    $period   = new DatePeriod($start_date, $interval, $end_date);

    $inserted_count = 0;

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
                $inserted_count += $slot_stmt->rowCount();
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        'status'  => 'success',
        'message' => "Successfully extended availability slots by 3 months starting from {$start_date->format('Y-m-d')}.",
    ]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to extend availability slots.']);
} finally {
    $pdo = null;
}
