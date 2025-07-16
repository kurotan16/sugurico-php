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
    <!-- ★CSSへのリンクを修正 -->
    <!--<link rel="stylesheet" href="../css/style.css"> -->
    <link rel="stylesheet" href="../css/forum_input.css"> <!-- 投稿フォーム専用CSS -->
</head>
<body>
    <header>
        <!-- (ヘッダー内容は省略) -->
    </header>

    <main>
        <h1>新しい記録を投稿</h1>

        <!-- エラーメッセージ表示欄 -->
        <?php if (!empty($errors)): ?>
            <div class="error-box">
                <?php foreach ($errors as $error): ?>
                    <p><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <!-- ★enctype="multipart/form-data" を追加してファイル送信を有効化 -->
        <form action="forum_execute.php" method="post" enctype="multipart/form-data">

            <!-- タイトル -->
            <div>
                <label for="titleInput">タイトル</label>
                <input type="text" name="title" id="titleInput" value="<?php echo htmlspecialchars($form_data['title'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" required>
            </div>

            <!-- 本文 -->
            <div>
                <label for="textInput">本文</label>
                <textarea name="text" id="textInput" rows="10"><?php echo htmlspecialchars($form_data['text'] ?? '', ENT_QUOTES, 'UTF-8'); ?></textarea>
            </div>

            <!-- 公開期限 -->
            <div>
                <label for="expiresSelect">公開期限</label>
                <select name="expires" id="expiresSelect">
                    <option value="1day">1日後</option>
                    <option value="3days">3日後</option>
                    <option value="7days">7日後</option>
                    <option value="permanent" selected>無期限</option>
                </select>
                <?php if ($is_premium): ?>
                    <!-- ★プレミアム会員の場合、時間指定の入力欄を表示 -->
                    <input type="datetime-local" name="expires_datetime">
                    <small>※日時を指定した場合、こちらが優先されます。</small>
                <?php endif; ?>
            </div>

            <!-- 画像添付 -->
            <div>
                <label for="imagesInput">画像 (最大<?php echo $max_images; ?>枚まで)</label>
                <!-- ★name属性を配列形式 "images[]" にするのがポイント -->
                <input type="file" name="images[]" id="imagesInput" multiple accept="image/*">
                <!-- 画像プレビューを表示するエリア -->
                <div id="image-preview-container"></div>
            </div>

            <!-- タグ -->
            <div>
                <label>タグ (最大10個まで)</label>
                <!-- ★JavaScriptで動的に入力欄を増減させるコンテナ -->
                <div id="tag-container">
                    <div class="tag-input-wrapper">
                        <input type="text" name="tags[]" placeholder="タグを入力">
                    </div>
                </div>
            </div>
            
            <input type="submit" value="投稿する">
        </form>
    </main>

    <!-- ★JavaScriptへのリンクを修正 -->
    <script src="../js/tag_form.js"></script> 
    <script src="../js/image_preview.js"></script> <!-- 画像プレビュー用JS -->
</body>
</html>