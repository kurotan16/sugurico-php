<?php
// ImageUploader.php

class ImageUploader
{
    private $uploadDir;

    /**
     * コンストラクタ
     * @param string $directory 保存先のディレクトリパス
     */
    public function __construct($directory = 'uploads/')
    {
        // 保存先ディレクトリを決定 (このファイルからの相対パス)
        // __DIR__ は、このファイル(ImageUploader.php)があるディレクトリを指す
        $this->uploadDir = __DIR__ . '/' . $directory;

        // ★★★ 保存用フォルダがなければ、自動で作成する ★★★
        if (!is_dir($this->uploadDir)) {
            // mkdirの第3引数をtrueにすると、再帰的にフォルダを作成してくれる
            if (!mkdir($this->uploadDir, 0777, true)) {
                throw new Exception("アップロード用ディレクトリの作成に失敗しました。");
            }
        }
    }

    /**
     * アップロードされたファイルを指定のディレクトリに保存する
     * @param string $tmpFilePath PHPが生成した一時ファイルのパス
     * @param string $originalFileName 元のファイル名
     * @return string 保存後のファイルへのパス (Webからアクセスできるパス)
     */
    public function save($tmpFilePath, $originalFileName)
    {
        // ファイル名が重複しないように、ユニークな名前を生成
        $extension = pathinfo($originalFileName, PATHINFO_EXTENSION);
        $newFileName = uniqid() . bin2hex(random_bytes(8)) . '.' . $extension;
        
        // 保存先の完全なパス
        $destination = $this->uploadDir . $newFileName;

        // 一時ファイルを、目的の場所に移動させる
        if (!move_uploaded_file($tmpFilePath, $destination)) {
            throw new Exception("ファイルの保存に失敗しました。");
        }

        // データベースに保存し、HTMLのimgタグで使えるパスを返す
        // (例: 'uploads/xxxxxxxx.jpg')
        return basename($this->uploadDir) . '/' . $newFileName;
    }
}
?>