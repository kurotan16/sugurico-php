<!--  -->
<?php session_start();
if(!isset($_SESSION["user_id"])){
    header('Location: ../../main.php');
    exit;
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
        <header>
            <nav>
            <?php
            if(isset($_SESSION["user_id"])){
                echo '<a href="ログイン系/php/logout.php">ログアウト</a>';
            } else {
                echo '<a href="ログイン系/php/login.php">ログイン</a>';
            }
            ?>
        </nav>
    </header>
    <pre>
        <?php print_r($_SESSION)?>
    </pre>
    <footer>

    </footer>
    </body>
    <script src="../js/.js"></script>
</html>