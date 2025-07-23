<?php
session_start();
require_once "../../base/getPDO.php";

// --- 1. ログインチェック ---
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// --- 2. 入力値の受け取り ---
$user_id = $_SESSION['user_id']; // 更新対象はログイン中のユーザー
$name = $_POST['name'] ?? '';
$user_name = $_POST['user_name'] ?? '';
$login_id = $_POST['login_id'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? ''; // 新しいパスワード（空の場合もある）

// --- 3. エラー時のために、入力値をセッションに保存 ---
$_SESSION['update_form_data']['name'] = $name;
$_SESSION['update_form_data']['user_name'] = $user_name;
$_SESSION['update_form_data']['login_id'] = $login_id;
$_SESSION['update_form_data']['email'] = $email;
$_SESSION['update_errors'] = []; 

// --- 4. サーバーサイドバリデーション（必須項目） ---
if (empty($name) || empty($user_name) || empty($login_id) || empty($email)) {
    $_SESSION['update_errors']['common'] = "必須項目を入力してください。";
    header('Location: update.php');
    exit;
}

$pdo = getPDO();

// --- 5. 重複チェック（自分以外のユーザーが使っていないか） ---
// ログインID
$stmt = $pdo->prepare("SELECT user_id FROM users WHERE login_id = ? AND user_id != ?");
$stmt->execute([$login_id, $user_id]);
if ($stmt->fetch()) {
    $_SESSION['update_errors']['login_id'] = "このログインIDは他のユーザーに使用されています。";
}

// メールアドレス
$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
$stmt->execute([$email, $user_id]);
if ($stmt->fetch()) {
    $_SESSION['update_errors']['email'] = "このメールアドレスは他のユーザーに使用されています。";
}

// --- 6. もしエラーがあれば、更新ページに戻す ---
if (!empty($_SESSION['update_errors'])) {
    header('Location: update.php');
    exit;
}

// --- 7. エラーがなければ、UPDATE処理を実行 ---

// パスワードが入力されているか（変更するか）でSQL文とパラメータを分ける
if (!empty($password)) {
    // 【パスワードも更新する場合】
    $sql = "UPDATE users SET name = ?, user_name = ?, login_id = ?, email = ?, password = ? WHERE user_id = ?";
    $params = [
        $name,
        $user_name,
        $login_id,
        $email,
        hash("SHA256", $password), // ★ 安全にハッシュ化
        $user_id
    ];
} else {
    // 【パスワードは更新しない場合】
    $sql = "UPDATE users SET name = ?, user_name = ?, login_id = ?, email = ? WHERE user_id = ?";
    $params = [
        $name,
        $user_name,
        $login_id,
        $email,
        $user_id
    ];
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

// 登録に使った入力値セッションをクリア
unset($_SESSION['update_form_data']);
unset($_SESSION['update_errors']);

// 画面表示用にセッションのユーザー名を更新
$_SESSION['user_name'] = $user_name;

// 更新完了メッセージをセッションに詰めて、同じページにリダイレクト
$_SESSION['success_message'] = "ユーザー情報を更新しました。";
header('Location: update.php');
exit;
?>