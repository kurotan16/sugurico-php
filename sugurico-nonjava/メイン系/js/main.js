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
                // 残り時間の計算（PHPのロジックをJSに移植）
                let remainingTime = '<small style="color:gray;">閲覧可能期間: 無期限</small>';
                if (post.delete_date) {
                    const now = new Date();
                    const deleteDate = new Date(post.delete_date);
                    if (now < deleteDate) {
                        // 簡単な残り時間表示（より正確な計算も可能）
                        remainingTime = `<small style="color:gray;">閲覧可能期間: ${deleteDate.toLocaleString()}まで</small>`;
                    }
                }
                

                return `
                    <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}">
                        <article class="post-item">
                            <h3>${escapeHTML(post.title)}</h3>
                            <p>${escapeHTML(post.text).replace(/\n/g, '<br>')}</p>
                            <small>投稿者: ${escapeHTML(post.users.user_name)}</small>
                            <br>
                            ${remainingTime}
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
 * XSS対策のためのHTMLエスケープ関数
 */
/*function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '''
        }[match];
    });
}*/