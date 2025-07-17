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
        <?php require_once '../../base/header.php'; ?>
    <pre>
        <?php print_r($_SESSION)?>
    </pre>
<?php require_once '../../base/footer.php'; ?>
    </body>
    <script src="../js/.js"></script>
</html>