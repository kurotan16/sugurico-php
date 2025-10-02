'use strict';

document.addEventListener('DOMContentLoaded', async() =>{


    const passwordAuthSection = document.getElementById('password-auth-section');
    const paymentSection = document.getElementById('payment-section');
    const passwordInput = document.getElementById('password-input');
    const authButton = document.getElementById('auth-button');
    const authMessageArea = document.getElementById('auth-message-area');
    const subscribeButton = document.getElementById('subscribe-button');
    const planSelect = document.getElementById('plan-select');
    const subscriptionStatus = document.getElementById('subscription-status');

    let currentUser;

    async function initializePage() {
        const {data: {user}} = await supabaseClient.auth.getUser();
        if(!user){
            window.location.href = 'login.html';
            return;
        }
        currentUser = user;
        
        const {data:premiumStatus, error} = await supabaseClient
            .from('premium')
            .select('status')
            .eq('id', currentUser.id)
            .single();

        if(premiumStatus && premiumStatus.status === 'active'){
            window.location.href = 'premium_edit.html';
            return;
        }
        
        checkLockStatus();

        setupEventListeners();
    }

    //  イベントリスナーを設定
    function setupEventListeners(){
        authButton.addEventListener('click', handlePasswordAuth);
        subscribeButton.addEventListener('click', handleSubscription);
    }

    async function handlePasswordAuth(){
        const password = passwordInput.value;
        if(!password){
            showMessage('パスワードを入力してください。', 'error');
            return;
        }

        // --- 本人確認 ---
        // ★ Supabaseには直接パスワードを検証するAPIがないため、
        // ★ signInWithPasswordを再認証として利用する
        const {error} = await supabaseClient.auth.signInWithPassword({
            email: currentUser.email,
            password: password
        });

        if(error){
            handleAuthFailure();
        } else {
            handleAuthSuccess();
        }
    }

    //  プレミアム登録処理 (シミュレーション)

    async function handleSubscription(){
        subscribeButton.disabled = true;
        subscriptionStatus.textContent = '登録処理中...';

        try {
            const selectedPlan = planSelect.value;
            const limitDate = new Date();
            if(selectedPlan === 'monthly'){
                limitDate.setMonth(limitDate.getMonth() + 1);
            } else if(selectedPlan === 'yearly'){
                limitDate.setFullYear(limitDate.getFullYear() + 1);
            }

            const {error} = await supabaseClient
                .from('premium')
                .upsert({
                    id: currentUser.id,
                    plan : selectedPlan,
                    status: 'active',
                    limit_date: limitDate.toISOString(),
                    updated_at: new Date().toISOString()
            });
            if (error) throw error;

            // --- 成功 ---

            subscriptionStatus.textContent = 'プレミアム登録が完了しました！';
            setTimeout(() => {
                window.location.href = 'premium_edit.html';
            }, 2000);

        } catch (error) {
            console.error('登録処理に失敗:', error);
            subscriptionStatus.textContent = `登録処理に失敗しました: ${error.message}`;
            subscribeButton.disabled = false;
        }
        
    }

    // 認証成功時の処理

    function handleAuthSuccess(){
        // 失敗カウントをリセット
        localStorage.removeItem(`auth_fails_${currentUser.id}`);

        showMessage('認証に成功しました。');

        passwordAuthSection.style.display = 'none';
        paymentSection.style.display = 'block';

    }

    // 認証失敗時の処理
    function handleAuthFailure(){
        const failKey = `auth_fails_${currentUser.id}`;
        const lockKey = `auth_lock_${currentUser.id}`;

        const MAX_FAILS = 5;
        
        // 1. 現在の失敗回数を取得 (なければ0)
        let failCount = parseInt(localStorage.getItem(failKey) || '0');
        failCount ++;

        // 2. 失敗回数を保存
        localStorage.setItem(failKey, failCount);

        if(failCount >= MAX_FAILS){

            // 3. 5回失敗したら、ロック時刻を保存

            const lockUntil = Date.now() + 15 * 60 * 1000; // 15分ロック
            localStorage.setItem(lockKey, lockUntil);

            // 4. Supabase Edge Functionを呼び出して、メールを送信
           // sendLockNotificationEmail();

            // 5. ページをロック
            lockPage(lockUntil);
        } else {
            showMessage(`パスワードが違います。残り試行回数: ${MAX_FAILS - failCount}回`, 'error');
        }
    }

    // メール通知用のEdge Functionを呼び出す
    async function sendLockNotificationEmail(){
        try {
            const {data, error} = await supabaseClient.functions.invoke(
                'send-lock-email',{
                    body : {
                        email: currentUser.email,
                        userName: currentUser.user_metadata?.userName
                    }
                });

            if(error) throw error;
            console.log('ロック通知メールの送信をリクエストしました。',data);
        } catch (error) {
            console.error('メール送信Functionの呼び出しに失敗:',error);
        }
    }

    // ページをロックし、再試行可能な時刻を表示する

    function lockPage(lockUntil){
        passwordInput.disabled = true;
        authButton.disabled = true;
        const unlockTime = new Date(lockUntil).toLocaleString('ja-JP');
        showMessage(`試行回数の上限に達しました。アカウントはロックされました。再試行可能になるまでお待ちください: ${unlockTime}`, 'error')
    }

    //  ページ読み込み時にロック状態をチェックする
    function checkLockStatus(){
        const lockKey = `auth_lock_${currentUser.id}`;
        const lockUntil = parseInt(localStorage.getItem(lockKey) || '0');

        if(Date.now() < lockUntil){
            lockPage(lockUntil);
        }

    }

    function showMessage(text, type) {
        authMessageArea.textContent = text;
        authMessageArea.className = `message ${type}`;
        authMessageArea.style.display = 'block';
    }

    initializePage();
});