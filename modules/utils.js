// Utility functions for Crazy Pong game

/**
 * Get field offset based on canvas dimensions and parameters
 * @param {HTMLCanvasElement} canvas - The game canvas
 * @param {Object} gameParams - Game parameters
 * @returns {Object} Field boundaries
 */
export function getFieldOffset(canvas, gameParams) {
    // Use gameParams field size for dynamic sizing
    const fieldWidth = canvas.width * gameParams.fieldWidth;
    const fieldHeight = canvas.height * gameParams.fieldHeight;
    
    // Center the field in the canvas
    const offsetX = (canvas.width - fieldWidth) / 2;
    const offsetY = (canvas.height - fieldHeight) / 2;
    
    return {
        x: offsetX,
        y: offsetY,
        width: fieldWidth,
        height: fieldHeight
    };
}

/**
 * Generate a random color
 * @returns {string} Hex color code
 */
export function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Generate the inverse of a given color
 * @param {string} hexColor - Hex color to invert
 * @returns {string} Inverted hex color
 */
export function inverseColor(hexColor) {
    // Remove hash if present
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Invert each component
    const invertedR = (255 - r).toString(16).padStart(2, '0');
    const invertedG = (255 - g).toString(16).padStart(2, '0');
    const invertedB = (255 - b).toString(16).padStart(2, '0');
    
    // Return as hex
    return `#${invertedR}${invertedG}${invertedB}`;
}

/**
 * Linear interpolation function
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color
 * @returns {Object} RGB values
 */
export function hexToRgb(hex) {
    // Convert hex color to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 }; // Fallback to white
}

/**
 * Convert RGB values to hex color
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color
 */
export function rgbToHex(r, g, b) {
    // Convert RGB to hex
    return "#" + ((1 << 24) + (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b)).toString(16).slice(1);
}

/**
 * Smoothly transition between colors
 * @param {string} currentColor - Current hex color
 * @param {string} targetColor - Target hex color
 * @param {number} speed - Transition speed
 * @returns {string} New hex color
 */
export function transitionColor(currentColor, targetColor, speed) {
    // Transition smoothly between colors
    const currentRgb = hexToRgb(currentColor);
    const targetRgb = hexToRgb(targetColor);
    
    // Calculate new RGB values with smooth transition
    const newR = currentRgb.r + (targetRgb.r - currentRgb.r) * speed;
    const newG = currentRgb.g + (targetRgb.g - currentRgb.g) * speed;
    const newB = currentRgb.b + (targetRgb.b - currentRgb.b) * speed;
    
    return rgbToHex(newR, newG, newB);
}
