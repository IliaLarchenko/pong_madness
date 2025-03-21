// Main entry point for Crazy Pong game
import { Game } from './modules/game.js';

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the game
    const game = new Game();
    game.init();
});
