<?php session_start(); ?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <link rel="stylesheet" href="style.css">
    <meta charset="UTF-8">
    <title>スグリコ - メインページ</title>
</head>
<body>
    <header>
        <nav>
            <?php
            if(isset($_SESSION['account'])){
                echo '<a href="ログイン系/php/logout.php">ログアウト</a>';
                echo '<a href="ログイン系/php/update.php">登録情報変更</a>';
            } else {
               echo '<a href="ログイン系/php/login.php">ログイン</a>';
            }
            
            ?>
        </nav>
    </header>
    <h1>ようこそ、スグリコへ！</h1>
    <pre>
        <?php print_r($_SESSION)?>
    </pre>
    <hr>
    あなたの投稿
        <!-- 最新三件 -->
    <hr>
    皆さんの投稿
        <!-- 最新三件 -->

    <?php
            if(isset($_SESSION['account'])){
                echo '<a href="投稿系/php/forum_input.php">+</a>';
            } 
            
            ?>
    <footer>

    </footer>
    <script src="script.js"></script>
</body>
</html>