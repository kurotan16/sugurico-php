const loginButton = document.getElementById("loginButton");
const loginIdInput = document.getElementById("loginIdInput");
const passwordInput = document.getElementById("passwordInput");




async function loginExecute() {
    // 処理中はボタンを無効化
    loginButton.disabled = true;
    loginButton.textContent = 'ログイン中...';

    const loginId = loginIdInput.value;
    const password = passwordInput.value;

    if (!loginId || !password) {
        alert("ログインIDとパスワードを入力してください。");
        loginButton.disabled = false;
        loginButton.textContent = 'ログイン';
        return;
    }

    try {
        // ★★★ 呼び出し先を、ログイン専用APIに変更 ★★★
        const response = await fetch('../../base/login_api.php', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // ★★★ 送信するデータを、SQLではなくIDとパスワードだけにする ★★★
            body: JSON.stringify({ loginId, password })
        });

        const result = await response.json();

        if (result.success) {
            alert("認証しました");
            // ログイン成功後、トップページなどにリダイレクト
            window.location.href = '../../main.php'; // トップページのパスに合わせて要修正
        } else {
            // APIから返されたエラーメッセージを表示
            alert(result.error || "ログインに失敗しました。");
        }

    } catch (error) {
        alert("通信中にエラーが発生しました。");
        console.error('Login Error:', error);
    } finally {
        // ボタンの状態を元に戻す
        loginButton.disabled = false;
        loginButton.textContent = 'ログイン';
    }
}

loginButton.addEventListener("click", loginExecute);