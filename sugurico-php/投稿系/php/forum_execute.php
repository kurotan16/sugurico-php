<?php
session_start();

// --- 必要なファイルを読み込む ---
require_once '../../base/getPDO.php';

require_once 'ImageUploader.php'; 

// --- ログインチェック ---
if (!isset($_SESSION["user_id"])) {
    // エラーメッセージを設定してフォームに戻す
    $_SESSION['post_errors'] = ['general' => '投稿するにはログインが必要です。'];
    header('Location: forum_input.php');
    exit;
}

// --- POSTされたデータを受け取る ---
$title = $_POST['title'] ?? '';
$text = $_POST['text'] ?? '';
$expires_option = $_POST['expires'] ?? 'permanent';
$expires_datetime = $_POST['expires_datetime'] ?? '';
$tags = $_POST['tags'] ?? [];
$images = $_FILES['images'] ?? []; // アップロードされたファイル情報

// --- バリデーション ---
$errors = [];
if (empty($title)) {
    $errors['title'] = 'タイトルは必須です。';
}
// (他のバリデーションも必要に応じて追加)

// もしエラーがあれば、入力値とエラーメッセージをセッションに保存してフォームに戻る
if (!empty($errors)) {
    $_SESSION['post_errors'] = $errors;
    $_SESSION['post_form_data'] = $_POST;
    header('Location: forum_input.php');
    exit;
}


// --- データベース処理開始 ---
try {
    $pdo = getPDO();

    // --- 1. 投稿本体(forumsテーブル)を保存 ---
    $sql = "INSERT INTO forums (user_id, title, text, delete_date, delete_flag, view_count) VALUES (?, ?, ?, ?, 0, 0)";
    $stmt = $pdo->prepare($sql);

    // 公開期限(delete_date)を計算
    $delete_date = null;
    if (!empty($expires_datetime)) {
        // 日時指定が最優先
        $delete_date = (new DateTime($expires_datetime))->format('Y-m-d H:i:s');
    } elseif ($expires_option !== 'permanent') {
        // プルダウンの選択肢
        $delete_date = (new DateTime())->modify('+' . str_replace('s', '', $expires_option))->format('Y-m-d H:i:s');
    }

    $stmt->execute([
        $_SESSION["user_id"],
        $title,
        $text,
        $delete_date
    ]);
    
    // ★今INSERTした投稿のIDを取得する
    $last_forum_id = $pdo->lastInsertId();

    // --- 2. タグ処理 ---
    if (!empty($tags)) {
        $unique_tags = array_unique(array_filter(array_map('trim', $tags)));
        foreach ($unique_tags as $tagName) {
            $tagName = trim($tagName);
            if (empty($tagName)) continue;

            // a. tag_dicに存在するか確認
            $stmt_tag = $pdo->prepare("SELECT tag_id FROM tag_dic WHERE tag_name = ?");
            $stmt_tag->execute([$tagName]);
            $tag_id = $stmt_tag->fetchColumn();

            // b. 存在しなければ、tag_dicに新規登録
            if (!$tag_id) {
                $stmt_insert_tag = $pdo->prepare("INSERT INTO tag_dic (tag_name, created_at) VALUES (?, NOW())");
                $stmt_insert_tag->execute([$tagName]);
                $tag_id = $pdo->lastInsertId();
            }

            // c. 中間テーブル(tag)に紐付けを保存
            $stmt_link = $pdo->prepare("INSERT INTO tag (forum_id, tag_id) VALUES (?, ?)");
            $stmt_link->execute([$last_forum_id, $tag_id]);
        }
    }

    // --- 3. 画像処理 ---
    $imageUploader = new ImageUploader('uploaded_images/');
    
    if (!empty($images['name'][0])) {
        $file_count = count($images['name']);
        for ($i = 0; $i < $file_count; $i++) {
            $tmp_name = $images['tmp_name'][$i];
            
            // アップロード時にエラーがなかったかチェック
            if ($images['error'][$i] === UPLOAD_ERR_OK) {
                $original_name = $images['name'][$i];
                
                // a. ファイルをサーバーのフォルダに保存し、パスを取得
                $saved_path = $imageUploader->save($tmp_name, $original_name);
                
                // b. forum_imagesテーブルに、そのパスを保存
                $stmt_img = $pdo->prepare("INSERT INTO forum_images (post_id, image_url, display_order) VALUES (?, ?, ?)");
                $stmt_img->execute([$last_forum_id, $saved_path, $i + 1]);
            }
        }
    }

    // --- 成功したら、メインページにリダイレクト ---
    $_SESSION['success_message'] = "投稿が完了しました。";
    header('Location: ../../main.php');
    exit;

} catch (Exception $e) {
    // 何らかのエラーが発生した場合
    $_SESSION['post_errors'] = ['general' => 'エラーが発生しました: ' . $e->getMessage()];
    $_SESSION['post_form_data'] = $_POST;
    header('Location: forum_input.php');
    exit;
}
?>