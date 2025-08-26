let frontendToken = null;

async function initSession() {
    const res = await fetch("http://127.0.0.1:8000/api/game/init/");
    const data = await res.json();
    frontendToken = data.token;
    console.log("Front end session token: ", frontEndToken);
};

async function enterMatchmaking() {
    if (!frontendToken) return alert("No session token, can't enter matchmaking");
    
    const res = await fetch("http://127.0.0.1:8000/api/game/matchmaking/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${frontendToken}`
        }
    });
    const data = await res.json();
    alert(data.status || data.error);
};

async function loginUser(username, password) {
    // login a user!
    return;
};
