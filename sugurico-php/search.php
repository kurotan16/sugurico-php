<?php 
session_start();
require_once 'base/getPDO.php';

$keyword = $_GET['keyword'];

$posts_per_page = 10;
$current_page = isset($_GET['page']) ? (int)$_GET['page'] :1;
if ($current_page < 1) {
    $current_page = 1;
}

$posts = [];
$total_posts = 0;
$total_pages  = 0;

if (!empty(trim($keyword))) {
    $pdo = getPDO();

        // 検索キーワードで総件数を取得
        $count_sql = "SELECT COUNT(*) FROM forums WHERE (title LIKE ? OR text LIKE ?)";
        $stmt_count = $pdo->prepare($count_sql);
        $search_keyword = '%' . $keyword . '%';
        $stmt_count->execute([$search_keyword, $search_keyword]);
        $total_posts = $stmt_count->fetchColumn();

        $total_pages = ceil($total_posts / $posts_per_page);
        $offset = ($current_page - 1) * $posts_per_page;

        // 検索キーワードで投稿を取得
         $search_sql = "SELECT f.*, u.user_name FROM forums f 
                       JOIN users u ON f.user_id = u.user_id 
                       WHERE (f.title LIKE ? OR f.text LIKE ?) 
                       ORDER BY f.forum_id DESC 
                       LIMIT " . (int)$posts_per_page . " OFFSET " . (int)$offset;
        
        $stmt_posts = $pdo->prepare($search_sql);
        
        // ★ executeに渡すパラメータから、LIMITとOFFSET用の値を削除
        $stmt_posts->execute([$search_keyword, $search_keyword]);
        
        $posts = $stmt_posts->fetchAll(PDO::FETCH_ASSOC);
    }
?>

<!DOCTYPE html>
<html lang = "ja">
    <head>
        <meta charset="UTF-8">
        <title>検索結果 | スグリコ</title>
            <link rel="stylesheet" href="base/style.css">

    </head>
    <body>
        <?php require_once 'base/header.php'; ?>
        <main>
            <h1>「<?php echo htmlspecialchars($keyword); ?>」の検索結果</h1>
            <p><?php echo $total_posts; ?>件の投稿が見つかりました。</p>
            <section class="post-list">
                <?php if(count($posts) > 0){
                    foreach ($posts as $post) {?>
                    <a href="投稿系/php/forum_others.php?id=<?php echo $post['forum_id']?>">
                    <article style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                        <h3>
                            <?php echo htmlspecialchars($post['title'])?>
                        </h3>
                        <p>
                        <?php echo nl2br(htmlspecialchars($post['text']))?>
                    </p>
                    <small>
                        投稿者:<?php echo htmlspecialchars($post['user_name']) ?>
                    </small>
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
                    ?>
                </article></a>
                    <?php }
                } else {?>
<p>該当する投稿は見つかりませんでした。</p>
                <?php
                }
                ?>
            </section>
            <nav class="pagination">
                <?php
                if ($total_pages > 1) {
                    // 「前へ」のリンク
                    if ($current_page > 1) {
                        // ★ keywordパラメータも一緒にURLに含める
                        echo '<a href="?keyword=' . urlencode($keyword) . '&page=' . ($current_page - 1) . '">« 前へ</a>';
                    }

                    // ページ番号のリンク
                    for ($i = 1; $i <= $total_pages; $i++) {
                        if ($i == $current_page) {
                            echo '<span style="font-weight:bold; margin: 0 5px;">' . $i . '</span>';
                        } else {
                            // ★ keywordパラメータも一緒にURLに含める
                            echo '<a href="?keyword=' . urlencode($keyword) . '&page=' . $i . '" style="margin: 0 5px;">' . $i . '</a>';
                        }
                    }
                    
                    // 「次へ」のリンク
                    if ($current_page < $total_pages) {
                        // ★ keywordパラメータも一緒にURLに含める
                        echo '<a href="?keyword=' . urlencode($keyword) . '&page=' . ($current_page + 1) . '">次へ »</a>';
                    }
                }
                ?>
            </nav>
        </main><?php require_once 'base/footer.php'; ?>
    </body>
</html>