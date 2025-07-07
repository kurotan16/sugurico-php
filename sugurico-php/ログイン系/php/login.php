<!-- ログインページ -->
<?php session_start();
if(isset($_SESSION['user_id'])){
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
            <form action="" method="post">
                <div id = "loginIdForm">
                    <label for="loginIdInput">ログインID</label>
                    <input type="text" name="loginId" id="loginIdInput">
                </div>
                <div id = "passwordForm">
                    <label for="passwordInput">パスワード</label>
                    <input type="password" id = "passwordInput">
                </div>
                
            </form><button type="submit" id = "loginButton">ログイン</button>
            <a href="signin.php">新規登録</a>
    </body>
    <script src = "../js/login.js"></script>
</html>

