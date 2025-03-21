// Main Game class for Crazy Pong
import { getFieldOffset, inverseColor } from './utils.js';
import { Paddle } from './paddle.js';
import { Ball } from './ball.js';
import { ChaosController } from './chaos.js';
import { SoundManager } from './sound.js';

/**
 * Main Game class that manages the entire game
 */
export class Game {
    /**
     * Create a new game instance
     */
    constructor() {
        // Default game configuration
        this.defaultParams = {
            ballSpeed: 3.5,
            ballSize: 10,
            paddleSize: 100, // Changed from paddleHeight to paddleSize
            paddleWidth: 15,
            paddleSpeed: 8,
            paddleColor: '#00ffff', // Cyan neon color
            fieldWidth: 0.9,
            fieldHeight: 0.9,
            ballColor: '#ff00ff', // Magenta neon color
            backgroundColor: '#0a0a12', // Dark background
            fieldBorderColor: '#1c1c35', // Light border
            trailEffect: true,
            paddlePulse: false,
            screenShake: true,
            invertControls: false,
            ballGravityX: 0,
            ballGravityY: 0,
            multiball: false,
            transitionSpeed: 0.05,
            useNeonEffects: true, // Enable neon glow effects
            useParticles: true // Enable particle effects
        };
        
        // Game state variables
        this.canvas = null;
        this.ctx = null;
        this.shakeAmount = 0;
        this.maxBalls = 5;
        this.gameActive = true;
        this.leftScore = 0;
        this.rightScore = 0;
        this.leftPaddleAI = true;
        this.rightPaddleAI = true;
        this.leftManualControl = false;
        this.invertControlsWarningActive = false;
        this.lastMultiballTime = 0;
        this.lastRandomMultiballTime = 0;
        this.multiballActive = false;
        this.multiballInterval = null;
        
        // Initialize audio
        this.soundManager = new SoundManager();
        
        // Initialize parameters
        this.params = { ...this.defaultParams };
        this.targetParams = { ...this.defaultParams };
        
        // Input state
        this.keys = {
            w: false,
            s: false,
            ArrowUp: false,
            ArrowDown: false
        };
        
        // Game objects
        this.paddleLeft = null;
        this.paddleRight = null;
        this.balls = [];
        
        // Chaos controller
        this.chaosController = new ChaosController(this.defaultParams);
    }
    
    /**
     * Initialize the game
     */
    init() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Resize canvas to fit window
        this.resizeCanvas();
        
        // Create game objects
        this.createGameObjects();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Reset scores
        this.leftScore = 0;
        this.rightScore = 0;
        this.updateScoreDisplay();
        
        // Update player labels
        this.updatePlayerLabels();
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Create initial game objects
     */
    createGameObjects() {
        const field = getFieldOffset(this.canvas, this.params);
        
        // Set default paddle color if not specified
        if (!this.params.paddleColor) {
            this.params.paddleColor = '#00ffff';
        }
        
        // Create paddles - ensure we're using paddleSize for height
        this.paddleLeft = new Paddle(
            field.x + 10, 
            field.y + (field.height - this.params.paddleSize) / 2,
            true, 
            this.params
        );
        
        this.paddleRight = new Paddle(
            field.x + field.width - 10 - this.params.paddleWidth,
            field.y + (field.height - this.params.paddleSize) / 2,
            false,
            this.params
        );
        
        // Create main ball - pass a deep copy of params to ensure it has its own copy of colors
        const mainBall = new Ball(
            this.canvas, 
            this.ctx, 
            {...this.params},
            this.updateScore.bind(this),
            {}, // No custom options
            this.soundManager // Pass the sound manager
        );
        
        this.balls = [mainBall];
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Touch controls for mobile (only if methods are defined) - but disable mouse controls
        if (typeof this.handleTouchStart === 'function' && 'ontouchstart' in window) {
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        }
        if (typeof this.handleTouchMove === 'function' && 'ontouchstart' in window) {
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        }
        if (typeof this.handleTouchEnd === 'function' && 'ontouchstart' in window) {
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        }
        
        // Remove mouse event handlers entirely to avoid conflicts with keyboard controls
        
        // Window resize events
        window.addEventListener('resize', this.resizeCanvas.bind(this));
    }
    
