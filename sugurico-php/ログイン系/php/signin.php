<!-- signin.php -->
<?php 
session_start();
if(isset($_SESSION["user_id"])){
    header('Location: ../../main.php');
    exit;
}

// セッションからエラー時の入力値とエラーメッセージを取得
$form_data = $_SESSION['signin_form_data'] ?? [];
$errors = $_SESSION['signin_errors'] ?? [];
// 一度使ったら消す
unset($_SESSION['signin_form_data']);
unset($_SESSION['signin_errors']);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <link rel="stylesheet" href="../css/style.css"> <!-- ★CSSのパスを修正 -->
    <link rel="stylesheet" href="../css/login.css"> <!-- ★ログインと共通のデザインを適用 -->
    <meta charset="UTF-8">
    <title>新規登録 | スグリコ</title>
</head>
<body>
    <?php require_once '../../base/header.php'; ?>

    <main class="form-container">
        <h1>新規登録</h1>

        <!-- 共通エラーメッセージ -->
        <?php 
        if (isset($errors['common'])){
            echo '<div class="message error">',htmlspecialchars($errors['common']),'</div>';
        }
        ?>

        <!-- ★formタグにmethod="post"を追加 -->
        <form action="signin_execute.php" method="post">
            <div class="form-group">
                <label for="nameInput">名前</label>
                <input type="text" name="name" id="nameInput" value="<?php echo htmlspecialchars($form_data['name'] ?? ''); ?>" required>
            </div>
            <div class="form-group">
                <label for="usernameInput">ユーザー名</label>
                <input type="text" name="user_name" id="usernameInput" value="<?php echo htmlspecialchars($form_data['user_name'] ?? ''); ?>" required>
            </div>
            <div class="form-group">
                <label for="loginIdInput">ログインID</label>
                <input type="text" name="login_id" id="loginIdInput" value="<?php echo htmlspecialchars($form_data['login_id'] ?? ''); ?>" required>
                <!-- ログインIDの重複エラーメッセージ -->
                <?php if (isset($errors['login_id'])): ?>
                    <p style="color:red;"><?php echo htmlspecialchars($errors['login_id']); ?></p>
                <?php endif; ?>
            </div>
            <div class="form-group">
                <label for="emailInput">メールアドレス</label>
                <input type="email" name="email" id="emailInput" value="<?php echo htmlspecialchars($form_data['email'] ?? ''); ?>" required>
                <!-- メールアドレスの重複エラーメッセージ -->
                <?php if (isset($errors['email'])): ?>
                    <p style="color:red;"><?php echo htmlspecialchars($errors['email']); ?></p>
                <?php endif; ?>
            </div>
            <div class="form-group">
                <label for="passwordInput">パスワード</label>
                <input type="password" name="password" id="passwordInput" required>
            </div>
            <button type="submit" class="form-button">登録する</button>
        </form>
    </main>
    
    <?php require_once '../../base/footer.php'; ?>
</body>
</html>