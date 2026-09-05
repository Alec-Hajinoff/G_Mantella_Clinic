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

$servername     = '127.0.0.1';
$username       = 'root';
$passwordServer = '';
$dbname         = 'loveday_auto';

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $passwordServer);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'We’re sorry, but we’re unable to connect to the database at the moment. Please try again shortly.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if ($input === null) {
    echo json_encode(['success' => false, 'message' => 'We couldn’t process your request due to invalid data. Please check and try again.']);
    exit;
}

$token = $input['token'] ?? null;

if (! $token) {
    echo json_encode(['success' => false, 'message' => 'It looks like the verification link is incomplete. Please use the full link from your email.']);
    exit;
}

try {
    $conn->beginTransaction();

    $checkSql = 'SELECT id, email, is_verified FROM users
                 WHERE verification_token = :token AND verification_token_expires_at > NOW()
                 LIMIT 1';
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':token', $token);
    $checkStmt->execute();

    if ($checkStmt->rowCount() === 0) {
        $expiredSql  = 'SELECT id FROM users WHERE verification_token = :token AND verification_token_expires_at <= NOW() LIMIT 1';
        $expiredStmt = $conn->prepare($expiredSql);
        $expiredStmt->bindParam(':token', $token);
        $expiredStmt->execute();

        if ($expiredStmt->rowCount() > 0) {
            echo json_encode(['success' => false, 'message' => 'This verification link has expired. Please request a new one to continue.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'We couldn’t find an account matching this verification link. Please check the link or contact support.']);
        }
        $conn->rollBack();
        exit;
    }

    $user = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($user['is_verified'] == 1) {
        echo json_encode(['success' => false, 'message' => 'This account has already been successfully verified. You can now log in.']);
        $conn->rollBack();
        exit;
    }

    $updateSql = 'UPDATE users
                  SET is_verified = 1,
                      verification_token = NULL,
                      verification_token_expires_at = NULL,
                      updated_at = NOW()
                  WHERE id = :id';
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bindParam(':id', $user['id']);
    $updateStmt->execute();

    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Your email has been successfully verified. You’re all set to log in.']);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log('Verification Error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Something went wrong while processing your request. Please try again later.']);
} finally {
    $conn = null;
}
