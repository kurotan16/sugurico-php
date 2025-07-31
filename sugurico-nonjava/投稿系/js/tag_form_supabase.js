'use strict';

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));//timeはミリ秒


document.addEventListener('DOMContentLoaded', () => {
    const tagContainer = document.getElementById('tag-container');
    if (!tagContainer) return; // 該当要素がなければ何もしない

    const maxTags = 10;

    // --- イベントリスナーをコンテナに設定 ---
    tagContainer.addEventListener('input', handleInput);
    tagContainer.addEventListener('keydown', handleKeyDown);

    /**
     * テキスト入力時の処理
     */
   async function handleInput(event) {
        const targetInput = event.target;
        // 最後の入力欄で、値があり、最大数未満なら、新しい入力欄を追加
        if (isLastInput(targetInput) && targetInput.value.trim() !== '' && tagContainer.children.length < maxTags) {
            addTagInput();
            await sleep(1000);
        }
    }

    /**
     * キー入力時の処理（Enter, Backspace）
     */
    function handleKeyDown(event) {
        const targetInput = event.target;
        if (event.key === 'Enter') {
            event.preventDefault(); // フォーム送信を防止
            const nextInput = findNextInput(targetInput);
            if (nextInput) {
                nextInput.focus();
            } else if (tagContainer.children.length < maxTags) {
                addTagInput();
            }
        }
        if (event.key === 'Backspace' && targetInput.value === '' && tagContainer.children.length > 1) {
            const prevInput = findPrevInput(targetInput);
            if (prevInput) {
                targetInput.parentElement.remove();
                prevInput.focus();
            }
        }
    }

    /**
     * 新しいタグ入力欄を追加する
     */
     function addTagInput() {
        if (tagContainer.children.length >= maxTags) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'tag-input-wrapper';

        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.name = 'tags[]'; // PHPで配列として受け取るためのname属性
        newInput.placeholder = 'タグを入力';

        wrapper.appendChild(newInput);
        
        tagContainer.appendChild(wrapper);
        newInput.focus();
    }

    // --- ヘルパー関数 ---
    function isLastInput(input) {
        return input.parentElement === tagContainer.lastElementChild;
    }
    function findNextInput(currentInput) {
        const nextWrapper = currentInput.parentElement.nextElementSibling;
        return nextWrapper ? nextWrapper.querySelector('input') : null;
    }
    function findPrevInput(currentInput) {
        const prevWrapper = currentInput.parentElement.previousElementSibling;
        return prevWrapper ? prevWrapper.querySelector('input') : null;
    }
});