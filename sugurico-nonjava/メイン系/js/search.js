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
    
    function timeAgo(utcDateString) {
        if (!utcDateString) return '';
        const postDate = new Date(utcDateString);
        const now = new Date;
        const diffInSeconds = Math.floor((now - postDate) / 1000);
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
    
    function timeLeft(utcDateString) {
        if (!utcDateString) {
            return '閲覧可能期限: 無期限';
        }
        
        const deadline = new Date(utcDateString);
        const now = new Date();

        if (deadline <= now) {
            return '';
        }
        
        let diffInMs = deadline - now + 9 * 60 *60 * 1000;
        
        const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        diffInMs -= days * (1000 * 60 * 60 *24);

        const hours = Math.floor(diffInMs / (1000 * 60 * 60));
        diffInMs -= hours * (1000 * 60 * 60);

        const minutes = Math.floor(diffInMs / (1000 * 60));
        
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
        return (result === '期限: あと ') ? '期限: あとわずか' : result.trim();
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
