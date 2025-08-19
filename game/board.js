import Math;
import LETTER_FREQUENCY from "letterfrequency.js";

var Tile = function(letter, x, y) {
    this.letter = letter;
    this.x = x; // x/y are based only on row/col! not pixels!
    this.y = y;
    this.status = "none"; // hover, click, valid, invalid
};

Tile.prototype.updateStatus = function(status) {
    this.status = status;
};

Tile.prototype.generateImgPath = function() {
    
};

var Board = function(shape, skin = "skindefault") { // input shape as 0 for unfilled, 1 for filled
    if (shape.length !== shape[0].length) {
        throw new Error("board shape must be inputted as square");
    }
    this.board = shape;
    this.skin = skin;
    this.currentWord = []; // array of arrays of length 2 [row, col]
    this.currentHover = []; // length 2, row and col
};

Board.prototype.generateLetters() = function(letters = []) {
    for (var row = 0; row < this.board.length; row++) {
        for (var col = 0; col < this.board[0].length; col++) {
            if (this.board[row][col] === 1) { // only make tiles at 
                var generateRandom = Math.floor(Math.random() * LETTER_FREQUENCY.length);
                var generateLetter = LETTER_FREQUENCY[generateRandom];
                if (letters.length === this.board.length) { // this trusts that letters is a safe format!
                   this.board[row][col] = new Tile(letters[row][col], row, col); 
                }
                else {
                    this.board[row][col] = new Tile(generateLetter, row, col);
                }
            }
        }
    }
};

Board.prototype.updateTiles() = function(mouseStatus, mouseRow, mouseCol) {
    // needs to know which tile is being interacted with at call time
    for (var row = 0; row < this.board.length; row++) {
        for (var col = 0; col < this.board.length; col++) {
            if ((row !== mouseRow || col !== mouseCol) && this.board[row][col].status === hover)
        }
    }
    if (Board[row][col] !== 0) {
        switch (status) {
            case "hover":
                this.board[row][col].updateStatus("hover");
                break;
            case "click":
                this.board[row][col].updateStatus("click");
                break;
        }
    }
};

Board.prototype.clearGuess() = function() { // call every time mouse is released
    Board.evaluateGuess();
    Board.currentWord = [];
};

Board.prototype.evaluateGuess() = function() {
    // we will see
};

Board.prototype.active = function() { // making a word = active, still hovering = inactive
    return this.currentWord.length !== 0;
};

Board.prototype.dim() = function() {
    return this.board.length;
};
