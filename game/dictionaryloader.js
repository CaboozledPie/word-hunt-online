/** CALL BEFORE GAME TO LOAD DICTIONARY **/
fetch("game/dictionary.txt")
    .then(response => response.text())
    .then(text => {
        // split lines, trim, remove empty
        const DICT_ARR = text
            .split("\n")
            .map(w => w.trim())
            .filter(Boolean);
            
        // move to set
        const DICTIONARY = new Set(DICT_ARR);

        console.log("dictionary loaded of size ", DICTIONARY.size);

        // move to global
        window.DICTIONARY = DICTIONARY;
    })
    .catch(err => console.error("failed to load dictionary: ", err));
