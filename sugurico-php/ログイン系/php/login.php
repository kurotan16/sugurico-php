<!-- login.php -->
<?php session_start();
if(isset($_SESSION["user_id"])){
    header('Location: ../../main.php');
    exit;
}
$success_message = $_SESSION['success_message'] ?? '';
unset($_SESSION['success_message']);

$error_message = $_SESSION['error_message'] ?? '';
unset($_SESSION['error_message']);
$form_data = $_SESSION['login_form_data'] ?? [];
unset($_SESSION['login_form_data']);
?>
<!DOCTYPE html>
<html lang="ja">
    <head>
        <link rel="stylesheet" href="../css/style.css">
        <link rel="stylesheet" href="../css/login.css">
        <meta charset="UTF-8">
        <title></title>
    </head>
    <body>
        <?php require_once '../../base/header.php'; ?>
        <main class="form-container">
            <h1>ログイン</h1>
            <pre>
                <?php print_r($_SESSION)?>
            </pre>
            <?php
            if($success_message){
                echo'<div class="message success">',htmlspecialchars($success_message),'</div>';
            }
            if($error_message){
                echo'<div class="message error">',htmlspecialchars($error_message),'</div>';
            }
            ?>
            
    <form action="login_execute.php" method="post">
        <div class="form-group">
            <label for="loginIdInput">ログインID</label>
            <input type="text" name="login_id" id="loginIdInput" 
            value="<?php echo htmlspecialchars($form_data['login_id'] ?? '')?>">
        </div>
        <div class="form-group">
            <label for="passwordInput">パスワード</label>
            <input type="password" name="password" id="passwordInput">
        </div>
        <button type="submit" class="form-button">ログイン</button>
    </form>
    <div class="form-footer"><a href="signin.php">新規登録</a></div>
    
</main><?php require_once '../../base/footer.php'; ?>
    </body>
    <script src="../js/.js"></script>
</html>