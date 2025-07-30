<!-- mypage.php -->
<?php 
session_start();
require_once '../../base/getPDO.php';

// --- ログインチェック ---
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// --- DB接続 ---
$pdo = getPDO();

// --- ページネーションの準備 ---
$posts_per_page = 10;
$current_page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($current_page < 1) { $current_page = 1; }

// ログインユーザーの総投稿数を取得
$stmt_count = $pdo->prepare("SELECT COUNT(*) FROM forums WHERE user_id = ?");
$stmt_count->execute([$_SESSION['user_id']]);
$total_posts = $stmt_count->fetchColumn();

// 総ページ数を計算
$total_pages = ceil($total_posts / $posts_per_page);

// OFFSETを計算
$offset = ($current_page - 1) * $posts_per_page;

?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>マイページ | スグリコ</title>
    <link rel="stylesheet" href="../../base/style.css">
</head>
<body>
<?php require_once '../../base/header.php'; ?>

    <main>
        <h2><?php echo htmlspecialchars($_SESSION['user_name']); ?>さんの投稿一覧</h2>
        <p><a href="update.php">登録情報変更</a></p>
        
        <hr>
        
        <?php
        // --- 表示する投稿を取得するSQL ---
        $stmt_posts = $pdo->prepare(
            "SELECT forum_id, title, text FROM forums WHERE user_id = ? ORDER BY forum_id DESC LIMIT ? OFFSET ?"
        );
        $stmt_posts->bindValue(1, $_SESSION['user_id'], PDO::PARAM_INT);
        $stmt_posts->bindValue(2, $posts_per_page, PDO::PARAM_INT);
        $stmt_posts->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt_posts->execute();

        if ($stmt_posts->rowCount() > 0) {
            foreach ($stmt_posts as $row) {
                 echo '<a href="../../投稿系/php/forum_yours.php?id=' . htmlspecialchars($row['forum_id']) . '" style="text-decoration:none; color:inherit;">';?>
                <article style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                <h3><?php echo htmlspecialchars($row['title'])?></h3>
                <p><?php echo nl2br(htmlspecialchars($row['text']))?></p>
                </article>
                <?php
                echo '</a>';
            }
        } else {
            echo "<p>まだ投稿がありません。</p>";
        }
        ?>

        <?php // --- ページネーションのリンクを表示 --- ?>
        <nav class="pagination">
            <?php
            if ($total_pages > 1) {
                
                // 「前へ」のリンク
                if ($current_page > 1) {
                    echo '<a href="?page=' . ($current_page - 1) . '">« 前へ</a>';
                }

                // ページ番号のリンク
                for ($i = 1; $i <= $total_pages; $i++) {
                    if ($i == $current_page) {
                        echo '<span style="font-weight:bold; margin: 0 5px;">' . $i . '</span>';
                    } else {
                        echo '<a href="?page=' . $i . '" style="margin: 0 5px;">' . $i . '</a>';
                    }
                }
                
                // 「次へ」のリンク
                if ($current_page < $total_pages) {
                    echo '<a href="?page=' . ($current_page + 1) . '">次へ »</a>';
                }
            }
            ?>
        </nav>


    </main><?php require_once '../../base/footer.php'; ?>
</body>
</html>