<!--header.php-->

<?php
// このファイルが直接アクセスされた場合に、セッションが未開始なら開始する
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// ログインしているユーザーのIDと名前を変数に入れておく
$current_user_id = $_SESSION['user_id'] ?? null;
$current_user_name = $_SESSION['user_name'] ?? 'ゲスト';
?>
<header>
    <h1><a href="/php/sugurico-php/main.php">スグリコ</a></h1>
    <nav>
        <?php if ($current_user_id){
            ?><a href="/php/sugurico-php/ログイン系/php/mypage.php">
                <?php echo htmlspecialchars($current_user_name); ?>さん
            </a>
            <a href="/php/sugurico-php/ログイン系/php/logout.php">ログアウト</a> <?php
        } else {?><a href="/php/sugurico-php/ログイン系/php/login.php">ログイン</a>
            <a href="/php/sugurico-php/ログイン系/php/signin.php">新規登録</a>
<?php
            }
            ?>
            
    </nav>
    <div class="search-form-container">
        <form action="/php/sugurico-php/search.php" method="get">
            <input type="text" name="keyword" placeholder="キーワードで検索...">
            <select name="type" id="content">
                <option value="title">タイトル</option>
                <option value="text">テキスト</option>
                <option value="tag">タグ</option>
            </select>
            <button type="submit">検索</button>
        </form>
    </div>
</header><style>
    
</style>