// Sound module for Crazy Pong
// Handles 8-bit music and sound effects using the Web Audio API

/**
 * Sound manager for game audio
 */
export class SoundManager {
    constructor() {
        // Initialize audio context
        this.audioContext = null;
        this.masterGainNode = null;
        this.backgroundMusic = null;
        this.backgroundMusicSource = null;
        this.isMuted = false;
        this.sounds = {};
        this.musicVolume = 0.12 * 0.7; // 30% quieter 
        this.sfxVolume = 0.18 * 0.7;   // 30% quieter
        
        // Initialize audio when possible (needs user interaction first)
        this.initialize();
    }
    
    /**
     * Initialize the audio context
     */
    initialize() {
        try {
            // Create audio context
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain node for volume control
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = 1.0;
            this.masterGainNode.connect(this.audioContext.destination);
            
            // Create separate gain nodes for music and SFX
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.gain.value = this.musicVolume;
            this.musicGainNode.connect(this.masterGainNode);
            
            this.sfxGainNode = this.audioContext.createGain();
            this.sfxGainNode.gain.value = this.sfxVolume;
            this.sfxGainNode.connect(this.masterGainNode);
            
            // Load sounds
            this.loadSounds();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser", e);
        }
    }
    
    /**
     * Generate and load sounds
     */
    loadSounds() {
        // Generate only the paddle hit sound effect (remove all others)
        this.sounds = {
            paddle: this.create8BitSound('square', 200, 0.1, 0.05, 0.01, 0.01),
        };
        
        // No background music
        this.backgroundMusic = null;
    }
    
    /**
     * Create an 8-bit sound effect
     * @param {string} type - Oscillator type (square, sawtooth, triangle, sine)
     * @param {number|array} frequency - Frequency or array of frequencies
     * @param {number} duration - Sound duration in seconds
     * @param {number} attack - Attack time in seconds
     * @param {number} decay - Decay time in seconds
     * @param {number} release - Release time in seconds
     * @returns {AudioBuffer} Sound buffer
     */
    create8BitSound(type, frequency, duration, attack, decay, release) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const audioBuffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Convert single frequency to array
        const frequencies = Array.isArray(frequency) ? frequency : [frequency];
        
        // Generate sound data
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // Sum all frequencies
            for (let j = 0; j < frequencies.length; j++) {
                const freq = frequencies[j];
                
                // Apply envelope
                let envelope = 0;
                if (t < attack) {
                    // Attack phase
                    envelope = t / attack;
                } else if (t < attack + decay) {
                    // Decay phase
                    envelope = 1.0 - (0.2 * ((t - attack) / decay));
                } else if (t < duration - release) {
                    // Sustain phase
                    envelope = 0.8;
                } else {
                    // Release phase
                    envelope = 0.8 * (1 - ((t - (duration - release)) / release));
                }
                
                // Generate waveform
                switch (type) {
                    case 'square':
                        sample += envelope * (Math.sin(2 * Math.PI * freq * t) > 0 ? 0.5 : -0.5);
                        break;
                    case 'sawtooth':
                        sample += envelope * (2 * (t * freq - Math.floor(0.5 + t * freq)));
                        break;
                    case 'triangle':
                        sample += envelope * (2 * Math.abs(2 * (t * freq - Math.floor(t * freq)) - 1) - 1);
                        break;
                    case 'sine':
                    default:
                        sample += envelope * Math.sin(2 * Math.PI * freq * t);
                }
            }
            
            // Normalize if multiple frequencies
            sample = sample / frequencies.length;
            
            // Add some 8-bit style quantization noise
            sample = Math.round(sample * 8) / 8;
            
            channelData[i] = sample;
        }
        
        return audioBuffer;
    }
    
    /**
     * Generate 8-bit background music
     * @returns {AudioBuffer} Music buffer
     */
    generate8BitMusic() {
        // Define a more interesting melody in A minor (all notes in this scale are copyright-free)
        const notes = [
            // First measure - Main melody
            { note: 'A4', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'A5', duration: 0.25 },
            
            // Second measure
            { note: 'G5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            { note: 'D5', duration: 0.25 },
            
            // Third measure
            { note: 'E5', duration: 0.5 },
            { note: 'D5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            
            // Fourth measure
            { note: 'A4', duration: 0.75 },
            { note: 'rest', duration: 0.25 },
            
            // Fifth measure - Variation
            { note: 'A4', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'G5', duration: 0.25 },
            
            // Sixth measure
            { note: 'F5', duration: 0.25 },
            { note: 'D5', duration: 0.25 },
            { note: 'B4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            
            // Seventh measure
            { note: 'A4', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'D5', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            
            // Eighth measure
            { note: 'A4', duration: 0.5 },
            { note: 'rest', duration: 0.5 },
        ];
        
        // Define frequencies for notes
        const noteFrequencies = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
            'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
        };
        
        // Calculate total duration
        const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0) * 2;
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * totalDuration;
        const audioBuffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Fill buffer with silence
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = 0;
        }
        
        // Generate the melody
        let currentTime = 0;
        for (let repeat = 0; repeat < 2; repeat++) {
            for (const note of notes) {
                if (note.note !== 'rest') {
                    const freq = noteFrequencies[note.note];
                    const startFrame = Math.floor(currentTime * sampleRate);
                    const endFrame = Math.floor((currentTime + note.duration) * sampleRate);
                    
                    // Create the note
                    for (let i = startFrame; i < endFrame; i++) {
                        const t = (i - startFrame) / sampleRate;
                        
                        // Improved envelope for more pleasant sound
                        let envelope = 1.0;
                        if (t < 0.03) { // Longer attack
                            envelope = t / 0.03;
                        } else if (t > note.duration - 0.08) { // Longer release
                            envelope = (note.duration - t) / 0.08;
                        }
                        
                        // Use triangle wave for a softer sound
                        let sample = envelope * (2 * Math.abs(2 * (t * freq - Math.floor(t * freq)) - 1) - 1);
                        
                        // Add some 8-bit style quantization
                        sample = Math.round(sample * 8) / 8;
                        
                        // Add to existing sample (reduced volume)
                        channelData[i] += sample * 0.2; // Lower volume for music
                    }
                }
                
                currentTime += note.duration;
            }
        }
        
        return audioBuffer;
    }
    
    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound to play
     */
    playSound(soundName) {
        // Only play the paddle hit sound
        if (soundName !== 'paddle' || this.isMuted || !this.audioContext || !this.sounds.paddle) return;
        
        // Resume audio context if suspended (browsers require user interaction)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Create source and connect to gain node
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds.paddle;
        source.connect(this.sfxGainNode);
        
        // Play sound
        source.start();
    }
    
    /**
     * Play background music - disabled
     */
    playMusic() {
        // Background music disabled
        return;
    }
    
    /**
     * Stop background music
     */
    stopMusic() {
        if (this.backgroundMusicSource) {
            try {
                this.backgroundMusicSource.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
            this.backgroundMusicSource = null;
        }
    }
    
    /**
     * Toggle mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.masterGainNode.gain.value = this.isMuted ? 0 : 1.0;
        return this.isMuted;
    }
    
    /**
     * Set music volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.musicVolume;
        }
    }
    
    /**
     * Set sound effects volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = this.sfxVolume;
        }
    }
}