    /**
     * Resize canvas to fit window
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth * 0.9;
        this.canvas.height = window.innerHeight * 0.8;
        
        // Reposition paddles after resize
        if (this.paddleLeft && this.paddleRight) {
            const field = getFieldOffset(this.canvas, this.params);
            
            this.paddleLeft.x = field.x + 10;
            this.paddleRight.x = field.x + field.width - 10 - this.params.paddleWidth;
            
            this.paddleLeft.y = field.y + (field.height - this.paddleLeft.height) / 2;
            this.paddleRight.y = field.y + (field.height - this.paddleRight.height) / 2;
        }
    }
    
    /**
     * Handle touch start (if available on device)
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Determine if touch is on left or right side of screen
        const isLeftSide = touchX < window.innerWidth / 2;
        
        if (isLeftSide) {
            // Left paddle control
            this.leftPaddleAI = false;
            this.leftManualControl = true;
            
            let paddleCenter = this.paddleLeft.y + this.paddleLeft.height / 2;
            if (touchY < paddleCenter) {
                this.keys.w = !this.params.invertControls;
                this.keys.s = this.params.invertControls;
            } else {
                this.keys.w = this.params.invertControls;
                this.keys.s = !this.params.invertControls;
            }
        } else {
            // Right paddle control
            this.rightPaddleAI = false;
            
            let paddleCenter = this.paddleRight.y + this.paddleRight.height / 2;
            if (touchY < paddleCenter) {
                this.keys.ArrowUp = !this.params.invertControls;
                this.keys.ArrowDown = this.params.invertControls;
            } else {
                this.keys.ArrowUp = this.params.invertControls;
                this.keys.ArrowDown = !this.params.invertControls;
            }
        }
        
        if (typeof this.updatePlayerLabels === 'function') {
            this.updatePlayerLabels();
        }
    }
    
    /**
     * Handle touch move
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Determine if touch is on left or right side of screen
        const isLeftSide = touchX < window.innerWidth / 2;
        
        if (isLeftSide) {
            // Left paddle control
            let paddleCenter = this.paddleLeft.y + this.paddleLeft.height / 2;
            if (touchY < paddleCenter) {
                this.keys.w = !this.params.invertControls;
                this.keys.s = this.params.invertControls;
            } else {
                this.keys.w = this.params.invertControls;
                this.keys.s = !this.params.invertControls;
            }
        } else {
            // Right paddle control
            let paddleCenter = this.paddleRight.y + this.paddleRight.height / 2;
            if (touchY < paddleCenter) {
                this.keys.ArrowUp = !this.params.invertControls;
                this.keys.ArrowDown = this.params.invertControls;
            } else {
                this.keys.ArrowUp = this.params.invertControls;
                this.keys.ArrowDown = !this.params.invertControls;
            }
        }
    }
    
    /**
     * Handle touch end
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        e.preventDefault();
        this.keys.w = false;
        this.keys.s = false;
        this.keys.ArrowUp = false;
        this.keys.ArrowDown = false;
    }
    
    /**
     * Handle keyboard press
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        const invertControls = this.params.invertControls;
        
        // Update appropriate key state based on inverted control setting
        if (e.key.toLowerCase() === 'w') this.keys.w = !invertControls;
        if (e.key.toLowerCase() === 's') this.keys.s = !invertControls;
        if (e.key === 'ArrowUp') this.keys.ArrowUp = !invertControls;
        if (e.key === 'ArrowDown') this.keys.ArrowDown = !invertControls;
        
        // If controls are inverted, also set the opposite key
        if (invertControls) {
            if (e.key.toLowerCase() === 'w') this.keys.s = true;
            if (e.key.toLowerCase() === 's') this.keys.w = true;
            if (e.key === 'ArrowUp') this.keys.ArrowDown = true;
            if (e.key === 'ArrowDown') this.keys.ArrowUp = true;
        }
        
        // Manual control for left paddle
        if (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 's') {
            this.leftManualControl = true;
            this.leftPaddleAI = false;
            this.updatePlayerLabels();
        }
        
        // Manual control for right paddle
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            this.rightPaddleAI = false;
            this.updatePlayerLabels();
        }
    }
    
    /**
     * Handle keyboard release
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        const invertControls = this.params.invertControls;
        
        // Update appropriate key state based on inverted control setting
        if (e.key.toLowerCase() === 'w') this.keys.w = false;
        if (e.key.toLowerCase() === 's') this.keys.s = false;
        if (e.key === 'ArrowUp') this.keys.ArrowUp = false;
        if (e.key === 'ArrowDown') this.keys.ArrowDown = false;
        
        // If controls are inverted, also release the opposite key
        if (invertControls) {
            if (e.key.toLowerCase() === 'w') this.keys.s = false;
            if (e.key.toLowerCase() === 's') this.keys.w = false;
            if (e.key === 'ArrowUp') this.keys.ArrowDown = false;
            if (e.key === 'ArrowDown') this.keys.ArrowUp = false;
        }
    }
    
    /**
     * Update the score display
     * @param {string} side - Which side scored (left/right)
     */
    updateScore(side) {
        if (side === 'left') {
            this.leftScore++;
        } else if (side === 'right') {
            this.rightScore++;
        }
        
        this.updateScoreDisplay();
    }
    
