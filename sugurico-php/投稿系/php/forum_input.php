<!-- forum_input.php -->
<?php
session_start();
// ログインしていないユーザーはメインページにリダイレクト
if (!isset($_SESSION["user_id"])) {
    header('Location: ../../main.php');
    exit;
}

// プレミアム会員かどうかを判定（仮のフラグ）
// 実際にはDBから取得するなどして判定します
$is_premium = $_SESSION['is_premium'] ?? false;
$max_images = $is_premium ? 6 : 3;

// エラー時の入力値復元用（今はまだ空）
$form_data = $_SESSION['post_form_data'] ?? [];
$errors = $_SESSION['post_errors'] ?? [];
unset($_SESSION['post_form_data']);
unset($_SESSION['post_errors']);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>新規投稿 | スグリコ</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/forum_input.css">
</head>
<body>
    <?php require_once '../../base/header.php'; ?>
    <main class="form-container">
        <h1>新しい記録を投稿</h1>
        <form action="forum_execute.php" method="post" enctype="multipart/form-data">

            <!-- タイトル -->
            <div class="form-group"> <!-- ★ divにclassを追加 -->
                <label for="titleInput">タイトル</label>
                <input type="text" name="title" id="titleInput" value="<?php echo htmlspecialchars($form_data['title'] ?? ''); ?>" required>
            </div>

            <!-- 本文 -->
            <div class="form-group"> <!-- ★ divにclassを追加 -->
                <label for="textInput">本文</label>
                <textarea name="text" id="textInput" rows="10"><?php echo htmlspecialchars($form_data['text'] ?? ''); ?></textarea>
            </div>

            <!-- 公開期限 -->
            <div class="form-group"> <!-- ★ divにclassを追加 -->
                <label for="expiresSelect">公開期限</label>
                <select name="expires" id="expiresSelect">
                    <option value="1day">1日後</option>
                    <option value="3days">3日後</option>
                    <option value="7days">7日後</option>
                    <option value="permanent" selected>無期限</option>
                </select>
                <?php if ($is_premium): ?>
                    <input type="datetime-local" name="expires_datetime">
                    <small>※日時を指定した場合、こちらが優先されます。</small>
                <?php endif; ?>
            </div>

            <!-- 画像添付 -->
            <div class="form-group"> <!-- ★ divにclassを追加 -->
                <label for="imagesInput">画像 (最大<?php echo $max_images; ?>枚まで)</label>
                <input type="file" name="images[]" id="imagesInput" multiple accept="image/*">
                <div id="image-preview-container"></div>
            </div>

            <!-- タグ -->
            <div class="form-group"> <!-- ★ divにclassを追加 -->
                <label>タグ (最大10個まで)</label>
                <div id="tag-container">
                    <div class="tag-input-wrapper">
                        <input type="text" name="tags[]" placeholder="タグを入力">
                    </div>
                </div>
            </div>
            
            <!-- ★ inputをbuttonに変更し、classを追加 -->
            <button type="submit" class="submit-button">投稿する</button>
        </form>
    </main>
    
    <?php require_once '../../base/footer.php'; ?>
    
    <script src="../js/tag_form.js"></script> 
    <script src="../js/image_preview.js"></script>
</body>
</html>