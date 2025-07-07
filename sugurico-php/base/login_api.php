<?php
// login_api.php
session_start(); 
header('Content-Type: application/json');
require_once 'getPDO.php';

// --- セッションを開始 ---
session_start();

// --- POSTデータ（JSON）の取得 ---
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => '無効なJSON形式です。']);
    exit;
}

// --- ログインIDとパスワードを取得 ---
$loginId = $data['loginId'] ?? '';
$password = $data['password'] ?? '';

if (empty($loginId) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ログインIDとパスワードを入力してください。']);
    exit;
}

// --- メインの認証処理 ---
try {
    $pdo = getPDO();

    // 1. ログインIDを元にユーザーを検索
    $sql = "SELECT user_id, user_name, password, withdrawal_flag FROM users WHERE login_id = :login_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':login_id' => $loginId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. ユーザーが存在し、パスワードが一致し、退会済みでないかチェック
    if ($user && password_verify($password, $user['password']) && $user['withdrawal_flag'] == 0) {
        // --- 認証成功 ---
        
        // セッションIDを再生成してセキュリティを高める
        session_regenerate_id(true);

        // セッションに必要な情報を保存
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['user_name'] = $user['user_name'];

        echo json_encode(['success' => true, 'message' => 'ログインに成功しました。']);

    } else {
        // --- 認証失敗 ---
        echo json_encode(['success' => false, 'error' => 'ログインIDまたはパスワードが正しくありません。']);
    }

} catch (PDOException $e) {
    http_response_code(500); // サーバー内部エラー
    echo json_encode(['success' => false, 'error' => 'データベースエラーが発生しました。']);
}
?>