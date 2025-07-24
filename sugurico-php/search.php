<?php 
session_start();
require_once 'base/getPDO.php';

// --- 1. 検索キーワードとタイプの受け取り ---
$keyword = $_GET['keyword'] ?? '';
$type = $_GET['type'] ?? 'title'; // デフォルトは'title'検索

// --- ページネーションの準備 ---
$posts_per_page = 10;
$current_page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($current_page < 1) { $current_page = 1; }

$posts = [];
$total_posts = 0;
$total_pages = 0;

if (!empty(trim($keyword))) {
    $pdo = getPDO();
    $search_keyword = '%' . $keyword . '%';

    // --- 2. 検索タイプに応じてSQLを切り替え ---
    $base_select = "SELECT f.*, u.user_name FROM forums f JOIN users u ON f.user_id = u.user_id";
    $count_select = "SELECT COUNT(DISTINCT f.forum_id) FROM forums f"; // COUNT用にDISTINCTを使用

    if ($type === 'tag') {
        // 【タグ検索の場合】
        $join_clause = " JOIN tag t ON f.forum_id = t.forum_id JOIN tag_dic td ON t.tag_id = td.tag_id";
        $where_clause = " WHERE td.tag_name LIKE ?";
        $params = [$search_keyword];
    } elseif ($type === 'text') {
        // 【本文検索の場合】
        $join_clause = "";
        $where_clause = " WHERE f.text LIKE ?";
        $params = [$search_keyword];
    } else {
        // 【タイトル検索の場合 (デフォルト)】
        $join_clause = "";
        $where_clause = " WHERE f.title LIKE ?";
        $params = [$search_keyword];
    }

    // --- 3. 総件数を取得 ---
    $stmt_count = $pdo->prepare($count_select . $join_clause . $where_clause);
    $stmt_count->execute($params);
    $total_posts = $stmt_count->fetchColumn();

    $total_pages = ceil($total_posts / $posts_per_page);
    $offset = ($current_page - 1) * $posts_per_page;

    // --- 4. 投稿を取得 ---
    $search_sql = $base_select . $join_clause . $where_clause . 
                  " ORDER BY f.forum_id DESC LIMIT " . (int)$posts_per_page . " OFFSET " . (int)$offset;
    
    $stmt_posts = $pdo->prepare($search_sql);
    $stmt_posts->execute($params);
    $posts = $stmt_posts->fetchAll(PDO::FETCH_ASSOC);
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>検索結果 | スグリコ</title>
    <link rel="stylesheet" href="base/style.css">
</head>
<body>
    <?php require_once 'base/header.php'; ?>
    <main>
        <h1>「<?php echo htmlspecialchars($keyword); ?>」の検索結果 (<?php echo htmlspecialchars($type); ?>)</h1>
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
            <?php if ($total_pages > 1): ?>
                <?php
                // --- 5. ページネーションリンクにtypeパラメータを追加 ---
                $base_link = '?keyword=' . urlencode($keyword) . '&type=' . urlencode($type);
                ?>
                <?php if ($current_page > 1): ?>
                    <a href="<?php echo $base_link . '&page=' . ($current_page - 1); ?>">« 前へ</a>
                <?php endif; ?>

                <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                    <?php if ($i == $current_page): ?>
                        <span><?php echo $i; ?></span>
                    <?php else: ?>
                        <a href="<?php echo $base_link . '&page=' . $i; ?>"><?php echo $i; ?></a>
                    <?php endif; ?>
                <?php endfor; ?>

                <?php if ($current_page < $total_pages): ?>
                    <a href="<?php echo $base_link . '&page=' . ($current_page + 1); ?>">次へ »</a>
                <?php endif; ?>
            <?php endif; ?>
        </nav>
    </main>
    <?php require_once 'base/footer.php'; ?>
</body>
</html>