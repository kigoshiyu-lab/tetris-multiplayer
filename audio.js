// ===== 8-bit Audio System =====
class ChiptuneAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.currentBGM = null;
        this.isPlaying = false;
        this.isMuted = false;

        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);

            // BGM gain
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.gain.value = 0.5;
            this.bgmGain.connect(this.masterGain);

            // SFX gain
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.7;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }

    // ===== Create Oscillator =====
    createOscillator(frequency, type = 'square', duration = 0.1, gain = 0.3) {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        gainNode.gain.value = gain;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + duration);

        return { osc, gainNode };
    }

    // ===== Sound Effects =====
    playRotate() {
        if (this.isMuted) return;
        this.createOscillator(523.25, 'square', 0.05, 0.2); // C5
    }

    playMove() {
        if (this.isMuted) return;
        this.createOscillator(392.00, 'square', 0.03, 0.15); // G4
    }

    playDrop() {
        if (this.isMuted) return;
        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playClearLine() {
        if (this.isMuted) return;
        const now = this.audioContext.currentTime;
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.createOscillator(freq, 'square', 0.1, 0.25);
            }, i * 50);
        });
    }

    playGameOver() {
        if (this.isMuted) return;
        const now = this.audioContext.currentTime;
        const frequencies = [392, 370, 349, 330, 294]; // Descending notes

        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.createOscillator(freq, 'square', 0.2, 0.3);
            }, i * 100);
        });
    }

    playLevelUp() {
        if (this.isMuted) return;
        const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 to E6

        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.createOscillator(freq, 'square', 0.08, 0.25);
            }, i * 60);
        });
    }

    // ===== BGM - Tetris Theme (8-bit style) =====
    startBGM() {
        if (this.isMuted || this.isPlaying) return;
        this.isPlaying = true;
        this.playTetrisTheme();
    }

    stopBGM() {
        this.isPlaying = false;
        if (this.currentBGM) {
            this.currentBGM.forEach(node => {
                if (node && node.stop) {
                    try { node.stop(); } catch (e) { }
                }
            });
            this.currentBGM = [];
        }
    }

    playTetrisTheme() {
        if (!this.isPlaying || this.isMuted) return;

        // Tetris Theme A (Korobeiniki) - Simplified 8-bit version
        const melody = [
            { note: 659.25, duration: 0.4 },  // E5
            { note: 493.88, duration: 0.2 },  // B4
            { note: 523.25, duration: 0.2 },  // C5
            { note: 587.33, duration: 0.4 },  // D5
            { note: 523.25, duration: 0.2 },  // C5
            { note: 493.88, duration: 0.2 },  // B4
            { note: 440.00, duration: 0.4 },  // A4
            { note: 440.00, duration: 0.2 },  // A4
            { note: 523.25, duration: 0.2 },  // C5
            { note: 659.25, duration: 0.4 },  // E5
            { note: 587.33, duration: 0.2 },  // D5
            { note: 523.25, duration: 0.2 },  // C5
            { note: 493.88, duration: 0.6 },  // B4
            { note: 523.25, duration: 0.2 },  // C5
            { note: 587.33, duration: 0.4 },  // D5
            { note: 659.25, duration: 0.4 },  // E5
            { note: 523.25, duration: 0.4 },  // C5
            { note: 440.00, duration: 0.4 },  // A4
            { note: 440.00, duration: 0.4 },  // A4
            { note: 0, duration: 0.2 },       // Rest

            { note: 587.33, duration: 0.4 },  // D5
            { note: 698.46, duration: 0.2 },  // F5
            { note: 880.00, duration: 0.4 },  // A5
            { note: 783.99, duration: 0.2 },  // G5
            { note: 698.46, duration: 0.2 },  // F5
            { note: 659.25, duration: 0.6 },  // E5
            { note: 523.25, duration: 0.2 },  // C5
            { note: 659.25, duration: 0.4 },  // E5
            { note: 587.33, duration: 0.2 },  // D5
            { note: 523.25, duration: 0.2 },  // C5
            { note: 493.88, duration: 0.4 },  // B4
            { note: 493.88, duration: 0.2 },  // B4
            { note: 523.25, duration: 0.2 },  // C5
            { note: 587.33, duration: 0.4 },  // D5
            { note: 659.25, duration: 0.4 },  // E5
            { note: 523.25, duration: 0.4 },  // C5
            { note: 440.00, duration: 0.4 },  // A4
            { note: 440.00, duration: 0.4 },  // A4
            { note: 0, duration: 0.4 },       // Rest
        ];

        // Bass line (simplified)
        const bass = [
            { note: 164.81, duration: 0.4 },  // E3
            { note: 0, duration: 0.4 },
            { note: 164.81, duration: 0.4 },
            { note: 0, duration: 0.4 },
            { note: 220.00, duration: 0.4 },  // A3
            { note: 0, duration: 0.4 },
            { note: 220.00, duration: 0.4 },
            { note: 0, duration: 0.4 },
        ];

        this.playMelodySequence(melody, bass);
    }

    playMelodySequence(melody, bass) {
        if (!this.isPlaying || this.isMuted) return;

        let melodyTime = 0;
        let bassTime = 0;
        const startTime = this.audioContext.currentTime;

        // Play melody
        melody.forEach((note, i) => {
            if (note.note > 0) {
                const osc = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                osc.type = 'square';
                osc.frequency.value = note.note;

                const noteStart = startTime + melodyTime;
                const noteEnd = noteStart + note.duration;

                gainNode.gain.setValueAtTime(0.15, noteStart);
                gainNode.gain.exponentialRampToValueAtTime(0.01, noteEnd);

                osc.connect(gainNode);
                gainNode.connect(this.bgmGain);

                osc.start(noteStart);
                osc.stop(noteEnd);
            }
            melodyTime += note.duration;
        });

        // Play bass
        for (let i = 0; i < 10; i++) {
            bass.forEach((note) => {
                if (note.note > 0) {
                    const osc = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();

                    osc.type = 'triangle';
                    osc.frequency.value = note.note;

                    const noteStart = startTime + bassTime;
                    const noteEnd = noteStart + note.duration;

                    gainNode.gain.setValueAtTime(0.2, noteStart);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, noteEnd);

                    osc.connect(gainNode);
                    gainNode.connect(this.bgmGain);

                    osc.start(noteStart);
                    osc.stop(noteEnd);
                }
                bassTime += note.duration;
            });
        }

        // Loop the BGM
        const totalDuration = melodyTime * 1000;
        setTimeout(() => {
            if (this.isPlaying) {
                this.playTetrisTheme();
            }
        }, totalDuration);
    }

    // ===== Toggle Mute =====
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBGM();
            this.masterGain.gain.value = 0;
        } else {
            this.masterGain.gain.value = 0.3;
            this.startBGM();
        }
        return this.isMuted;
    }

    // ===== Resume Audio Context (for browser autoplay policy) =====
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Create global audio instance
const gameAudio = new ChiptuneAudio();
