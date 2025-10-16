// forum_detail.js
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    // header.jsで初期化済みのsupabaseクライアントをグローバルスコープから取得

    // --- HTML要素の取得 ---
    const postContainer = document.getElementById('post-detail-container');
    const commentFormContainer = document.getElementById('comment-form-container');
    const commentListContainer = document.getElementById('comment-list-container');

    // --- 1. URLから投稿IDを取得 ---
    const urlParams = new URLSearchParams(window.location.search);
    const forumId = parseInt(urlParams.get('id'));

    if (!forumId) {
        postContainer.innerHTML = '<h1>無効な投稿IDです。</h1>';
        return;
    }

    // --- 2. ログイン状態を取得 ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    const currentUser = session?.user;


    try {
        // --- 3. 投稿データを取得 ---
        const [
            postResponse,
            tagsResponse,
            imagesResponse,
            commentsResponse
        ] = await Promise.all([
            supabaseClient.from('forums').select('*,users!user_id_auth(user_name)').eq('forum_id', forumId).single(),
            supabaseClient.from('tag').select('tag_dic(tag_name)').eq('forum_id', forumId),
            supabaseClient.from('forum_images').select('image_url').eq('post_id', forumId).order('display_order'),
            supabaseClient.from('comments').select(`
                comment_id,
                comment_text,
                created_at,
                users!user_id_auth(user_name)
                `).eq('forum_id', forumId).order('created_at', { ascending: false })
        ]);
        console.log(postResponse.error);
        console.log(postResponse.data);
        if (postResponse.error || !postResponse.data) throw new Error('投稿が見つからないか、取得に失敗しました。');

        const post = postResponse.data;

        // --- 4. アクセス制御 ---
        const isOwner = currentUser && post.user_id_auth === currentUser.id;
        if (!isOwner && post.delete_date && new Date(post.delete_date) < new Date()) {
            throw new Error('この投稿の公開期限は終了しました。');
        }

        // --- 5. 取得したデータでページを描画 ---
        renderPost(
            post,
            tagsResponse.data || [],
            imagesResponse.data || []
        );
        renderComments(commentsResponse.data || []);

        if (currentUser) {
            renderCommentForm(isOwner);
        } else {
            commentFormContainer.innerHTML = `<p><a href="../../ログイン系/html/login.html">ログイン</a>してコメントを投稿する</p>`;
        }

    } catch (error) {
        postContainer.innerHTML = `<h1>エラー</h1><p>${error.message}</p>`;
        commentFormContainer.style.display = 'none';
        commentListContainer.style.display = 'none';
    }

    // --------------------------------------------------
    //  描画・イベント処理用のヘルパー関数
    // --------------------------------------------------

    /**
     * 投稿内容を描画する
     */

    function renderPost(post, tags, images) {
        const remainingTimeHTML = timeLeft(post.delete_date);
        const timeAgoHTML = timeAgo(post.created_at);

        // タグのHTMLを生成
        const tagsHTML = tags.map(tag => `<a href="../../メイン系/html/search.html?keyword=${encodeURIComponent(tag.tag_dic.tag_name)}&type=tag" class="tag-link">#${escapeHTML(tag.tag_dic.tag_name)}</a>`).join(' ');

        // 画像のHTMLを生成
        const imagesHTML = images.map(image =>
            `<div class="post-image-wrapper"><img src="${image.image_url}" alt="投稿画像" class="post-image"></div>`
        ).join('');

        let authorHTML = '';
        const authorName = escapeHTML(post.users?.user_name || '不明');
        if (currentUser && post.user_id_auth !== currentUser.id) {
            authorHTML = `<a href="user_posts.html?id=${post.user_id_auth}">${authorName}</a>`;
        } else {
            authorHTML = authorName;
        }

        // ★ isOwner 変数を関数の中から見えるように取得
        const isOwner = currentUser && post.user_id_auth === currentUser.id;

        // ★ 編集・削除ボタン用のHTMLを生成
        let ownerButtonsHTML = '';
        if (isOwner) {
            ownerButtonsHTML = `
                <div class="post-owner-actions">
                    <a href="forum_input.html?edit_id=${post.forum_id}" class="edit-button">編集</a>
                    <button type="button" id="delete-post-button" class="delete-button">削除</button>
                </div>
            `;
        }

        postContainer.innerHTML = `
            ${ownerButtonsHTML} <!-- ★ ここにボタンを追加 -->
            <h1>${escapeHTML(post.title)}</h1>
            <p class="post-meta">投稿者:${authorHTML} </p>
            <p class="post-meta">投稿日時: ${timeAgoHTML}</p>
            <div class="post-images-container">${imagesHTML}</div>
            <div class="post-content">${nl2br(post.text)}</div>
            <div class="post-tags">${tagsHTML}</div>
            ${remainingTimeHTML}
        `; 

        // 削除ボタンにイベントリスナーを設定
        if (isOwner) {
            document.getElementById('delete-post-button').addEventListener('click', () => {
                // 削除処理
                /**
                 * 投稿を削除する関数
                 * @param {number} forumId - 削除する投稿のID
                 */
                async function handleDeletePost(forumId) {
                    // ユーザーに最終確認
                    if (!confirm('この投稿を本当に削除しますか？\nこの操作は元に戻せません。')) {
                        return; // キャンセルされたら何もしない
                    }

                    try {
                        // ★ SupabaseのRPCで、削除用のデータベース関数を呼び出す
                        //    (この方が、関連データをまとめて削除できて安全)
                        const { error } = await supabaseClient.rpc('delete_forum_with_related_data', {
                            forum_id_param: forumId
                        });

                        if (error) {
                            // 削除中にDBエラーが発生した場合
                            throw error;
                        }

                        // 削除成功
                        alert('投稿を削除しました。');
                        window.location.href = '../../メイン系/html/index.html'; // ホームページにリダイレクト

                    } catch (error) {
                        console.error('削除エラー:', error);
                        alert(`投稿の削除に失敗しました: ${error.message}`);
                    }
                }
                handleDeletePost(post.forum_id);
            });
        }
    }

    /**
     * コメントフォームを描画し、イベントを設定する
     */

    function renderCommentForm() {

        commentFormContainer.innerHTML = `
            <form id="comment-form">
                <textarea name="comment_text" placeholder="コメントを入力..." required></textarea>
                <button type="submit">コメントを投稿する</button>
            </form>
        `;

        document.getElementById('comment-form').addEventListener('submit', handleCommentSubmit);

    }

    /**
     * コメント投稿処理             
     */

    async function handleCommentSubmit(event) {
        event.preventDefault();
        const commentText = event.target.querySelector('textarea').value.trim();
        if (!commentText) return;

        const { error } = await supabaseClient
            .from('comments')
            .insert({
                forum_id: forumId,
                user_id_auth: currentUser.id,// AuthのIDを紐付け
                comment_text: commentText
            })
        if (error) {
            alert('コメントの投稿に失敗しました:' + error.message);
        } else {
            // 投稿成功後、コメント欄をリフレッシュ
            event.target.querySelector('textarea').value = '';
            await fetchAndRenderComments();
        }
    }

    /**
     * コメント一覧を取得して描画する
     */
    async function fetchAndRenderComments() {
        const {
            data: comments, error
        } = await supabaseClient
            .from('comments')
            .select(`
        comment_id,
        comment_text,
        created_at,
        users ( user_name )
    `)
            .eq('forum_id', forumId)
            .order('created_at', { ascending: false });


        if (error) {
            commentListContainer.innerHTML = '<p>コメントの読み込みに失敗しました。</p>';
            return;
        }
        renderComments(comments);
    }

    /**
     * コメント一覧を描画する
     */

    function renderComments(comments) {
        console.log(comments);
        if (comments && comments.length > 0) {

            commentListContainer.innerHTML = comments.map(
                comment => {
                    const commentTimeAgo = timeAgo(comment.created_at);

                    return `
                        <div class="comment-item">
                            <strong>${escapeHTML(comment.users?.user_name || '不明')}:</strong>
                            <p>${nl2br(comment.comment_text)}</p>
                            <small>${commentTimeAgo}</small>
                        </div>
                    `;
                }
            ).join('');
        } else {
            commentListContainer.innerHTML = "<p>まだコメントはありません。</p>"
        }
    }
});


