// image_preview.js
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- 要素の取得 ---
    const uploadContainer = document.getElementById('image-upload-container');
    const hiddenInputContainer = document.getElementById('image-input-hidden-container');
    const addButtonWrapper = document.getElementById('add-image-button-wrapper');
    const maxImagesCountSpan = document.getElementById('max-images-count');

    if (!uploadContainer || !hiddenInputContainer || !addButtonWrapper) return;

    // --- 設定 ---
    const isPremium = false; // 将来的にユーザー情報から取得
    const MAX_IMAGES = isPremium ? 6 : 3;
    maxImagesCountSpan.textContent = MAX_IMAGES;
    let fileInputCounter = 1;

    /**
     * 新しいファイル入力欄を生成する関数
     */
    function createNewFileInput() {
        fileInputCounter++;
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
                currentImageCount++;

                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'image-preview-wrapper';
                
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = () => URL.revokeObjectURL(img.src); // メモリ解放

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