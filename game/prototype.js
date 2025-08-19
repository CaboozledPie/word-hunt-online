import {Tile, Board} "from board.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let mouseX = 400, mouseY = 400;
let mouseIsPressed = false;
let mouseIsReleased = false;

// grab mouseX, mouseY
canvas.addEventListener("mousemove",
    e => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }
);

// handle mouseIsPressed
canvas.addEventListener("mousedown", () => mouseIsPressed = true);
canvas.addEventListener("mouseup", function() {
    mouseIsPressed = false;
    mouseIsReleased = true;
});

/** ACTUALLY RUNNING THE GAME **/
// even this behavior should probably be sectioned off later but for now it's going in here
let boardShape = [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
];
var wordBoard = new Board(boardShape);
wordBoard.generateLetters();

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.fill();
    ctx.closePath();
}

function loop() {
    if (mouseIsReleased) {
        wordBoard.clearGuess();
    }
    
    draw();
    requestAnimationFrame(loop);
    mouseIsReleased = false; // i have to do this for this logic to work, no getting around it
}

loop();
