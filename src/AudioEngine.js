// ============================================
// OUTSYNTH — AudioEngine
// ============================================
// Pro-grade Web Audio API engine.
// Supports dynamic synthesized drum machines, customizable leads,
// real-time sound kit switching, per-channel volume/mute/solo controls, and DRIVE Synth.

export class AudioEngine {
  constructor(soundKitConfig, masterVolume = 0.8) {
    this.soundKitConfig = soundKitConfig || {};
    this.masterVolume = masterVolume;
    this.context = null;
    this.master = null;

    // DRIVE Sound
    this.drive = null;
    this.driveFilter = null;
    this.driveGain = null;
    this.driveEnabled = false;

    // Per-Track / Lane Sound Customizations
    this.trackSettings = [
      {
        id: 'kick',
        name: 'KICK / BASS',
        preset: '808_sub',
        waveform: 'sine',
        baseFreq: 130,
        endFreq: 45,
        decay: 0.28,
        volume: 0.95,
        muted: false,
        solo: false,
      },
      {
        id: 'snare',
        name: 'SNARE / CLAP',
        preset: '909_snare',
        waveform: 'triangle',
        baseFreq: 220,
        noiseAmount: 0.8,
        decay: 0.18,
        volume: 0.85,
        muted: false,
        solo: false,
      },
      {
        id: 'hat',
        name: 'HI-HAT / PERC',
        preset: 'crisp_hat',
        waveform: 'square',
        baseFreq: 8000,
        decay: 0.08,
        volume: 0.70,
        muted: false,
        solo: false,
      },
      {
        id: 'synth',
        name: 'SYNTH / LEAD',
        preset: 'saw_lead',
        waveform: 'sawtooth',
        baseFreq: 261.63, // C4
        filterFreq: 2400,
        decay: 0.45,
        volume: 0.75,
        muted: false,
        solo: false,
      }
    ];

    // Presets database
    this.presets = {
      0: [
        { id: '808_sub', name: '808 Sub Kick', baseFreq: 140, endFreq: 42, decay: 0.32, waveform: 'sine' },
        { id: 'club_punch', name: 'Club Punch Kick', baseFreq: 180, endFreq: 52, decay: 0.22, waveform: 'triangle' },
        { id: 'electro_thump', name: 'Electro Thump', baseFreq: 220, endFreq: 60, decay: 0.15, waveform: 'square' },
        { id: 'deep_acoustic', name: 'Deep Acoustic', baseFreq: 110, endFreq: 38, decay: 0.40, waveform: 'sine' }
      ],
      1: [
        { id: '909_snare', name: '909 Snare', baseFreq: 210, noiseAmount: 0.8, decay: 0.18, waveform: 'triangle' },
        { id: 'cyber_clap', name: 'Cyber Clap', baseFreq: 280, noiseAmount: 0.95, decay: 0.25, waveform: 'square' },
        { id: 'rim_snap', name: 'Rimshot Snap', baseFreq: 450, noiseAmount: 0.3, decay: 0.09, waveform: 'sine' },
        { id: 'laser_zap', name: 'Laser Zap', baseFreq: 880, noiseAmount: 0.4, decay: 0.14, waveform: 'sawtooth' }
      ],
      2: [
        { id: 'crisp_hat', name: 'Crisp Closed Hat', baseFreq: 8000, decay: 0.06, waveform: 'square' },
        { id: 'open_sizzle', name: 'Open Sizzle Hat', baseFreq: 6500, decay: 0.30, waveform: 'square' },
        { id: 'cyber_shaker', name: 'Cyber Shaker', baseFreq: 5000, decay: 0.12, waveform: 'triangle' },
        { id: 'synth_perc', name: 'Synth Perc Block', baseFreq: 1200, decay: 0.08, waveform: 'sine' }
      ],
      3: [
        { id: 'saw_lead', name: 'Neon Saw Lead', baseFreq: 261.63, filterFreq: 2800, decay: 0.45, waveform: 'sawtooth' },
        { id: 'square_pluck', name: 'Retro Chiptune Pluck', baseFreq: 329.63, filterFreq: 3500, decay: 0.22, waveform: 'square' },
        { id: 'acid_bass', name: 'Acid Resonance Bass', baseFreq: 130.81, filterFreq: 1400, decay: 0.35, waveform: 'sawtooth' },
        { id: 'dream_pad', name: 'Dream Chime', baseFreq: 392.00, filterFreq: 4200, decay: 0.70, waveform: 'sine' }
      ]
    };
  }

