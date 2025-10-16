// post_form.js
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
<<<<<<< HEAD
=======
    // header.jsで初期化済みのsupabaseクライアントをグローバルスコープから取得
>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d

    // --- HTML要素の取得 ---
    const postForm = document.getElementById('post-form');
    const titleInput = document.getElementById('titleInput');
    const textInput = document.getElementById('textInput');
    const expireSelect = document.getElementById('expireSelect');
    const imageInputContainer = document.getElementById('image-input-container'); // 画像入力欄の親要素
    const submitButton = document.getElementById('submitButton');
    const messageArea = document.getElementById('message-area');

    // --- ログインチェック ---
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = '../../ログイン系/html/login.html';
        return;
    }

<<<<<<< HEAD
    // --- 1. 編集モードか新規投稿モードかを判断 ---
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit_id');

    if (editId) {
        // --- 【編集モードの初期化処理】 ---
        document.querySelector('h1').textContent = '記録を編集';
        submitButton.textContent = '更新する';
        await loadPostForEditing(editId, user.id);
    }

    // --- 2. フォーム送信イベントリスナー (ページに1つだけ) ---
=======
    // --- フォーム送信イベント ---
>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
    postForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = editId ? '更新中...' : '投稿中...';
        messageArea.style.display = 'none';

        try {
<<<<<<< HEAD
            if (editId) {
                // 【更新処理】を実行
                await handleUpdatePost(editId);
            } else {
                // 【新規投稿処理】を実行
                await handleNewPost(user);
            }
            
            alert(editId ? '更新が完了しました。' : '投稿が完了しました。');
            window.location.href = editId 
                ? `forum_detail.html?id=${editId}` 
                : '../../メイン系/html/index.html';

=======
            // --- 1. 画像をSupabase Storageにアップロード ---
            // ★ コンテナの中から、すべてのファイル入力欄を取得
            const imageInputs = imageInputContainer.querySelectorAll('.image-input');
            const filesToUpload = [];
            imageInputs.forEach(input => {
                if (input.files[0]) {
                    filesToUpload.push(input.files[0]);
                }
            });
            // ★ 収集したファイルのリストをアップロード関数に渡す
            const imageUrls = await uploadImages(filesToUpload);

            // --- 2. 投稿本体(forumsテーブル)をDBに保存 ---
            const { data: savedForum,
                error: forumError
            } = await supabaseClient.from('forums').insert({
                user_id_auth: user.id,
                title: titleInput.value,
                text: textInput.value,
                delete_date: calculateDeleteDate(expireSelect.value)
            }).select() // INSERTしたデータを返すようにする
                .single();
            if (forumError) throw error;

            // --- 3. タグをDBに保存 ---
            const tagInputs = document.querySelectorAll('#tag-container input.tag-input');
            const tagValues = Array.from(tagInputs).map(input => input.value.trim()).filter(Boolean);

            // 配列から重複したタグを自動的に除去
            const tags = [...new Set(tagValues)];

            if (tags.length > 0) {
                await saveTags(savedForum.forum_id, tags);

            }

            // --- 4. 画像URLをDBに保存 ---
            if (imageUrls.length > 0) {
                await saveImageUrls(savedForum.forum_id, imageUrls);
            }

            // --- 成功 ---
            alert('投稿が完了しました。');
            window.location.href = '../../メイン系/html/index.html';
>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
        } catch (error) {
            messageArea.textContent = '処理に失敗しました: ' + error.message;
            messageArea.className = 'message error';
            messageArea.style.display = 'block';
            console.error('Post Error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = editId ? '更新する' : '投稿する';
        }
    });

    // =================================================================
    //  関数定義セクション
    // =================================================================

    /**
     * 【新規投稿】を行う関数
     */
    async function handleNewPost(user) {
        // 1. 画像をアップロード
        const imageUrls = await uploadAllImages(user.id);

<<<<<<< HEAD
        // 2. 投稿本体をDBに保存
        const { data: savedForum, error: forumError } = await supabaseClient.from('forums').insert({
            user_id_auth: user.id,
            title: titleInput.value,
            text: textInput.value,
            delete_date: calculateDeleteDate(expireSelect.value)
        }).select().single();
        if (forumError) throw forumError;
        
        // 3. タグをDBに保存
        const tags = getTagsFromForm();
        if (tags.length > 0) {
            await saveTags(savedForum.forum_id, tags);
        }

        // 4. 画像URLをDBに保存
        if (imageUrls.length > 0) {
            await saveImageUrls(savedForum.forum_id, imageUrls);
        }
    }

    /**
     * 【更新処理】を行う関数
     * @param {number} forumId - 更新する投稿のID
     */
    async function handleUpdatePost(forumId) {
        // --- 1. まず、投稿本体（タイトル、本文など）を更新 ---
        const { error: forumUpdateError } = await supabaseClient
            .from('forums')
            .update({
                title: titleInput.value,
                text: textInput.value,
                delete_date: calculateDeleteDate(expireSelect.value)
            })
            .eq('forum_id', forumId);

        if (forumUpdateError) throw forumUpdateError;

        // --- 2. タグの更新 ---
        const { error: tagDeleteError } = await supabaseClient
            .from('tag')
            .delete()
            .eq('forum_id', forumId);
        if (tagDeleteError) throw tagDeleteError;
        
        const tags = getTagsFromForm();
        if (tags.length > 0) {
            await saveTags(forumId, tags);
        }

        // --- 3. 画像の更新 ---
        const imageInputs = document.querySelectorAll('#image-input-hidden-container .image-input');
        const filesToUpload = [];
        imageInputs.forEach(input => { if (input.files[0]) filesToUpload.push(input.files[0]); });

        if (filesToUpload.length > 0) {
            const { error: storageError } = await supabaseClient.rpc('delete_post_images', { forum_id_param: forumId });
            if (storageError) throw storageError;

            const { error: imageDbError } = await supabaseClient
                .from('forum_images')
                .delete()
                .eq('post_id', forumId);
            if (imageDbError) throw imageDbError;

            const newImageUrls = await uploadImages(filesToUpload, user.id);

            if (newImageUrls.length > 0) {
                await saveImageUrls(forumId, newImageUrls);
            }
        }
    }

    /**
     * 【編集用】既存の投稿データを読み込んでフォームにセットする関数
     */
    async function loadPostForEditing(forumId, currentUserId) {
        try {
            const { data: post, error } = await supabaseClient
                .from('forums')
                .select(`*, tag(tag_dic(tag_name)), forum_images(image_url)`)
                .eq('forum_id', forumId)
                .single();
            if (error) throw error;
            if (post.user_id_auth !== currentUserId) throw new Error('この投稿を編集する権限がありません。');

            titleInput.value = post.title;
            textInput.value = post.text;

            if (post.tag && post.tag.length > 0) {
                const tagContainer = document.getElementById('tag-container');
                const firstTagInput = tagContainer.querySelector('.tag-input');
                const existingWrappers = tagContainer.querySelectorAll('.tag-input-wrapper');
                existingWrappers.forEach((w, i) => { if (i > 0) w.remove(); });
                firstTagInput.value = '';

                post.tag.forEach((tagItem, index) => {
                    if (index === 0) firstTagInput.value = tagItem.tag_dic.tag_name;
                    else addTagInputWithValue(tagItem.tag_dic.tag_name);
                });
            }
        } catch (error) {
            messageArea.textContent = '投稿データの読み込みに失敗しました: ' + error.message;
            messageArea.className = 'message error';
            messageArea.style.display = 'block';
            submitButton.disabled = true;
        }
    }

    // --- ヘルパー関数群 ---

    /**
     * フォームからすべての画像ファイルを取得し、アップロードする
     */
    async function uploadAllImages(userId) {
        const imageInputs = document.querySelectorAll('#image-input-hidden-container .image-input');
        const filesToUpload = [];
        imageInputs.forEach(input => { if (input.files[0]) filesToUpload.push(input.files[0]); });
        return await uploadImages(filesToUpload, userId);
    }
    
    /**
     * フォームからタグの配列を取得し、重複を排除する
     */
    function getTagsFromForm() {
        const tagInputs = document.querySelectorAll('#tag-container input.tag-input');
        const tagValues = Array.from(tagInputs).map(input => input.value.trim()).filter(Boolean);
        return [...new Set(tagValues)];
    }

    /**
     * 画像ファイルをSupabase Storageにアップロードするコア関数
     */
    async function uploadImages(files, userId) {
        if (!files || files.length === 0) return [];
        const uploadPromises = files.map(file => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;
            return supabaseClient.storage.from('post-images').upload(fileName, file);
        });
        const results = await Promise.all(uploadPromises);
        const uploadedUrls = [];
        for (const result of results) {
            if (result.error) throw new Error('画像アップロードに失敗: ' + result.error.message);
=======
    async function uploadImages(files) {
        const uploadedUrls = [];
        if (!files || files.length === 0) return uploadedUrls;

        // ★ forEachではなく、Promise.allで並列アップロードすると高速
        const uploadPromises = Array.from(files).map(file => {
            const fileExt = file.name.split('.').pop();
            const randomName = crypto.randomUUID();
            const fileName = `${user.id}/${randomName}.${fileExt}`;

            return supabaseClient
                .storage
                .from('post-images')
                .upload(fileName, file);
        });

        // すべてのアップロードが完了するのを待つ
        const results = await Promise.all(uploadPromises);

        // 成功したものの公開URLを取得
        for (const result of results) {
            if (result.error) {
                // 1つでも失敗したらエラーを投げる
                throw new Error('画像アップロードに失敗:' + result.error.message);
            }
>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
            const { data: { publicUrl } } = supabaseClient.storage.from('post-images').getPublicUrl(result.data.path);
            uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
    }

    /**
<<<<<<< HEAD
     * タグ情報をDBに保存する関数
     */
    async function saveTags(forumId, tagNames) {
        // (この関数の中身は変更なし)
        const { data: existingTags, error: selectError } = await supabaseClient.from('tag_dic').select('tag_id, tag_name').in('tag_name', tagNames);
        if (selectError) throw selectError;
        const existingTagsMap = new Map(existingTags.map(tag => [tag.tag_name, tag.tag_id]));
        const newTagNames = tagNames.filter(name => !existingTagsMap.has(name));
        if (newTagNames.length > 0) {
            const { data: insertedTags, error: insertError } = await supabaseClient.from('tag_dic').insert(newTagNames.map(name => ({ tag_name: name }))).select('tag_id, tag_name');
=======
         * タグ情報をDBに保存する関数
         * @param {number} forumId - 紐付ける投稿のID
         * @param {string[]} tagNames - タグ名の文字列の配列
         */
    async function saveTags(forumId, tagNames) {
        // --- 1. まず、既存のタグをDBからまとめて取得 ---
        const {
            data: existingTags,
            error: selectError
        } = await supabaseClient
            .from('tag_dic')
            .select('tag_id, tag_name')
            .in('tag_name', tagNames);// 配列内のいずれかの名前に一致するものを検索

        if (selectError) throw selectError;

        // 検索しやすいように、{"tagName": tagId} の形式のマップに変換
        const existingTagsMap = new Map(
            existingTags.map(
                tag => [
                    tag.tag_name,
                    tag.tag_id
                ]
            )
        );

        // --- 2. 存在しないタグを特定し、DBに新規登録 ---
        const newTagNames = tagNames.filter(name =>
            !existingTagsMap.has(name)
        );

        let newTagIds = [];
        if (newTagNames.length > 0) {
            const newTagsToInsert = newTagNames.map(name => ({
                tag_name: name
            }));

            const {
                data: insertedTags,
                error: insertError
            } = await supabaseClient.from('tag_dic')
                .insert(newTagsToInsert)
                .select('tag_id, tag_name');
>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
            if (insertError) throw insertError;
            insertedTags.forEach(tag => existingTagsMap.set(tag.tag_name, tag.tag_id));
        }
        const tagIdsToLink = tagNames.map(name => existingTagsMap.get(name));
<<<<<<< HEAD
        const linksToInsert = tagIdsToLink.map(tagId => ({ forum_id: forumId, tag_id: tagId }));
        const { error: linkError } = await supabaseClient.from('tag').insert(linksToInsert);
        if (linkError) throw linkError;
=======

        // 中間テーブルにINSERTするためのデータを作成
        const linksToInsert = tagIdsToLink.map(tagId => ({
            forum_id: forumId,
            tag_id: tagId
        }));
        const { error: linkError } = await supabaseClient
            .from('tag')// ★中間テーブル名
            .insert(linksToInsert);

        if (linkError) throw linkError;


>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
    }

    /**
     * 画像URLをDBに保存する関数
     */
    async function saveImageUrls(forumId, urls) {
<<<<<<< HEAD
        const imageData = urls.map((url, index) => ({ post_id: forumId, image_url: url, display_order: index + 1 }));
        const { error } = await supabaseClient.from('forum_images').insert(imageData);
        if (error) throw error;
=======
        const imageData = urls.map(
            (url, index) => ({
                post_id: forumId,
                image_url: url,
                display_order: index + 1
            }));
        const { error } = await supabaseClient.from('forum_images').insert(imageData);
        if (error) throw error;

>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
    }

    /**
     * 公開期限の日時を計算する関数
     */
    function calculateDeleteDate(expiresOption) {
<<<<<<< HEAD
        // (この関数の中身は変更なし)
        if (expiresOption === 'permanent') return null;
=======
        if (expiresOption === 'permanent') return null;

>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
        const date = new Date();
        if (expiresOption === 'private') return date.toISOString(); // privateの場合もISO文字列を返すのが望ましい
        const days = parseInt(expiresOption.replace('days', ''));
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }
});

// --- グローバルスコープのヘルパー関数 ---
function addTagInputWithValue(value) {
    const tagContainer = document.getElementById('tag-container');
    const wrapper = document.createElement('div');
    wrapper.className = 'tag-input-wrapper';
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'tags[]';
    newInput.className = 'tag-input';
    newInput.value = value;
    wrapper.appendChild(newInput);
    const buttonContainer = document.getElementById('insert-tags').parentElement;
    tagContainer.insertBefore(wrapper, buttonContainer);
    // showButtons(); // tag_form_supabase.js に依存するため、ここでは呼び出さない方が安全
}