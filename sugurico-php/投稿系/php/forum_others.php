<!-- forum_others.php -->
<?php
session_start();
require_once '../../base/getPDO.php'; // パスは適宜調整

// --- パラメータ受け取りとバリデーション ---
$forum_id = $_GET['id'] ?? null;
if (!$forum_id || !is_numeric($forum_id)) {
    header('Location: ../../main.php');
    exit;
}


    $pdo = getPDO();

    // --- 投稿情報を取得（期限切れでないもの）---
    $stmt_post = $pdo->prepare(
        "SELECT f.*, u.user_name 
         FROM forums f JOIN users u ON f.user_id = u.user_id 
         WHERE f.forum_id = ? AND (f.delete_date IS NULL OR f.delete_date > NOW())"
    );
    $stmt_post->execute([$forum_id]);
    $post = $stmt_post->fetch(PDO::FETCH_ASSOC);

    // --- アクセス制御 ---

    // 1. 投稿自体が存在しない（期限切れ含む）場合はトップへ
    if (!$post) {
        header('Location: ../../main.php');
        exit;
    }

    // 2. もし自分の投稿にアクセスしようとした場合は、自分用のページへリダイレクト
    //    (ログインしている場合のみチェック)
    if (isset($_SESSION['user_id']) && $post['user_id'] == $_SESSION['user_id']) {
        header('Location: forum_yours.php?id=' . $forum_id);
        exit;
    }

    // --- タグを取得 ---
    $stmt_tags = $pdo->prepare(
        "SELECT * FROM `tag_dic` 
JOIN tag on tag_dic.tag_id = tag.tag_id
JOIN forums ON tag.forum_id = forums.forum_id
         WHERE forums.forum_id = ? ORDER BY tag.tag_id DESC"
    );
    $stmt_tags->execute([$forum_id]);
    $tags = $stmt_tags->fetchAll(PDO::FETCH_ASSOC);

    // --- コメント一覧を取得 ---
    $stmt_comments = $pdo->prepare(
        "SELECT c.*, u.user_name FROM comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.forum_id = ? ORDER BY c.created_at DESC"
    );
    $stmt_comments->execute([$forum_id]);
    $comments = $stmt_comments->fetchAll(PDO::FETCH_ASSOC);


?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title><?php echo htmlspecialchars($post['title']); ?> | スグリコ</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <?php require_once '../../base/header.php'; ?>

    <main>
        <article class="post-detail">
            <h1><?php echo htmlspecialchars($post["title"]); ?></h1>
            <p>投稿者: <?php echo htmlspecialchars($post["user_name"]); ?></p>
            <div class="post-content">
                <?php echo nl2br(htmlspecialchars($post["text"])); ?>
            </div>
            <br>
                    <?php 
                    if ($post['delete_date']) {
                        $now = new DateTime();
                        $delete_date = new DateTime($post['delete_date']);
                        if ($now < $delete_date) {
                            $interval = $now->diff($delete_date);
                            echo '<small style="color:gray;">閲覧可能期間: 残り ' . $interval->format('%d日 %h時間 %i分') . '</small>';
                        }
                    } else {
                        echo '<small style="color:gray;">閲覧可能期間: 無期限</small>';
                    }
                    if (count($tags) > 0) {
                        foreach ($tags as $tag) {
                            echo '<a href="">',$tag['tag_name'],'</a>/';
                        }
                    }
                    
                    ?>
            <!-- (ここに画像やタグ、残り時間などを表示) -->
        </article>

        <hr>

        <section class="comment-section">
            <h2>コメント</h2>
            <?php
                if (isset($_SESSION['user_id'])){
                    ?>
                    <form action="comment_execute.php" method="post">
                        <textarea name="comment_text" placeholder="コメントを入力..." required></textarea>
                        <input type="hidden" name="forum_id" value="<?php echo htmlspecialchars($post['forum_id']); ?>">
                        <!-- ★どちらのページから来たかを示す隠しデータを追加 -->
                        <input type="hidden" name="return_page" value="others">
                        <button type="submit">コメントを投稿する</button>
                    </form>
                    <?php
                    } else {
                        echo '<p><a href="../../ログイン系/php/login.php">ログイン</a>してコメントを投稿する</p>';
                    }
                    ?>

                    <!-- コメント一覧 -->
                    <div class="comment-list">
                        <?php if (count($comments) > 0){
                            foreach ($comments as $comment) {?>
                            <div class="comment-item">
                                <strong><?php echo htmlspecialchars($comment['user_name']); ?>:</strong>
                                <p><?php echo nl2br(htmlspecialchars($comment['comment_text'])); ?></p>
                                <small><?php echo htmlspecialchars($comment['created_at']); ?></small>
                            </div>
                            <?php 
                            }
                        } else {
                            echo '<p>まだコメントはありません。</p>';
                        } ?>
                    </div>
        </section>
    </main>
<?php require_once '../../base/footer.php'; ?>

</body>
</html>