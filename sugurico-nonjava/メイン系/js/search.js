// search.js

'use strict';

document.addEventListener('DOMContentLoaded', async () => {

    const { data: { session } } = await supabaseClient.auth.getSession();
    const searchTitle = document.getElementById('search-title');
    const searchCount = document.getElementById('search-count');
    const postsListContainer = document.getElementById('posts-list-container');
    const paginationContainer = document.getElementById('pagination-container');
    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('keyword')?.trim() || '';
    const type = urlParams.get('type') || 'title';
    let currentPage = parseInt(urlParams.get('page')) || 1;

    if (!keyword) {
        searchTitle.textContent = 'すべての投稿';
    } else {
        searchTitle.textContent = `「${escapeHTML(keyword)}」の検索結果(${type})`;
    }

    try {
        const postsPerPage = 10;
        let totalPosts = 0;
        let posts = [];

        if (keyword && type === 'tag') {
            // --- ▼▼▼ タグ検索のロジック ▼▼▼ ---
            // ① キーワードに一致するタグを`tag_dic`から検索し、関連する投稿ID(`forum_id`)を取得
            const { data: tags, error: tagError } = await supabaseClient
                .from('tag_dic')
                .select('tag!inner(forum_id)')
                .like('tag_name', `%${keyword}%`);

            if (tagError) throw tagError;

            // ② 取得したデータから、重複を除いたforum_idの配列を作成
            const allForumIds = [...new Set(tags.flatMap(t => t.tag.map(item => item.forum_id)))];
            
            totalPosts = allForumIds.length;

            if (totalPosts > 0) {
                const offset = (currentPage - 1) * postsPerPage;
                const pagedForumIds = allForumIds.slice(offset, offset + postsPerPage);

                // ③ 抜き出したforum_idを使って、最終的に表示する投稿データを取得
                const { data, error } = await supabaseClient
                    .from('forums')
                    .select('*, users!forums_user_id_auth_fkey(user_name), forum_images(image_url)')
                    .in('forum_id', pagedForumIds)
                    .order('forum_id', { ascending: false });

                if (error) throw error;
                posts = data;
            }
        } else {
            // --- ▼▼▼ キーワードが空、またはタイトル/テキスト検索のロジック ▼▼▼ ---
            const column = (type === 'text') ? 'text' : 'title';
            const offset = (currentPage - 1) * postsPerPage;

            let countQuery = supabaseClient
                .from('forums')
                .select('*', { count: 'exact', head: true });

            let dataQuery = supabaseClient
                .from('forums')
                .select('*, users!forums_user_id_auth_fkey(user_name), forum_images(image_url)');

            if (keyword) {
                countQuery = countQuery.like(column, `%${keyword}%`);
                dataQuery = dataQuery.like(column, `%${keyword}%`);
            }
            
            const { count: totalCount, error: countError } = await countQuery;

            if (countError) throw countError;
            totalPosts = totalCount ?? 0;

            const { data, error } = await dataQuery
                .order('forum_id', { ascending: false })
                .range(offset, offset + postsPerPage - 1);

            if (error) throw error;
            posts = data;
        }

        searchCount.textContent = `${totalPosts}件の投稿が見つかりました。`;

        if (posts.length > 0) {
            postsListContainer.innerHTML = posts.map(post => renderPostHTML(post)).join('');
        } else {
            postsListContainer.innerHTML = '<p>該当する投稿は見つかりませんでした。</p>';
        }

        renderPagination(totalPosts, currentPage, postsPerPage, keyword, type);

    } catch (error) {
        console.error('検索エラー:', error);
        searchCount.textContent = '';
        postsListContainer.innerHTML = `<p>検索中にエラーが発生しました: ${escapeHTML(error.message)}</p>`;
    }

    // -----------------------------
    // ヘルパー関数 (変更なし)
    // -----------------------------

    function renderPostHTML(post) {
        // --- 1. サムネイルと各種時間情報の準備 (既存のロジック) ---
        let thumbnailHTML = '';
        if (post.forum_images && post.forum_images.length > 0) {
            thumbnailHTML = `<div class="post-item-thumbnail"><img src="${post.forum_images[0].image_url}" alt="投稿画像"></div>`;
        }
        const remainingTime = timeLeft(post.delete_date);
        const timeAgoString = timeAgo(post.created_at);

        // --- 2. 投稿のメインコンテンツ部分のHTMLを生成 ---
        const postContentHTML = `
            <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}" class="post-item-link">
                <div class="post-item-main ${thumbnailHTML ? 'has-thumbnail' : ''}">
                    ${thumbnailHTML}
                    <div class="post-item-content">
                        <h3>${escapeHTML(post.title)} <small style="color:gray;">${timeAgoString}</small> </h3>
                        <p>${nl2br(post.text.length > 20 ? post.text.slice(0, 20) + '...' : post.text)}</p>
                        <small>投稿者: ${escapeHTML(post.users.user_name)}</small>
                        <br>
                        <small style="color:gray;">${remainingTime}</small>
                    </div>
                </div>
            </a>
        `;

        // --- 3. ログインしていて、かつ自分の投稿の場合にのみ、編集・削除ボタンのHTMLを生成 ---
        let postActionsHTML = '';
        if (session && session.user.id === post.user_id_auth) {
            postActionsHTML = `
                <div class="post-item-actions">
                    <a href="../../投稿系/html/forum_input.html?edit_id=${post.forum_id}" class="action-button edit-button">編集</a>
                    <button type="button" class="action-button delete-button" data-post-id="${post.forum_id}">削除</button>
                </div>
            `;
        }

        // --- 4. 最終的なHTML構造を組み立てる ---
        return `
            <article class="post-item">
                ${postContentHTML}
                ${postActionsHTML}
            </article>
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

    function escapeHTML(str) {
        if (!str) return '';
        return str.toString().replace(/[&<>"']/g, m => ( {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m]);
    }

    function nl2br(str) {
        return escapeHTML(str).replace(/\r\n|\n\r|\r|\n/g, '<br>');
    }

    // --- 削除ボタンのイベントリスナー ---
    postsListContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-button')) {
            const postId = event.target.dataset.postId;
            await handleDeletePost(postId);
        }
    });

    /**
     * 投稿を削除し、UIを更新する関数
     */
    async function handleDeletePost(postId) {
        if (!confirm('この投稿を本当に削除しますか？')) {
            return;
        }
        try {
            const { error } = await supabaseClient.rpc('delete_forum_with_related_data', {
                forum_id_param: postId
            });
            if (error) throw error;
            
            alert('投稿を削除しました。');
            
            // 削除成功後、現在の検索結果を再読み込み
            // ★ location.reload() を使うのが最も簡単で確実
            location.reload();

        } catch (error) {
            console.error('削除エラー:', error);
            alert(`投稿の削除に失敗しました: ${error.message}`);
        }
    }

});

