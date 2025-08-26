let accessToken = null;

const demoUser = { username: "test", password: "hehehehaw"};

async function tokenLogin(username, password) {
    const res = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoUser),
        credentials: "include"  // important: allows refresh cookie to be set
    });

    const data = await res.json();
    accessToken = data.access;  // store **in memory only**
};

async function createPost(title, body) {
    if (!accessToken) throw new Error("Not logged in");

    const res = await fetch("http://127.0.0.1:8000/api/posts/", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, body })
    });

    if (res.status === 401) {
        // token expired → try refreshing
        await refreshToken();
        return createPost(title, body);  // retry
    }

    return res.json();
};

sync function refreshToken() {
    const res = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
        method: "POST",
        credentials: "include"  // browser automatically sends HttpOnly refresh cookie
    });

    if (!res.ok) throw new Error("Refresh failed");

    const data = await res.json();
    accessToken = data.access;
};
