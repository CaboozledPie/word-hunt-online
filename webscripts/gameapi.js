const api_path = "http://127.0.0.1:8000/api/gameapi/";

let pollInterval = null;
let socket = null;

function connectSocket(matchId) { // returns match websocket, socket responses in here also
    const token = sessionStorage.getItem("frontendToken");
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://localhost:8000/ws/game/${matchId}/?token=${token}`);
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.event) {
                case "foundWord":
                    if (data.player === token) return;
                    console.log(`${data.player} found a word: ${data.word_info.word}`);
                    break;
                case "opponent_disconnect":
                    if (data.player === token) return; // this shouldnt even be possible but idk
                    console.log(`${data.player} has dc'd GG`);
                    break;
            }
        };
        socket.onopen = (event) => {
            setInterval(() => {
                socket.send(JSON.stringify({type: "heartbeat"}));
            }, 5000);
            console.log("websocket connected!");
            resolve(socket);
        };
        socket.onerror = (err) => reject(err);
    });
};

async function initSession() {
    const res = await fetch(`${api_path}init/`);
    const data = await res.json();
    sessionStorage.setItem("frontendToken", data.token);
    console.log("Front end session token: ", sessionStorage.getItem("frontendToken"));
};

async function enterMatchmaking() {
    if (!sessionStorage.getItem("frontendToken")) return alert("No session token, can't enter matchmaking");
    console.log("Sending token: ", sessionStorage.getItem("frontendToken"));
    const res = await fetch(`${api_path}enter_matchmaking/`, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("frontendToken")}`
        },
        body: JSON.stringify({})
    });

    if (res.ok) {
        pollInterval = setInterval(pollMatchStatus, 5000);
    }
    const data = await res.json();
    if (data.error) {
        alert(data.error);
    }
};

async function exitMatchmaking() {
    if (!sessionStorage.getItem("frontendToken")) return alert("No session token, can't exit matchmaking");
    console.log("Sending token: ", sessionStorage.getItem("frontendToken"));
    const res = await fetch(`${api_path}exit_matchmaking/`, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({token: sessionStorage.getItem("frontendToken")})
    });
    if (res.ok) {
        clearInterval(pollInterval);
    }
    const data = await res.json();
    alert(data.status || data.error);
};

async function pollMatchStatus() {
    if (!sessionStorage.getItem("frontendToken")) return alert("No session token, can't poll match status");
    try {
        const res = await fetch(`${api_path}matchmaking_status/`, {
            headers: {
                "Authorization": `Bearer ${sessionStorage.getItem("frontendToken")}`,
            },
        });
        const data = await res.json();
        console.log(data.status);
        if (data.status === "matched") { // we shall asume if matched match_id is also valid
            clearInterval(pollInterval);
            window.location.href = `game.html?match_id=${data.match_id}`;
        }
    }
    catch (err) {
        console.error("Error polling:", err);
    }
};

async function getSeed(matchId) {
    if (!sessionStorage.getItem("frontendToken")) return alert("can't get seed with no session token");
    try  {
        const res = await fetch(`${api_path}get_seed/`, {
            headers: {
                "Authorization": `Bearer ${sessionStorage.getItem("frontendToken")}`,
                "matchId": matchId,
            },
        });
        const data = await res.json();
        return data.seed;
    }
    catch (err) {
        console.error("Error grabbing board seed:", err);
    }
};

async function loginUser(username, password) {
    // login a user!
    return;
};


// handle pageclose
function pageClose(token, socket) {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }

    const payload = JSON.stringify({
        token: token
    });
    navigator.sendBeacon(`${api_path}exit_matchmaking/`, payload);
};
