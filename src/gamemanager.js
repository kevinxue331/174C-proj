export default class GameManager {
    constructor(onReset) {
        this.score = 0;
        this.isGameOver = false;

        this.scoreboard = document.getElementById('scoreboard');
        this.gameoverScreen = document.getElementById('gameover');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.replayButton = document.getElementById('replay-button');
        this.onReset = onReset;

        window.addEventListener('keydown', (event) => this.handleKeyPress(event));
    }

    handleKeyPress(event) {
        if (event.key === 'r' || event.key === 'R') {
            this.resetGame(); // could add check to see if game is over, but easier to test without that
        }
    }


    // Update the score
    updateScore(points) {
        if (!this.isGameOver) {
            this.score += points;
            this.scoreboard.textContent = `Score: ${this.score}`;
        }
    }

    // Show the game-over screen
    gameOver() {
        this.isGameOver = true;
        this.finalScoreDisplay.textContent = this.score;
        this.gameoverScreen.style.display = 'block';
    }

    // Reset the game
    resetGame() {
        this.isGameOver = false;
        this.score = 0;
        this.scoreboard.textContent = `Score: ${this.score}`;
        this.gameoverScreen.style.display = 'none';

        if (this.onReset) {
            this.onReset();
        }
    }

    // Callback for resetting the game
    setResetCallback(callback) {
        this.onReset = callback;
    }
}