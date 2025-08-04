// header.js

'use strict';

// --- Supabaseクライアントの初期化 ---
// ★ この初期化コードは、複数のJSファイルで共通して使うので、
// ★ 本来は一つの共通ファイルにまとめるのがベストです。
const SUPABASE_URL = 'https://ahyayuewvlbgrpkuxhvp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoeWF5dWV3dmxiZ3Jwa3V4aHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NzQxNDgsImV4cCI6MjA2OTI1MDE0OH0.C3VoRGUdUxOIjUoAR4Hx2OLGpBy_5B0KSuuOqOu-arQ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/**
 * ページのヘッダーを動的に生成・表示する関数
 */
async function setupHeader() {
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');
    if (!headerContainer) return;

    // --- ログイン状態を取得 ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    console.log("現在のセッション情報:", session);
    let headerHTML = '';

    if (session) {
        // 【ログインしている場合のヘッダー】
        const userName = session.user.user_metadata.user_name|| 'ユーザー';
        console.log(userName);
        headerHTML = `
            <h1><a href="../../メイン系/html/main.html">スグリコ</a></h1>
            <nav>
                <a href="../../ログイン系/html/mypage.html">${escapeHTML(userName)}さん</a>
                <a href="#" id="logout-button">ログアウト</a>
            </nav>
        `;
    } else {
        // 【ログインしていない場合のヘッダー】
        headerHTML = `
            <h1><a href="../../メイン系/html/main.html">スグリコ</a></h1>
            <nav>
                <a href="../../ログイン系/html/login.html">ログイン</a>
                <a href="../../ログイン系/html/signin.html">新規登録</a>
            </nav>
        `;
    }

    headerHTML += `
    <div class="search-form-container">
        <form action="../../メイン系/html/search.html" method="get">
            <input type="text" name="keyword" placeholder="キーワードで検索...">
            <select name="type" id="content">
                <option value="title">タイトル</option>
                <option value="text">テキスト</option>
                <option value="tag">タグ</option>
            </select>
            <button type="submit">検索</button>
        </form>
    </div>
    `;

    // 生成したHTMLをヘッダーコンテナに挿入
    headerContainer.innerHTML = headerHTML;

    footerContainer.innerHTML = `<p>© 2025 スグリコ. All Rights Reserved.</p>`;

    // もしログアウトボタンが存在すれば、イベントリスナーを設定
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('Logout Error:', error);
            } else {
                // ログアウト成功後、ログインページに移動
                window.location.href = '../../メイン系/html/main.html';
            }
        });
    }
}

/**
 * XSS対策のためのHTMLエスケープ関数
 */
function escapeHTML(str) {
    // もしstrがnullやundefinedなら、空文字列を返す
    if (str === null || str === undefined) {
        return '';
    }
    // 文字列でなければ、文字列に変換する
    if (typeof str !== 'string') {
        str = String(str);
    }

    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": "'"
        }[match];
    });
}

// --- 関数の実行 ---
setupHeader();