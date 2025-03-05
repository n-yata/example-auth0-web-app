// 最初に共通設定（定数）をまとめる
const AUTH0_DOMAIN = "xxxxxxxxxxxxx.us.auth0.com";
const AUTH0_CLIENT_ID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const AUTH0_AUDIENCE = "https://my-app-api/";
const AUTH0_REDIRECT_URI = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async function () {
    const auth0Client = await auth0.createAuth0Client({
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        authorizationParams: {
            redirect_uri: AUTH0_REDIRECT_URI,
            audience: AUTH0_AUDIENCE,
            scope: "openid profile email offline_access"
        },
        cacheLocation: "localstorage",
        useRefreshTokens: true
    });

    // 通常ログイン
    document.getElementById("login").addEventListener("click", async () => {
        await auth0Client.loginWithRedirect();
    });

    // 電話番号ログイン
    document.getElementById("login-sms")?.addEventListener("click", async () => {
        await loginWithPhoneNumber();
    });

    // 認証コールバック処理
    async function handleAuthCallback() {
        const query = window.location.search;
        if (query.includes("code=") && query.includes("state=")) {
            await auth0Client.handleRedirectCallback();
            window.history.replaceState({}, document.title, "/");
        }

        const isAuthenticated = await auth0Client.isAuthenticated();
        if (isAuthenticated) {
            const user = await auth0Client.getUser();
            document.getElementById("profile").textContent = JSON.stringify(user, null, 2);
            document.getElementById("login").style.display = "none";
            document.getElementById("logout").style.display = "block";
            document.getElementById("refresh").style.display = "block";
        }
    }

    // トークンリフレッシュ
    document.getElementById("refresh").addEventListener("click", async () => {
        try {
            const token = await auth0Client.getTokenSilently();
            console.log("New Access Token:", token);
            document.getElementById("profile").textContent = `New Token: ${token}`;
        } catch (error) {
            console.error("Failed to refresh token", error);
        }
    });

    // ログアウト
    document.getElementById("logout").addEventListener("click", async () => {
        await auth0Client.logout({
            logoutParams: {
                returnTo: AUTH0_REDIRECT_URI
            }
        });
    });

    await handleAuthCallback();

    // 電話番号ログイン処理（Passwordless SMS）
    async function loginWithPhoneNumber() {
        const phoneNumber = prompt("電話番号を入力してください（例: +818012345678）");
        if (!phoneNumber) return;

        const startResponse = await fetch(`https://${AUTH0_DOMAIN}/passwordless/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: AUTH0_CLIENT_ID,
                connection: "sms",
                phone_number: phoneNumber,
                send: "code"
            })
        });

        const startResult = await startResponse.json();
        if (startResult.error) {
            alert("SMS送信に失敗しました");
            return;
        }

        const code = prompt("SMSで届いた6桁のコードを入力してください");
        if (!code) return;

        const tokenResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                grant_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
                client_id: AUTH0_CLIENT_ID,
                otp: code,
                realm: "sms",
                phone_number: phoneNumber,
                scope: "openid profile email"
            })
        });

        const tokenResult = await tokenResponse.json();
        if (tokenResult.error) {
            alert(`ログイン失敗: ${tokenResult.error_description}`);
            return;
        }

        alert("電話番号ログイン成功！");
        document.getElementById("profile").textContent = `Login Successful!\n${JSON.stringify(tokenResult, null, 2)}`;
    }
});
