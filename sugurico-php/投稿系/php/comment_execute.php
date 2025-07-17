<!-- コメントの投稿ページ -->
<?php 
session_start();
require_once '../../base/getPDO.php';
if(!isset($_SESSION["user_id"])){
    header('Location: ../../main.php');
    exit;
}
echo "<pre>";
print_r($_REQUEST);
echo "</pre>";

$pdo = getPDO();

    $sql = "INSERT INTO comments (user_id, forum_id, comment_text, delete_flag) VALUES (?, ?, ?, 0)";
    $stmt = $pdo->prepare($sql);
    
$stmt->execute([$_SESSION["user_id"], $_REQUEST["forum_id"], $_REQUEST["comment_text"]]);
if ($_REQUEST["return_page"] == "yours") {
        header('Location: forum_yours.php?id=' . $_REQUEST["forum_id"]);
    exit;
} else {
        header('Location: forum_others.php?id=' . $_REQUEST["forum_id"]);
    exit;
}


?>
