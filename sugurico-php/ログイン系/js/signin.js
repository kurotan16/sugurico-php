'use strict';

// --- HTML要素の取得 ---
const nameInput = document.getElementById("nameInput");
const usernameInput = document.getElementById("usernameInput");
const loginIdInput = document.getElementById("loginIdInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const confirmInput = document.getElementById("confirmInput");
const passwordLog = document.getElementById("passwordLog");
const confirmLog = document.getElementById("confirmLog");
const submitButton = document.getElementById("submitButton");

// --- パスワードの正規表現 ---
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

/**
 * パスワード関連のバリデーションを実行する関数
 */
function passCheck() {
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    let isPasswordValid = true;

    // パスワード形式チェック (入力がある場合のみ)
    if (password && !regex.test(password)) {
        passwordLog.textContent = "パスワードは8文字以上で、大文字、小文字、数字を各1文字以上含めてください。";
        passwordLog.style.display = 'block';
        isPasswordValid = false;
    } else {
        passwordLog.style.display = 'none';
    }

    // 確認用パスワードの一致チェック (入力がある場合のみ)
    if (confirm && password !== confirm) {
        confirmLog.textContent = "パスワードが一致しません。";
        confirmLog.style.display = 'block';
        isPasswordValid = false;
    } else {
        confirmLog.style.display = 'none';
    }

    // ボタンの状態を更新 (パスワード部分だけ)
    // 他の項目が空でも、パスワードが正しければエラーは消える
    submitButton.disabled = !isPasswordValid;
}

/**
 * 登録ボタンがクリックされた時の処理 (非同期)
 */
async function signInExecute() {
    // --- 1. 未入力項目のチェック ---
    if (!nameInput.value || !usernameInput.value || !loginIdInput.value || !emailInput.value || !passwordInput.value) {
        alert("未入力の項目があります。");
        return; // 処理を中断
    }
    
    // --- 2. パスワードの最終チェック ---
    if (submitButton.disabled) {
        alert("パスワードの形式が正しくないか、確認用パスワードと一致していません。");
        return; // 処理を中断
    }
    
    // 処理中はボタンを無効化して連打を防ぐ
    submitButton.disabled = true;
    submitButton.textContent = '登録中...';

    try {
        // --- 3. loginIdとemailの重複をAPIで確認 ---
        const checkSql = "SELECT login_id, mail FROM users WHERE login_id = :login_id OR mail = :mail";
        const checkParams = {
            ":login_id": loginIdInput.value,
            ":mail": emailInput.value
        };
        const checkResult = await callApi(checkSql, checkParams);

        if (checkResult.data.length > 0) {
            // もし何かしらのデータが返ってきたら、重複がある
            const existingData = checkResult.data[0];
            if (existingData.login_id === loginIdInput.value) {
                alert("このログインIDは既に使用されています。");
            } else if (existingData.mail === emailInput.value) {
                alert("このメールアドレスは既に使用されています。");
            }
            // 処理を中断
            return;
        }

        // --- 4. 重複がなければ、INSERT文を実行 ---
        const insertSql = "INSERT INTO users (name, user_name, login_id, mail, password) VALUES (:name, :user_name, :login_id, :mail, :password)";
        
        // ★重要：パスワードはハッシュ化して保存する必要があります
        // ここでは仮に平文で保存しますが、本番ではPHP側でpassword_hash()を使うべきです。
        const insertParams = {
            ":name": nameInput.value,
            ":user_name": usernameInput.value,
            ":login_id": loginIdInput.value,
            ":mail": emailInput.value,
            ":password": passwordInput.value // 本番ではハッシュ化！
        };

        const insertResult = await callApi(insertSql, insertParams);

        if (insertResult.rows > 0) {
            alert("ユーザー登録が完了しました！");
            // ログインページなどにリダイレクト
            window.location.href = 'login.php'; 
        } else {
            throw new Error("ユーザー登録に失敗しました。");
        }

    } catch (error) {
        // API呼び出し自体に失敗した場合など
        alert(`エラーが発生しました: ${error.message}`);
    } finally {
        // 成功しても失敗しても、ボタンの状態を元に戻す
        submitButton.disabled = false;
        submitButton.textContent = '登録する';
    }
}


/**
 * 汎用API呼び出し関数
 * @param {string} sql - 実行するSQL文
 * @param {object} params - SQLにバインドするパラメータ
 * @returns {Promise<object>} - APIからのレスポンス結果
 */
async function callApi(sql, params = {}) {
    try {
        const response = await fetch('../../base/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql, params })
        });

        const result = await response.json();

        if (!response.ok || (result.success === false)) {
            throw new Error(result.error || 'API request failed');
        }

        return result;

    } catch (error) {
        console.error('API呼び出し中にエラー:', error);
        throw error; // エラーを呼び出し元に再スローする
    }
}

// --- イベントリスナーの設定 ---
passwordInput.addEventListener("input", passCheck);
confirmInput.addEventListener("input", passCheck);
submitButton.addEventListener("click", signInExecute);