import {startGame} from "/game/prototype.js";

const api_path = "http://127.0.0.1:8000/api/gameapi/";

let pollInterval = null;
let socket = null;

function getOpponentId(match, playerId) { // helper function
    const playerIds = Object.keys(match["players"]);
    if (playerId === playerIds[0]) return playerIds[1];
    if (playerId === playerIds[1]) return playerIds[0];
    return "???"; // shouldnt happen but ya never know
};

export async function connectSocket(matchId) { // returns match websocket, socket responses in here also
    const token = sessionStorage.getItem("frontendToken");
    
    // verify token before opening connection
    const res = await fetch(`${api_path}valid_token/`, {
        method: "GET",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("frontendToken")}`
        },
    });

    const data = await res.json();
    if (!res.ok) {
        if (!data["status"]) {
            throw new Error("can't open socket connection with invalid token");
        }
    }

    // socket details
    const match = await getMatch(matchId);
    if (!(token in match["players"])) { // if token is invalid or not in the match
        return false;
    }
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://localhost:8000/ws/game/${matchId}/?token=${token}`);
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.event) {
                case "gameStart": // listen for opponent's gameStart to be fair
                    if (!match) console.log("failed to fetch match details");
                    startGame(match['seed'], socket, 80, match["players"][token])
                    break;
                case "foundWord":
                    if (data.player_id === token) return;
                    console.log(`${data.player_id} found a word: ${data.word_info.word}`);
                    console.log(data['player_data']);
                    document.getElementById("opponentScore").textContent =
                        `Points: ${data['player_data']['score']} Words: ${data['player_data']['word_count']}`;
                    break;
                case "reconnect":
                    if (data.player_id !== token) { // log that opponent is back
                        console.log(`${data.player_id} came back from dc, no timeout`);
                    }
                    else {
                        const opponentId = getOpponentId(match, data.player_id);
                        const timer = Math.max(0,
                            Math.floor(match.duration - (Date.now() / 1000 - match.start_time)))
                        if (!match) console.log("failed to fetch match details");
                        document.getElementById("opponentScore").textContent =
                            `Points: ${match["players"][opponentId]['score']} Words: ${match["players"][opponentId]['word_count']}`;
                        startGame(match['seed'], socket, timer, match["players"][token])
                    }
                case "disconnect": // only on timeout (15s)
                    if (data.player_id === token) return; // this shouldnt even be possible but idk
                    console.log(`${data.player_id} has dc'd GG`);
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

export async function initSession() {
    const res = await fetch(`${api_path}init/`);
    const data = await res.json();
    sessionStorage.setItem("frontendToken", data.token);
    console.log("Front end session token: ", sessionStorage.getItem("frontendToken"));
};

export async function enterMatchmaking() {
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

export async function exitMatchmaking() {
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

export async function pollMatchStatus() {
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

export async function getMatch(matchId) {
    if (!sessionStorage.getItem("frontendToken")) return alert("can't get seed with no session token");
    try  {
        const res = await fetch(`${api_path}get_match/`, {
            headers: {
                "Authorization": `Bearer ${sessionStorage.getItem("frontendToken")}`,
                "matchId": matchId,
            },
        });
        const data = await res.json();
        return data["data"];
    }
    catch (err) {
        console.error("Error grabbing board seed:", err);
    }
};

export async function loginUser(username, password) {
    // login a user!
    return;
};


// handle pageclose
export function pageClose(token, socket) {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }

    const payload = JSON.stringify({
        token: token
    });
    navigator.sendBeacon(`${api_path}exit_matchmaking/`, payload);
};

// push certain functions to window
window.initSession = initSession;
window.enterMatchmaking = enterMatchmaking;
window.exitMatchmaking = exitMatchmaking;
window.connectSocket = connectSocket;
window.pageClose = pageClose;
