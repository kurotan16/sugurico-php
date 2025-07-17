<!--  -->
<?php session_start();
if(isset($_SESSION["user_id"])){
    header('Location: ../../main.php');
}
?>
<!DOCTYPE html>

<html lang="ja">
    <head>
        <link rel="stylesheet" href="../css/.css">
        <meta charset="UTF-8">
        <title></title>

    </head>
    <body>
<?php require_once '../../base/header.php'; ?>
    <pre>
        <?php print_r($_SESSION)?>
    </pre>
    <div><?php 
    echo htmlspecialchars($_SESSION['login_form']['message'] ?? '');
    ?></div>
    <form action="login_execute.php">
        <div><label for="">ログインID</label><input type="text" name="login_id" id="" value = 
        <?php echo htmlspecialchars($_SESSION['login_form']['login_id'] ?? "") ?>
        ></div>
        <div><label for="">パスワード</label><input type="password" name="password" id="" value = 
        <?php echo htmlspecialchars($_SESSION['login_form']['password'] ?? "") ?>>
    </div>
        <input type="submit" value="ログイン">
    </form>
    <a href="signin.php"><button>新規登録</button></a>
<?php require_once '../../base/footer.php'; ?>
    </body>
    <script src="../js/.js"></script>
</html>