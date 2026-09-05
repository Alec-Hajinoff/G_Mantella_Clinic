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

try {
    $pdo = new PDO('mysql:host=localhost;dbname=loveday_auto', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT id FROM users WHERE id = :id AND is_deleted = 0');
    $stmt->execute([':id' => $user_id]);
    $user = $stmt->fetch();

    if (! $user) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Account not found or already deleted.']);
        exit;
    }

    $randomPasswordHash = password_hash(bin2hex(random_bytes(32)), PASSWORD_BCRYPT);

    $anonymiseStmt = $pdo->prepare('
        UPDATE users
        SET is_deleted = 1,
            first_name = NULL,
            surname = NULL,
            phone = NULL,
            email = CONCAT("deleted_", id, "@deleted.local"),
            password = :password,
            verification_token = NULL,
            verification_token_expires_at = NULL,
            password_reset_token = NULL,
            password_token_expires_at = NULL,
            updated_at = NOW()
        WHERE id = :id
    ');

    $anonymiseStmt->execute([
        ':password' => $randomPasswordHash,
        ':id'       => $user_id,
    ]);

    $pdo->commit();

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Your account has been deleted successfully.',
    ]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to delete account.']);
} finally {
    $pdo = null;
}
