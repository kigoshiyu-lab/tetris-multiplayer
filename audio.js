/**
 * 8-bit風ループBGM（ラウンド開始時にランダムで1曲）
 * クラシック群は短いアレンジ。テトリスはコロベイニキ（従来実装と同一データ）。
 */
const BGM_CLASSICAL_TRACKS = [
    {
        name: 'Beethoven Sym.5',
        melody: [
            { note: 392, duration: 0.18 }, { note: 392, duration: 0.18 }, { note: 392, duration: 0.18 },
            { note: 311.13, duration: 0.55 },
            { note: 349.23, duration: 0.18 }, { note: 349.23, duration: 0.18 }, { note: 349.23, duration: 0.18 },
            { note: 293.66, duration: 0.55 },
            { note: 311.13, duration: 0.18 }, { note: 311.13, duration: 0.18 }, { note: 311.13, duration: 0.18 },
            { note: 261.63, duration: 0.55 },
            { note: 246.94, duration: 0.35 }, { note: 246.94, duration: 0.35 }, { note: 246.94, duration: 0.35 },
            { note: 246.94, duration: 0.45 }, { note: 0, duration: 0.25 }
        ],
        bass: [
            { note: 98, duration: 0.35 }, { note: 0, duration: 0.35 },
            { note: 87.31, duration: 0.35 }, { note: 0, duration: 0.35 }
        ]
    },
    {
        name: 'Mozart Eine kleine',
        melody: [
            { note: 392, duration: 0.22 }, { note: 293.66, duration: 0.22 }, { note: 392, duration: 0.22 },
            { note: 493.88, duration: 0.22 }, { note: 587.33, duration: 0.35 }, { note: 783.99, duration: 0.35 },
            { note: 587.33, duration: 0.22 }, { note: 493.88, duration: 0.22 }, { note: 392, duration: 0.45 },
            { note: 293.66, duration: 0.22 }, { note: 392, duration: 0.22 }, { note: 493.88, duration: 0.22 },
            { note: 587.33, duration: 0.35 }, { note: 659.25, duration: 0.45 }, { note: 587.33, duration: 0.35 },
            { note: 523.25, duration: 0.5 }, { note: 0, duration: 0.2 }
        ],
        bass: [
            { note: 196, duration: 0.45 }, { note: 146.83, duration: 0.45 },
            { note: 174.61, duration: 0.45 }, { note: 196, duration: 0.45 }
        ]
    },
    {
        name: 'Vivaldi Spring',
        melody: [
            { note: 659.25, duration: 0.2 }, { note: 659.25, duration: 0.2 }, { note: 659.25, duration: 0.2 },
            { note: 493.88, duration: 0.2 }, { note: 523.25, duration: 0.2 }, { note: 587.33, duration: 0.2 },
            { note: 659.25, duration: 0.35 }, { note: 783.99, duration: 0.35 }, { note: 698.46, duration: 0.2 },
            { note: 659.25, duration: 0.2 }, { note: 587.33, duration: 0.2 }, { note: 523.25, duration: 0.35 },
            { note: 329.63, duration: 0.25 }, { note: 329.63, duration: 0.25 }, { note: 293.66, duration: 0.25 },
            { note: 261.63, duration: 0.45 }, { note: 0, duration: 0.2 }
        ],
        bass: [
            { note: 164.81, duration: 0.4 }, { note: 196, duration: 0.4 },
            { note: 220, duration: 0.4 }, { note: 196, duration: 0.4 }
        ]
    },
    {
        name: 'Bizet Carmen',
        melody: [
            { note: 293.66, duration: 0.25 }, { note: 293.66, duration: 0.25 }, { note: 293.66, duration: 0.25 },
            { note: 293.66, duration: 0.35 },
            { note: 220, duration: 0.25 }, { note: 220, duration: 0.25 }, { note: 220, duration: 0.25 },
            { note: 220, duration: 0.35 },
            { note: 293.66, duration: 0.25 }, { note: 293.66, duration: 0.25 }, { note: 293.66, duration: 0.25 },
            { note: 293.66, duration: 0.35 },
            { note: 246.94, duration: 0.3 }, { note: 261.63, duration: 0.3 }, { note: 293.66, duration: 0.45 },
            { note: 220, duration: 0.5 }, { note: 0, duration: 0.2 }
        ],
        bass: [
            { note: 146.83, duration: 0.5 }, { note: 110, duration: 0.5 },
            { note: 123.47, duration: 0.5 }, { note: 110, duration: 0.5 }
        ]
    },
    {
        name: 'Wagner Walkure',
        melody: [
            { note: 164.81, duration: 0.16 }, { note: 196, duration: 0.16 }, { note: 246.94, duration: 0.16 },
            { note: 329.63, duration: 0.45 },
            { note: 196, duration: 0.16 }, { note: 246.94, duration: 0.16 }, { note: 311.13, duration: 0.16 },
            { note: 392, duration: 0.45 },
            { note: 220, duration: 0.16 }, { note: 261.63, duration: 0.16 }, { note: 329.63, duration: 0.16 },
            { note: 440, duration: 0.45 },
            { note: 246.94, duration: 0.16 }, { note: 293.66, duration: 0.16 }, { note: 349.23, duration: 0.16 },
            { note: 493.88, duration: 0.55 }, { note: 392, duration: 0.4 }, { note: 0, duration: 0.2 }
        ],
        bass: [
            { note: 82.41, duration: 0.32 }, { note: 98, duration: 0.32 },
            { note: 110, duration: 0.32 }, { note: 98, duration: 0.32 }
        ]
    },
    {
        name: 'Rossini William Tell',
        melody: [
            { note: 523.25, duration: 0.1 }, { note: 587.33, duration: 0.1 }, { note: 659.25, duration: 0.1 },
            { note: 698.46, duration: 0.1 }, { note: 783.99, duration: 0.1 }, { note: 880, duration: 0.1 },
            { note: 987.77, duration: 0.12 }, { note: 1046.5, duration: 0.15 },
            { note: 1046.5, duration: 0.12 }, { note: 987.77, duration: 0.1 }, { note: 880, duration: 0.1 },
            { note: 783.99, duration: 0.1 }, { note: 698.46, duration: 0.1 }, { note: 659.25, duration: 0.1 },
            { note: 587.33, duration: 0.1 }, { note: 523.25, duration: 0.35 },
            { note: 659.25, duration: 0.2 }, { note: 523.25, duration: 0.45 }, { note: 0, duration: 0.2 }
        ],
        bass: [
            { note: 130.81, duration: 0.2 }, { note: 146.83, duration: 0.2 },
            { note: 164.81, duration: 0.2 }, { note: 174.61, duration: 0.2 }
        ]
    },
    {
        name: 'Tchaikovsky Nutcracker',
        melody: [
            { note: 392, duration: 0.22 }, { note: 392, duration: 0.22 }, { note: 392, duration: 0.22 },
            { note: 392, duration: 0.22 }, { note: 440, duration: 0.22 }, { note: 493.88, duration: 0.22 },
            { note: 523.25, duration: 0.4 }, { note: 587.33, duration: 0.4 }, { note: 523.25, duration: 0.22 },
            { note: 493.88, duration: 0.22 }, { note: 440, duration: 0.22 }, { note: 392, duration: 0.45 },
            { note: 349.23, duration: 0.22 }, { note: 392, duration: 0.22 }, { note: 440, duration: 0.22 },
            { note: 493.88, duration: 0.45 }, { note: 523.25, duration: 0.5 }, { note: 392, duration: 0.45 },
            { note: 0, duration: 0.2 }
        ],
        bass: [
            { note: 196, duration: 0.45 }, { note: 174.61, duration: 0.45 },
            { note: 196, duration: 0.45 }, { note: 174.61, duration: 0.45 }
        ]
    },
    {
        name: 'Tetris Korobeiniki',
        melody: [
            { note: 659.25, duration: 0.4 },
            { note: 493.88, duration: 0.2 },
            { note: 523.25, duration: 0.2 },
            { note: 587.33, duration: 0.4 },
            { note: 523.25, duration: 0.2 },
            { note: 493.88, duration: 0.2 },
            { note: 440.0, duration: 0.4 },
            { note: 440.0, duration: 0.2 },
            { note: 523.25, duration: 0.2 },
            { note: 659.25, duration: 0.4 },
            { note: 587.33, duration: 0.2 },
            { note: 523.25, duration: 0.2 },
            { note: 493.88, duration: 0.6 },
            { note: 523.25, duration: 0.2 },
            { note: 587.33, duration: 0.4 },
            { note: 659.25, duration: 0.4 },
            { note: 523.25, duration: 0.4 },
            { note: 440.0, duration: 0.4 },
            { note: 440.0, duration: 0.4 },
            { note: 0, duration: 0.2 },
            { note: 587.33, duration: 0.4 },
            { note: 698.46, duration: 0.2 },
            { note: 880.0, duration: 0.4 },
            { note: 783.99, duration: 0.2 },
            { note: 698.46, duration: 0.2 },
            { note: 659.25, duration: 0.6 },
            { note: 523.25, duration: 0.2 },
            { note: 659.25, duration: 0.4 },
            { note: 587.33, duration: 0.2 },
            { note: 523.25, duration: 0.2 },
            { note: 493.88, duration: 0.4 },
            { note: 493.88, duration: 0.2 },
            { note: 523.25, duration: 0.2 },
            { note: 587.33, duration: 0.4 },
            { note: 659.25, duration: 0.4 },
            { note: 523.25, duration: 0.4 },
            { note: 440.0, duration: 0.4 },
            { note: 440.0, duration: 0.4 },
            { note: 0, duration: 0.4 }
        ],
        bass: [
            { note: 164.81, duration: 0.4 },
            { note: 0, duration: 0.4 },
            { note: 164.81, duration: 0.4 },
            { note: 0, duration: 0.4 },
            { note: 220.0, duration: 0.4 },
            { note: 0, duration: 0.4 },
            { note: 220.0, duration: 0.4 },
            { note: 0, duration: 0.4 }
        ]
    }
];

