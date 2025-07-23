<?php session_start();
unset($_SESSION["account"],$_SESSION["signin_form"],$_SESSION["update_form"]);
unset($_SESSION["user_id"],$_SESSION["signin_form"],$_SESSION["update_form"]);
header('Location: ../../main.php');
?>