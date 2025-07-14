<!--  -->
<?php session_start();
require_once "../../base/getPDO.php";
if(!isset($_SESSION['account'])){
    header('Location: ../../main.php');
}

?>
<!DOCTYPE html>

<html lang="ja">
    <head>
        <link rel="stylesheet" href="../css/.css">
        <meta charset="UTF-8">
        <title></title>

    </head>
    <body>
        <header>
            <nav>
            <?php
            if(isset($_SESSION['account'])){
                echo '<a href="logout.php">ログアウト</a>';
            } else {
                echo '<a href="login.php">ログイン</a>';
            }
            ?>
        </nav>
    </header>
    <pre>
        <?php print_r($_SESSION); ?>
        <?php 
        if (!isset($_SESSION['update_form']['name'])) {
            $pdo = getPDO();
            $stmt = $pdo->prepare('SELECT * FROM users WHERE user_id = ?');
            $stmt->execute([$_SESSION["account"]["user_id"]]);
            foreach ($stmt as $row) {
                $_SESSION['update_form']['name'] = $row['name'];
                $_SESSION['update_form']['user_name'] = $row['user_name'];
                $_SESSION['update_form']['login_id'] = $row['login_id'];
                $_SESSION['update_form']['email'] = $row['email'];
            }
        }
        ?>
    </pre>
    <form action="update_execute.php">
        <div>
            <?php 
            echo $_SESSION['update_form']['message'] ?? "";
            ?>
        </div>
        <div>
            <label for="nameInput">名前</label>
            <input type="text" name="name" id="nameInput" value =
            <?php echo htmlspecialchars($_SESSION['update_form']['name'] ?? "");?>>
        </div>
        <div>
            <label for="userNameInput">ユーザーネーム</label>
            <input type="text" name="user_name" id="userNameInput" value= 
            <?php echo htmlspecialchars($_SESSION['update_form']['user_name'] ?? ""); ?>>
        </div>
        <div>
            <label for="loginIdInput">
                ログインID
            </label>
            <input type="text" name="login_id" id="loginIdInput" value = 
            <?php echo htmlspecialchars($_SESSION['update_form']['login_id'] ?? "");?>>
            <div>
                <?php echo htmlspecialchars($_SESSION['update_form']['errors']['login_id'] ?? "");?>
            </div>
        </div>
        <div>
            <label for="emailInput">メールアドレス</label>
            <input type="email" name="email" id="emailInput" value = 
            <?php echo htmlspecialchars($_SESSION['update_form']['email'] ?? "");?>>
            <div>
                <?php echo htmlspecialchars($_SESSION['update_form']['errors']['email'] ?? "");?>
            </div>
        </div>
        <div>
            <label for="passwordInput">パスワード</label>
            <input type="password" name="password" id="passwordInput" value = 
            <?php echo htmlspecialchars($_SESSION['update_form']['password'] ?? "");?>>
        </div>
        <input type="submit" value="更新">
    </form>
    <footer>

    </footer>
    </body>
    <script src="../js/.js"></script>
</html>