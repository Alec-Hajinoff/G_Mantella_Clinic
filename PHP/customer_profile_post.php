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

$user_id = $_SESSION['id'];
$input   = json_decode(file_get_contents('php://input'), true);

$first_name = isset($input['first_name']) ? trim($input['first_name']) : null;
$surname    = isset($input['surname']) ? trim($input['surname']) : null;
$phone      = isset($input['phone']) ? trim($input['phone']) : null;

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $stmt = $pdo->prepare('SELECT first_name, surname, phone FROM users WHERE id = :id');
    $stmt->execute([':id' => $user_id]);
    $currentUser = $stmt->fetch();

    if (! $currentUser) {
        echo json_encode(['status' => 'error', 'message' => 'User profile not found.']);
        exit;
    }

    // Rule: If database value is not null and incoming value is empty, keep existing value (do not delete)
    $final_first_name = ($currentUser['first_name'] !== null && ($first_name === '' || $first_name === null))
        ? $currentUser['first_name']
        : ($first_name !== '' ? $first_name : null);

    $final_surname = ($currentUser['surname'] !== null && ($surname === '' || $surname === null))
        ? $currentUser['surname']
        : ($surname !== '' ? $surname : null);

    $final_phone = ($currentUser['phone'] !== null && ($phone === '' || $phone === null))
        ? $currentUser['phone']
        : ($phone !== '' ? $phone : null);

    $updateStmt = $pdo->prepare('
        UPDATE users
        SET first_name = :first_name, surname = :surname, phone = :phone, updated_at = NOW()
        WHERE id = :id
    ');

    $updateStmt->execute([
        ':first_name' => $final_first_name,
        ':surname'    => $final_surname,
        ':phone'      => $final_phone,
        ':id'         => $user_id,
    ]);

    echo json_encode([
        'status'  => 'success',
        'message' => 'Profile updated successfully.',
        'user'    => [
            'first_name' => $final_first_name,
            'surname'    => $final_surname,
            'phone'      => $final_phone,
        ],
    ]);
} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update profile.']);
} finally {
    $pdo = null;
}
