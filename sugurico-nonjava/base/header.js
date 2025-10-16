// header.js

'use strict';

// --- Supabaseクライアントの初期化 ---
// ★ この初期化コードは、複数のJSファイルで共通して使うので、
// ★ 本来は一つの共通ファイルにまとめるのがベストです。
const SUPABASE_URL = 'https://ahyayuewvlbgrpkuxhvp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoeWF5dWV3dmxiZ3Jwa3V4aHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NzQxNDgsImV4cCI6MjA2OTI1MDE0OH0.C3VoRGUdUxOIjUoAR4Hx2OLGpBy_5B0KSuuOqOu-arQ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/**
 * ページのヘッダー フッターを動的に生成・表示する関数
 */
async function setupHeaderAndFooter() {
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');

    if (!headerContainer || !footerContainer) {
        console.warn('header-containerまたはfooter-containerが見つかりません。');
        return;
    }

    // --- ログイン状態を取得 ---
    const { data: { session } } = await supabaseClient.auth.getSession();

    let navHTML = '';// ナビゲーション部分のHTML

    if (session && session.user) {
        // 【ログインしている場合のナビゲーション】
        const userName = session.user.user_metadata?.user_name || 'ゲスト';
        navHTML = `
            <a href="../../ログイン系/html/mypage.html">${escapeHTML(userName)}さん</a>
            <a href="#" id="logout-button">ログアウト</a>
        `;

    } else {
        // 【ログインしていない場合のナビゲーション】
        navHTML = `
            <a href="../../ログイン系/html/login.html">ログイン</a>
            <a href="../../ログイン系/html/signin.html">新規登録</a>
        `;
    }

    const headerHTML = `
        <div class="header-logo">
            <h1><a href="../../メイン系/html/index.html">スグリコ</a></h1>
        </div>

        <div class="search-form-container">
            <form action="../../メイン系/html/search.html" method="get">
                <input type="text" name="keyword" placeholder="キーワード検索...">
                <select name="type">
                    <option value="title">タイトル</option>
                    <option value="text">テキスト</option>
                    <option value="tag">タグ</option>
                </select>
                <button type="submit">検索</button>
            </form>
        </div>

        <nav class="header-nav">
            ${navHTML}
        </nav>
    `;

    // 生成したHTMLをヘッダーコンテナに挿入
    headerContainer.innerHTML = headerHTML;

    // フッターのHTMLを設定
    footerContainer.innerHTML = `<p>&copy; 2025 スグリコ. All Rights Reserved.</p>`;

    // --- ログアウトボタンのイベントリスナー設定 ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('ログアウトエラー:', error.message);
                alert('ログアウトに失敗しました。');
            } else {
                window.location.href = '../..//メイン系/html/index.html';
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

    return str.replace(/[&<>"']/g, function (match) {
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
setupHeaderAndFooter();
