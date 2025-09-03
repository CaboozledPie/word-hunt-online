const api_path = "http://127.0.0.1:8000/api/gameapi/";

let pollInterval = null;
let socket = null;

function connectSocket(matchId) {
    const token = sessionStorage.getItem("frontendToken");
    socket = new WebSocket(`ws://localhost:8000/ws/game/${matchId}/?token=${token}`);
    socket.onmessage = (event) => {
        console.log("Game update: ", JSON.parse(event.data)); // placeholder for behavior
    };
    socket.onopen = (event) => {
        console.log("connected to server!");
        setInterval(() => {
            socket.send(JSON.stringify({type: "heartbeat"}));
        }, 5000);
    };
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
            "Authorization": `Bearer ${sessionStorage.getItem("frontendToken")}`
        },
        body: JSON.stringify({})
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
            
            // connect to socket
            connectSocket();
        }
    }
    catch (err) {
        console.error("Error polling:", err);
    }
};

async function getSeed() {
    if (!sessionStorage.getItem("frontendToken")) return alert("No session token, can't poll match status");
    try  {
        const res = await fetch(`${api_path}get_seed/`, {
            headers: {
                "Authorization": `Bearer ${sessionStorage.getItem("frontendToken")}`,
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
document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("beforeunload", () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
        navigator.sendBeacon(
            `${api_path}exitmatch_making/`,
            JSON.stringify({})
        );
    });
});

