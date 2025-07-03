<!-- ログインページ -->
<?php session_start();
if(isset($_SESSION['account'])){
        echo '<meta http-equiv="refresh" content="0;url=../メイン系/main.php">';
}
?>
<!DOCTYPE html>

<html lang="ja">
    <head>
        <link rel="stylesheet" href="..\css\login.css">
        <meta charset="UTF-8">
        <title></title>
    </head>
    <body>
        <div class="login-form">
            <form action="" method="post">
                <p>ユーザーネーム
                    <input type="text" name="username" id="username"></p>
                <p>パスワード
                    <div><input type="password" maxlength="20" id = "password"><img src="" alt=""></div>
                </p>
                <button type="submit">ログイン</button>
            </form>
            <a href="signin.php">新規登録</a>
        </div>
    </body>
    <script>"../js/login.js"</script>
</html>

