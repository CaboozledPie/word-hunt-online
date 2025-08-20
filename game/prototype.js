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
const offset = tileSize / 20; // margin around each tile so theyre not hugging

var wordBoard = new Board(boardShape);
wordBoard.generateLetters();


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var tileInfo = wordBoard.getTiles();
    for (var row = 0; row < tileInfo.length; row++) {
        for (var col = 0; col < tileInfo[0].length; col++) {
            const tile = tileInfo[row][col];
            
            const drawX = offset + tile.getCol() * tileSize;
            const drawY = offset + tile.getRow() * tileSize;
            
            const img = tileSkin[tile.getStatus()];
            if (img.complete) { // make sure img loaded
                ctx.drawImage(img, drawX, drawY, tileSize - offset * 2, tileSize - offset * 2);
            }
        }
    }
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

    if (mouseIsReleased) { // mouse leaves play area or mouse released
        wordBoard.clearGuess();
    }
    if (mouseTileRow !== -1 && !mouseIsPressed && !mouseLeft) { // hover, should work if stationary also
        wordBoard.newHover(mouseTileRow, mouseTileCol);
    }
    if (mouseTileRow !== -1 && mouseIsPressed) {
        wordBoard.selectTile(mouseTileRow, mouseTileCol);
    }
    draw();
    requestAnimationFrame(loop);
    mouseIsReleased = false; // i have to do this for this logic to work, no getting around it
}

loop();
