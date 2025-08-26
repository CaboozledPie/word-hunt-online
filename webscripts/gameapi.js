let frontendToken = null;

async function initSession() {
    const res = await fetch("http://127.0.0.1:8000/api/gameapi/init/");
    const data = await res.json();
    frontendToken = data.token;
    console.log("Front end session token: ", frontendToken);
};

async function enterMatchmaking() {
    if (!frontendToken) return alert("No session token, can't enter matchmaking");
    console.log("Sending token: ", frontendToken);
    const res = await fetch("http://127.0.0.1:8000/api/gameapi/enter_matchmaking/", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${frontendToken}`
        },
        body: JSON.stringify({})
    });
    const data = await res.json();
    alert(data.status || data.error);
};

async function loginUser(username, password) {
    // login a user!
    return;
};