    /**
     * Update the score display
     */
    updateScoreDisplay() {
        const leftScoreElement = document.getElementById('leftScoreValue');
        const rightScoreElement = document.getElementById('rightScoreValue');
        
        if (leftScoreElement) {
            leftScoreElement.textContent = this.leftScore;
        }
        
        if (rightScoreElement) {
            rightScoreElement.textContent = this.rightScore;
        }
    }
    
    /**
     * Update the player labels in the DOM
     */
    updatePlayerLabels() {
        const leftLabel = document.getElementById('leftLabel');
        const rightLabel = document.getElementById('rightLabel');
        
        if (leftLabel && rightLabel) {
            leftLabel.textContent = this.leftPaddleAI ? "AI" : "Human";
            rightLabel.textContent = this.rightPaddleAI ? "AI" : "Human";
        }
    }
    
    /**
     * Update warnings in the DOM
     */
    updateWarnings() {
        const warningElement = document.querySelector('.warning');
        this.invertControlsWarningActive = this.params.invertControls;
        
        if (warningElement) {
            if (this.invertControlsWarningActive) {
                warningElement.classList.remove('hidden');
            } else {
                warningElement.classList.add('hidden');
            }
        }
    }
    
    /**
     * Create a new multiball
     * @param {Ball} sourceBall - Source ball for new ball
     */
    createMultiball(sourceBall) {
        // Prevent adding balls if we already have the maximum
        if (this.balls.length >= this.maxBalls) return;
        
        // Check if multiball feature is even enabled
        if (!this.params.multiball) return;
        
        // Check if enough time has passed since last multiball creation
        const currentTime = performance.now();
        if (!this.lastMultiballTime) {
            this.lastMultiballTime = 0;
        }
        
        // Enforce a minimum delay of 500ms between multiballs
        if (currentTime - this.lastMultiballTime < 500) {
            return;
        }
        
        // Create a new ball with random velocity based on source ball
        const newBall = new Ball(
            this.canvas, 
            this.ctx, 
            {...this.params},
            this.updateScore.bind(this),
            {
                x: sourceBall.x,
                y: sourceBall.y,
                dx: -sourceBall.dx * (0.8 + Math.random() * 0.4), // Slightly randomize speed
                dy: sourceBall.dy * (Math.random() < 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4)
            },
            this.soundManager // Pass the sound manager
        );
        
        this.balls.push(newBall);
        this.lastMultiballTime = currentTime;
        
        // Add screen shake effect when new ball appears
        this.shakeAmount = 8;
    }
    
