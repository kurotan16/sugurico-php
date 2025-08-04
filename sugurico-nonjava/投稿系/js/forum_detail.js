'use strict';

document.addEventListener('DOMContentLoaded', async () =>{
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
    const {data: {session}} = await supabaseClient.auth.getSession();
    const currentUser = session?.user;

    try {
        // --- 3. 投稿データを取得 ---
        const[
            postResponse, 
            tagsResponse, 
            imagesResponse, 
            commentsResponse
        ] = await Promise.all([
            supabaseClient.from('forums').select('*,users(user_name)').eq('forum_id',forumId).single(),
            supabaseClient.from('tag').select('tag_dic(tag_name)').eq('forum_id',forumId),
            supabaseClient.from('forum_images').select('image_url').eq('post_id',forumId).order('display_order'),
            supabaseClient.from('comments').select(`
        comment_id,
        comment_text,
        created_at,
        users ( user_name )
    `).eq('forum_id',forumId).order('created_at',{ascending: false})
        ]);
        if (postResponse.error || !postResponse.data) throw new Error('投稿が見つからないか、取得に失敗しました。');
        
        const post = postResponse.data;

        // --- 4. アクセス制御 ---
        const isOwner = currentUser && post.user_id_auth === currentUser.id;
        if(!isOwner && post.delete_date && new Date(post.delete_date) < new Date()){
            throw new Error ('この投稿の公開期限は終了しました。');
        } 

        // --- 5. 取得したデータでページを描画 ---
        renderPost(
            post, 
            tagsResponse.data || [],
            imagesResponse.data || []
        );
        renderComments(commentsResponse.data ||[]);

        if(currentUser){
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
        // 残り時間の計算
        let remainingTimeHTML = '<small class="post-meta">閲覧可能期間: 無期限</small>';
        if(post.delete_date) {
            const deleteDate = new Date(post.delete_date);
            if (new Date() < deleteDate) {
                // (簡易的な残り時間表示)
                remainingTimeHTML = `<small class="post-meta">閲覧期限: ${deleteDate.toLocaleString()}</small>`;
            }
        }
        // タグのHTMLを生成
        const tagsHTML = tags.map(tag =>`<a href="../../search.html?keyword=${encodeURIComponent(tag.tag_dic.tag_name)}&type=tag" class="tag-link">#${escapeHTML(tag.tag_dic.tag_name)}</a>`).join(' ');

        // 画像のHTMLを生成
        const imagesHTML = images.map(image =>
            `<div class="post-image-wrapper"><img src="${image.image_url}" alt="投稿画像" class="post-image"></div>`
        ).join('');

        postContainer.innerHTML = `
            <h1>${escapeHTML(post.title)}</h1>
            <p class="post-meta">投稿者: ${escapeHTML(post.users.user_name)}</p>
            <div class="post-images-container">${imagesHTML}</div>
            <div class="post-content">${nl2br(escapeHTML(post.text))}</div>
            <div class="post-tags">${tagsHTML}</div>
            ${remainingTimeHTML}
        `; 
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
        if(!commentText) return;

        const{ error } = await supabaseClient
                                .from('comments')
                                .insert({
                                    forum_id:forumId,
                                    user_id_auth: currentUser.id,// AuthのIDを紐付け
                                    comment_text: commentText
                                })
        if (error){
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
            data: comments,error
        } = await supabaseClient
                    .from('comments')
                    .select(`
        comment_id,
        comment_text,
        created_at,
        users ( user_name )
    `)
                    .eq('forum_id', forumId)
                    .order('created_at', {ascending:false});


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
        if(comments && comments.length > 0){
            commentListContainer.innerHTML = comments.map(
                comment =>`
                <div class="comment-item">
                    <strong>${escapeHTML(comment.users.user_name)}:</strong>
                    <p>${nl2br(escapeHTML(comment.comment_text))}</p>
                    <small>${new Date(comment.created_at).toLocaleString()}</small>
                </div>
            `
            ).join('');
        } else {
            commentListContainer.innerHTML = "<p>まだコメントはありません。</p>"
        }
    }
    /**
    * XSS対策のためのHTMLエスケープ関数
    */
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, match => 
            ({
                '&': '&',
                '<': '<',
                '>': '>',
                '"': '"',
                // ★★★ ここを修正 ★★★
                // "'": "'" // シングルクォートをHTMLエンティティに変換
            })[match]
        );
    }

    /**
     * 改行文字を<br>タグに変換する関数（XSS対策済み）
     * @param {any} str - 変換する文字列
     * @returns {string} - <br>タグを含む安全なHTML文字列
     */
    function nl2br(str) {
        // まず、HTMLとして危険な文字をすべてエスケープする
        const escapedStr = escapeHTML(str);
        // その後で、安全になった文字列の改行を<br>に変換する
        return escapedStr.replace(/\r\n|\n\r|\r|\n/g, '<br>');
    }

});


