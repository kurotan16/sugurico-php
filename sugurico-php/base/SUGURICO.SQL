-- [sugurico]データベースがあれば削除
DROP DATABASE IF EXISTS sugurico;
-- [sugurico]データベースを作成、文字コードはUTF-8
CREATE DATABASE sugurico DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- ユーザー[owner]があれば削除する
DROP USER IF EXISTS 'owner'@'localhost';

-- ユーザーを作成、ユーザー名は[owner]、パスワードは[password]
CREATE USER 'owner'@'localhost' IDENTIFIED BY 'password';
-- 権限を付与する:[owner]ユーザーは[sugurico]データベースにアクセス出来る
GRANT ALL ON sugurico.* TO 'owner'@'localhost';
-- 以降の処理は[sugurico]データベースを使用する
USE sugurico;

-- ユーザーテーブル:ユーザーID,名前,ユーザー名,ログインID,メールアドレス,パスワード,登録日,更新日,プレミアムフラグ,退会フラグ
CREATE TABLE users (
	user_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	user_name VARCHAR(50) NOT NULL,
	login_id VARCHAR(50) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	date_create TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	date_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	premium_flag TINYINT(1) NOT NULL DEFAULT 0,
	withdrawal_flag TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- 投稿テーブル:投稿ID,ユーザーID,タイトル,本文,閲覧数,消去期限(日),消去フラグ
CREATE TABLE forums (
	forum_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT NOT NULL,
	title VARCHAR(30) NOT NULL,
	text VARCHAR(140),
	view_count INT NOT NULL DEFAULT 0,
	delete_date TIMESTAMP NULL,
	delete_flag TINYINT(1) NOT NULL DEFAULT 0,
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 画像テーブル:画像ID,-投稿ID,画像URL,表示順
CREATE TABLE forum_images (
	image_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	post_id BIGINT NOT NULL,
	image_url VARCHAR(255),
	display_order INT NOT NULL, 
	FOREIGN KEY (post_id) REFERENCES forums(forum_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- タグ辞書:タグID,タグ名, 登録日
CREATE TABLE tag_dic (

	tag_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	tag_name VARCHAR(50) UNIQUE,
	created_at TIMESTAMP NULL
) ENGINE=InnoDB;

-- タグ紐付けテーブル:投稿ID,タグID
CREATE TABLE tag (

	forum_id BIGINT NOT NULL,
	tag_id BIGINT NOT NULL,
	PRIMARY KEY (forum_id, tag_id),
	FOREIGN KEY (forum_id) REFERENCES forums(forum_id) ON DELETE CASCADE,
	FOREIGN KEY (tag_id) REFERENCES tag_dic(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- コメントテーブル:コメントID,ユーザーID,投稿ID,コメント,削除フラグ,作成日時
CREATE TABLE comments (

	comment_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
	user_id BIGINT NOT NULL,
	forum_id BIGINT NOT NULL,
	comment_text VARCHAR(140),
	delete_flag TINYINT(1) NOT NULL DEFAULT 0,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
	FOREIGN KEY (forum_id) REFERENCES forums(forum_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 閲覧履歴:ユーザーID,投稿ID,最初の閲覧日時,最後の閲覧日時,閲覧回数
CREATE TABLE history (

	user_id BIGINT NOT NULL,
	forum_id BIGINT NOT NULL,
	first_view_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_view_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	view_count INT NOT NULL DEFAULT 1,
	PRIMARY KEY (user_id, forum_id),
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
	FOREIGN KEY (forum_id) REFERENCES forums(forum_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- プレミアム会員:プレミアム契約ID,ユーザーID,プラン,契約ステータス,最初の入金日,リミット,更新日時
CREATE TABLE premium (

	premium_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT NOT NULL UNIQUE,
    plan VARCHAR(20) NOT NULL,
	status VARCHAR(20) NOT NULL,
	first_paid TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	limit_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ミュート関係:ミュートしたユーザーID,ミュートされたユーザーID,作成日時
CREATE TABLE mutes (

	muting_user_id BIGINT NOT NULL,
	muted_user_id BIGINT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (muting_user_id, muted_user_id),
	FOREIGN KEY (muting_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
	FOREIGN KEY (muted_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ブックマーク:ユーザーID,投稿ID,作成日時
CREATE TABLE bookmark (

	user_id BIGINT NOT NULL,
	post_id BIGINT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, post_id),
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
	FOREIGN KEY (post_id) REFERENCES forums(forum_id) ON DELETE CASCADE
) ENGINE=InnoDB;