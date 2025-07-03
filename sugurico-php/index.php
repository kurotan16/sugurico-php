<?php session_start()?>
<!DOCTYPE html>
<html lang="ja">
    <head>
        <link rel="stylesheet" href="style.css">
        <meta charset="UTF-8">
        <title></title>
        
    </head>
    <body>
         <a href="<?php echo isset($_SESSION['account']) ? 'ログイン系\php\logout.php' : 'ログイン系\php\login.php'; ?>">
            <?php echo isset($_SESSION['account']) ? 'ログアウト' : 'ログイン'; ?>
        </a>

        
        <h1>ようこそ、スグリコへ！</h1>
        <p>今日は <?php echo date("Y年m月d日"); ?> です。</p>
    </body>
</html>
