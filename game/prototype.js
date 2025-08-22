import {Tile, Board} from "./board.js";
import {DICTIONARY_READY} from "./dictionarytools.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let mouseX = canvas.width/2, mouseY = canvas.height/2;
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
canvas.addEventListener("mouseout", () => mouseLeft = true);
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

// we can put this in a better place later, just putting it here for now
var drawTile = function(tile) {
    const img = tileSkin[tile.getStatus()];

    if (img.complete) { // make sure img loaded
        const drawSize = (tileSize - offset * 2) * tile.getAnimationSize();
        const drawX = tile.getCol() * tileSize + tileSize / 2 - drawSize / 2; // topleft orientation coords
        const drawY = tile.getRow() * tileSize + tileSize / 2 - drawSize / 2;
        
        ctx.drawImage(img, drawX, drawY, drawSize, drawSize);
    }

    // show letter
    ctx.fillStyle = "black";
    ctx.font = "bold 60px Verdana";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // center align text
    ctx.fillText(tile.getLetter(), tile.getCol() * tileSize + tileSize/2, tile.getRow() * tileSize + tileSize/2 + 5);
    // center align, no animation
};

function draw(wordBoard) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw tiles
    for (var row = 0; row < wordBoard.dim(); row++) {
        for (var col = 0; col < wordBoard.dim(); col++) {
            const tile = wordBoard.getTile(row, col);
            drawTile(tile);
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
        // recolor to clear if valid
        if(currentWord[0].getStatus() === "valid" || currentWord[0].getStatus() === "invalid") {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        }
        
        // draw lines
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

function loop(wordBoard) {
    // translate mouseX/mouseY to row col
    var mouseTileRow = -1;
    var mouseTileCol = -1; // row, col
    if (!mouseLeft) { // if mouse is gone dont even bother checking tile
        if (wordBoard.active()) { // circular hitboxes
            const prevTile = wordBoard.getCurrentWord()[wordBoard.getCurrentWord().length-1];
            const prevRow = prevTile.getRow();
            const prevCol = prevTile.getCol();
            for (var row = Math.max(0, prevRow-1); row < Math.min(wordBoard.dim(), prevRow+2); row++) {
                for (var col = Math.max(0, prevCol-1); col < Math.max(wordBoard.dim(), prevCol+2); col++) {
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
            mouseTileRow = Math.floor(mouseY / tileSize);
            mouseTileCol = Math.floor(mouseX / tileSize);
        }
    }

    if (mouseLeft || mouseIsReleased) { // mouse leaves play area or mouse released
        console.log("hi");
        wordBoard.clearGuess();
        wordBoard.clearAnimations();
        mouseIsPressed = false; // we should not accidentally drag
    }
    if (mouseTileRow !== -1 && !mouseIsPressed && !mouseLeft) { // hover, should work if stationary also
        const hoverStatus = wordBoard.newHover(mouseTileRow, mouseTileCol);
        if (hoverStatus) {
            wordBoard.getTile(mouseTileRow, mouseTileCol).beginAnimation("hover");
        }
    }
    if (mouseTileRow !== -1 && mouseIsPressed) {
        const clickStatus = wordBoard.selectTile(mouseTileRow, mouseTileCol);
        if (clickStatus) {
            wordBoard.getTile(mouseTileRow, mouseTileCol).beginAnimation("click");
        }
    }
    draw(wordBoard);

    // update tile animations
    for (var row = 0; row < wordBoard.dim(); row++) {
        for (var col = 0; col < wordBoard.dim(); col++) {
            const tile = wordBoard.getTile(row, col);
            if (tile.getAnimationType() !== "none") {
                const animationStatus = tile.progressAnimationFrame();
                if (animationStatus === 0 && tile.getAnimationType() === "hover") {
                    tile.endAnimation();
                }
            }
        }
    }

    /** dom stuffs **/
    document.getElementById("score").textContent = `Points: ${wordBoard.getScore()} Words: ${wordBoard.getWordCount()}`;
    
    requestAnimationFrame(() => loop(wordBoard));
    mouseIsReleased = false; // i have to do this for this logic to work, no getting around it
}

let boardShape = [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
];
const tileSize = canvas.width / boardShape.length; // for our tests 200
const offset = tileSize / 20; // margin around each tile so theyre not hugging, purely visual

// wait until dictionary is loaded before starting le game
DICTIONARY_READY.then(() => {
    // even this behavior should probably be sectioned off later but for now it's going in here
    var gameBoard = new Board(boardShape);
    gameBoard.generateLetters();
    gameBoard.solve();
    loop(gameBoard);
});
