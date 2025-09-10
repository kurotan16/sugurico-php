'use strict';

document.addEventListener('DOMContentLoaded', async () => {

// --- HTML要素の取得 ---
    const pageTitle = document.getElementById('page-title');
    const postsListContainer = document.getElementById('posts-list-container');
    const paginationContainer = document.getElementById('pagination-container');

    //  1. 表示対象のユーザーIDを、URLから取得
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('id');

    if(!targetUserId) {
        pageTitle.textContent = 'ユーザーIDが指定されていません';
        return;
    }

    //  2. ページネーションの準備
    const postsPerPage = 10;
    let currentPage = parseInt(urlParams.get('page')) || 1;
    if (currentPage < 1) currentPage = 1;

    try {
        //  3. 表示対象ユーザーのプロフィール情報(user_name)を取得
        const {data: targetUser, error:userError} = await supabaseClient
            .from('users')
            .select('user_name')
            .eq('id', targetUserId)
            .single();
        
        if (userError || !targetUser) throw new Error('ユーザー情報の取得に失敗しました');

        pageTitle.textContent = `${escapeHTML(targetUser.user_name)}さんの投稿一覧`;

        //  4. 表示対象ユーザーの投稿の総件数を取得 (公開期限を考慮)
        const { count: totalPosts, error: countError } = await supabaseClient
            .from('forums')
            .select('*', {count: 'exact', head: true})
            .eq('user_id_auth', targetUserId)
            .or('delete_date.is.null,delete_date.gt.now()');

        if (countError) throw countError;

        //  5. 現在のページに表示する投稿を取得
        const offset = (currentPage - 1) * postsPerPage;
        const {data: posts, error: postsError} = await supabaseClient
            .from('forums')
            .select('forum_id, title, text, delete_date')
            .eq('user_id_auth', targetUserId)
            .or('delete_date.is.null,delete_date.gt.now()')
            .order('forum_id', {ascending: false})
            .range(offset, offset + postsPerPage - 1);
        if (postsError) throw postsError;

        //  6. 投稿リストの表示
        if(posts.length > 0){
        postsListContainer.innerHTML = posts.map(post =>`
            <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}">
                <article class="post-item">
                    <h3>${escapeHTML(post.title)}</h3>
                    <p>${escapeHTML(post.text).replace(/\n/g, '<br>')}</p>
                </article>
            </a>
        `).join('');
    } else {
        postsListContainer.innerHTML = `<p>まだ投稿がありません。</p>`;
    }
    //  7. ページネーションのリンクを表示
    renderPagination(totalPosts ?? 0, currentPage, postsPerPage, targetUserId);

    } catch (error) {
        pageTitle.textContent = 'エラー';
        postsListContainer.innerHTML = `<p>データの取得中にエラーが発生しました: ${error.message}</p>`;
    }
});

function renderPagination(totalItems, currentPage, itemsPerPage, targetUserId) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    let paginationHTML = '';
    const baseLink = `?id=${targetUserId}`

    if (currentPage > 1) {
        paginationHTML += `<a href="${baseLink}&page=${currentPage - 1}">« 前へ</a>`;
    }
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<span class="current-page">${i}</span>`;
        } else {
            paginationHTML += `<a href="${baseLink}&page=${i}">${i}</a>`;
        }
    }
    if (currentPage < totalPages) {
        paginationHTML += `<a href="${baseLink}&page=${currentPage + 1}">次へ »</a>`;
    }
    paginationContainer.innerHTML = paginationHTML;
}
