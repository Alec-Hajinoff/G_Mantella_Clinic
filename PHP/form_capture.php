<?php
require_once 'session_config.php';

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
if ($config === false) {
    error_log('Failed to parse .env file');
    echo json_encode(['success' => false, 'message' => 'Server configuration error']);
    exit;
}

$mailUsername = $config['MAIL_USERNAME'];
$mailPassword = $config['MAIL_PASSWORD'];

if (empty($mailUsername) || empty($mailPassword)) {
    error_log('Gmail credentials not found in .env file');
    echo json_encode(['success' => false, 'message' => 'Server configuration error']);
    exit;
}

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
    die('Connection failed: ' . $e->getMessage());
}

$input = json_decode(file_get_contents('php://input'), true);
if ($input === null) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$email    = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $input['password'] ?? null;

if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

if (! $email || ! $password) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    $checkSql  = 'SELECT id FROM users WHERE email = :email LIMIT 1';
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':email', $email);
    $checkStmt->execute();

    if ($checkStmt->rowCount() > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'We couldn’t use this email. Please try a different one.',
        ]);
        exit;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error during email verification',
    ]);
    exit;
}

try {
    $conn->beginTransaction();

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $verificationToken = bin2hex(random_bytes(32));

    $sql = 'INSERT INTO users (role_id, email, password, verification_token, verification_token_expires_at, is_verified, created_at, updated_at)
        VALUES (4, :email, :password, :token, DATE_ADD(NOW(), INTERVAL 24 HOUR), 0, NOW(), NOW())';

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $hashedPassword);

        $stmt->bindParam(':token', $verificationToken);
        $stmt->execute();

        $userId = $conn->lastInsertId();

        $verificationLink = 'http://localhost:3000/VerifyEmail?token=' . urlencode($verificationToken);

        $mail = new PHPMailer(true);

        try {
            $mail->SMTPDebug = SMTP::DEBUG_OFF;
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $mailUsername;
            $mail->Password   = $mailPassword;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            $mail->setFrom($mailUsername, 'Hertford Standard');

            $mail->addAddress($email);

            $mail->isHTML(false);
            $mail->Subject = 'Verify your email address - Hertford Standard';
            $mail->Body    = "Thank you for creating an account with Hertford Standard.\n\n"
                . "Please click the link below to verify your email address:\n"
                . $verificationLink . "\n\n"
                . "Once verified, you will be able to sign in to your account.\n\n"
                . 'This link is valid for 24 hours.';

            $mail->send();

            $conn->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $conn->rollBack();

            error_log('PHPMailer Error: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Registration completed but failed to send verification email. Please contact support.',
            ]);
        }
    } else {
        throw new Exception('Database error preparing statement');
    }
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log('Registration Error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
} finally {
    $conn = null;
}