    /**
     * Draw gravity indicator with neon glow effect
     */
    drawGravityIndicator() {
        const field = getFieldOffset(this.canvas, this.params);
        
        // Calculate center of the field
        const centerX = field.x + field.width / 2;
        const centerY = field.y + field.height / 2;
        
        // Increase scale factor for more visible gravity
        const scaleFactor = 2000;
        
        // Calculate end point of the arrow
        let endX = centerX + this.params.ballGravityX * scaleFactor;
        let endY = centerY + this.params.ballGravityY * scaleFactor;
        
        // Limit length of arrow to half of the field height for visibility
        const maxArrowLength = field.height / 2;
        const arrowLength = Math.sqrt(Math.pow(endX - centerX, 2) + Math.pow(endY - centerY, 2));
        
        if (arrowLength > maxArrowLength) {
            const ratio = maxArrowLength / arrowLength;
            endX = centerX + (endX - centerX) * ratio;
            endY = centerY + (endY - centerY) * ratio;
        }
        
        this.ctx.save();
        
        // Add glow effect
        if (this.params.useNeonEffects) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ffff00';
        }
        
        // Create gradient for arrow
        const gradient = this.ctx.createLinearGradient(centerX, centerY, endX, endY);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0.9)');
        
        // Draw arrow line with increased thickness and opacity
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Draw arrow head with glow
        const arrowHeadSize = 10;
        const angle = Math.atan2(endY - centerY, endX - centerX);
        
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowHeadSize * Math.cos(angle - Math.PI / 6),
            endY - arrowHeadSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endX - arrowHeadSize * Math.cos(angle + Math.PI / 6),
            endY - arrowHeadSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * Draw the field with neon effects
     */
    drawField() {
        const field = getFieldOffset(this.canvas, this.params);
        
        this.ctx.save();
        
        // Add glow effect for border
        if (this.params.useNeonEffects) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#00ffff';
        }
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            field.x, 
            field.y, 
            field.x + field.width, 
            field.y + field.height
        );
        borderGradient.addColorStop(0, '#00ffff'); // Cyan
        borderGradient.addColorStop(0.5, '#ff00ff'); // Magenta
        borderGradient.addColorStop(1, '#00ffff'); // Cyan
        
        // Draw border with gradient
        this.ctx.strokeStyle = borderGradient;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            field.x, 
            field.y, 
            field.width, 
            field.height
        );
        
        // Draw center line dashed with glow
        this.ctx.beginPath();
        this.ctx.setLineDash([10, 15]);
        this.ctx.moveTo(this.canvas.width / 2, field.y);
        this.ctx.lineTo(this.canvas.width / 2, field.y + field.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Optional grid pattern
        if (this.params.useNeonEffects) {
            this.drawGridOverlay(field.x, field.y, field.width, field.height);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw subtle grid overlay for field
     */
    drawGridOverlay(fieldX, fieldY, fieldWidth, fieldHeight) {
        this.ctx.save();
        
        // No shadow for grid to keep it subtle
        this.ctx.shadowBlur = 0;
        
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'; // Very subtle cyan
        this.ctx.lineWidth = 1;
        
        // Draw horizontal grid lines
        const gridSize = 30;
        for (let y = fieldY; y <= fieldY + fieldHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(fieldX, y);
            this.ctx.lineTo(fieldX + fieldWidth, y);
            this.ctx.stroke();
        }
        
        // Draw vertical grid lines
        for (let x = fieldX; x <= fieldX + fieldWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, fieldY);
            this.ctx.lineTo(x, fieldY + fieldHeight);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp
     */
    gameLoop(timestamp) {
        // Clear the canvas with background color
        this.ctx.fillStyle = this.params.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate field boundaries ONCE at the beginning of the frame
        // and use these consistently throughout the entire frame
        const field = getFieldOffset(this.canvas, this.params);
        
        // Apply screen shake if active
        let screenOffsetX = 0;
        let screenOffsetY = 0;
        
        if (this.params.screenShake && this.shakeAmount > 0) {
            // More visible screen shake
            screenOffsetX = (Math.random() - 0.5) * this.shakeAmount * 10; 
            screenOffsetY = (Math.random() - 0.5) * this.shakeAmount * 10;
            
            // Decrease shake amount more slowly for longer effect
            this.shakeAmount *= 0.92;
            if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        }
        
        // Add small continuous shake regardless of collisions
        if (this.params.screenShake) {
            screenOffsetX += (Math.random() - 0.5) * 2;
            screenOffsetY += (Math.random() - 0.5) * 2;
        }
        
        this.ctx.save();
        // Apply screen shake offset
        this.ctx.translate(screenOffsetX, screenOffsetY);
        
        // Draw game field background
        this.ctx.fillStyle = this.params.backgroundColor;
        this.ctx.fillRect(field.x, field.y, field.width, field.height);
        
        // Draw border
        this.ctx.strokeStyle = this.params.fieldBorderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(field.x, field.y, field.width, field.height);
        
        if (this.gameActive) {
            // Update parameters with chaos
            this.params = this.chaosController.update(timestamp, this.gameActive);
            
            // Update warnings for inverted controls
            this.updateWarnings();
            
            // Update paddle dimensions to reflect chaos changes
            this.paddleLeft.updateDimensions();
            this.paddleRight.updateDimensions();
            
            // Update paddle positions based on current field dimensions
            this.paddleLeft.x = field.x + 10;
            this.paddleRight.x = field.x + field.width - 10 - this.paddleRight.width;
            
            // Ensure paddles stay within vertical field boundaries
            this.paddleLeft.y = Math.max(field.y, Math.min(field.y + field.height - this.paddleLeft.height, this.paddleLeft.y));
            this.paddleRight.y = Math.max(field.y, Math.min(field.y + field.height - this.paddleRight.height, this.paddleRight.y));
            
            // Update left paddle (player or AI)
            if (!this.leftPaddleAI) {
                this.paddleLeft.update(this.keys, this.canvas, this.params);
            } else {
                const targetBall = this.findClosestBall(this.paddleLeft);
                this.paddleLeft.updateAI(targetBall.y, this.canvas, this.params);
            }
            
            // Update right paddle (player or AI)
            if (!this.rightPaddleAI) {
                this.paddleRight.update(this.keys, this.canvas, this.params);
            } else {
                const targetBall = this.findClosestBall(this.paddleRight);
                this.paddleRight.updateAI(targetBall.y, this.canvas, this.params);
            }
            
            // Update all balls - pass timestamp for reset delay
            for (let i = 0; i < this.balls.length; i++) {
                // Ensure each ball has the latest parameters
                // This is crucial for colors and other visual effects
                this.balls[i].gameParams = {...this.params};
                
                // Update ball size
                this.balls[i].updateSize();
                
                // Update ball position and get updated shake amount
                this.shakeAmount = this.balls[i].update(
                    timestamp, 
                    this.paddleLeft, 
                    this.paddleRight, 
                    this.shakeAmount,
                    this.createMultiball.bind(this)
                );
            }
            
            // Remove any balls that need to be removed
            this.balls = this.balls.filter(ball => !ball.needsRemoval);
            
            // Add a new ball if all balls are gone
            if (this.balls.length === 0) {
                const newBall = new Ball(
                    this.canvas, 
                    this.ctx, 
                    {...this.params}, // Pass a deep copy to ensure color is captured properly
                    this.updateScore.bind(this),
                    {}, // No custom options
                    this.soundManager // Pass the sound manager
                );
                this.balls.push(newBall);
            }
            
            // Handle multiball feature when it first activates
            if (this.params.multiball && !this.multiballActive && this.balls.length < this.maxBalls) {
                // Mark that we've activated multiball mode
                this.multiballActive = true;
                
                // Create all 5 balls in a row with a slight delay between each
                this.createMultiballSequence();
            } else if (!this.params.multiball) {
                // Reset multiball active flag when multiball is off
                this.multiballActive = false;
                
                // If multiball is off and we have more than 1 ball, flag extra balls for removal when scored
                for (let i = 0; i < this.balls.length; i++) {
                    if (i > 0) { // Keep the first ball
                        this.balls[i].shouldRespawn = false;
                    }
                }
            }
        }
        
        // Draw gravity indicator
        this.drawGravityIndicator();
        
        // Draw field
        this.drawField();
        
        // Draw paddles
        this.paddleLeft.draw(this.ctx);
        this.paddleRight.draw(this.ctx);
        
        // Draw all balls
        for (let i = 0; i < this.balls.length; i++) {
            this.balls[i].draw();
        }
        
        // Reset translation for screen shake
        this.ctx.restore();
        
        // Request next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Find the closest ball to a paddle
     * @param {Paddle} paddle - The paddle to find the closest ball to
     * @returns {Ball} The closest ball
     */
    findClosestBall(paddle) {
        if (this.balls.length === 0) {
            // Return a dummy ball at the center if no balls exist
            return { 
                x: this.canvas.width / 2, 
                y: this.canvas.height / 2 
            };
        }
        
        // Find ball closest to paddle that's moving toward it
        let closestBall = this.balls[0];
        let closestDistance = Infinity;
        
        for (let ball of this.balls) {
            // Check if the ball is moving toward the paddle
            const isMovingTowardLeftPaddle = ball.dx < 0 && paddle.isLeft;
            const isMovingTowardRightPaddle = ball.dx > 0 && !paddle.isLeft;
            
            if (isMovingTowardLeftPaddle || isMovingTowardRightPaddle) {
                const distance = Math.abs(ball.y - (paddle.y + paddle.height / 2));
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestBall = ball;
                }
            }
        }
        
        // If no ball is moving toward paddle, pick the closest one
        if (closestDistance === Infinity) {
            for (let ball of this.balls) {
                const distance = Math.abs(ball.y - (paddle.y + paddle.height / 2));
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestBall = ball;
                }
            }
        }
        
        return closestBall;
    }
    
    /**
     * Reset the game
     */
    reset() {
        // Reset game state
        this.gameActive = true;
        this.leftScore = 0;
        this.rightScore = 0;
        this.leftPaddleAI = true;
        this.rightPaddleAI = true;
        this.leftManualControl = false;
        
        // Reset chaos controller
        this.chaosController.reset();
        
        // Reset parameters
        this.params = { ...this.defaultParams };
        this.targetParams = { ...this.defaultParams };
        
        // Reset shake amount
        this.shakeAmount = 0;
        
        // Clear balls
        this.balls = [];
        
        // Recreate game objects
        this.createGameObjects();
        
        // Update UI
        this.updateScoreDisplay();
        this.updatePlayerLabels();
        this.updateWarnings();
    }
    
    /**
     * Create a sequence of multiple balls for multiball mode
     */
    createMultiballSequence() {
        // Cancel any existing sequence
        if (this.multiballInterval) {
            clearInterval(this.multiballInterval);
        }
        
        let ballsToCreate = this.maxBalls - this.balls.length;
        let ballsCreated = 0;
        
        // Create a new ball every 300ms
        this.multiballInterval = setInterval(() => {
            if (ballsCreated >= ballsToCreate || !this.params.multiball || this.balls.length >= this.maxBalls) {
                clearInterval(this.multiballInterval);
                this.multiballInterval = null;
                return;
            }
            
            // Create a new ball from the center with random angle
            const field = getFieldOffset(this.canvas, this.params);
            const angle = Math.random() * Math.PI * 2; // Random direction in 360 degrees
            
            const newBall = new Ball(
                this.canvas, 
                this.ctx, 
                {...this.params},
                this.updateScore.bind(this),
                {
                    x: field.x + field.width / 2,
                    y: field.y + field.height / 2,
                    dx: Math.cos(angle) * this.params.ballSpeed,
                    dy: Math.sin(angle) * this.params.ballSpeed
                },
                this.soundManager // Pass the sound manager
            );
            
            this.balls.push(newBall);
            ballsCreated++;
            
            // Add screen shake effect when new ball appears
            this.shakeAmount = 5;
        }, 300);
    }
    
    /**
     * Start the game
     */
    start() {
        // Make the game instance globally accessible for sound effects
        window.game = this;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the game loop
        this.gameActive = true;
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}
