// search.js

'use strict';

document.addEventListener('DOMContentLoaded', async () => {

    const searchTitle = document.getElementById('search-title');
    const searchCount = document.getElementById('search-count');
    const postsListContainer = document.getElementById('posts-list-container');
    const paginationContainer = document.getElementById('pagination-container');

    const urlParams = new URLSearchParams(window.location.search);
    // ▼▼▼ .trim() を使って、前後の空白を除去したキーワードを取得します ▼▼▼
    const keyword = urlParams.get('keyword')?.trim() || '';
    const type = urlParams.get('type') || 'title';
    let currentPage = parseInt(urlParams.get('page')) || 1;

    // ▼▼▼ キーワードの有無で、ページのタイトル表示を切り替えます ▼▼▼
    if (!keyword) {
        searchTitle.textContent = 'すべての投稿';
    } else {
        searchTitle.textContent = `「${escapeHTML(keyword)}」の検索結果(${type})`;
    }

    try {
        const postsPerPage = 10;
        let query;

        const visibilityFilter = 'delete_date.is.null,delete_date.gt.now()';

        if(type === 'tag') {
            const {data:forumIdsData, error: forumIdsError} = await supabaseClient
            .from('tag')
            .select('forums!inner(forum_id, delete_date)')
            .like('tag_dic, tag_name', `%${keyword}%`)
            .or(visibilityFilter, {referencedTable: 'forums'});

            if (forumIdsError) throw forumIdsError;
            const ids = forumIdsData.map(f => f.forums.forum_id);

            query = (ids.length > 0) ?
                supabaseClient.from('forums').select(`*,users ( user_name )`).in('forum_id', ids)
                :null;
        } else {
            const column = (type === 'title') ? 'title' : 'text';
            query = supabaseClient.from('forums')
                .select(`*,users ( user_name )`)
                .like(column, `%${keyword}%`)
                .or(visibilityFilter);
        }

        let totalPosts = 0;
        let posts = [];

        // ▼▼▼ キーワードがあり、かつタグ検索の場合のみ、特別な処理をします ▼▼▼
        if (keyword && type === 'tag') {
            // ①タグ名にマッチするforum_idを取得 (既存のロジック)
            const { data: forumTags, error: forumTagError } = await supabaseClient
                .from('tag')
                .select('forum_id, tag_dic!inner(tag_name)')
                .like('tag_dic.tag_name', `%${keyword}%`);

            if (forumTagError) throw forumTagError;

            const allForumIds = [...new Set(forumTags.map(f => f.forum_id))];
            totalPosts = allForumIds.length;

            if (totalPosts > 0) {
                const offset = (currentPage - 1) * postsPerPage;
                const pagedForumIds = allForumIds.slice(offset, offset + postsPerPage);

                const { data, error } = await supabaseClient
                    .from('forums')
                    .select('*, users(user_name), forum_images(image_url)')
                    .in('forum_id', pagedForumIds)
                    .order('forum_id', { ascending: false });

                if (error) throw error;
                posts = data;
            }
        } else {
            // ② キーワードが空、またはタイトル/テキスト検索の場合の処理
            const column = (type === 'text') ? 'text' : 'title';
            const offset = (currentPage - 1) * postsPerPage;

            // 件数を取得するためのクエリを準備
            let countQuery = supabaseClient
                .from('forums')
                .select('*', { count: 'exact', head: true });

            // データを取得するためのクエリを準備
            let dataQuery = supabaseClient
                .from('forums')
                .select('*, users(user_name), forum_images(image_url)')

            // もしキーワードが存在すれば、両方のクエリに.like()で検索条件を追加
            if (keyword) {
                countQuery = countQuery.like(column, `%${keyword}%`);
                dataQuery = dataQuery.like(column, `%${keyword}%`);
            }

            // 件数取得
            const { count: totalCount, error: countError } = await countQuery
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;
            totalPosts = totalCount ?? 0;

            // データ取得
            const { data, error } = await dataQuery
                .select('*, users(user_name), forum_images(image_url)')
                .order('forum_id', { ascending: false })
                .range(offset, offset + postsPerPage - 1);

            if (error) throw error;

            console.log("Supabaseから取得した検索結果データ:", data); // デバッグ用ログ
            posts = data;
            totalPosts = data.length ?? 0;
        }
        



        if (posts.length > 0) {
            searchCount.textContent = `${totalPosts}件の投稿が見つかりました。`;
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
        // 1. 画像サムネイルのHTMLを準備
        let thumbnailHTML = '';
        // もし画像があり、その配列が空でなければ
        if (post.forum_images && post.forum_images.length > 0) {
            // 1枚目の画像のURLを使ってimgタグを生成
            thumbnailHTML = `<div class="post-item-thumbnail"><img src="${post.forum_images[0].image_url}" alt="投稿画像"></div>`;
        }
        
        // 2. 閲覧期限のHTMLを準備 (ここは既存のロジックと同じ)
        let remainingTimeHTML = '';
        if (post.delete_date && new Date(post.delete_date) > new Date()) {
            remainingTimeHTML = `<small class="post-meta">閲覧期限: ${new Date(post.delete_date).toLocaleString()}</small>`;
        } else if (!post.delete_date) {
            remainingTimeHTML = '<small class="post-meta">閲覧可能期間: 無期限</small>';
        }

        // 3. 最終的なHTMLを組み立てる
        return `
            <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}" class="post-link">
                <article class="post-item ${thumbnailHTML ? 'has-thumbnail' : ''}">
                    ${thumbnailHTML}
                    <div class="post-item-content">
                        <h3>${escapeHTML(post.title)}</h3>
                        <p>${nl2br(post.text)}</p>
                        <small class="post-meta">投稿者: ${escapeHTML(post.users?.user_name || '不明')}</small>
                        <br>
                        ${remainingTimeHTML}
                    </div>
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

});

/*** 旧コード
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

    if (!keyword.trim()) {
        searchTitle.textContent = '検索キーワードが入力されていません。';
        postsListContainer.innerHTML = '';
        return;
    }

    searchTitle.textContent = `「${escapeHTML(keyword)}」の検索結果(${type})`;

    try {
        const postsPerPage = 10;
        let totalPosts = 0;
        let posts = [];

        if (type === 'tag') {
            // ①タグ名にマッチするforum_idを取得
            const { data: forumTags, error: forumTagError } = await supabaseClient
                .from('tag')
                .select('forum_id, tag_dic!inner(tag_name)')
                .like('tag_dic.tag_name', `%${keyword}%`);

            if (forumTagError) throw forumTagError;

            // forum_id配列（重複を除く）
            const allForumIds = [...new Set(forumTags.map(f => f.forum_id))];
            totalPosts = allForumIds.length;

            if (totalPosts > 0) {
                const offset = (currentPage - 1) * postsPerPage;
                const pagedForumIds = allForumIds.slice(offset, offset + postsPerPage);

                const { data, error } = await supabaseClient
                    .from('forums')
                    .select('*, users(user_name)')
                    .in('forum_id', pagedForumIds)
                    .order('forum_id', { ascending: false });

                if (error) throw error;
                posts = data;
            }
        } else {
            // ② title または text 検索の既存処理
            const column = (type === 'text') ? 'text' : 'title';
            const offset = (currentPage - 1) * postsPerPage;

            // 件数取得
            const { count: totalCount, error: countError } = await supabaseClient
                .from('forums')
                .select('*', { count: 'exact', head: true })
                .like(column, `%${keyword}%`);

            if (countError) throw countError;
            totalPosts = totalCount ?? 0;

            // データ取得
            const { data, error } = await supabaseClient
                .from('forums')
                .select('*, users(user_name)')
                .like(column, `%${keyword}%`)
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
    // ヘルパー関数
    // -----------------------------

    function renderPostHTML(post) {
        let remainingTimeHTML = '';
        if (post.delete_date && new Date(post.delete_date) > new Date()) {
            remainingTimeHTML = `<small class="post-meta">閲覧期限: ${new Date(post.delete_date).toLocaleString()}</small>`;
        } else if (!post.delete_date) {
            remainingTimeHTML = '<small class="post-meta">閲覧可能期間: 無期限</small>';
        }

        return `
            <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}" class="post-link">
                <article class="post-item">
                    <h3>${escapeHTML(post.title)}</h3>
                    <p>${nl2br(post.text)}</p>
                    <small class="post-meta">投稿者: ${escapeHTML(post.users?.user_name || '不明')}</small>
                    <br>
                    ${remainingTimeHTML}
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

});
***/