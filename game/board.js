import {LETTER_FREQUENCY} from "./letterfrequency.js";
import {DICTIONARY} from "./dictionarytools.js";

function bounceScale(t, end = 1, overshoot = 1.1, undershoot = end - (overshoot - end) / 2, frequency = 2) { // helper func
    // Compute a sine wave oscillation damped by (1-t)
    const amplitude = overshoot - end;
    const minAmp = end - undershoot;
    const damping = 1 - t;

    // Map sine from [-1,1] to [-minAmp, amplitude]
    const raw = Math.sin(Math.PI * frequency * t) * damping;
    return end + (raw > 0 ? raw * amplitude : raw * minAmp);
};

var Tile = function(letter, row, col) {
    this.letter = letter;
    this.row = row; 
    this.col = col;
    this.status = "none"; // hover, click, valid, invalid

    // animation stuff, control animation type and time
    this.animationType = "none";
    this.bounceFrame = 0;
    this.bounceTime = 30;
};

Tile.prototype.getLetter = function() {
    return this.letter;
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

Tile.prototype.beginAnimation = function(type) {
    switch (type) { // set animation params based on type
        case "hover":
            this.bounceTime = 10;
            break;
        case "click":
            this.bounceTime = 20;
            break;
        default:
            throw new Error("invalid animation type for Tile.beginAnimation()");
            break;
    }
    this.animationType = type;
    this.bounceFrame = 0; // shouldn't be necessary but just to be safe
};

Tile.prototype.endAnimation = function() {
    this.animationType = "none";
    this.bounceFrame = 0;
};

Tile.prototype.progressAnimationFrame = function() { // returns 1 if progressed, return 0 if done
    if (this.bounceFrame < this.bounceTime) {
        this.bounceFrame++;
        return 1;
    }
    return 0;
    // no resetting frame because i want the animation to stay in its final frame until updated
};

Tile.prototype.getAnimationSize = function() { // translate animationFrame to usable width/height
    // returns size multiplier from animation
    var endScale, overshoot;
    switch (this.animationType) { // set animation params based on type
        case "none":
            endScale = 1;
            overshoot = 1;
            break;
        case "hover":
            endScale = 1;
            overshoot = 1.05;
            break;
        case "click":
            endScale = 1.05;
            overshoot = 1.1;
            break;
        default:
            throw new Error("invalid animation type for Tile.getAnimationSize()");
            break;
    }
    const t = this.bounceFrame / this.bounceTime;
    return bounceScale(t, endScale, overshoot);
};

Tile.prototype.getAnimationType = function() {
    return this.animationType;
};

/**this board class is basically the entire game. everything relevant is in here.**/
var Board = function(shape, skin = "skindefault") { // input shape as 0 for unfilled, 1 for filled
    if (shape.length !== shape[0].length) {
        throw new Error("board shape must be inputted as square for Board() constructor");
    }
    this.board = shape;
    this.skin = skin;
    this.currentWord = []; // array of arrays of length 2 [row, col]
    this.currentTile = []; // length 2, row and col
    this.usedWords = new Set(); // hashmap for yellow
    this.score = 0;
    this.key = []; // sorted list of answers
};

// make the board according to letter distribution (bag w/o replacement)
Board.prototype.generateLetters = function(letters = []) {
    // make a copy of the frequency so you have a bag w/o replacement
    var bag = LETTER_FREQUENCY;
    for (var row = 0; row < this.board.length; row++) {
        for (var col = 0; col < this.board[0].length; col++) {
            if (this.board[row][col] === 1) { // only make tiles at 
                var generateRandom = Math.floor(Math.random() * bag.length);
                var generateLetter = bag[generateRandom];
                bag.splice(generateRandom, 1);
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

// board solver algorithm
Board.prototype.solve = function() { // assume board is already generated, if not gg
    const visited = Array.from({length: this.dim()}, () => Array(this.dim()).fill(false));
    const unsorted = new Set();

    const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    
    // recursive depth first search
    const depthFirstSearch = (row, col, prefix) => {
        if (row < 0 || row >= this.dim() || col < 0 || col >= this.dim()) return;
        if (visited[row][col]) return;

        prefix += this.getTile(row, col).getLetter();
        if (!DICTIONARY.startsWith(prefix)) return;
        if (DICTIONARY.has(prefix) && !unsorted.has(prefix) && prefix.length >= 3) unsorted.add(prefix);
        
        visited[row][col] = true;
        for (let [dr, dc] of directions) {
            depthFirstSearch(row + dr, col + dc, prefix);
        }
        visited[row][col] = false;
    }

    for (var row = 0; row < this.dim(); row++) {
        for (var col = 0; col < this.dim(); col++) {
            depthFirstSearch(row, col, "");
        }
    }

    // sort the found words by greatest to shortest, then alphabetically
    this.key = Array.from(unsorted);
    this.key.sort(function(a, b) {
        if (b.length !== a.length) return b.length - a.length;
        return a.localeCompare(b);
    });
    console.log(this.key);
}

Board.prototype.updateTile = function(status, row, col) {
    // needs to know which tile is being interacted with at call time
    if (this.getTile(row, col) !== 0) {
        this.getTile(row, col).updateStatus(status);
    }
};

Board.prototype.newHover = function(row, col) { // returns 1 if new hover, 0 if failed
    if (this.getTile(row, col).getStatus() !== "none") { // if the new tile is already hovered/clicked, can't update
        return 0;
    }
    if (this.currentTile.length == 2) { // if no currentTile then we'll have index error
        this.updateTile("none", this.currentTile[0], this.currentTile[1]);
    }
    this.currentTile = [row, col];
    this.updateTile("hover", row, col);
    return 1;
};

Board.prototype.selectTile = function(row, col) { // returns 1 if new tile selected, 0 if failed
    // make sure you don't double select
    for (var i = 0; i < this.currentWord.length; i++) {
        if (this.currentWord[i].getRow() === row && this.currentWord[i].getCol() === col) {
            return 0; // can't select
        }
    }
    this.currentWord.push(this.getTile(row, col));
    
    // check status of word to determine color
    for (var i = 0; i < this.currentWord.length; i++) {
        switch (this.evaluateGuess()) {
            case 0: // if the new letter ruins the guess
                this.updateTile("click", this.currentWord[i].getRow(), this.currentWord[i].getCol());
                break;
            case 1: // valid guess
                this.updateTile("valid", this.currentWord[i].getRow(), this.currentWord[i].getCol());
                break;
            case 2: // repeat guess
                this.updateTile("invalid", this.currentWord[i].getRow(), this.currentWord[i].getCol());
                break;
        }
    }
    return 1;
}

Board.prototype.clearGuess = function() { // call every time mouse is released
    // check the guess
    if (this.evaluateGuess() == 1) {
        // give points
        switch (this.currentWord.length) {
            case 3:
                this.score += 100;
                break;
            case 4:
                this.score += 400;
                break;
            case 5:
                this.score += 800;
                break;
            default:
                this.score += 400 * this.currentWord.length - 1000
                break;
        }

        // add to history
        var guess = "";
        for (var i = 0; i < this.currentWord.length; i++) {
            guess += this.currentWord[i].getLetter();
        }
        this.usedWords.add(guess);
    }
    
    // reset all tiles
    for (var row = 0; row < this.board.length; row++) {
        for (var col = 0; col < this.board[0].length; col++) {
            this.updateTile("none", row, col);
        }
    }

    //reset word
    this.currentWord = [];
};

Board.prototype.evaluateGuess = function() { // 0 for wrong, 1 for valid, 2 for repeat
    if (this.currentWord.length < 3) { // all words >= 3
        return 0;
    }
    var guess = "";
    for (var i = 0; i < this.currentWord.length; i++) {
        guess += this.currentWord[i].getLetter();
    }
    if (DICTIONARY.has(guess)) {
        if (this.usedWords.has(guess)) { // repeat
            return 2;
        }
        return 1; // valid
    }
    return 0; // not a valid word
    // we will see
};

Board.prototype.clearAnimations = function() {
    for (var row = 0; row < this.dim(); row++) {
        for (var col = 0; col < this.dim(); col++) {
            this.getTile(row, col).endAnimation();
        }
    }
};

Board.prototype.getTile = function(row, col) {
    if (this.board[row][col] === 0) {
        throw new Error(`tried to Board.getTile(), found none at ${row}, ${col}`);
    }
    return this.board[row][col];
};

Board.prototype.getTiles = function() {
    return this.board;
};

Board.prototype.getCurrentWord = function() { // necessary for drawing
    return this.currentWord;
};

Board.prototype.active = function() { // making a word = active, still hovering = inactive
    return this.currentWord.length > 0;
};

Board.prototype.dim = function() {
    return this.board.length;
};

Board.prototype.getScore = function() {
    return this.score;
};

Board.prototype.getWordCount = function() {
    return this.usedWords.size;
};

export {Tile, Board};
