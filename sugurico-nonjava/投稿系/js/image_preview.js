// image_preview.js
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    // --- 要素の取得 ---
    const uploadContainer = document.getElementById('image-upload-container');
    const hiddenInputContainer = document.getElementById('image-input-hidden-container');
    const addButtonWrapper = document.getElementById('add-image-button-wrapper');
    const maxImagesCountSpan = document.getElementById('max-images-count');

<<<<<<< HEAD
    if (!uploadContainer || !hiddenInputContainer || !addButtonWrapper) return;

    // ▼▼▼ プレミアム状態をチェック ▼▼▼
    let isPremium = false;
    // ログインユーザーの情報をDBから直接取得する
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        const { data: profile, error } = await supabaseClient
            .from('users')
            .select('premium_expires_at')
            .eq('id', user.id)
            .single();
        
        // プレミアム期限が未来の日付なら、isPremiumをtrueにする
        if (profile && profile.premium_expires_at && new Date(profile.premium_expires_at) > new Date()) {
            isPremium = true;
        }
    }

    // --- 設定 ---
    const MAX_IMAGES = isPremium ? 6 : 3;
    maxImagesCountSpan.textContent = MAX_IMAGES;
    let fileInputCounter = 1;
=======
    // もし必要な要素がなければ処理を中断
    if (!imageInputContainer ||
        !addButton ||
        !removeButton ||
        !previewContainer) {
        return;
    }

    let currentObjectUrls = [];

    // ★ プレミアム機能の判定（仮）
    // 実際には、ログインユーザーの情報を取得して判定します
    const isPremium = false;
    const maxImages = isPremium ? 6 : 3;
    maxImagesCountSpan.textContent = maxImages;

    // --- イベントリスナー ---

    // [追加]ボタンのクリックイベント
    addButton.addEventListener('click', () => {
        const currentInputs = imageInputContainer.querySelectorAll('.image-input');
        const lastInput = currentInputs[currentInputs.length - 1];
        // 最後の入力欄にファイルが選択されているかチェック
        if (lastInput.files.length === 0) {
            alert('最後の画像を選択してから追加してください。');
            lastInput.click(); // ファイル選択ダイアログを開く
            return;
        }
        if (currentInputs.length < maxImages) {
            addImageInput();
        } else {
            alert(`画像は最大${maxImages}枚までです。`);
        }
    });

    // [削除]ボタンのクリックイベント
    removeButton.addEventListener('click', () => {
        const wrappers = imageInputContainer.querySelectorAll('.image-input-wrapper');
        if (wrappers.length > 1) {
            wrappers[wrappers.length - 1].remove();
            updateAllPreviews();// 削除後にプレビュー全体を更新
        }
    });

    // 動的に追加される要素に対応するため、親要素にイベントリスナーを設定（イベント移譲）
    imageInputContainer.addEventListener('change', (event) => {
        if (event.target.classList.contains('image-input')) {
            updateAllPreviews();
        }
    });

    // --- 関数群 ---
>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d

    /**
     * 新しいファイル入力欄を生成する関数
     */
<<<<<<< HEAD
    function createNewFileInput() {
        fileInputCounter++;
=======
    function addImageInput() {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-input-wrapper';

>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
        const newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.id = `image-input-${fileInputCounter}`;
        newInput.className = 'image-input';
        newInput.accept = 'image/*';
        hiddenInputContainer.appendChild(newInput);
        // 新しい「+」ボタンの `for` 属性を、新しい入力欄のIDに更新
        addButtonWrapper.querySelector('label').setAttribute('for', newInput.id);
    }

    /**
     * プレビューを更新する関数
     */
    function updatePreviews() {
        // --- 既存のプレビューを一旦すべて削除 ---
        const existingPreviews = uploadContainer.querySelectorAll('.image-preview-wrapper');
        existingPreviews.forEach(p => p.remove());

        // --- すべてのファイル入力欄をチェックしてプレビューを再生成 ---
        const allInputs = hiddenInputContainer.querySelectorAll('.image-input');
        let currentImageCount = 0;

        allInputs.forEach(input => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
<<<<<<< HEAD
                currentImageCount++;
=======
                if (!file.type.startsWith('image/')) return;
>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d

                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'image-preview-wrapper';
                
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = () => URL.revokeObjectURL(img.src); // メモリ解放

<<<<<<< HEAD
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'preview-delete-button';
                deleteButton.textContent = '×';
                // 削除ボタンが押されたら、対応する入力欄をリセットしてプレビューを更新
                deleteButton.onclick = () => {
                    input.value = ''; // ファイル選択をリセット
                    updatePreviews();
                };

                previewWrapper.appendChild(img);
                previewWrapper.appendChild(deleteButton);
                // 「+」ボタンの前にプレビューを追加
                uploadContainer.insertBefore(previewWrapper, addButtonWrapper);
=======
                // ★ 新しく生成したURLを管理配列に追加
                currentObjectUrls.push(objectUrl);

                img.src = objectUrl;
                img.alt = '画像プレビュー';
                img.addEventListener('click', () => { showModal(objectUrl); });

                previewWrapper.appendChild(img);
                previewContainer.appendChild(previewWrapper);

>>>>>>> 9dd67833a76ed6b939350439b376d1a9f92bc29d
            }
        });

        // --- 「+」ボタンの表示/非表示を切り替え ---
        if (currentImageCount >= MAX_IMAGES) {
            addButtonWrapper.style.display = 'none';
        } else {
            addButtonWrapper.style.display = 'flex';
        }
    }

    // --- イベントリスナー ---
    hiddenInputContainer.addEventListener('change', (event) => {
        // いずれかのファイル入力欄でファイルが選択されたら
        if (event.target.classList.contains('image-input')) {
            const currentInputs = hiddenInputContainer.querySelectorAll('.image-input');
            const filledInputs = Array.from(currentInputs).filter(i => i.files[0]);

            // 上限に達していなければ、新しい入力欄を準備
            if (filledInputs.length < MAX_IMAGES) {
                // まだ空の入力欄がない場合のみ、新しいものを追加
                const hasEmptyInput = Array.from(currentInputs).some(i => !i.files[0]);
                if (!hasEmptyInput) {
                    createNewFileInput();
                }
            }
            // プレビューを更新
            updatePreviews();
        }
    });

    // 初期状態で1つは入力欄があるので、「+」ボタンを表示しておく
    addButtonWrapper.style.display = 'flex';
});