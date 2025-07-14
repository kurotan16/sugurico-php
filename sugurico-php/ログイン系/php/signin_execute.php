<?php
session_start();
require_once "../../base/getPDO.php";

$pdo = getPDO();

$name = $_REQUEST['name'];
$user_name = $_REQUEST['user_name'];
$login_id = $_REQUEST['login_id'];
$email = $_REQUEST['email'];
$password = $_REQUEST['password'];



$_SESSION['signin_form']['name'] = $name;
$_SESSION['signin_form']['user_name'] = $user_name;
$_SESSION['signin_form']['login_id'] = $login_id;
$_SESSION['signin_form']['email'] = $email;
$_SESSION['signin_form']['password'] = $password;
$_SESSION['signin_form']['errors'] = [];


$stmt = $pdo -> prepare("SELECT login_id FROM `users` WHERE login_id = ?");
$stmt -> execute([$_REQUEST['login_id']]);
if($stmt->rowCount() > 0){
    $_SESSION['signin_form']['errors']['login_id'] = "このログインIDは使われています。";
}

$stmt = $pdo -> prepare("SELECT email FROM `users` WHERE email = ?");
$stmt -> execute([$_REQUEST['email']]);
if($stmt->rowCount() > 0){
    $_SESSION['signin_form']['errors']['email'] = "このメールアドレスは使われています。";
}

if (!empty($_SESSION['signin_form']['errors'])) {
    header('Location: signin.php');
}

$hashed_password = hash("SHA256", $password);

$stmt = $pdo -> prepare("INSERT INTO `users`(`name`, `user_name`, `login_id`, `email`, `password`) VALUES (?,?,?,?,?)");
$stmt -> execute([$name, $user_name, $login_id, $email, $hashed_password]);
unset($_SESSION['signin_form']);
$_SESSION['login_form']['message'] = "登録が完了しました。";
header('Location: login.php');
?>