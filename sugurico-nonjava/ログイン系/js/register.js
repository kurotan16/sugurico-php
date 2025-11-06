// signin.js

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- HTML要素の取得 ---
    const signinForm = document.getElementById('signin-form');
    const nameInput = document.getElementById('nameInput');
    const usernameInput = document.getElementById('usernameInput');
    const loginIdInput = document.getElementById('loginIdInput');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const submitButton = document.getElementById('submitButton');
    const messageArea = document.getElementById('message-area');

    // --- フォーム送信イベントのリスナー ---
    if (signinForm) {
        signinForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            messageArea.style.display = 'none';
            submitButton.disabled = true;
            submitButton.textContent = '登録中...';

            // --- Supabase Auth を使ってユーザー登録 ---
            const { data, error } = await supabaseClient.auth.signUp({
                email: emailInput.value,
                password: passwordInput.value,
                options: {
                    data: {
                        name: nameInput.value,
                        user_name: usernameInput.value,
                        login_id: loginIdInput.value
                    }
                }
            });
            console.log("Supabase signUp 結果:", { data, error });
            if (error) {
                // 登録失敗（メールアドレス重複など）
                messageArea.textContent = 'このメールアドレスは既に使用されているか、入力内容に誤りがあります。';
                messageArea.className = 'message error';
                messageArea.style.display = 'block';
                console.error('Signup Error:', error);

                submitButton.disabled = false;
                submitButton.textContent = '登録する';
            } else {
                // 登録成功後、DBのusersテーブルにも情報を保存
                console.log("Supabase signUp 結果:", { data, error });
                await addUserProfile(data.user);
            }
        });
    }

    /**
     * 登録成功後、DBのusersテーブルにプロフィール情報を追加する関数
     * @param {object} user - Supabase Authから返されたユーザーオブジェクト
     */
    async function addUserProfile(user) {
        try {
            // SupabaseのDB APIを使って、usersテーブルにINSERT
            const { error } = await supabaseClient
                .from('users') // ★ Supabase上のテーブル名
                .insert({
                    id: user.id, // AuthのIDを紐付ける
                    name: nameInput.value,
                    user_name: usernameInput.value,
                    login_id: loginIdInput.value,
                    mail: emailInput.value
                });

            if (error) throw error;

            // すべて成功
            alert('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
            window.location.href = 'login.html?register_success=1';

        } catch (dbError) {
            // login_idの重複エラーなどはここでキャッチ
            if (dbError.message.includes('duplicate key value violates unique constraint "users_login_id_key"')) {
                messageArea.textContent = 'このログインIDは既に使用されています。';
            } else {
                messageArea.textContent = 'データベースへのプロフィール登録に失敗しました。';
            }
            messageArea.className = 'message error';
            messageArea.style.display = 'block';
            console.error('DB Insert Error:', dbError);

            // 失敗したらボタンの状態を元に戻す
            submitButton.disabled = false;
            submitButton.textContent = '登録する';
        }
    }
});