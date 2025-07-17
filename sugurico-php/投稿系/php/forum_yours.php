<!-- 自分の投稿を見るページ -->
<?php session_start();
require_once '../../base/getPDO.php';
if(!isset($_SESSION["user_id"])){
    header('Location: ../../main.php');
    exit;
}

$forum_id =  $_GET['id'] ?? null;
if(!$forum_id || !is_numeric($forum_id)){
    header('Location: ../../main.php');
    exit;
}

$pdo = getPDO();

$stmt_post = $pdo->prepare("SELECT f.*, u.user_name 
FROM forums f
JOIN users u ON f.user_id = u.user_id
WHERE f.forum_id = ?");
$stmt_post -> execute([$forum_id]);
$post = $stmt_post -> fetch(PDO::FETCH_ASSOC);

if(!$post || $post['user_id'] != $_SESSION['user_id']){
    header('Location: ../../main.php');
    exit;
}


$stmt_comments = $pdo->prepare("SELECT c.*, u.user_name
FROM comments c
JOIN users u ON c.user_id = u.user_id
WHERE c.forum_id = ?
ORDER BY c.created_at DESC "
);
$stmt_comments -> execute([$forum_id]);
?>
<!DOCTYPE html>

<html lang="ja">
    <head>
        <link rel="stylesheet" href="../css/.css">
        <meta charset="UTF-8">
        <title>
            <?php echo htmlspecialchars($post['title'])?> | スグリコ
        </title>
    </head>
    <body>
        <header>
            <a href="../../main.php">トップに戻る</a>
            <a href="mypage.php">マイページに戻る</a>
        </header>
        <pre>
            <?php print_r($_SESSION)?>
        </pre>
        <main>
            <article class = "post-detail">
                <h1><?php echo htmlspecialchars($post["title"]) ?></h1>
                <p>投稿者:<?php echo htmlspecialchars($post["user_name"]); ?></p>
                <div class = "post-content">
                    <?php echo htmlspecialchars($post["text"]) ?>
                </div>
            </article>
            <hr>
            <section class = "comment-section">
                <h2>コメント</h2>
                <?php 
                if (isset($_SESSION['user_id'])) {
                    ?>
                    <form action="comment_execute.php" method="post">
                        <textarea name="comment_text" id="commentText" rows="4" placeholder="コメントを入力" required>

                        </textarea>
                        <input type="hidden" name="forum_id" value=
                        <?php echo htmlspecialchars($post['forum_id']) ?>
                        >
                        <input type="hidden" name="return_page" value="yours">
                        <button type="submit">コメントを投稿する</button>
                    </form>
                    <?php
                }
                ?>

                <div class = "comment-list">
                    <?php 
                    if($stmt_comments->rowCount() > 0){
                        foreach ($stmt_comments as $comment) {
                            ?>
                            <div class = "comment-item">
                                <strong><?php echo htmlspecialchars($comment['user_name']) ?></strong>
                                <p><?php echo htmlspecialchars($comment['comment_text']) ?></p>
                                <small><?php echo htmlspecialchars($comment['created_at']) ?></small>
                            </div>
                            <?php
                        } 
                    }else {
                            echo '<p>まだコメントはありません。</p>';
                        }
                    ?>
                </div>
            </section>
        </main>
    <footer>

    </footer>
    </body>
    <script src="../js/.js"></script>
</html>