/** 8曲: クラシック7 + テトリス（コロベイニキ） */

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

    /** 3・2・1 表示用（0=3, 1=2, 2=1） 音程を少し上げて緊張感 */
    playCountdownTick(step) {
        if (this.isMuted) return;
        const freqs = [392.0, 493.88, 587.33]; // G4, B4, D5
        const freq = freqs[Math.min(Math.max(step, 0), 2)];
        this.createOscillator(freq, 'square', 0.1, 0.28);
    }

    /** START 表示時の短いファンファーレ */
    playCountdownStart() {
        if (this.isMuted) return;
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
        freqs.forEach((freq, i) => {
            setTimeout(() => {
                this.createOscillator(freq, 'square', 0.12, 0.3);
            }, i * 70);
        });
    }

    playItemUse() {
        if (this.isMuted) return;
        this.createOscillator(880, 'square', 0.08, 0.22);
        setTimeout(() => {
            if (!this.isMuted) this.createOscillator(1174.66, 'square', 0.1, 0.2);
        }, 60);
    }

    // ===== BGM: random classical loop (8-bit) =====
    /** 一時停止解除・初回など：今選ばれている曲のループ先頭から */
    startBGM() {
        if (this.isMuted || this.isPlaying) return;
        this.isPlaying = true;
        if (this.activeBgmTrack === undefined || this.activeBgmTrack === null) {
            this.activeBgmTrack = Math.floor(Math.random() * BGM_CLASSICAL_TRACKS.length);
        }
        this.playActiveBgmTrack();
    }

    /** 対戦ラウンド開始時：毎回ランダムに1曲選ぶ */
    startBGMNewRound() {
        this.stopBGM();
        this.activeBgmTrack = Math.floor(Math.random() * BGM_CLASSICAL_TRACKS.length);
        if (this.isMuted) return;
        this.isPlaying = true;
        this.playActiveBgmTrack();
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

    playActiveBgmTrack() {
        if (!this.isPlaying || this.isMuted) return;
        const track = BGM_CLASSICAL_TRACKS[this.activeBgmTrack];
        if (!track) {
            this.activeBgmTrack = 0;
            return this.playActiveBgmTrack();
        }
        this.playMelodySequence(
            track.melody,
            track.bass,
            () => {
                if (this.isPlaying) this.playActiveBgmTrack();
            }
        );
    }

    playMelodySequence(melody, bass, onLoop) {
        if (!this.isPlaying || this.isMuted) return;
        if (!this.audioContext) return;

        const startTime = this.audioContext.currentTime;
        let melodyTime = 0;
        const totalMelodyTime = melody.reduce((s, n) => s + n.duration, 0);

        melody.forEach((note) => {
            if (note.note > 0) {
                const osc = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                osc.type = 'square';
                osc.frequency.value = note.note;
                const noteStart = startTime + melodyTime;
                const noteEnd = noteStart + note.duration;
                gainNode.gain.setValueAtTime(0.14, noteStart);
                gainNode.gain.exponentialRampToValueAtTime(0.01, noteEnd);
                osc.connect(gainNode);
                gainNode.connect(this.bgmGain);
                osc.start(noteStart);
                osc.stop(noteEnd);
            }
            melodyTime += note.duration;
        });

        if (bass && bass.length > 0) {
            let bassTime = 0;
            const patternDur = bass.reduce((s, n) => s + n.duration, 0);
            if (patternDur > 0) {
                while (bassTime < totalMelodyTime - 0.0001) {
                    bass.forEach((note) => {
                        if (bassTime >= totalMelodyTime) return;
                        if (note.note > 0) {
                            const osc = this.audioContext.createOscillator();
                            const gainNode = this.audioContext.createGain();
                            osc.type = 'triangle';
                            osc.frequency.value = note.note;
                            const noteStart = startTime + bassTime;
                            const d = Math.min(note.duration, totalMelodyTime - bassTime);
                            const noteEnd = noteStart + d;
                            gainNode.gain.setValueAtTime(0.18, noteStart);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, noteEnd);
                            osc.connect(gainNode);
                            gainNode.connect(this.bgmGain);
                            osc.start(noteStart);
                            osc.stop(noteEnd);
                        }
                        bassTime += note.duration;
                    });
                }
            }
        }

        setTimeout(() => {
            if (this.isPlaying && onLoop) {
                onLoop();
            }
        }, totalMelodyTime * 1000);
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
