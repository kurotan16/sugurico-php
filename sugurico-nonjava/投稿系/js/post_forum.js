// post_forum.js
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    // header.jsで初期化済みのsupabaseクライアントをグローバルスコープから取得

    // --- HTML要素の取得 ---
    const pageTitle = document.querySelector('.form-container h1');// ★ h1タグを直接取得
    const postForm = document.getElementById('post-form');
    const titleInput = document.getElementById('titleInput');
    const textInput = document.getElementById('textInput');
    const expireSelect = document.getElementById('expireSelect');
    // ★ IDではなく、クラスを持つ "すべて" の画像入力欄を対象にするコンテナを取得
    const imageInputContainer = document.getElementById('image-input-container');
    const submitButton = document.getElementById('submitButton');
    const messageArea = document.getElementById('message-area');




    // --- 1. 編集モードか、新規モードかを判断 ---
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit_id');
    const isEditMode = !!editId;
    let currentUser;// --- ログインチェック ---
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('この操作にはログインが必要です');//早急に対処せよ　2025年10月23日　福田
        window.location.href = '../../ログイン系/html/login.html';
    }
    currentUser = user;

    async function initializePage() {


        if (isEditMode) {
            pageTitle.textContent = '投稿を編集する';
            submitButton.textContent = '更新する';
            await loadPostForEditing();
        } else {
            pageTitle.textContent = '新しい記録を投稿';
            submitButton.textContent = '投稿する';
        }
        postForm.addEventListener('submit', handleFormSubmit);
    }

    //  編集対象の投稿データを読み込み、フォームに設定する
    async function loadPostForEditing() {
        try {
            const { data: post, error } = await supabaseClient
                .from('forums')
                .select('* ,tag(tag_dic(tag_name)), forum_images(image_url)')
                .eq('forum_id', editId)
                .single();

            if (error || !post) throw new Error('投稿が見つからないか、読み込めませんでした');

            // ★★★ 他人の投稿かチェック ★★★
            if (post.user_id_auth !== currentUser.id) {
                alert('他人の投稿は編集できません。');
                window.location.href = '../../メイン系/html/index.html';
                return;
            }

            // --- フォームに既存のデータを設定 ---
            titleInput.value = post.title;
            textInput.value = post.text;

            // (公開期限、タグ、画像の初期表示もここで行う)
            // ...
        } catch (error) {
            console.error('編集データの読み込みエラー:', error);
            alert('データの読み込みに失敗しました。メインページに戻ります。');
            window.location.href = '../../メイン系/html/index';
        }

    }


    async function handleFormSubmit(event) {
        event.preventDefault();
        submitButton.disabled = true;

        try {
            if (isEditMode) {
                // --- 更新処理 ---
                submitButton.textContent = '更新中...';
                await updatePost();
                alert('投稿を更新しました。');
            } else {
                // --- 新規登録処理 ---
                submitButton.textContent = '投稿中...';
                await createPost();
                alert('投稿が完了しました。');
            }
            window.location.href = '../../メイン系/html/index.html'
        } catch (error) {
            console.error('投稿/更新エラー', error);
            alert(`処理に失敗しました。:{error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? '更新する' : '投稿する';
        }
    }

    // 新規投稿を作成する関数
    async function createPost() {
        const imageInputs = imageInputContainer.querySelectorAll('.image-input');
        const filesToUpload = Array.from(imageInputs).map(input => input.files[0]).filter(Boolean);
        const imageUrls = await uploadImages(filesToUpload);

        const { data: [savedForum], error: forumError } = await supabaseClient
            .from('forums')
            .insert({
                user_id_auth: currentUser.id,
                title: titleInput.value,
                text: textInput.value,
                delete_date: calculateDeleteDate(expireSelect.value)
            }).select();
        if (forumError) throw forumError;

        const tagInputs = document.querySelectorAll('#tag-container .tag-input');
        const tags = [...new Set(Array.from(tagInputs).map(input => input.value.trim()).filter(Boolean))];
        if (tags.length > 0) await saveTags(savedForum.forum_id, tags);
        if (imageUrls.length > 0) await saveImageUrls(savedForum.forum_id, imageUrls)
    }

    async function updatePost() {
        const { error } = await supabaseClient
            .from('forums')
            .update({
                title: titleInput.value,
                text: textInput.value,
                delete_date: calculateDeleteDate(expireSelect.value)
            })
            .eq('forum_id', editId);
        if (error) throw error;
    }

    /**
     * 画像ファイルをSupabase Storageにアップロードする関数
     */

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
            const { data: { publicUrl } } = supabaseClient.storage.from('post-images').getPublicUrl(result.data.path);
            uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
    }

    /**
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
            if (insertError) throw insertError;

            // 新しく作られたタグのIDをマップに追加
            insertedTags.forEach(tag => existingTagsMap.set(tag.tag_name, tag.tag_id));
        }
        // --- 3. すべてのタグを中間テーブルに紐付ける ---
        // 最終的に紐付けるべきtag_idのリストを作成

        const tagIdsToLink = tagNames.map(name => existingTagsMap.get(name));

        // 中間テーブルにINSERTするためのデータを作成
        const linksToInsert = tagIdsToLink.map(tagId => ({
            forum_id: forumId,
            tag_id: tagId
        }));
        const { error: linkError } = await supabaseClient
            .from('tag')// ★中間テーブル名
            .insert(linksToInsert);

        if (linkError) throw linkError;


    }

    /**
     * 画像URLをDBに保存する関数
     */
    async function saveImageUrls(forumId, urls) {
        const imageData = urls.map(
            (url, index) => ({
                post_id: forumId,
                image_url: url,
                display_order: index + 1
            }));
        const { error } = await supabaseClient.from('forum_images').insert(imageData);
        if (error) throw error;

    }

    /**
     * 公開期限の日時を計算する関数
     */
    function calculateDeleteDate(expiresOption) {
        if (expiresOption === 'permanent') return null;

        const date = new Date();
        if (expiresOption === 'private') return date;
        const days = parseInt(expiresOption.replace('day', ''));
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }
    initializePage();

});