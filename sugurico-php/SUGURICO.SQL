-- [sugurico]データベースがあれば削除
DROP DATABASE IF EXISTS sugurico;
-- [sugurico]データベースを作成、文字コードはUTF-8
CREATE DATABASE sugurico DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
-- ユーザー[owner]があれば削除する
DROP USER IF EXISTS 'owner'@'localhost';

-- ユーザーを作成、ユーザー名は[owner]、パスワードは[password]
CREATE USER 'owner'@'localhost' IDENTIFIED BY 'password';
-- 権限を付与する:[owner]ユーザーは[sugurico]データベースにアクセス出来る
GRANT ALL ON sugurico.* TO 'owner'@'localhost';
-- 以降の処理は[sugurico]データベースを使用する
USE sugurico;

-- ユーザーテーブル
CREATE TABLE users (
	user_id BIGSERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	user_name VARCHAR(50) NOT NULL,
	login_id VARCHAR(50) NOT NULL UNIQUE,
	mail VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	date_create TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	date_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	premium_flag BOOLEAN NOT NULL DEFAULT false,
	withdrawal_flag BOOLEAN NOT NULL DEFAULT false
);

-- 投稿テーブル
CREATE TABLE forums (
	forum_id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(user_id),
	title VARCHAR(30) NOT NULL,
	text VARCHAR(140),
	view_count INTEGER NOT NULL DEFAULT 0,
	delete_date TIMESTAMP,
	delete_flag BOOLEAN NOT NULL DEFAULT false
);

-- 画像テーブル
CREATE TABLE forum_images (
	image_id BIGSERIAL PRIMARY KEY,
	post_id BIGINT NOT NULL REFERENCES forums(forum_id),
	image_url VARCHAR(255),
	display_order INTEGER NOT NULL
);

-- タグ辞書
CREATE TABLE tag_dic (
	tag_id BIGSERIAL PRIMARY KEY,
	tag_name VARCHAR(50),
	created_at TIMESTAMP
);

-- タグ紐付けテーブル
CREATE TABLE tag (
	forum_id BIGINT NOT NULL REFERENCES forums(forum_id),
	tag_id BIGINT NOT NULL REFERENCES tag_dic(tag_id),
	PRIMARY KEY (forum_id, tag_id)
);

-- コメントテーブル
CREATE TABLE comments (
	comment_id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(user_id),
	forum_id BIGINT NOT NULL REFERENCES forums(forum_id),
	comment_text VARCHAR(140),
	delete_flag BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 閲覧履歴
CREATE TABLE history (
	user_id BIGINT NOT NULL REFERENCES users(user_id),
	forum_id BIGINT NOT NULL REFERENCES forums(forum_id),
	first_view_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_view_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	view_count INTEGER NOT NULL DEFAULT 1,
	PRIMARY KEY (user_id, forum_id)
);

-- プレミアム会員
CREATE TABLE premium (
	premium_id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id),
	plan VARCHAR(20),
	status VARCHAR(20),
	first_paid TIMESTAMP NOT NULL,
	limit_date TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ミュート関係
CREATE TABLE mutes (
	muting_user_id BIGINT NOT NULL REFERENCES users(user_id),
	muted_user_id BIGINT NOT NULL REFERENCES users(user_id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (muting_user_id, muted_user_id)
);

-- ブックマーク
CREATE TABLE bookmark (
	user_id BIGINT NOT NULL REFERENCES users(user_id),
	post_id BIGINT NOT NULL REFERENCES forums(forum_id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, post_id)
);
