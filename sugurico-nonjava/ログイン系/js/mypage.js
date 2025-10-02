// mypage.js

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- HTML要素の取得 ---
    const mypageTitle = document.getElementById('mypage-title');
    const postsListContainer = document.getElementById('my-posts-list');
    const paginationContainer = document.getElementById('pagination-container');

    // 詳細検索フォームの要素
    const toggleSearchButton = document.getElementById('toggle-search-button');
    const advancedSearchForm = document.getElementById('advanced-search-form');
    const filterButton = document.getElementById('filter-button');
    const keywordInput = document.getElementById('search-keyword');
    const periodSelect = document.getElementById('period-select');
    const sortSelect = document.getElementById('sort-select');
    const tagSelect = document.getElementById('tag-select');

    let currentUser;    //  ログインユーザー情報を保持する変数

    //  ページの初期化を行うメイン関数
    async function initializePage() {
        //  1. ログイン状態とユーザー情報を取得
        const  {data:{session}} = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'login.html'; // ログインページへリダイレクト
            return;
        }
        currentUser = session.user;

        const userName = currentUser.user_metadata?.user_name || 'あなた';
        mypageTitle.textContent = `${escapeHTML(userName)}の投稿一覧`;

        //  2. ユーザーが使用したタグを取得し、プルダウンを生成
        await populateUserTags();

        //  3. URLのパラメータを読み込んで、初期表示を行う
        const urlParams = new URLSearchParams(window.location.search);
        const page = parseInt(urlParams.get('page')) || 1;
        await fetchAndDisplayUserPosts(page);

        // --- 4. イベントリスナーを設定 ---
        setupEventListeners();
    }

    //  イベントリスナーをまとめて設定する関数
    function setupEventListeners() {
        // 詳細検索フォームの表示/非表示トグル
        toggleSearchButton.addEventListener('click', () => {
            const isHidden = advancedSearchForm.style.display === 'none';
            advancedSearchForm.style.display = isHidden ? 'block' : 'none';
            toggleSearchButton.textContent = isHidden ? '詳細検索を閉じる' : '詳細検索';
        });

        // 「絞り込み」ボタンのクリックイベント
        filterButton.addEventListener('click',  () => {
            fetchAndDisplayUserPosts(1); // 1ページ目から表示      
        });

        // 投稿リスト全体に対してイベントリスナーを設定 (イベント移譲)
        postsListContainer.addEventListener('click', async (event) => {
            // クリックされたのが削除ボタン(.delete-button)の場合のみ処理
            if (event.target.classList.contains('delete-button')) {
                const postId = event.target.dataset.postId; // data-post-id属性からIDを取得
                await handleDeletePost(postId);
            }
        });

        // 「プレミアム体験」ボタンのクリックイベント
        const premiumButton = document.getElementById('premium-button');
        premiumButton.addEventListener('click', async () => {
            if (!confirm('1日間、プレミアム機能を有効にしますか？')) {
                return;
            }

            try {
                // プレミアム期限を「今から24時間後」に設定
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 1);

                // Supabaseのusersテーブルを更新
                const { error } = await supabaseClient
                    .from('users')
                    .update({ premium_expires_at: expiryDate.toISOString() })
                    .eq('id', currentUser.id); // 必ず自分のIDを指定

                if (error) throw error;

                alert('プレミアム機能が有効になりました！\n期限は24時間後です。');
                // ボタンを無効化するなど、UIを更新しても良い
                premiumButton.disabled = true;
                premiumButton.textContent = 'プレミアム有効中';

            } catch (error) {
                console.error('プレミアム化エラー:', error);
                alert('エラーが発生し、プレミアム機能を有効にできませんでした。');
            }
        });
    }

    //  ユーザーの投稿を取得し、表示する関数
    async function populateUserTags() {
        try {
            //  SupabaseのRPCで、作成したDB関数 "get_user_tags" を呼び出す
            const {data: tags, error} = await supabaseClient.
                                        rpc(
                                            'get_user_tags', {
                                                user_id_param: currentUser.id   //  関数の引数に、ログイン中のユーザーIDを渡す
                                            }
                                        );

            if(error) throw error;

            //  <select>の中身を一度クリアし、「すべてのタグ」を先頭に追加
            tagSelect.innerHTML = '<option value="">すべてのタグ</option>'
            
            if (tags && tags.length > 0) {
                tags.forEach(tag => {
                    const option = document.createElement('option');
                    option.value = tag.tag_id;  //  valueにはIDを設定
                    option.textContent = tag.tag_name;  //  表示はタグ名
                    tagSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('ユーザーのタグリスト取得に失敗:',error);
            // エラー時でも最低限の選択肢を表示
            tagSelect.innerHTML = '<option value="">すべてのタグ</option>';
        }
    }

    //  絞り込み条件に基づいてユーザーの投稿を取得・表示するメイン関数
    async function fetchAndDisplayUserPosts(page = 1) {
        postsListContainer.innerHTML = '読み込み中...';
        paginationContainer.innerHTML = '';

        try {
            const postsPerPage = 10;
            const offset = (page - 1) * postsPerPage;

            // --- ▼▼▼ RPCをやめて、JSでクエリを組み立てる ▼▼▼ ---
            
            // 1. クエリのベースを作成
            let query = supabaseClient
                .from('forums')
                .select('*, users!forums_user_id_auth_fkey(user_name), forum_images(image_url)', { count: 'exact' });

            // 2. 常に自分の投稿だけに絞り込む
            query = query.eq('user_id_auth', currentUser.id);

            // 3. 詳細検索の条件を追加
            const keyword = keywordInput.value.trim();
            if (keyword) {
                // キーワードはタイトルと本文の両方を対象にする(OR検索)
                query = query.or(`title.like.%${keyword}%,text.like.%${keyword}%`);
            }

            const period = periodSelect.value;
            if (period !== 'all') {
                const date = new Date();
                if (period === '3days') date.setDate(date.getDate() - 3);
                if (period === '1week') date.setDate(date.getDate() - 7);
                if (period === '1month') date.setMonth(date.getMonth() - 1);
                query = query.gte('created_at', date.toISOString());
            }

            // (タグでの絞り込みは少し複雑なので、一度コメントアウト。必要なら後で追加)
            /*
            const tagId = tagSelect.value;
            if (tagId) {
                // ... タグ絞り込みのロジック ...
            }
            */

            // 4. 並び順と範囲を指定
            const sort = sortSelect.value;
            query = query.order('created_at', { ascending: (sort === 'asc') })
                         .range(offset, offset + postsPerPage - 1);

            // 5. クエリを実行
            const { data: posts, error, count: totalPosts } = await query;
            
            if (error) throw error;
            // --- ▲▲▲ クエリ組み立てはここまで ▲▲▲ ---

            if (posts && posts.length > 0) {
                // ★ renderPostHTMLは、main.jsやsearch.jsと同じものに統一する
                postsListContainer.innerHTML = posts.map(post => renderPostHTML(post)).join('');
            } else {
                postsListContainer.innerHTML = '<p>該当する投稿はありません。</p>';
            }
            renderPagination(totalPosts ?? 0, page, postsPerPage);
        } catch (error) {
            console.error('投稿の取得に失敗:', error);
            postsListContainer.innerHTML = `<p>投稿の取得中にエラーが発生しました。:${error.message}</p>`;
        }
    }

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
            postActionsHTML =`
                <div class="post-item-actions">
                    <a href="../../投稿系/html/forum_input.html?edit_id=${post.forum_id}" class="action-button edit-button">編集</a>
                    <button type="button" class="action-button delete-button" data-post-id="${post.forum_id}">削除</button>
                </div>
            `;

        // --- 4. 最終的なHTML構造を組み立てる ---
        return `
            <article class="post-item">
                ${postContentHTML}
                ${postActionsHTML}
            </article>
        `;
    }

    function renderPagination(totalItems, currentPage, itemsPerPage) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return; // ページネーション不要
        }

        let paginationHTML = '';

        const params = new URLSearchParams();
        if(keywordInput.value.trim() !== '') params.set('keyword', kewordInput.value.trim());
        if(periodSelect.value !== 'all') params.set('period', periodSelect.value);
        if(sortSelect.value !== 'newest') params.set('sort', sortSelect.value);
        if(tagSelect.value !== '') params.set('tag', tagSelect.value);

        if(currentPage > 1) {
            params.set('page', currentPage - 1);
            paginationHTML += `<a href="?${params.toString()}" class="pagination-button">前へ</a>`;
        }

        for(let i = 1; i <= totalPages; i++) {
            params.set('page', i);
            if(i === currentPage) {
                paginationHTML += `<span class="pagination-button current">${i}</span>`;
            } else {
                paginationHTML += `<a href="?${params.toString()}" class="pagination-button">${i}</a>`;
            }
        }

        if(currentPage < totalPages) {
            params.set('page', currentPage + 1);
            paginationHTML += `<a href="?${params.toString()}" class="pagination-button">次へ</a>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }
    /**
     * 投稿を削除し、UIを更新する関数
     * @param {number} postId - 削除する投稿のID
     */
    async function handleDeletePost(postId) {
        if (!confirm('この投稿を本当に削除しますか？')) {
            return;
        }

        try {
            // forum_detail.js と同じRPCを呼び出して安全に削除
            const { error } = await supabaseClient.rpc('delete_forum_with_related_data', {
                forum_id_param: postId
            });

            if (error) throw error;

            // 削除成功
            alert('投稿を削除しました。');
            
            // ★ページをリロードするのではなく、表示を更新する
            // 現在のページ番号を取得
            const urlParams = new URLSearchParams(window.location.search);
            const currentPage = parseInt(urlParams.get('page')) || 1;
            // 投稿リストを再読み込み
            await fetchAndDisplayUserPosts(currentPage);

        } catch (error) {
            console.error('削除エラー:', error);
            alert(`投稿の削除に失敗しました: ${error.message}`);
        }
    }

    initializePage();
});