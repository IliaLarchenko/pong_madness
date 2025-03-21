// Chaos Controller for Crazy Pong game
import { transitionColor } from './utils.js';

/**
 * Manages the chaotic changes to game parameters
 */
export class ChaosController {
    /**
     * Create a new chaos controller
     * @param {Object} defaultParams - Default game parameters
     */
    constructor(defaultParams) {
        this.defaultParams = defaultParams;
        this.targetParams = { ...defaultParams };

        // Independent chaos parameters for randomization
        this.chaosParams = [
            { name: "ballSpeed", min: 2, max: 7, current: defaultParams.ballSpeed, target: defaultParams.ballSpeed, nextChange: 0, transitionDuration: 0 },
            { name: "ballSize", min: 5, max: 15, current: defaultParams.ballSize, target: defaultParams.ballSize, nextChange: 0, transitionDuration: 0 },
            { name: "paddleSize", min: 60, max: 130, current: defaultParams.paddleSize, target: defaultParams.paddleSize, nextChange: 0, transitionDuration: 0 },
            { name: "paddleWidth", min: 10, max: 25, current: defaultParams.paddleWidth, target: defaultParams.paddleWidth, nextChange: 0, transitionDuration: 0 },
            { name: "paddleSpeed", min: 5, max: 12, current: defaultParams.paddleSpeed, target: defaultParams.paddleSpeed, nextChange: 0, transitionDuration: 0 },
            { name: "ballGravityX", min: -0.02, max: 0.02, current: 0, target: 0, nextChange: 0, transitionDuration: 0 },
            { name: "ballGravityY", min: -0.1, max: 0.1, current: 0, target: 0, nextChange: 0, transitionDuration: 0 },
            { name: "fieldWidth", min: 0.7, max: 0.95, current: defaultParams.fieldWidth, target: defaultParams.fieldWidth, nextChange: 0, transitionDuration: 0 },
            { name: "fieldHeight", min: 0.7, max: 0.95, current: defaultParams.fieldHeight, target: defaultParams.fieldHeight, nextChange: 0, transitionDuration: 0 },
            { name: "multiball", min: 0, max: 1, current: defaultParams.multiball ? 1 : 0, target: defaultParams.multiball ? 1 : 0, nextChange: 0, transitionDuration: 0, isBoolean: true }
        ];

        // Color chaos parameters
        this.colorParams = [
            { 
                name: "ballColor", 
                current: defaultParams.ballColor || "#ffffff", 
                nextChange: 0,
                getRandomColor: () => {
                    return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
                }
            },
            { 
                name: "paddleColor", 
                current: defaultParams.paddleColor || "#ffffff", 
                nextChange: 0,
                getRandomColor: () => {
                    return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
                }
            },
            { 
                name: "backgroundColor", 
                current: defaultParams.backgroundColor, 
                nextChange: 0,
                getRandomColor: () => {
                    // Dark colors for background
                    return `#${Math.floor(Math.random()*4210752).toString(16).padStart(6, '0')}`;
                }
            },
            { 
                name: "fieldBorderColor", 
                current: defaultParams.fieldBorderColor, 
                nextChange: 0,
                getRandomColor: () => {
                    return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
                }
            }
        ];
        
        // Set initial parameter values
        this.gameParams = { ...defaultParams };
        
        // Control when chaos starts
        this.startTime = 0;
        this.chaosStartDelay = 10000; // 10 seconds delay before chaos starts
        this.invertControls = false;
        this.invertControlsNextChange = 0;
    }
    
    /**
     * Update all chaos parameters
     * @param {number} timestamp - Current timestamp
     * @param {boolean} active - Whether the game is active
     * @returns {Object} Updated game parameters
     */
    update(timestamp, active = true) {
        if (!active) return this.gameParams;
        
        // Don't start chaos until delay has passed
        if (this.startTime === 0) {
            this.startTime = timestamp;
        }
        
        if (timestamp - this.startTime < this.chaosStartDelay) {
            return this.gameParams;
        }
        
        // Update regular parameters
        this.updateParameters(timestamp);
        
        // Update colors
        this.updateColors(timestamp);
        
        // Randomly toggle inverted controls
        this.updateInvertedControls(timestamp);
        
        return this.gameParams;
    }
    
    /**
     * Update non-color game parameters
     * @param {number} timestamp - Current timestamp
     */
    updateParameters(timestamp) {
        // Update each chaos parameter
        this.chaosParams.forEach(param => {
            // Check if it's time for a parameter change
            if (timestamp >= param.nextChange) {
                // Set new target value
                param.target = param.min + Math.random() * (param.max - param.min);
                
                // Schedule next change
                param.nextChange = timestamp + 5000 + Math.random() * 5000;
                param.transitionDuration = 2000 + Math.random() * 1000;
                param.transitionStart = timestamp;
            }
            
            // Smoothly transition to target value
            if (timestamp < param.transitionStart + param.transitionDuration) {
                const progress = (timestamp - param.transitionStart) / param.transitionDuration;
                param.current = param.current + (param.target - param.current) * Math.min(progress, 0.1);
            }
            
            // Apply current value to game parameters
            if (param.isBoolean) {
                this.gameParams[param.name] = param.current > 0.5;
            } else {
                this.gameParams[param.name] = param.current;
            }
        });
    }
    
    /**
     * Update color parameters
     * @param {number} timestamp - Current timestamp
     */
    updateColors(timestamp) {
        this.colorParams.forEach(param => {
            // Generate new colors at random intervals
            if (timestamp >= param.nextChange) {
                // Set next change time
                param.nextChange = timestamp + 2000 + Math.random() * 6000;
                
                // Set new target color
                this.targetParams[param.name] = param.getRandomColor();
            }
            
            // Smoothly transition current color to target color
            this.gameParams[param.name] = transitionColor(
                this.gameParams[param.name], 
                this.targetParams[param.name], 
                0.02  // Transition speed
            );
        });
    }
    
    /**
     * Randomly toggle inverted controls
     * @param {number} timestamp - Current timestamp
     */
    updateInvertedControls(timestamp) {
        if (timestamp >= this.invertControlsNextChange) {
            // 15% chance to invert controls
            const shouldInvert = Math.random() < 0.15;
            this.gameParams.invertControls = shouldInvert;
            
            // Set next change time (10-20 seconds)
            this.invertControlsNextChange = timestamp + 10000 + Math.random() * 10000;
        }
    }
    
    /**
     * Reset all parameters to defaults
     */
    reset() {
        this.gameParams = { ...this.defaultParams };
        this.targetParams = { ...this.defaultParams };
        this.startTime = 0;
        this.invertControlsNextChange = 0;
        
        // Reset all chaos parameters
        this.chaosParams.forEach(param => {
            param.current = this.defaultParams[param.name] || 0;
            param.target = param.current;
            param.nextChange = 0;
        });
        
        // Reset all color parameters
        this.colorParams.forEach(param => {
            param.current = this.defaultParams[param.name];
            param.nextChange = 0;
        });
    }
}
