# 🏓 Pong Madness

A chaotic twist on the classic Pong game where everything—from paddle sizes to gravity—constantly changes to create delightful mayhem!

## About This Project

Pong Madness was developed in a single evening as an experiment to test the capabilities of **Windsurf**, and its "vibe coding" approach. The entire game was created using Windsurf with Claude Sonnet 3.7 as the AI assistant.

## Game Features

### Dynamic Gameplay
- Start with AI vs AI—both paddles are computer-controlled
- Jump in anytime by pressing keys to take control of either paddle
- Left paddle: W/S keys
- Right paddle: Arrow Up/Down keys
- Mobile support: Touch left/right side of screen to control respective paddles

### Chaos Mode
After 5 seconds of gameplay, chaos ensues:
- Paddles randomly change colors, sizes, and speeds
- Balls vary in size and velocity
- Gravity shifts direction and intensity (with visual indicator)
- Game field dimensions fluctuate
- Multiball mayhem with up to 5 balls at once
- Screen shake effects for impact
- Occasional control inversions with warning indicators

### Sound Effects
- Minimal 8-bit paddle hit sounds for that retro feel

## How to Play

1. Open `index.html` in any modern browser to start playing immediately
2. By default, both paddles are AI-controlled
3. Press W/S or Arrow keys to take manual control of a paddle
4. Score points when the ball passes your opponent's paddle
5. The game continues indefinitely—how long can you survive the madness?

## Technical Implementation

- Built with pure HTML5 Canvas, CSS3, and vanilla JavaScript (ES6 modules)
- No external dependencies or libraries
- Modular architecture with clean separation of concerns:
  - Game loop management
  - Physics-based ball movement
  - AI opponent with adjustable difficulty
  - Dynamic parameter transitions
  - Input handling for keyboard and touch
  
## Browser Compatibility

Works in all modern browsers that support HTML5 Canvas and ES6 modules:
- Chrome, Firefox, Safari, Edge, etc.

## License

This project is released as open-source. Feel free to modify and distribute as you like.

---

**Pong Madness**: Embrace the chaos and enjoy the unpredictability! 🎮 

*Created with Windsurf and Claude Sonnet 3.7*