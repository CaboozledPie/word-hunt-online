import {LETTER_FREQUENCY} from "./letterfrequency.js";

var Tile = function(letter, row, col) {
    this.letter = letter;
    this.row = row; 
    this.col = col;
    this.status = "none"; // hover, click, valid, invalid
};

Tile.prototype.getRow = function() {
    return this.row;
};

Tile.prototype.getCol = function() {
    return this.col;
};

Tile.prototype.getStatus = function() {
    return this.status;
};

Tile.prototype.updateStatus = function(status) {
    this.status = status;
};

var Board = function(shape, skin = "skindefault") { // input shape as 0 for unfilled, 1 for filled
    if (shape.length !== shape[0].length) {
        throw new Error("board shape must be inputted as square");
    }
    this.board = shape;
    this.skin = skin;
    this.currentWord = []; // array of arrays of length 2 [row, col]
    this.currentTile = []; // length 2, row and col
};

Board.prototype.generateLetters = function(letters = []) {
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

Board.prototype.updateTile = function(status, row, col) {
    // needs to know which tile is being interacted with at call time
    if (this.getTile(row, col) !== 0) {
        this.getTile(row, col).updateStatus(status);
    }
};

Board.prototype.newHover = function(row, col) {
    if (this.currentTile.length == 2) { // if no currentTile then we'll have index error
        this.updateTile("none", this.currentTile[0], this.currentTile[1]);
    }
    this.currentTile = [row, col];
    this.updateTile("hover", row, col);
};

Board.prototype.selectTile = function(row, col) {
    // make sure you don't double select
    for (var i = 0; i < this.currentWord.length; i++) {
        if (this.currentWord[i].getRow() === row && this.currentWord[i].getCol() === col) {
            return; // can't select
        }
    }
    this.updateTile("click", row, col);
    this.currentWord.push(this.getTile(row, col));
}

Board.prototype.clearGuess = function() { // call every time mouse is released
    // points?
    this.evaluateGuess();
    
    // reset all tiles
    for (var i = 0; i < this.currentWord.length; i++) {
        this.updateTile("none", this.currentWord[i].getRow(), this.currentWord[i].getCol());
    }

    //reset word
    this.currentWord = [];
};

Board.prototype.evaluateGuess = function() {
    return;
    // we will see
};

Board.prototype.getTile = function(row, col) {
    return this.board[row][col];
};

Board.prototype.getTiles = function() {
    return this.board;
};

Board.prototype.active = function() { // making a word = active, still hovering = inactive
    return this.currentWord.length !== 0;
};

Board.prototype.dim = function() {
    return this.board.length;
};

export {Tile, Board};