  start() {
    if (!this.context) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioCtx();
      this.master = this.context.createGain();
      this.master.gain.value = this.masterVolume;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      return this.context.resume();
    }
    return Promise.resolve();
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.masterVolume, this.context.currentTime, 0.02);
    }
  }

  effectiveVolume(lane) {
    const track = this.trackSettings[lane];
    if (!track) return 0;
    if (track.muted) return 0;
    const hasSolo = this.trackSettings.some(t => t.solo);
    if (hasSolo && !track.solo) return 0;
    return track.volume ?? 1.0;
  }

  // ---- Trigger sound for a given lane (0 to 3) ----
  trigger(lane) {
    if (!this.context) return;
    const vol = this.effectiveVolume(lane);
    if (vol <= 0.001) return; // Muted or inactive

    const now = this.context.currentTime;
    const track = this.trackSettings[lane] || this.trackSettings[0];

    switch (lane) {
      case 0: // KICK
        this._playKick(track, vol, now);
        break;
      case 1: // SNARE
        this._playSnare(track, vol, now);
        break;
      case 2: // HI-HAT
        this._playHat(track, vol, now);
        break;
      case 3: // SYNTH
        this._playSynth(track, vol, now);
        break;
    }
  }

  // --- Kick Synthesizer ---
  _playKick(cfg, vol, now) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = cfg.waveform || 'sine';
    osc.frequency.setValueAtTime(cfg.baseFreq || 140, now);
    osc.frequency.exponentialRampToValueAtTime(cfg.endFreq || 42, now + cfg.decay);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + cfg.decay + 0.05);
  }

  // --- Snare Synthesizer ---
  _playSnare(cfg, vol, now) {
    // Tonal body
    const osc = this.context.createOscillator();
    const oscGain = this.context.createGain();
    osc.type = cfg.waveform || 'triangle';
    osc.frequency.setValueAtTime(cfg.baseFreq || 220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + cfg.decay * 0.5);

    oscGain.gain.setValueAtTime(vol * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);
    osc.connect(oscGain);
    oscGain.connect(this.master);

    osc.start(now);
    osc.stop(now + cfg.decay);

    // Noise burst
    const bufferSize = Math.floor(this.context.sampleRate * cfg.decay);
    const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(vol * (cfg.noiseAmount || 0.8), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.master);

    noise.start(now);
    noise.stop(now + cfg.decay);
  }

  // --- Hi-Hat Synthesizer ---
  _playHat(cfg, vol, now) {
    const bufferSize = Math.floor(this.context.sampleRate * cfg.decay);
    const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = noiseBuffer;

    const bandpass = this.context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = cfg.baseFreq || 8000;
    bandpass.Q.value = 4.0;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vol * 0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.master);

    noise.start(now);
    noise.stop(now + cfg.decay);
  }

  // --- Synth Lead Synthesizer ---
  _playSynth(cfg, vol, now) {
    const osc = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    osc.type = cfg.waveform || 'sawtooth';
    osc.frequency.setValueAtTime(cfg.baseFreq || 261.63, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cfg.filterFreq || 2400, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + cfg.decay);

    gain.gain.setValueAtTime(vol * 0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + cfg.decay + 0.05);
  }

  // ---- Continuous DRIVE Sound (Key 'D') ----
  updateDrive(speed, maxSpeed, lane) {
    if (!this.context || !this.driveEnabled || !this.drive) return;
    const ratio = Math.max(0, Math.min(1, speed / maxSpeed));
    const laneFrequencies = [130.81, 155.56, 196.00, 233.08]; // C3, Eb3, G3, Bb3

    const targetFreq = laneFrequencies[lane] || 130.81;
    this.drive.frequency.setTargetAtTime(targetFreq, this.context.currentTime, 0.08);

    // Cutoff opens with vehicle speed
    const cutoff = 200 + ratio * 5500;
    this.driveFilter.frequency.setTargetAtTime(cutoff, this.context.currentTime, 0.06);

    // Gain increases with speed
    const targetGain = (0.02 + ratio * 0.18) * (this.masterVolume);
    this.driveGain.gain.setTargetAtTime(targetGain, this.context.currentTime, 0.06);
  }

  toggleDrive() {
    if (!this.context) return false;
    this.driveEnabled = !this.driveEnabled;
    if (this.driveEnabled && !this.drive) {
      this.drive = this.context.createOscillator();
      this.drive.type = 'sawtooth';
      this.driveFilter = this.context.createBiquadFilter();
      this.driveFilter.type = 'lowpass';
      this.driveFilter.frequency.value = 400;
      this.driveFilter.Q.value = 6.0;

      this.driveGain = this.context.createGain();
      this.driveGain.gain.value = 0;

      this.drive.connect(this.driveFilter);
      this.driveFilter.connect(this.driveGain);
      this.driveGain.connect(this.master);
      this.drive.start();
    }
    if (!this.driveEnabled && this.driveGain) {
      this.driveGain.gain.setTargetAtTime(0, this.context.currentTime, 0.04);
    }
    return this.driveEnabled;
  }

  // ---- Sound Preset & Customization Accessors ----
  setPreset(lane, presetId) {
    const list = this.presets[lane] || [];
    const p = list.find(item => item.id === presetId);
    if (p) {
      Object.assign(this.trackSettings[lane], p);
    }
  }

  setTrackProperty(lane, prop, val) {
    if (this.trackSettings[lane]) {
      this.trackSettings[lane][prop] = val;
    }
  }

  toggleMute(lane) {
    if (this.trackSettings[lane]) {
      this.trackSettings[lane].muted = !this.trackSettings[lane].muted;
      return this.trackSettings[lane].muted;
    }
    return false;
  }

  toggleSolo(lane) {
    if (this.trackSettings[lane]) {
      this.trackSettings[lane].solo = !this.trackSettings[lane].solo;
      return this.trackSettings[lane].solo;
    }
    return false;
  }
}
