import {Tile, Board} from "./board.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let mouseX = 400, mouseY = 400;
let mouseIsPressed = false;
let mouseIsReleased = false;
let mouseLeft = false;

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

// handle mouseLeft
canvas.addEventListener("mouseleave", () => mouseLeft = true);
canvas.addEventListener("mouseenter", () => mouseLeft = false);

// load skin
const tileSkin = {
    none: new Image(),
    hover: new Image(),
    click: new Image(),
    valid: new Image(),
    invalid: new Image()
};

const imgPath = "./game/skins/skindefault/tile";
tileSkin.none.src = imgPath + ".png";
tileSkin.hover.src = imgPath + "hover.png";
tileSkin.click.src = imgPath + "click.png";
tileSkin.valid.src = imgPath + "valid.png";
tileSkin.invalid.src = imgPath + "invalid.png";

/** ACTUALLY RUNNING THE GAME **/
// even this behavior should probably be sectioned off later but for now it's going in here
let boardShape = [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
];
const tileSize = canvas.width / boardShape.length; // for our tests 200
const offset = tileSize / 20; // margin around each tile so theyre not hugging, purely visual

var wordBoard = new Board(boardShape);
wordBoard.generateLetters();


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var tileInfo = wordBoard.getTiles();
    
    // draw tiles
    for (var row = 0; row < tileInfo.length; row++) {
        for (var col = 0; col < tileInfo[0].length; col++) {
            const tile = tileInfo[row][col];
            
            const drawX = tile.getCol() * tileSize;
            const drawY = tile.getRow() * tileSize;
            
            // img texture first
            const img = tileSkin[tile.getStatus()];
            if (img.complete) { // make sure img loaded
                ctx.drawImage(img, drawX + offset, drawY + offset, tileSize - offset * 2, tileSize - offset * 2);
            }

            // show letter
            ctx.fillStyle = "black";
            ctx.font = "bold 60px Verdana";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle"; // center align text
            ctx.fillText(tile.getLetter(), drawX + tileSize/2, drawY + tileSize/2 + 5);
        }
    }

    // draw red line
    var currentWord = wordBoard.getCurrentWord();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"; // 50%?
    ctx.lineWidth = tileSize / 10; // subject to change
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
 
    if (currentWord.length > 1) { // minimum two selected for line
        ctx.moveTo(
            currentWord[0].getCol() * tileSize + tileSize/2,
            currentWord[0].getRow() * tileSize + tileSize/2
        );
        for (var i = 1; i < currentWord.length; i++) {
            ctx.lineTo(
                currentWord[i].getCol() * tileSize + tileSize/2,
                currentWord[i].getRow() * tileSize + tileSize/2
            );
        }
    }

    ctx.stroke();
    ctx.closePath();
}

function loop() {
    // translate mouseX/mouseY to row col
    var mouseTileRow = -1;
    var mouseTileCol = -1; // row, col
    if (!mouseLeft) { // if mouse is gone dont even bother checking tile
        if (wordBoard.active) { // circular hitboxes
            for (var row = 0; row < wordBoard.dim(); row++) {
                for (var col = 0; col < wordBoard.dim(); col++) {
                    if (wordBoard.getTile(row, col) !== 0) { // ignore blank tiles
                        const tileCenterX = col * tileSize + tileSize/2;
                        const tileCenterY = row * tileSize + tileSize/2;
                        if (Math.hypot(tileCenterX - mouseX, tileCenterY - mouseY) < tileSize/2) {
                            mouseTileRow = row;
                            mouseTileCol = col;
                        }
                    }
                }
            }
        }
        else { // square hitboxes, first letter in chain
            mouseTileRow = Math.floor(mouseX / tileSize);
            mouseTileCol = Math.floor(mouseY / tileSize);
        }
    }

    if (mouseLeft || mouseIsReleased) { // mouse leaves play area or mouse released
        wordBoard.clearGuess();
        mouseIsPressed = false; // we should not accidentally drag
    }
    if (mouseTileRow !== -1 && !mouseIsPressed && !mouseLeft) { // hover, should work if stationary also
        wordBoard.newHover(mouseTileRow, mouseTileCol);
    }
    if (mouseTileRow !== -1 && mouseIsPressed) {
        wordBoard.selectTile(mouseTileRow, mouseTileCol);
    }
    draw();

    /** dom stuffs **/
    document.getElementById("score").textContent = `Points: ${wordBoard.getScore()}`;
    
    requestAnimationFrame(loop);
    mouseIsReleased = false; // i have to do this for this logic to work, no getting around it
}

loop();
