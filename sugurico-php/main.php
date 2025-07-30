<!--main.php-->

<?php session_start(); 
require_once 'base/getPDO.php';
$pdo = getPDO();
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <link rel="stylesheet" href="base/style.css">
    <link rel="stylesheet" href="style.css">
    <meta charset="UTF-8">
    <title>スグリコ - メインページ</title>
</head>
<body>
    <?php require_once 'base/header.php'; ?>
    <h1>ようこそ、スグリコへ！</h1>
    <pre>
        <?php print_r($_SESSION)?>
    </pre>
    <?php 
    if (isset($_SESSION["user_id"])){
        echo"<hr>あなたの投稿<!-- 最新三件 -->";
        $stmt_my =  $pdo->prepare("SELECT users.user_name, forums.title, forums.text, forums.delete_date,forums.forum_id
        FROM `forums`
        JOIN users ON users.user_id = forums.user_id
        WHERE users.user_id = ? AND (forums.delete_date IS NULL OR forums.delete_date > NOW())
        ORDER BY forum_id DESC 
        LIMIT 3");
        $stmt_my -> execute([$_SESSION["user_id"]]);
        if ($stmt_my-> rowCount() > 0) {
            foreach ($stmt_my as $row) {
                ?>
                <a href="投稿系/php/forum_yours.php?id=<?php echo $row['forum_id']?>">
                <article style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                    <h3>
                        <?php echo htmlspecialchars($row['title'])?>
                    </h3>
                    <p>
                        <?php echo nl2br(htmlspecialchars($row['text']))?>
                    </p>
                    <small>
                        投稿者:<?php echo htmlspecialchars($row['user_name']) ?>
                    </small>
                    <?php
                    if ($row['delete_date']) {
                        $now = new DateTime();
                        $delete_date = new DateTime($row['delete_date']);
                        if ($now < $delete_date) {
                            $interval = $now->diff($delete_date);
                            echo '<small style="color:gray;">閲覧可能期間: 残り ' . $interval->format('%d日 %h時間 %i分') . '</small>';
                        }
                    } else {
                        echo '<small style="color:gray;">閲覧可能期間: 無期限</small>';
                    }
                    ?>
                </article></a>
                <?php
            }
        } else {
            echo "まだ投稿がありません。";
        }
    }
    ?>
    <hr>
    皆さんの投稿
    <!-- 最新三件 -->
    <?php 
    if(isset($_SESSION["user_id"])){
        $stmt_all =  $pdo->prepare("SELECT users.user_name, forums.title, forums.text, forums.delete_date ,forums.forum_id
        FROM `forums`
        JOIN users ON users.user_id = forums.user_id
        Where users.user_id != ? AND(forums.delete_date IS NULL OR forums.delete_date > NOW())
        ORDER BY forum_id DESC 
        LIMIT 3");
        $stmt_all -> execute([$_SESSION["user_id"]]);
    } else {
        $stmt_all =  $pdo->prepare("SELECT users.user_name, forums.title, forums.text, forums.delete_date ,forums.forum_id
        FROM `forums`
        JOIN users 
        ON users.user_id = forums.user_id
        WHERE (forums.delete_date IS NULL OR forums.delete_date > NOW())
        ORDER BY forum_id DESC 
        LIMIT 3");
        $stmt_all -> execute();}
        if ($stmt_all-> rowCount() > 0) {
            foreach ($stmt_all as $row) {
                ?>
                <a href="投稿系/php/forum_others.php?id=<?php echo $row['forum_id']?>">
                    <article style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                        <h3>
                            <?php echo htmlspecialchars($row['title'])?>
                        </h3>
                        <p>
                        <?php echo nl2br(htmlspecialchars($row['text']))?>
                    </p>
                    <small>
                        投稿者:<?php echo htmlspecialchars($row['user_name']) ?>
                    </small>
                    <br>
                    <?php 
                    if ($row['delete_date']) {
                        $now = new DateTime();
                        $delete_date = new DateTime($row['delete_date']);
                        if ($now < $delete_date) {
                            $interval = $now->diff($delete_date);
                            echo '<small style="color:gray;">閲覧可能期間: 残り ' . $interval->format('%d日 %h時間 %i分') . '</small>';
                        }
                    } else {
                        echo '<small style="color:gray;">閲覧可能期間: 無期限</small>';
                    }
                    ?>
                </article></a>
                <?php
            }
        } else {
            echo "まだ投稿がありません。";
        }
        
        ?>

    <?php
    if(isset($_SESSION["user_id"])){
        echo '<a href="投稿系/php/forum_input.php" class = "floating-button">+</a>';
        } ?>
    <?php require_once 'base/footer.php'; ?>
    <script src="script.js"></script>
</body>
</html>