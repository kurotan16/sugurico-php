<!-- login_execute.php -->
<?php 
session_start();
require_once "../../base/getPDO.php";

$login_id = $_REQUEST['login_id'];
$password = $_REQUEST['password'];

$_SESSION['login_form_data']['login_id'] = $login_id;

if(empty($password) || empty($login_id)) {
    $_SESSION['error_message'] = "ログインIDとパスワードを入力してください";
    header("Location: login.php");
    exit();
}

$hashed_password = hash("SHA256", $password);
$pdo = getPDO();
$stmt = $pdo->prepare("SELECT * 
FROM users 
WHERE login_id = ? AND password = ?");
$stmt->execute([$login_id, $hashed_password]);
if($stmt->rowCount() > 0) { // ★ ユーザーが見つかった場合
    
    // ---  ログイン成功の処理 ---

    // ログイン成功したので、エラー表示用のセッション情報はすべて不要
    unset($_SESSION['login_form_data']);
    unset($_SESSION['error_message']);

    // セッションIDを再生成してセキュリティを向上
    session_regenerate_id(true);

    foreach ($stmt as $row) {
// ログイン状態を示す情報をセッションに保存
    $_SESSION["user_id"] = $row["user_id"];
    $_SESSION['user_name'] = $row['user_name'];
    }
    
    
    // メインページにリダイレクト
    header('Location: ../../main.php');
    exit;

} else {
    
    // ---  ログイン失敗の処理 ---

    // ログイン失敗のメッセージをセッションに保存
    $_SESSION["error_message"] = "ログイン情報が違います。";
    
    // ログインページにリダイレクトして戻す
    header('Location: login.php');
    exit;
}
?>