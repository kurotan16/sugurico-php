<!-- 新規登録 -->
<?php session_start();?>
<!DOCTYPE html>

<html lang="ja">
    <head>
        <link rel="stylesheet" href="../css/signin.css">
        <meta charset="UTF-8">
        <title></title>
    </head>
    <body>
        <form action="" method="post">
            <div>
                <label for="nameInput">名前:</label>
                <input type="text" name="name" id="nameInput">
            </div>
            <div>
                <label for="usernameInput">ユーザー名:</label>
                <input type="text" name="username" id="usernameInput">
            </div>
            <div>
                <label for="loginIdInput">ログインID:</label>
                <input type="text" name="loginId" id="loginIdInput">
                <div id = "loginIdLog"></div><!--これが重複したらダメ-->
            </div>
            <div>
                <label for="emailInput">メールアドレス:</label>
                <input type="email" name="email" id="emailInput">
                <div id = "emailLog"></div><!--これが重複したらダメ-->
            </div>
            <div>
                <label for="passwordInput">パスワード:</label>
                <input type="password" name="password" id="passwordInput">
                <div id = "passwordLog"></div>
            </div>
            <div>
                <label for="confirmInput">パスワード(確認用):</label>
                <input type="password" name="confirm" id="confirmInput">
                <div id = "confirmLog"></div>
            </div>
        </form>
        <button type="submit" id = "submitButton">登録</button>
    </body>
    <script src = "../js/signin.js"></script>
</html>