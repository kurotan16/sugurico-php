<?php
// --- 1. 常にファイルの先頭でセッションを開始 ---
session_start();

// --- 2. セッション変数をすべて解除 ---
// $_SESSION を空の配列で上書きする
$_SESSION = [];

// --- 3. セッションクッキーを削除 ---
// session.use_cookiesが有効な場合のみ
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    // クッキーの有効期限を過去に設定することで、ブラウザから削除させる
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// --- 4. 最終的に、セッションを破壊 ---
session_destroy();

// --- 5. ログアウト完了後、ログインページにリダイレクト ---
// ログアウトしたことをユーザーに伝えるメッセージを添えるのが親切
header('Location: login.php');
exit;
?>