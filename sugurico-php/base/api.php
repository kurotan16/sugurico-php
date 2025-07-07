<?php
// レスポンスの形式をJSONに設定
header('Content-Type: application/json');

// --- データベース接続関数の読み込み ---
// getPDO()関数が定義されたファイルを読み込みます
require_once 'getPDO.php';

// --- POSTデータ（JSON）の取得とデコード ---
// リクエストボディから生データを取得
$body = file_get_contents('php://input');
// JSON文字列をPHPの連想配列に変換
$data = json_decode($body, true);

// もしJSONのデコードに失敗したらエラー
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => '無効なJSON形式です。']);
    exit;
}

// --- SQL文とパラメータの取得 ---
// "sql"キーの値を取得し、前後の空白を除去。なければ空文字列に。
$sql = trim($data['sql'] ?? '');
// "params"キーの値を取得。なければ空の配列に。
$params = $data['params'] ?? [];

// SQL文が空の場合はエラー
if ($sql === '') {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'SQL文が空です。']);
    exit;
}

// --- メイン処理 ---
try {
    // データベースに接続
    $pdo = getPDO();

    // SQL文がusersテーブルへのINSERTまたはUPDATEであるかをチェック
    if (preg_match('/^\s*(INSERT\s+INTO|UPDATE)\s+`?users`?/i', $sql)) {
        // パラメータにパスワードが含まれているかを確認
        if (isset($params[':password'])) {
            // もしパスワードが空文字列でなければ、ハッシュ化する
            if ($params[':password'] !== '') {
                $params[':password'] = password_hash($params[':password'], PASSWORD_DEFAULT);
            } else {
                // もしパスワードが空文字列なら、このパラメータ自体を削除する
                // (UPDATE時にパスワードが未入力の場合、更新しないようにするため)
                unset($params[':password']);
            }
        }
    }

    // プリペアドステートメントを準備
    $stmt = $pdo->prepare($sql);
    // パラメータをバインドして実行
    $stmt->execute($params);

    // SQL文がSELECT文かどうかを判断 (大文字小文字を区別しない)
    if (preg_match('/^\s*SELECT/i', $sql)) {
        // SELECT文の場合：結果をすべて連想配列として取得
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // 結果をJSON形式で出力
        echo json_encode(['success' => true, 'type' => 'select', 'data' => $rows]);
    } else {
        // INSERT, UPDATE, DELETE文の場合：影響を受けた行数を取得
        $affectedRows = $stmt->rowCount();
        // 結果をJSON形式で出力
        echo json_encode(['success' => true, 'type' => 'exec', 'rows' => $affectedRows]);
    }

} catch (PDOException $e) {
    // データベース関連のエラーが発生した場合
    http_response_code(400); // Bad Request (SQLエラーなどはクライアント側の問題とみなす)
    // エラーメッセージをJSON形式で出力
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>