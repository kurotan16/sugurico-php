<?php 
session_start();
require_once "../../base/getPDO.php";

$login_id = $_REQUEST['login_id'];
$password = $_REQUEST['password'];

$_SESSION['login_form']['login_id'] = $login_id;
$_SESSION['login_form']['password'] = $password;

$hashed_password = hash("SHA256", $password);

$pdo = getPDO();
$stmt = $pdo->prepare("SELECT * 
FROM users 
WHERE login_id = ? AND password = ?");

$stmt->execute([$login_id, $hashed_password]);

if($stmt->rowCount() > 0) {
    foreach ($stmt as $row) {
        $_SESSION["user_id"] = $row["user_id"];
        $_SESSION['user_name'] = $row['user_name'];
        unset($_SESSION["login_form"]);
        header('Location: ../../main.php');
    }
} else {
    $_SESSION["login_form"]["message"] = "ログイン情報が違います。";
    header('Location: login.php');
}
?>