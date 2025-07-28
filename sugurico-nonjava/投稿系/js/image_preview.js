'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const imagesInput = document.getElementById('imagesInput');
    const previewContainer = document.getElementById('image-preview-container');

    if (!imagesInput || !previewContainer) return;

    // ファイルが選択されたら、プレビューを更新
    imagesInput.addEventListener('change', (event) => {
        // 既存のプレビューをすべてクリア
        previewContainer.innerHTML = '';
        
        const files = event.target.files;
        if (files.length === 0) return;

        // 選択された各ファイルに対してプレビューを作成
        for (const file of files) {
            // ファイルが画像でなければスキップ
            if (!file.type.startsWith('image/')){ continue; }

            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'image-preview-wrapper';

            const img = document.createElement('img');
            img.src = URL.createObjectURL(file); // ファイルを一時的なURLに変換
            img.onload = () => {
                URL.revokeObjectURL(img.src); // メモリリーク防止
            };
            img.alt = '画像プレビュー';
            
            // 画像クリックでモーダル表示
            img.addEventListener('click', () => {
                showModal(img.src);
            });

            previewWrapper.appendChild(img);
            previewContainer.appendChild(previewWrapper);
        }
    });

    /**
     * 画像を拡大表示するモーダルを作成・表示
     * @param {string} src - 表示する画像のソースURL
     */
    function showModal(src) {
        // モーダルの背景を作成
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'modal-backdrop';
        
        // 拡大画像を作成
        const modalImage = document.createElement('img');
        modalImage.src = src;
        modalImage.className = 'modal-image';

        modalBackdrop.appendChild(modalImage);
        document.body.appendChild(modalBackdrop);

        // 背景をクリックしたらモーダルを閉じる
        modalBackdrop.addEventListener('click', () => {
            modalBackdrop.remove();
        });
    }
});