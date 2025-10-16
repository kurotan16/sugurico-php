// login.js
'use strict';

// --- HTML要素の取得 ---
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const messageArea = document.getElementById('message-area');

// --- ページ読み込み時の処理 ---
document.addEventListener('DOMContentLoaded', () => {
    // URLに ?register_success=1 が付いていたら、登録完了メッセージを表示
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('register_success')) {
        messageArea.textContent = 'ユーザー登録が完了しました。';
        messageArea.className = 'message success';
        messageArea.style.display = 'block';
    }
});

// --- フォーム送信イベントのリスナー ---
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // デフォルトの送信をキャンセル
        
        messageArea.style.display = 'none'; // メッセージをクリア
        loginButton.disabled = true;
        loginButton.textContent = 'ログイン中...';

        // ここから新しいコード
        try {
            const loginIdentifier = emailInput.value; //入力された値を取得
            const password = passwordInput.value;
            let userEmail = '';

            // 1. 入力されたのがメールアドレスか、ログインIDかを判定
            if (loginIdentifier.includes('@')) {
                // '@'が含まれている場合、メールアドレスとみなす
                userEmail = loginIdentifier;
            } else {
                // @'がなければログインIDとみなし、DBから対応するメールアドレスを検索
                const {data: user, error: findError} = await supabaseClient
                    .from('users')
                    .select('mail')
                    .eq('login_id', loginIdentifier)
                    .single(); //該当するユーザーが複数いる可能性は低い

                if (findError || !user) {
                    // ログインIDが見つからなかった
                    throw new Error('ログインIDまたはパスワードが違います。');
                }
                userEmail = user.mail; //対応するメールアドレスを取得
            }

            // 2. 取得したメールアドレスでログインを試みる
            const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
                email: userEmail,
                password: password,
            });

            if (signInError) {
                throw new Error('ログインIDまたはパスワードが違います。');
            }

            // ログイン成功
            alert('ログインに成功しました！');
            window.location.href = '../../メイン系/html/index.html'; // パスは適宜調整してください

        } catch (error) {
            // ログイン失敗 (全てのエラーをここでキャッチ)
            messageArea.textContent = error.message;
            messageArea.className = 'message error';
            messageArea.style.display = 'block';
        } finally {
            // 3. ボタンの状態を元に戻す
            loginButton.disabled = false;
            loginButton.textContent = 'ログイン';
        }
    });
}
            
/*** --- 旧コード ---
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // デフォルトの送信をキャンセル
        
        messageArea.style.display = 'none'; // メッセージをクリア
        loginButton.disabled = true;
        loginButton.textContent = 'ログイン中...';

        // Supabase Auth を使ってログイン実行
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: emailInput.value,
            password: passwordInput.value,
        });

        if (error) {
            alert('ログインに失敗しました！');
            // ログイン失敗
            messageArea.textContent = 'メールアドレスまたはパスワードが違います。';
            messageArea.className = 'message error';
            messageArea.style.display = 'block';
        } else {
            // ログイン成功
            alert('ログインに成功しました！');
            // メインページに移動
            window.location.href = '../../メイン系/html/index.html'; // パスは適宜調整してください
        }
        
        // ボタンの状態を元に戻す
        loginButton.disabled = false;
        loginButton.textContent = 'ログイン';
    });
}
***/