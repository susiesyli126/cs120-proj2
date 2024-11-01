const WordleGame = {
    wordList: [], // array of valid 5-letter words
    answerWord: '', // stores correct answer word 
    guessCount: 0, // number of guesses tracker 
    totalGuesses: 0, // track total guesses across multiple browser sessions
    gameCount: 0, // track number of games the user has played 

    // initialize the game board
    createBoard() {
        const board = document.getElementById('board');
        for (let row = 0; row < 6; row++) { // creates 6 rows (6 tries)
            for (let col = 0; col < 5; col++) {
                let div = document.createElement('div');
                div.classList.add('letter-box', `row-${row}`, `col-${col}`);
                board.appendChild(div);
            }
        }
    },

    // creates the word list from a local file 
    createWordList() {
        fetch('five-letter-words.txt')
            .then(response => response.text())
            .then(data => {
                // convert text file into an array of words
                this.wordList = data.split('\n').filter(word => word.length === 5);
                this.setAnswerWord();
            })
            .catch(error => {
                console.error('Error fetching the word list:', error);
            });
    },

    // randomly selects a word from the word list as the correct answer
    setAnswerWord() {
        if (this.wordList.length > 0) {
            this.answerWord = this.wordList[Math.floor(Math.random() * this.wordList.length)].trim();
            console.log('Answer:', this.answerWord);
        }
    },

    // uses an API to check if user's input is a valid word 
    validateWord(guess) {
        return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`)
            .then(response => response.ok)
            .catch(error => {
                console.error('Error validating the word:', error); // for debugging 
                return false;
            });
    },

    // checks the user's guess against the answer
    checkGuess(guess) {
        const guessArray = guess.split(''); // array of letters 
        const answerArray = this.answerWord.split(''); // array of answer letters 

        // check letter by letter 
        guessArray.forEach((letter, index) => {
            const letterBox = document.querySelector(`.row-${this.guessCount}.col-${index}`);
            
            // display the guessed letter in the corresponding box
            letterBox.textContent = letter.toUpperCase();
            
            if (letter === answerArray[index]) {
                letterBox.classList.add('correct');
            } else if (answerArray.includes(letter)) {
                letterBox.classList.add('wrong-place');
            } else {
                letterBox.classList.add('not-in-word');
            }
        });
    },

    // display confetti on screen. called when user guesses a word correctly 
    showConfetti() {
        this.jsConfetti.addConfetti({
            // sets colors 
            confettiColors: [
                '#FF0000', // red
                '#FF7F00', // orange
                '#FFFF00', // yellow
                // '#00FF00', // green
                // '#00FF00', // lime
                // // '#0000FF', // blue
                // '#7DD0D7', // indigo
                // '#9400D3', // violet
                // '#C0C0C0'  // silver
                // '#EE7EAD',
                '#FFA9BA', // dark pink
                '#FFD7D6', // light pink 
                '#FFAF6E', // orange
                '#EA7D70', // light orange 
                '#F69F95',
                '#FFE2A6',
                '#DBE098', // light green 
                // '#CAE7D3', // mint green
                // '#D5EDF8', // light blue
            ],  
            confettiRadius: 4, // sets size 
            confettiNumber: 1200 // sets number of confetti pieces 
        });
    },

    // take user input, check if it's valid, display result on board 
    async handleGuessSubmission() {
        const guess = document.getElementById('guess-input').value.toLowerCase();
        // error check: not a 5-letter word 
        if (guess.length !== 5) {
            alert('Please enter a 5-letter word.');
            return;
        }
        // error check: user guessed an invalid word 
        const isValidWord = await this.validateWord(guess);
        if (!isValidWord) {
            alert('Please enter a valid word.');
            return;
        }
        // input is valid, process answer 
        if (guess.length === 5) {
            this.checkGuess(guess); // check letter by letter 
            this.guessCount++;
            document.getElementById('guess-input').value = ''; // clear input string 
            
            if (guess === this.answerWord) { // user guessed correctly 
                alert(`Congrats you win! The word was: ${this.answerWord}`);
                this.showConfetti();  
                this.updateGameStats(this.guessCount);
                document.getElementById('restart').classList.add('show');
            } else if (this.guessCount === 6) { // reached 6 guesses 
                alert(`Game over! The word was: ${this.answerWord}`);
                this.updateGameStats(6);
                document.getElementById('restart').classList.add('show');
            }
        } 
    },

    /*******************************************************************
     *                          COOKIE FUNCTIONS                       *
     *******************************************************************/
    // set cookie + when it expires 
    setCookie(name, value, days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // x number of days since now 
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    },
    
    // retrive cookie based on name 
    getCookie(name) {
        const username = name + "="; // make 'wordleStats='
        const ca = document.cookie.split(';'); // split into array 
        for (let i = 0; i < ca.length; i++) { // loop through cookies 
            let c = ca[i]; // c = current cookie 
            while (c.charAt(0) === ' ') c = c.substring(1); // cut leading spaces 
            if (c.indexOf(username) === 0) return c.substring(username.length, c.length); // found cookie, return
        }
        return null; // if we get here, no cookie found, return null 
    },

    // load game statistics from cookies
    loadGameStats() {
        const stats = this.getCookie('wordleStats'); // retrive cookie 
        if (stats) { // if cookie exists 
            const parsedStats = JSON.parse(stats); // parse stats in cookie 
            this.totalGuesses = parsedStats.totalGuesses || 0; // default to 0 if undefined 
            this.gameCount = parsedStats.gameCount || 0; // default to 0 if undefined 
        }
    },

    // save this game's to cookies
    saveGameStats() {
        const stats = { // JS object 
            totalGuesses: this.totalGuesses,
            gameCount: this.gameCount
        };
        this.setCookie('wordleStats', JSON.stringify(stats), 2); // store for 2 days
    },

    // update statistics after each game
    updateGameStats(currentGuessCount) {
        this.totalGuesses += currentGuessCount; // add this game's number of guesses 
        this.gameCount++;
        this.saveGameStats();
        this.showAverageStats();
    },

    // display average guesses across multiple sessions 
    showAverageStats() {
        let averageGuesses = 0; 
        if (this.gameCount !== 0) { // prevent div by 0 error 
            averageGuesses = this.totalGuesses / this.gameCount.toFixed(2);
        } 
        const averageElement = document.getElementById('average-guesses');
        averageElement.textContent = `Average guesses per game: ${averageGuesses}`;
    },

    // restarts the game
    restartGame() {
        this.guessCount = 0;
        const board = document.getElementById('board');
        this.createBoard();
        this.setAnswerWord();
        document.getElementById('restart').classList.remove('show');
        document.getElementById('guess-input').value = '';
    },

    // starts a game by creating the word list + setting up the board and cookie 
    init() {
        this.jsConfetti = new JSConfetti();  
        this.loadGameStats(); // track average 
        this.createWordList();
        this.createBoard();
        this.showAverageStats();

        // event handler: user clicks "submit guess" button to enter a guess 
        document.getElementById('submit-guess').addEventListener('click', () => {
            this.handleGuessSubmission();
        });

        // event handler: user submits guess by hitting enter key 
        document.getElementById('guess-input').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.handleGuessSubmission();
            }
        });

        // event handler: user clicks restart game 
        document.getElementById('restart').addEventListener('click', () => {
            this.restartGame();
        });
    }
};

// initialize a game
WordleGame.init();