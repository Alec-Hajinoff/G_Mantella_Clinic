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

if (! in_array(strtolower($user_role), ['owner', 'admin'])) {
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Admin permissions required.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (! isset($input['services']) || ! is_array($input['services']) || empty($input['services'])) {
    echo json_encode(['status' => 'error', 'message' => 'Please provide at least one service.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $pdo->beginTransaction();

    $sql = 'INSERT INTO services (name, duration_minutes, created_at, updated_at)
            VALUES (:name, :duration_minutes, NOW(), NOW())';

    $stmt = $pdo->prepare($sql);

    foreach ($input['services'] as $service) {
        $name     = trim($service['name'] ?? '');
        $duration = (int) ($service['duration_minutes'] ?? 0);

        if (empty($name) || $duration <= 0) {
            $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => 'Each service requires a valid name and duration in minutes.']);
            exit;
        }

        $stmt->execute([
            ':name'             => $name,
            ':duration_minutes' => $duration,
        ]);
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Services saved successfully.']);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save garage services.']);
} finally {
    $pdo = null;
}
