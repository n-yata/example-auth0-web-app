document.addEventListener("DOMContentLoaded", async function () {
    const auth0Client = await auth0.createAuth0Client({
        domain: "dev-xxxxxxxxxxxx.us.auth0.com",
        clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        authorizationParams: {
            redirect_uri: "http://localhost:3000",
            audience: "https://my-app-api/",
            scope: "openid profile email offline_access"
        },
        cacheLocation: "localstorage",
        useRefreshTokens: true
    });

    // ログイン処理
    document.getElementById("login").addEventListener("click", async () => {
        await auth0Client.loginWithRedirect();
    });

    // 認証コールバック処理
    async function handleAuthCallback() {
        const query = window.location.search;
        if (query.includes("code=") && query.includes("state=")) {
            await auth0Client.handleRedirectCallback();
            window.history.replaceState({}, document.title, "/"); // URL をクリーンアップ
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

    // トークンのリフレッシュ処理
    document.getElementById("refresh").addEventListener("click", async () => {
        try {
            const token = await auth0Client.getTokenSilently();
            console.log("New Access Token:", token);
            document.getElementById("profile").textContent = `New Token: ${token}`;
        } catch (error) {
            console.error("Failed to refresh token", error);
        }
    });

    // ログアウト処理
    document.getElementById("logout").addEventListener("click", async () => {
        await auth0Client.logout({
            logoutParams: {
                returnTo: "http://localhost:3000"
            }
        });
    });

    await handleAuthCallback();
});
