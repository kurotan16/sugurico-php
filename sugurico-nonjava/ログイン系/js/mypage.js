'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    // --- HTML要素の取得 ---
    const mypageTitle = document.getElementById('mypage-title');
    const postListContainer = document.getElementById('my-posts-list');
    const paginationContainer = document.getElementById('pagination-container');

    // --- 1. ログイン状態とユーザー情報を取得 ---
    const{data:{session}} = await supabaseClient.auth.getSession();
    if(!session) {
        // ログインしていなければ、ログインページにリダイレクト 
        window.location.href = 'login.html';
        return;
    }
    const currentUser = session.user;
    const userName = currentUser.user_metadata?.user_name || 'あなた';
    mypageTitle.textContent = `${escapeHTML(userName)}さんの投稿一覧`;

    // --- 2. ページネーションの準備 ---
    const postPerPage = 10;
    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get('page')) || 1;
    if (currentPage < 1) currentPage = 1;

    // --- 3. 自分の投稿の総件数を取得 ---
    const {
        count: totalPosts,
        error: countError
    } = await supabaseClient
    .from('forums')
    .select('*', {count: 'exact', head: 'true'})
    .eq('user_id_auth', currentUser.id);

    if(countError){
        console.log('投稿数の取得に失敗:', countError);
        postListContainer.innerHTML = '<p>エラーが発生しました。</p>';
        return;
    }

    // --- 4. 現在のページに表示する投稿を取得 ---
    const offset = (currentPage - 1) * postPerPage;
    const{
        data: posts,
        error: postsError
    } = await supabaseClient.from('forums')
    .select('forum_id, title, text')
    .eq('user_id_auth', currentUser.id)
    .order('forum_id', {ascending: false})
    .range(offset, offset + postPerPage - 1);

    if(postsError) {
        console.error('投稿の取得に失敗:', postsError);
        postListContainer.innerHTML = "<p>エラーが発生しました。</p>";
        return;
    }

    // --- 5. 取得した投稿をHTMLに描画 ---
    if(posts.length > 0){
        postListContainer.innerHTML = posts.map(post =>`
            <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}">
                <article class="post-item">
                    <h3>${escapeHTML(post.title)}</h3>
                    <p>${escapeHTML(post.text).replace(/\n/g, '<br>')}</p>
                </article>
            </a>
        `).join('');
    } else {
        postListContainer.innerHTML = `<p>まだ投稿がありません。</p>`;
    }

     // --- 6. ページネーションのリンクを描画 ---
     const totalPages = Math.ceil(totalPosts/ postPerPage);
     if(totalPages > 1){
        let paginationHTML = '';
        if(currentPage > 1){
            paginationHTML += `<a href="?page=${currentPage - 1}">« 前へ</a>`;
        }
        for(let i = 1; i <= totalPages; i ++){
            if(i === currentPage) {
                paginationHTML += `<span class="current-page">${i}</span>`;
            } else {
                paginationHTML += `<a href="?page=${i}">${i}</a>`;
            }
        }
        if(currentPage < totalPages){
            paginationHTML += `<a href="?page=${currentPage + 1}">次へ »</a>`;
        }
        paginationContainer.innerHTML = paginationHTML;
     }
});

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