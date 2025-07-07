<?php session_start()?>
<!DOCTYPE html>
<html lang="ja">
    <head>
        <link rel="stylesheet" href="style.css">
        <meta charset="UTF-8">
        <title></title>
        
    </head>
    <body>
         <a href="<?php echo isset($_SESSION['user_id']) ? 'ログイン系\php\logout.php' : 'ログイン系\php\login.php'; ?>">
            <?php echo isset($_SESSION['user_id']) ? 'ログアウト' : 'ログイン'; ?>
        </a>

        
        <h1>ようこそ、スグリコへ！</h1>
        <p>今日は <?php echo date("Y年m月d日"); ?> です。</p>
        
        <?php 
            if (isset($_SESSION['user_id'])) {
                echo <<<HTML
                <a href="">
                    <div class = "forum_form">+</div>
                </a>
HTML;
            }        
        ?>
        <script src="script.js"></script>
    </body>
</html>
