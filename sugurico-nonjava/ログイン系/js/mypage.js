// mypage.js

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
        const  {data:{session}} = await supabase.auth.getSession();
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
        const keyword = urlParams.get('keyword') || '';
        const period = urlParams.get('period') || 'all';
        const sort = urlParams.get('sort') || 'newest';
        const tag = urlParams.get('tag') || '';
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
    }

    //  ユーザーの投稿を取得し、表示する関数
    async function populateUserTags() {
        //  (タグ取得用のDB関数 "get_user_tags" が必要)
    }

    //  絞り込み条件に基づいてユーザーの投稿を取得・表示するメイン関数
    async function fetchAndDisplayUserPosts(page = 1) {
        postsListContainer.innerHTML = '読み込み中...';
        paginationContainer.innerHTML = '';

        try {
            const postsPerPage = 10; // 1ページあたりの投稿数

            //  クエリの組み立て
            let query = supabaseClient
                        .from('forums')
                        .select('*, users!inner(user_name)',{ count: 'exact' })
            // 自分の投稿に限定
            query = query.eq('user_id_auth', currentUser.id);
            
            // キーワード絞り込み
            if(keywordInput.value.trim() !== '') {
                query = query.or(`title.like.%${keywordInput.value}%,text.like.%${keywordInput.value}%`);
            }

            //  期間フィルター
            if(periodSelect.value !== 'all') {
                const date = new Date();
                if(periodSelect.value === '3days') date.setDate(date.getDate() - 3);
                if(periodSelect.value === '1week') date.setDate(date.getDate() - 7);
                if(periodSelect.value === '1month') date.setMonth(date.getMonth() - 1);
                //  if(periodSelect.value === '3months') date.setMonth(date.getMonth() - 3);
                query = query.gte('created_at', date.toISOString());
            }

            //  タグフィルター
            if(tagSelect.value !== '') {
                // (タグ絞り込み用のJOINロジックが必要)
            }

            //  ソート順
            const sortOrder = sortSelect.value === 'asc';
            query = query.order('created_at', { ascending: sortOrder });

            //  ページネーション
            const offset = (page - 1) * postsPerPage;
            const {data: posts, count: totalPosts, error} = await query.range(offset, offset + postPerPage - 1);

            if (error) throw error;

            //  投稿の表示
            if (posts.length === 0) {
                postsListContainer.innerHTML = '<p>投稿が見つかりません。</p>';
            } else {
                postsListContainer.innerHTML = posts.map(post =>renderPostHTML(post)).join('');
            }

            renderPagination(totalPosts ?? 0, page, postsPerPage);
        } catch (error) {
            console.error('投稿の取得に失敗:', error);
            postsListContainer.innerHTML = `<p>投稿の取得中にエラーが発生しました。:${error.message}</p>`;
        }
    }

    function renderPostHTML(post) {
        return `
            <a href="../../投稿系/html/forum_detail.html?id=${post.forum_id}">
                <article class="post-item">
                    <h3>${escapeHTML(post.title)}</h3>
                    <p>${nl2br(post.text)}</p>
                </article>
            </a>
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
    initializePage();
});