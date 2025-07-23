<!-- signin_execute.php -->
<?php
session_start();
require_once "../../base/getPDO.php";



// --- 入力値の受け取り（POST推奨） ---
$name = $_REQUEST['name'] ?? '';
$user_name = $_REQUEST['user_name'] ?? '';
$login_id = $_REQUEST['login_id'] ?? '';
$email = $_REQUEST['email'] ?? '';
$password = $_REQUEST['password'] ?? '';


// --- エラー時のために、入力値をセッションに保存 ---
$_SESSION['signin_form_data']['name'] = $name;
$_SESSION['signin_form_data']['user_name'] = $user_name;
$_SESSION['signin_form_data']['login_id'] = $login_id;
$_SESSION['signin_form_data']['email'] = $email;
// エラーメッセージ用配列を初期化
$_SESSION['signin_form_data']['errors'] = [];

// --- サーバーサイドバリデーション ---
if (empty($name) || empty($user_name) || empty($login_id) || empty($email) || empty($password)) {
    $_SESSION['signin_errors']['common'] = "すべての項目を入力してください。";
    header('Location: signin.php');
    exit;
}

$pdo = getPDO();

// --- ログインIDの重複チェック ---
$stmt = $pdo -> prepare("SELECT login_id FROM `users` WHERE login_id = ?");
$stmt -> execute([$_REQUEST['login_id']]);
if($stmt->rowCount() > 0){
    $_SESSION['signin_errors']['login_id'] = "このログインIDは既に使用されています。";
}

// --- メールアドレスの重複チェック ---
$stmt = $pdo -> prepare("SELECT email FROM `users` WHERE email = ?");
$stmt -> execute([$_REQUEST['email']]);
if($stmt->rowCount() > 0){
    $_SESSION['signin_errors']['email'] = "このメールアドレスは既に使用されています。";
}

// --- もしエラーがあれば、登録ページに戻す ---
if (!empty($_SESSION['signin_errors'])) {
    header('Location: signin.php');
}


// --- エラーがなければ、INSERT処理を実行 ---
$hashed_password = hash("SHA256", $password);
$stmt = $pdo -> prepare("INSERT INTO `users`(`name`, `user_name`, `login_id`, `email`, `password`) VALUES (?,?,?,?,?)");
$stmt -> execute([$name, $user_name, $login_id, $email, $hashed_password]);

// 登録に使ったセッション情報をクリア
unset($_SESSION['signin_form_data']);
unset($_SESSION['signin_errors']);

// 登録完了メッセージをセッションに詰めて、ログインページにリダイレクト
$_SESSION['success_message'] = "ユーザー登録が完了しました。";
header('Location: login.php');
exit;
?>