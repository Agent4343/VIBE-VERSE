/**
 * SoundManager - Synthesized fighting game sounds using Web Audio API
 * Creates retro-style sound effects without external audio files
 */

export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = null;
        this.masterVolume = 0.5;
        this.enabled = true;

        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // === IMPACT SOUNDS ===

    playPunch() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Short noise burst for impact
        const noise = this.createNoise(0.08);
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 800;
        noiseFilter.Q.value = 1;

        noiseGain.gain.setValueAtTime(0.4 * this.masterVolume, now);
        noiseGain.gain.exponentialDecayTo(0.01, now + 0.08);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // Low thump
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialDecayTo(50, now + 0.1);

        oscGain.gain.setValueAtTime(0.5 * this.masterVolume, now);
        oscGain.gain.exponentialDecayTo(0.01, now + 0.1);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playKick() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Heavier impact than punch
        const noise = this.createNoise(0.12);
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();

        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 600;

        noiseGain.gain.setValueAtTime(0.5 * this.masterVolume, now);
        noiseGain.gain.exponentialDecayTo(0.01, now + 0.12);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // Deep thump
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialDecayTo(30, now + 0.15);

        oscGain.gain.setValueAtTime(0.6 * this.masterVolume, now);
        oscGain.gain.exponentialDecayTo(0.01, now + 0.15);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playUppercut() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Rising whoosh
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

        oscGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        oscGain.gain.exponentialDecayTo(0.01, now + 0.2);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);

        // Impact at peak
        setTimeout(() => this.playPunch(), 100);
    }

    playSweep() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Swoosh sound
        const noise = this.createNoise(0.2);
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 0.2);
        noiseFilter.Q.value = 2;

        noiseGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        noiseGain.gain.exponentialDecayTo(0.01, now + 0.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
    }

    playSpecial() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Energy charge sound
        for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200 + i * 100, now + i * 0.05);
            osc.frequency.exponentialRampToValueAtTime(800 + i * 200, now + 0.3);

            oscGain.gain.setValueAtTime(0.2 * this.masterVolume, now + i * 0.05);
            oscGain.gain.exponentialDecayTo(0.01, now + 0.4);

            osc.connect(oscGain);
            oscGain.connect(ctx.destination);

            osc.start(now + i * 0.05);
            osc.stop(now + 0.5);
        }

        // Big impact
        setTimeout(() => {
            this.playKick();
            this.playKick();
        }, 200);
    }

    // === DEFENSIVE SOUNDS ===

    playBlock() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Metallic clang
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'square';
        osc1.frequency.value = 800;

        osc2.type = 'square';
        osc2.frequency.value = 1200;

        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialDecayTo(0.01, now + 0.1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.1);
        osc2.stop(now + 0.1);
    }

    playHit() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Pain grunt approximation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialDecayTo(80, now + 0.15);

        filter.type = 'lowpass';
        filter.frequency.value = 500;

        gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
        gain.gain.exponentialDecayTo(0.01, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // === ANNOUNCER SOUNDS ===

    playFight() {
        if (!this.enabled) return;
        this.resume();
        this.playSynth('fight');
    }

    playRound(number) {
        if (!this.enabled) return;
        this.resume();
        this.playSynth('round');
    }

    playKO() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Dramatic KO sound
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(400 - i * 100, now + i * 0.15);
            osc.frequency.exponentialDecayTo(100, now + 0.3 + i * 0.15);

            gain.gain.setValueAtTime(0.5 * this.masterVolume, now + i * 0.15);
            gain.gain.exponentialDecayTo(0.01, now + 0.4 + i * 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.15);
            osc.stop(now + 0.5 + i * 0.15);
        }
    }

    playWin() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + i * 0.15 + 0.05);
            gain.gain.exponentialDecayTo(0.01, now + i * 0.15 + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.5);
        });
    }

    // === UTILITY SOUNDS ===

    playMenuSelect() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 880;

        gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        gain.gain.exponentialDecayTo(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playMenuConfirm() {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        [660, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.25 * this.masterVolume, now + i * 0.08);
            gain.gain.exponentialDecayTo(0.01, now + i * 0.08 + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.2);
        });
    }

    playCombo(count) {
        if (!this.enabled) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Higher pitch for bigger combos
        const baseFreq = 400 + (count * 50);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialDecayTo(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // === HELPER METHODS ===

    createNoise(duration) {
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.start();

        return noise;
    }

    playSynth(type) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Simple synth patterns for announcer
        const patterns = {
            fight: [
                { freq: 400, dur: 0.1 },
                { freq: 500, dur: 0.1 },
                { freq: 600, dur: 0.2 }
            ],
            round: [
                { freq: 300, dur: 0.15 },
                { freq: 400, dur: 0.15 },
                { freq: 350, dur: 0.2 }
            ]
        };

        const pattern = patterns[type] || patterns.fight;
        let time = now;

        pattern.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.value = note.freq;

            gain.gain.setValueAtTime(0.3 * this.masterVolume, time);
            gain.gain.exponentialDecayTo(0.01, time + note.dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + note.dur + 0.05);

            time += note.dur;
        });
    }

    setVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Polyfill for exponentialDecayTo
if (typeof AudioParam !== 'undefined' && !AudioParam.prototype.exponentialDecayTo) {
    AudioParam.prototype.exponentialDecayTo = function(value, endTime) {
        this.exponentialRampToValueAtTime(Math.max(0.0001, value), endTime);
    };
}
