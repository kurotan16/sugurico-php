<?php
session_start();
require_once "../../base/getPDO.php";

// --- 1. ログインチェック ---
if (!isset($_SESSION["user_id"])) {
    header('Location: login.php');
    exit;
}

// --- 2. エラー/成功メッセージと、エラー時の入力値を取得 ---
$success_message = $_SESSION['success_message'] ?? '';
unset($_SESSION['success_message']);

$errors = $_SESSION['update_errors'] ?? [];
unset($_SESSION['update_errors']);

$form_data = $_SESSION['update_form_data'] ?? [];
unset($_SESSION['update_form_data']);

// --- 3. フォームの初期値を設定 ---
$display_data = [];
if (!empty($form_data)) {
    // エラーで戻ってきた場合は、セッションの入力値を優先して使う
    $display_data = $form_data;
} else {
    // 初回アクセス時は、DBから現在のユーザー情報を取得
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT name, user_name, login_id, email FROM users WHERE user_id = ?');
    $stmt->execute([$_SESSION["user_id"]]);
    $db_data = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($db_data) {
        $display_data = $db_data;
    }
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>登録情報変更 | スグリコ</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/login.css"> <!-- 共通のデザインを適用 -->
</head>
<body>
    <?php require_once '../../base/header.php'; ?>

    <main class="form-container">
        <h1>登録情報変更</h1>

        <!-- 成功メッセージ -->
        <?php if ($success_message): ?>
            <div class="message success"><?php echo htmlspecialchars($success_message); ?></div>
        <?php endif; ?>
        <!-- 共通エラーメッセージ -->
        <?php if (isset($errors['common'])): ?>
            <div class="message error"><?php echo htmlspecialchars($errors['common']); ?></div>
        <?php endif; ?>

        <!-- ★ method="post" を追加 -->
        <form action="update_execute.php" method="post">
            <div class="form-group">
                <label for="nameInput">名前</label>
                <!-- ★ 表示する値を$display_dataから取得 -->
                <input type="text" name="name" id="nameInput" value="<?php echo htmlspecialchars($display_data['name'] ?? ''); ?>" required>
            </div>
            <div class="form-group">
                <label for="userNameInput">ユーザー名</label>
                <input type="text" name="user_name" id="userNameInput" value="<?php echo htmlspecialchars($display_data['user_name'] ?? ''); ?>" required>
            </div>
            <div class="form-group">
                <label for="loginIdInput">ログインID</label>
                <input type="text" name="login_id" id="loginIdInput" value="<?php echo htmlspecialchars($display_data['login_id'] ?? ''); ?>" required>
                <?php if (isset($errors['login_id'])): ?>
                    <p style="color:red;"><?php echo htmlspecialchars($errors['login_id']); ?></p>
                <?php endif; ?>
            </div>
            <div class="form-group">
                <label for="emailInput">メールアドレス</label>
                <input type="email" name="email" id="emailInput" value="<?php echo htmlspecialchars($display_data['email'] ?? ''); ?>" required>
                 <?php if (isset($errors['email'])): ?>
                    <p style="color:red;"><?php echo htmlspecialchars($errors['email']); ?></p>
                <?php endif; ?>
            </div>
            <hr>
            <p>パスワードを変更する場合のみ入力してください</p>
            <div class="form-group">
                <label for="passwordInput">新しいパスワード</label>
                <!-- パスワードは表示しない -->
                <input type="password" name="password" id="passwordInput" placeholder="変更しない場合は空のまま">
            </div>
            <button type="submit" class="form-button">更新する</button>
        </form>
    </main>
    
    <?php require_once '../../base/footer.php'; ?>
</body>
</html>