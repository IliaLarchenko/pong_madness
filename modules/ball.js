// Ball class for Crazy Pong game
import { getFieldOffset } from './utils.js';

/**
 * Ball class - handles ball physics, movement and rendering
 */
export class Ball {
    /**
     * Create a new ball
     * @param {HTMLCanvasElement} canvas - Game canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} gameParams - Game parameters
     * @param {Function} updateScore - Score update function
     * @param {Object} options - Optional parameters
     * @param {Object} soundManager - Sound manager instance
     */
    constructor(canvas, ctx, gameParams, updateScore, options = {}, soundManager = null) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameParams = {...gameParams}; // Create a local copy of game parameters
        this.updateScore = updateScore;
        this.size = this.gameParams.ballSize || 10; // Ensure default size
        this.color = this.gameParams.ballColor || '#ff00ff'; // Use magenta neon color
        this.needsRemoval = false;
        this.lastScoreTime = 0;
        this.resetDelay = 500; // 0.5 second delay before resetting
        this.shouldRespawn = true; // By default, balls respawn when scored
        this.soundManager = soundManager;
        
        // Trail effect
        this.trail = [];
        this.maxTrailLength = 10;
        
        // Initialize with custom options or default values
        if (options.dx !== undefined && options.dy !== undefined) {
            this.x = options.x || this.canvas.width / 2;
            this.y = options.y || this.canvas.height / 2;
            this.dx = options.dx;
            this.dy = options.dy;
        } else {
            this.reset();
        }
    }
    
    /**
     * Reset ball to center with random direction
     */
    reset() {
        // Get current field boundaries
        const field = getFieldOffset(this.canvas, this.gameParams);
        
        // Position ball in the center of the field
        this.x = field.x + field.width / 2;
        this.y = field.y + field.height / 2;
        
        // Random direction, but ensure significant horizontal movement
        const angle = (Math.random() * Math.PI / 2.5) - Math.PI / 5; // More horizontal bias
        const direction = Math.random() < 0.5 ? 1 : -1; // Left or right
        
        // Set velocity based on angle and ensure minimum speed
        const minSpeed = Math.max(2, this.gameParams.ballSpeed * 0.8);
        const speed = minSpeed + Math.random() * (this.gameParams.ballSpeed - minSpeed);
        
        this.dx = Math.cos(angle) * speed * direction;
        this.dy = Math.sin(angle) * speed;
        
        // Ensure we never have near-zero horizontal speed
        if (Math.abs(this.dx) < 1) {
            this.dx = direction * 1;
        }
    }
    
    /**
     * Handle ball collision with walls
     * @param {Object} field - Field boundaries
     * @param {number} ballSize - Current ball size
     * @returns {boolean} Whether a collision occurred
     */
    handleWallCollision(field, ballSize) {
        let collided = false;
        
        // Collision with top wall
        if (this.y - ballSize < field.y) {
            this.y = field.y + ballSize; // Correct position
            this.dy = Math.abs(this.dy); // Ensure downward movement
            collided = true;
        }
        
        // Collision with bottom wall
        if (this.y + ballSize > field.y + field.height) {
            this.y = field.y + field.height - ballSize; // Correct position
            this.dy = -Math.abs(this.dy); // Ensure upward movement
            collided = true;
        }
        
        return collided;
    }
    
    /**
     * Handle ball collision with paddle
     * @param {Paddle} paddle - Paddle to check collision with
     * @param {number} ballSize - Current ball size
     * @returns {boolean} Whether a collision occurred
     */
    handlePaddleCollision(paddle, ballSize) {
        // Calculate ball boundaries
        const ballLeft = this.x - ballSize;
        const ballRight = this.x + ballSize;
        const ballTop = this.y - ballSize;
        const ballBottom = this.y + ballSize;
        
        // Calculate paddle boundaries
        const paddleLeft = paddle.x;
        const paddleRight = paddle.x + paddle.width;
        const paddleTop = paddle.y;
        const paddleBottom = paddle.y + paddle.height;
        
        // Check if ball overlaps with paddle
        if (ballRight >= paddleLeft && ballLeft <= paddleRight &&
            ballBottom >= paddleTop && ballTop <= paddleBottom) {
            
            // Calculate intersection depth
            const overlapLeft = ballRight - paddleLeft;
            const overlapRight = paddleRight - ballLeft;
            const overlapTop = ballBottom - paddleTop;
            const overlapBottom = paddleBottom - ballTop;
            
            // Find minimum overlap to determine collision side
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            // Horizontal collision (left/right side of paddle)
            if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                // Flip horizontal direction
                this.dx = -this.dx;
                
                // Adjust position to prevent sticking
                if (minOverlap === overlapLeft) {
                    this.x = paddleLeft - ballSize;
                } else {
                    this.x = paddleRight + ballSize;
                }
                
                // Add angle based on where ball hit the paddle
                const hitPosition = (this.y - paddle.y) / paddle.height;
                this.dy = (hitPosition - 0.5) * 2 * Math.abs(this.dx);
                
                // Enforce minimum horizontal speed
                const minSpeed = 2;
                if (Math.abs(this.dx) < minSpeed) {
                    this.dx = this.dx > 0 ? minSpeed : -minSpeed;
                }
            } 
            // Vertical collision (top/bottom of paddle) - less common
            else {
                // Flip vertical direction
                this.dy = -this.dy;
                
                // Adjust position to prevent sticking
                if (minOverlap === overlapTop) {
                    this.y = paddleTop - ballSize;
                } else {
                    this.y = paddleBottom + ballSize;
                }
            }
            
            // Increase ball speed slightly with each paddle hit
            const speedIncrease = 0.1;
            this.dx *= (1 + speedIncrease);
            this.dy *= (1 + speedIncrease);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Update ball position and handle collisions
     * @param {number} timestamp - Current timestamp
     * @param {Paddle} paddleLeft - Left paddle
     * @param {Paddle} paddleRight - Right paddle
     * @param {number} shakeAmount - Current screen shake amount
     * @param {Function} createMultiball - Callback to create multiball
     * @returns {number} Updated shake amount
     */
    update(timestamp, paddleLeft, paddleRight, shakeAmount = 0, createMultiball = null) {
        // Don't update if we're in the reset delay period
        if (this.lastScoreTime > 0) {
            const delayElapsed = timestamp - this.lastScoreTime;
            if (delayElapsed < this.resetDelay) {
                // Still waiting for reset delay
                return shakeAmount;
            } else {
                // Reset delay is over
                this.lastScoreTime = 0;
            }
        }
        
        // Get field boundaries
        const field = getFieldOffset(this.canvas, this.gameParams);
        
        // Adjust ballSize based on current parameters
        const ballSize = this.size / 2;
        
        // Store current position for trail effect
        if (this.gameParams.trailEffect) {
            this.trail.push({x: this.x, y: this.y, size: this.size});
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        } else {
            // Clear trail if effect is disabled
            this.trail = [];
        }
        
        // Apply gravity
        this.dx += this.gameParams.ballGravityX || 0;
        this.dy += this.gameParams.ballGravityY || 0;
        
        // Update position
        this.x += this.dx;
        this.y += this.dy;
        
        // Check for wall collisions
        if (this.handleWallCollision(field, ballSize)) {
            // Wall collision occurred, increase shake
            shakeAmount += 1;
        }
        
        // Check for paddle collisions
        let paddleHit = false;
        
        // Check left paddle collision
        if (this.dx < 0 && this.handlePaddleCollision(paddleLeft, ballSize)) {
            paddleHit = true;
        }
        
        // Check right paddle collision
        if (this.dx > 0 && this.handlePaddleCollision(paddleRight, ballSize)) {
            paddleHit = true;
        }
        
        // Handle paddle hit effects
        if (paddleHit) {
            // Increase shake on paddle hit
            shakeAmount += 3;
            
            // Play paddle hit sound if available
            if (this.soundManager) {
                this.soundManager.playSound('paddle');
            }
            
            // Random chance to create multiball if enabled
            if (createMultiball && this.gameParams.multiball && Math.random() < 0.05) {
                createMultiball(this);
            }
        }
        
        // Completely out of bounds on left side (right player scores)
        if (this.x + ballSize < field.x) {
            if (this.updateScore) {
                this.updateScore('right');
            }
            
            if (this.shouldRespawn) {
                this.lastScoreTime = timestamp;
                this.reset();
            } else {
                // Mark for removal if this ball shouldn't respawn
                this.needsRemoval = true;
            }
        }
        
        // Completely out of bounds on right side (left player scores)
        if (this.x - ballSize > field.x + field.width) {
            if (this.updateScore) {
                this.updateScore('left');
            }
            
            if (this.shouldRespawn) {
                this.lastScoreTime = timestamp;
                this.reset();
            } else {
                // Mark for removal if this ball shouldn't respawn
                this.needsRemoval = true;
            }
        }
        
        return shakeAmount;
    }
    
    /**
     * Update ball size and color based on game parameters
     */
    updateSize() {
        this.size = this.gameParams.ballSize || 10;
        // Also update color whenever size is updated
        if (this.gameParams.ballColor) {
            this.color = this.gameParams.ballColor;
        }
    }
    
    /**
     * Draw the ball on the canvas with neon effects
     */
    draw() {
        // Draw trail effect
        if (this.gameParams.trailEffect && this.trail.length > 0) {
            for (let i = 0; i < this.trail.length; i++) {
                const trailPoint = this.trail[i];
                const alpha = i / this.trail.length; // Fade based on position in trail
                const trailColor = this.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
                
                this.ctx.beginPath();
                this.ctx.arc(
                    trailPoint.x,
                    trailPoint.y,
                    (trailPoint.size/2) * (0.3 + 0.7 * (i / this.trail.length)), // Smaller for older trail points
                    0,
                    Math.PI * 2
                );
                this.ctx.fillStyle = trailColor;
                this.ctx.fill();
            }
        }
        
        // Apply glow effect for main ball
        if (this.gameParams.useNeonEffects) {
            this.ctx.save();
            this.ctx.shadowColor = this.color;
            this.ctx.shadowBlur = 15;
        }
        
        // Draw the main ball with gradient fill
        const gradient = this.ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
        );
        
        // Create a brighter center for the glow effect
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, this.color);
        
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Optional: add subtle ring around the ball
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size/2 + 1, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        if (this.gameParams.useNeonEffects) {
            this.ctx.restore();
        }
    }
}
