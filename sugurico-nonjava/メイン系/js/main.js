// main.js
'use strict';


// --- ページ読み込み完了時のメイン処理 ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. ログイン状態をチェック ---
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        // 【ログインしている場合の処理】
        console.log("ログイン済み:", session.user);
        // 「あなたの投稿」セクションと、投稿ボタンを表示
        document.getElementById('my-posts-section').style.display = 'block';
        document.getElementById('new-post-button').style.display = 'flex'; // flexはfloating-buttonのCSSに合わせる

        // 自分の投稿を取得して表示
        fetchAndDisplayPosts('my-posts-list', session.user.id);
        // 皆さんの投稿（自分を除く）を取得して表示
        fetchAndDisplayPosts('all-posts-list', null, session.user.id);

    } else {
        // 【ログインしていない場合の処理】
        console.log("未ログイン");
        // 皆さんの投稿（すべて）を取得して表示
        fetchAndDisplayPosts('all-posts-list', null);
    }
});


/**
 * Supabaseから投稿を取得し、指定された場所に表示する関数
 * @param {string} containerId - 投稿を表示するHTML要素のID
 * @param {string|null} userId - 特定のユーザーID（指定しない場合はnull）
 * @param {string|null} excludeUserId - 除外するユーザーID（指定しない場合はnull）
 */
async function fetchAndDisplayPosts(containerId, userId = null, excludeUserId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        // SupabaseのDB APIを呼び出す
        let query = supabaseClient
            .from('forums')
            .select(`
                forum_id,
                created_at,
                title,
                text,
                delete_date,
                users ( user_name )
            `)
            .or('delete_date.is.null,delete_date.gt.now()') // 公開期限のチェック
            .order('forum_id', { ascending: false }) // 新しい順
            .limit(3);

        // 条件に応じてクエリを組み立て
        if (userId) {
            query = query.eq('user_id_auth', userId); // 自分の投稿
        }
        if (excludeUserId) {
            query = query.not('user_id_auth', 'eq', excludeUserId); // 自分以外の投稿
        }

        const { data: posts, error } = await query;
        
        if (error) throw error;

        // --- HTMLの組み立て ---
        if (posts.length > 0) {
            container.innerHTML = posts.map(post => {
                const timeAgoString = timeAgo(post.created_at);

                const remainingTime = timeLeft(post.delete_date);
                

                return `
                    <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}">
                        <article class="post-item">
                            <small style="color:gray;">${timeAgoString}</small>
                            <h3>${escapeHTML(post.title)}</h3>
                            <p>${escapeHTML(post.text).replace(/\n/g, '<br>')}</p>
                            <small>投稿者: ${escapeHTML(post.users.user_name)}</small>
                            <br>
                            <small style ='color:gray'>${remainingTime}</small>
                        </article>
                    </a>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>まだ投稿がありません。</p>';
        }

    } catch (error) {
        console.error('投稿の取得に失敗しました:', error);
        container.innerHTML = '<p>投稿の読み込み中にエラーが発生しました。</p>';
    }
}

/**
 * UTCの日時文字列を、日本の現在時刻からの相対時間文字列に変換する
 * 例: "3分前", "5時間前", "2日前"
 * @param {string} utcDateString - Supabaseから取得したUTCの日時文字列
 * @returns {string} - 相対時間文字列
 */
function timeAgo(utcDateString) {
    if (!utcDateString) return '';

    // Supabaseから受け取ったUTC時刻をDateオブジェクトに変換
    const postDate = new Date(utcDateString);
    // 現在の日本時刻を取得
    const now = new Date;

    // 差分を秒で計算
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    // 差分に応じて表示を切り替え
    const minutes = Math.floor(diffInSeconds / 60);
    if(minutes < 1) {
        return "たった今";
    }
    if (minutes < 60) {
        return `${minutes}分前`
    }

    const hours = Math.floor(minutes / 60);
    if(hours < 24) {
        return `${hours}時間前`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days}日前`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months}ヶ月前`
    }

    const years = Math.floor(months / 12);
    return `${years}年前`;
}

/**
 * UTCの日時文字列から、日本の現在時刻までの残り時間を計算して文字列を返す
 * 例: "期限: あと2日 10時間 5分"
 * @param {string | null} utcDateString - Supabaseから取得した期限のUTC日時文字列
 * @returns {string} - 残り時間の文字列
 */
function timeLeft(utcDateString) {
    // 期限が設定されていない（無期限の）場合は、その旨を返す
    if (!utcDateString) {
        return '閲覧可能期限: 無期限';
    }
    
    const deadline = new Date(utcDateString);
    const now = new Date();

    // 期限がすでに過ぎている場合は、表示しないか「期限切れ」と表示
    if (deadline <= now) {
        // ここでは何も表示しないようにする
        return '';
    }

    // --- 残り時間の計算 ---
    // 差分をミリ秒で取得
    let diffInMs = deadline - now;

    // ミリ秒を日、時間、分に変換
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    diffInMs -= days * (1000 * 60 * 60 *24);

    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    diffInMs -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(diffInMs / (1000 * 60));

    // --- 表示文字列の組み立て ---
    let result = '閲覧可能期限: あと';
    if (days > 0) {
        result += `${days}日`;
    }
    if (hours > 0) {
        result += `${hours}時間`;
    }
    if (minutes > 0) {
        result += `${minutes}分`;
    }

    // もし1分未満なら「あと少し」と表示
    if (result === '閲覧可能期限: あと') {
        result = '閲覧可能期限: あとわずか';
    }

    return result.trim();
}


/**
 * XSS対策のためのHTMLエスケープ関数
 */
function escapeHTML(str) {
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