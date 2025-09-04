// search.js

'use strict';

document.addEventListener('DOMContentLoaded', async () => {

    const searchTitle = document.getElementById('search-title');
    const searchCount = document.getElementById('search-count');
    const postsListContainer = document.getElementById('posts-list-container');
    const paginationContainer = document.getElementById('pagination-container');

    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('keyword') || '';
    const type = urlParams.get('type') || 'title';
    let currentPage = parseInt(urlParams.get('page')) || 1;

    /*if (!keyword.trim()) {
        searchTitle.textContent = '検索キーワードが入力されていません。';
        postsListContainer.innerHTML = '';
        return;
    }*/

    searchTitle.textContent = `「${escapeHTML(keyword)}」の検索結果(${type})`;

   try {
        const postsPerPage = 10;
        const visibilityFilter = 'delete_date.is.null,delete_date.gt.now()';

        let totalPosts = 0;
        let pagedForumIds = [];

        // --- 2. 検索タイプに応じて、表示すべき投稿IDのリストを取得 ---
        if (type === 'tag') {
            // 【タグ検索】
            // a. タグ名で、条件に合う "tag" テーブルの行を取得
            const { data: tagLinks, error: tagError } = await supabaseClient
                .from('tag')
                .select('forum_id, tag_dic!inner(tag_name)')
                .like('tag_dic.tag_name', `%${keyword}%`);

            if (tagError) throw tagError;
            console.log("タグ検索で取得したtagLinks:", tagLinks); // デバッグ用ログ
            
            const matchedForumIds = [...new Set(tagLinks.map(t => t.forum_id))];

            // b. 取得した投稿IDの中から、さらに公開期限が有効なものを絞り込む
            if (matchedForumIds.length > 0) {
                const { data: visibleForums, error: forumError } = await supabaseClient
                    .from('forums')
                    .select('forum_id')
                    .in('forum_id', matchedForumIds)
                    .or(visibilityFilter);
                
                if (forumError) throw forumError;
                console.log("公開期限が有効な投稿:", visibleForums); // デバッグ用ログ

                const finalForumIds = visibleForums.map(f => f.forum_id);
                totalPosts = finalForumIds.length;
                
                // c. ページネーションのためにIDを切り出す
                const offset = (currentPage - 1) * postsPerPage;
                pagedForumIds = finalForumIds.slice(offset, offset + postsPerPage);
            }

        } else {
            // 【タイトル or 本文検索】
            const column = (type === 'text') ? 'text' : 'title';
            // a. まず総件数を取得
            const { count, error: countError } = await supabaseClient
                .from('forums')
                .select('*', { count: 'exact', head: true })
                .like(column, `%${keyword}%`)
                .or(visibilityFilter);
            
            if (countError) throw countError;
            totalPosts = count ?? 0;
        }

        // --- 3. 投稿データを取得 ---
        let posts = [];
        if ((type === 'tag' && pagedForumIds.length > 0) || (type !== 'tag' && totalPosts > 0)) {
            let query = supabaseClient.from('forums').select('*, users(user_name),forum_images ( image_url ) ');

            if (type === 'tag') {
                query = query.in('forum_id', pagedForumIds);
            } else {
                const column = (type === 'text') ? 'text' : 'title';
                const offset = (currentPage - 1) * postsPerPage;
                query = query.like(column, `%${keyword}%`)
                             .or(visibilityFilter)
                             .range(offset, offset + postsPerPage - 1);
            }
            
            const { data, error } = await query.order('forum_id', { ascending: false });
            if (error) throw error;
            posts = data;
        }

        // --- 5. 検索結果を描画 ---
        
        if (posts.length > 0) {
            searchCount.textContent = `${totalPosts}件の投稿が見つかりました。`;
            postsListContainer.innerHTML = posts.map(post => renderPostHTML(post)).join('');
        } else {
            postsListContainer.innerHTML = '<p>該当する投稿は見つかりませんでした。</p>';
        }

        // --- 6. ページネーションを描画 ---
        renderPagination(totalPosts, currentPage, postsPerPage, keyword, type);

    } catch (error) {
        console.error('検索エラー:', error);
        searchCount.textContent = '';
        postsListContainer.innerHTML = `<p>検索中にエラーが発生しました: ${escapeHTML(error.message)}</p>`;
    }

    // -----------------------------
    // ヘルパー関数
    // -----------------------------

    function renderPostHTML(post) {
        let thumbnailHTML = '';
        if (post.forum_images && post.forum_images.length > 0) {
            thumbnailHTML = `<div class="post-item-thumbnail"><img src="${post.forum_images[0].image_url}" alt="投稿画像"></div>`;
        }
        const remainingTime = timeLeft(post.delete_date);
        const timeAgoString = timeAgo(post.created_at);

        return `
                    <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}" class="post-link">
                        <article class="post-item ${thumbnailHTML ? 'has-thumbnail' : ''}">
                            
                            <div class="post-item-content">
                            <h3>${escapeHTML(post.title)} <small style="color:gray;">${timeAgoString}</small> </h3>
                                <p>${escapeHTML(post.text).replace(/\n/g, '<br>')}</p>
                                <small>投稿者: ${escapeHTML(post.users.user_name)}</small>
                                <br>
                                <small style="color:gray;">${remainingTime}</small>
                            </div>
                            ${thumbnailHTML}
                        </article>
                    </a>
                `;
    }

    function renderPagination(totalItems, currentPage, itemsPerPage, keyword, type) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        const baseLink = `?keyword=${encodeURIComponent(keyword)}&type=${encodeURIComponent(type)}`;

        if (currentPage > 1) {
            paginationHTML += `<a href="${baseLink}&page=${currentPage - 1}">« 前へ</a>`;
            paginationHTML += ' ';
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `<span class="current-page">${i}</span>`;
            } else {
                paginationHTML += `<a href="${baseLink}&page=${i}">${i}</a>`;
            }
            paginationHTML += ' ';
        }

        if (currentPage < totalPages) {
            paginationHTML += ' ';
            paginationHTML += `<a href="${baseLink}&page=${currentPage + 1}">次へ »</a>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }


});
