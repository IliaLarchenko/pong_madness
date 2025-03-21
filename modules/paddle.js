// Paddle class for Crazy Pong game
import { getFieldOffset } from './utils.js';

/**
 * Paddle class - handles paddle movement and rendering
 */
export class Paddle {
    /**
     * Create a new paddle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {boolean} isLeft - Whether this is the left paddle
     * @param {Object} gameParams - Game parameters
     */
    constructor(x, y, isLeft = true, gameParams) {
        this.x = x;
        this.y = y;
        this.width = gameParams.paddleWidth;
        this.height = gameParams.paddleSize;
        this.isLeft = isLeft;
        this.gameParams = gameParams;
        this.color = gameParams.paddleColor || '#ffffff';
    }
    
    /**
     * Update paddle position based on keyboard input
     * @param {Object} keys - Keyboard state
     * @param {HTMLCanvasElement} canvas - Game canvas
     * @param {Object} updatedParams - Updated game parameters (optional)
     */
    update(keys, canvas, updatedParams) {
        // Update game parameters if provided
        if (updatedParams) {
            this.gameParams = updatedParams;
        }
        
        // Get current field boundaries for proper positioning
        const field = getFieldOffset(canvas, this.gameParams);
        
        // Move based on keys and which paddle this is
        if (this.isLeft) {
            // Left paddle controls (ONLY W/S keys)
            if (keys['w'] || keys['W']) {
                this.y -= this.gameParams.paddleSpeed;
            }
            if (keys['s'] || keys['S']) {
                this.y += this.gameParams.paddleSpeed;
            }
        } else {
            // Right paddle controls (ONLY Up/Down arrows)
            if (keys['ArrowUp']) {
                this.y -= this.gameParams.paddleSpeed;
            }
            if (keys['ArrowDown']) {
                this.y += this.gameParams.paddleSpeed;
            }
        }
        
        // Keep paddle within field bounds
        this.y = Math.max(field.y, Math.min(field.y + field.height - this.height, this.y));
    }
    
    /**
     * Update paddle position using AI
     * @param {number} targetY - Target Y position
     * @param {HTMLCanvasElement} canvas - Game canvas
     * @param {Object} updatedParams - Updated game parameters (optional)
     */
    updateAI(targetY, canvas, updatedParams) {
        // Update game parameters if provided
        if (updatedParams) {
            this.gameParams = updatedParams;
        }
        
        // Get current field boundaries for proper positioning
        const field = getFieldOffset(canvas, this.gameParams);
        
        // Calculate the center of the paddle
        const paddleCenter = this.y + this.height / 2;
        
        // Always move to ensure the AI is responsive
        const distanceToTarget = targetY - paddleCenter;
        const moveDirection = Math.sign(distanceToTarget);
        const aiSpeed = this.gameParams.paddleSpeed * 0.8; // Speed slightly slower than player
        
        // Move paddle toward the ball
        this.y += moveDirection * aiSpeed;
        
        // Ensure AI paddle stays within field bounds
        this.y = Math.max(field.y, Math.min(field.y + field.height - this.height, this.y));
    }
    
    /**
     * Draw paddle
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.save();
        
        // Add glow effect if enabled
        if (this.gameParams.useNeonEffects) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
        }
        
        // Create gradient fill for paddle
        const gradient = ctx.createLinearGradient(
            this.x, 
            this.y, 
            this.x + this.width, 
            this.y + this.height
        );
        
        // Get a slightly lighter color for gradient effect
        const lighterColor = this.color.replace('rgb', 'rgba').replace(')', ', 0.8)');
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, lighterColor);
        gradient.addColorStop(1, this.color);
        
        // Draw paddle with rounded corners
        const radius = Math.min(8, this.width / 2, this.height / 2);
        
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add subtle inner highlight 
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y + 2);
        ctx.lineTo(this.x + this.width - radius, this.y + 2);
        ctx.quadraticCurveTo(this.x + this.width - 2, this.y + 2, this.x + this.width - 2, this.y + radius + 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * Update paddle dimensions based on game parameters
     */
    updateDimensions() {
        // Update width and height based on game parameters, which change during chaos mode
        this.width = this.gameParams.paddleWidth;
        
        // Use paddleSize consistently for height
        this.height = this.gameParams.paddleSize;
    }
}
