// we are building a trie
function TrieNode() {
    this.children = {};
    this.isWord = false;
}

function Trie() {
    this.root = new TrieNode();
}

Trie.prototype.insert = function(word) {
    let node = this.root;
    for (let char of word) {
        if (!node.children[char]) {
            node.children[char] = new TrieNode();
        }
        node = node.children[char];
    }
    node.isWord = true;
};

// check if a prefix exists
Trie.prototype.startsWith = function(prefix) {
    let node = this.root;
    for (let char of prefix) {
        if (!node.children[char]) return false;
        node = node.children[char];
    }
    return true;
};

// check if a word exists
Trie.prototype.has = function(word) {
    let node = this.root;
    for (let char of word) {
        if (!node.children[char]) return false;
        node = node.children[char];
    }
    return node.isWord;
};

/** CALL BEFORE GAME TO LOAD DICTIONARY **/
export const DICTIONARY = new Trie();

export const DICTIONARY_READY = fetch("game/dictionary.txt")
    .then(response => response.text())
    .then(text => { // split lines, trim, remove empty, put in array
        const DICT_ARR = text.split("\n").map(w => w.trim()).filter(Boolean);
        
        // move to set
        for (const word of DICT_ARR) {
            DICTIONARY.insert(word.toUpperCase()); // case should be unnecessary but just in case
        }
        
        console.log("dictionary loaded of size ", DICT_ARR.length);
        return DICTIONARY;
    })
    .catch(err => {
        console.error("dictionary failed to load: ", err);
        throw err;
    });
        
