<?php
function getPDO() {
    // 共通
    $PASSWORD = 'password';     // パスワード

    // XAMPP
    $HOST     = 'localhost';    // データベースサーバーのアドレス
    $DBNAME   = 'sugurico';         // データベース名
    $USERNAME = 'owner';        // ユーザー名

    // ロリポップ

    // $HOST     = 'mysql309.phy.lolipop.lan';    // データベースサーバーのアドレス
    // $DBNAME   = 'LAA1515804-fg';         // データベース名
    // $USERNAME = 'LAA1515804';        // ユーザー名

    try {
        // PDOインスタンスを作成してMySQLに接続
        $pdo = new PDO("mysql:host=$HOST;dbname=$DBNAME;charset=utf8", $USERNAME, $PASSWORD);
    } catch (PDOException $e) {
        // 接続エラーが発生した場合の処理
        die("接続エラー: " . $e->getMessage());
    }

    // PDOのエラーモードを例外モードに設定
    // 詳細なエラー内容を画面に表示してくれる設定
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    return $pdo;
}
?>
