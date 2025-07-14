<?php
function getPDO() {
    $PASSWORD = 'password';
    $HOST     = 'localhost';
    $DBNAME   = 'sugurico';
    $USERNAME = 'owner';

    try {
        $pdo = new PDO("mysql:host=$HOST;dbname=$DBNAME;charset=utf8", $USERNAME, $PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        die("接続エラー: " . $e->getMessage());
    }
}
?>