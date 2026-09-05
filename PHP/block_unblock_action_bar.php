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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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
    echo json_encode(['status' => 'error', 'message' => 'Access denied. Only administrators can perform this action.']);
    exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$slot_ids = $input['slot_ids'] ?? [];
$action   = $input['action'] ?? null;

if (empty($slot_ids) || ! is_array($slot_ids)) {
    echo json_encode(['status' => 'error', 'message' => 'No valid slot IDs provided.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $pdo->beginTransaction();

    $placeholders = implode(',', array_fill(0, count($slot_ids), '?'));

    if ($action === 'block') {

        $stmt = $pdo->prepare("UPDATE availability_slots SET status = 'blocked', updated_at = NOW() WHERE id IN ($placeholders) AND status = 'available'");
        $stmt->execute($slot_ids);
    } else if ($action === 'unblock') {

        $stmt = $pdo->prepare("UPDATE availability_slots SET status = 'available', updated_at = NOW() WHERE id IN ($placeholders) AND status = 'blocked'");
        $stmt->execute($slot_ids);
    } else {

        $stmtSelect = $pdo->prepare("SELECT id, status FROM availability_slots WHERE id IN ($placeholders)");
        $stmtSelect->execute($slot_ids);
        $slots = $stmtSelect->fetchAll();

        $allAvailable = true;
        foreach ($slots as $slot) {
            if ($slot['status'] !== 'available') {
                $allAvailable = false;
                break;
            }
        }

        $newStatus = $allAvailable ? 'blocked' : 'available';

        $stmtUpdate = $pdo->prepare("UPDATE availability_slots SET status = ?, updated_at = NOW() WHERE id IN ($placeholders) AND status != 'booked'");
        $params     = array_merge([$newStatus], $slot_ids);
        $stmtUpdate->execute($params);
    }

    $pdo->commit();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Slot status updated successfully.',
    ]);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update slot status.']);
} finally {
    $pdo = null;
}
