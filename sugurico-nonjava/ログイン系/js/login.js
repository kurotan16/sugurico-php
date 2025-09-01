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