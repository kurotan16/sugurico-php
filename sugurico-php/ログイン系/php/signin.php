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
    <form action="signin_execute.php">
        <div>
            <label for="">名前</label>
            <input type="text" name="name" id="" required></div>
        <div>
            <label for="">ユーザーネーム</label>
            <input type="text" name="user_name" id="" required>
        </div>
        <div>
            <label for="">ログインID</label>
            <input type="text" name="login_id" id="" required>
        </div>
        <div>
            <label for="">メールアドレス</label>
            <input type="email" name="email" id="" required>
        </div>
        <div>
            <label for="">パスワード</label>
            <input type="password" name="password" id="" required>
        </div>
        <input type="submit" value="新規登録">
    </form>
<?php require_once '../../base/footer.php'; ?>
    </body>
    <script src="../js/.js"></script>
</html>