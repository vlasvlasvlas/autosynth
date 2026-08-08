// ============================================
// OUTSYNTH — AudioEngine v0.3
// ============================================
// 6-lane Web Audio engine with scale selector,
// drive mode, sustain, per-channel mixer controls.

export class AudioEngine {
  constructor(soundKitConfig, masterVolume = 0.8) {
    this.soundKitConfig = soundKitConfig || {};
    this.masterVolume = masterVolume;
    this.context = null;
    this.master = null;

    this.drive = null;
    this.driveFilter = null;
    this.driveGain = null;
    this.driveMode = false;

    this.driveFrequencies = [130.81, 155.56, 196.00, 233.08, 261.63, 311.13];
    this.currentScale = { rootNote: 'C', scaleType: 'minor_pentatonic' };

    this.trackSettings = [
      { id: 'kick',      name: 'KICK',      preset: '808_sub',    waveform: 'sine',     baseFreq: 130,    endFreq: 45,  decay: 0.28, volume: 0.95, muted: false, solo: false },
      { id: 'snare',     name: 'SNARE',     preset: '909_snare',  waveform: 'triangle', baseFreq: 220,    noiseAmount: 0.8,  decay: 0.18, volume: 0.85, muted: false, solo: false },
      { id: 'hat',       name: 'HI-HAT',    preset: 'crisp_hat',  waveform: 'square',   baseFreq: 8000,   decay: 0.08, volume: 0.70, muted: false, solo: false },
      { id: 'clap',      name: 'CLAP',      preset: 'cyber_clap', waveform: 'square',   baseFreq: 280,    noiseAmount: 0.95, decay: 0.14, volume: 0.80, muted: false, solo: false },
      { id: 'synth_low', name: 'SYNTH LOW', preset: 'acid_bass',  waveform: 'sawtooth', baseFreq: 130.81, filterFreq: 1400, decay: 0.35, volume: 0.75, muted: false, solo: false },
      { id: 'synth_high',name: 'SYNTH HIGH',preset: 'dream_pad',  waveform: 'sine',     baseFreq: 261.63, filterFreq: 4200, decay: 0.50, volume: 0.70, muted: false, solo: false },
    ];

    this.presets = {
      0: [
        { id: '808_sub',       name: '808 Sub Kick',    baseFreq: 140,    endFreq: 42,  decay: 0.32, waveform: 'sine' },
        { id: 'club_punch',    name: 'Club Punch',      baseFreq: 180,    endFreq: 52,  decay: 0.22, waveform: 'triangle' },
        { id: 'electro_thump', name: 'Electro Thump',   baseFreq: 220,    endFreq: 60,  decay: 0.15, waveform: 'square' },
        { id: 'deep_acoustic', name: 'Deep Acoustic',   baseFreq: 110,    endFreq: 38,  decay: 0.40, waveform: 'sine' },
      ],
      1: [
        { id: '909_snare',  name: '909 Snare',      baseFreq: 210, noiseAmount: 0.8,  decay: 0.18, waveform: 'triangle' },
        { id: 'cyber_clap', name: 'Cyber Clap',     baseFreq: 280, noiseAmount: 0.95, decay: 0.25, waveform: 'square' },
        { id: 'rim_snap',   name: 'Rimshot Snap',   baseFreq: 450, noiseAmount: 0.3,  decay: 0.09, waveform: 'sine' },
        { id: 'laser_zap',  name: 'Laser Zap',      baseFreq: 880, noiseAmount: 0.4,  decay: 0.14, waveform: 'sawtooth' },
      ],
      2: [
        { id: 'crisp_hat',    name: 'Crisp Closed Hat', baseFreq: 8000, decay: 0.06, waveform: 'square' },
        { id: 'open_sizzle',  name: 'Open Sizzle',      baseFreq: 6500, decay: 0.30, waveform: 'square' },
        { id: 'cyber_shaker', name: 'Cyber Shaker',     baseFreq: 5000, decay: 0.12, waveform: 'triangle' },
        { id: 'synth_perc',   name: 'Synth Perc',       baseFreq: 1200, decay: 0.08, waveform: 'sine' },
      ],
      3: [
        { id: 'cyber_clap',  name: 'Cyber Clap',   baseFreq: 280, noiseAmount: 0.95, decay: 0.14, waveform: 'square' },
        { id: 'hand_clap',   name: 'Hand Clap',    baseFreq: 350, noiseAmount: 0.7,  decay: 0.18, waveform: 'triangle' },
        { id: 'snap',        name: 'Finger Snap',  baseFreq: 600, noiseAmount: 0.5,  decay: 0.07, waveform: 'sine' },
        { id: 'wood_block',  name: 'Wood Block',   baseFreq: 800, noiseAmount: 0.2,  decay: 0.05, waveform: 'square' },
      ],
      4: [
        { id: 'acid_bass',   name: 'Acid Bass',    baseFreq: 130.81, filterFreq: 1400, decay: 0.35, waveform: 'sawtooth' },
        { id: 'sub_bass',    name: 'Sub Bass',     baseFreq: 65.41,  filterFreq: 800,  decay: 0.50, waveform: 'sine' },
        { id: 'square_bass', name: 'Square Bass',  baseFreq: 130.81, filterFreq: 2000, decay: 0.30, waveform: 'square' },
        { id: 'warm_bass',   name: 'Warm Bass',    baseFreq: 98.00,  filterFreq: 1200, decay: 0.45, waveform: 'triangle' },
      ],
      5: [
        { id: 'dream_pad',    name: 'Dream Chime',  baseFreq: 392.00, filterFreq: 4200, decay: 0.70, waveform: 'sine' },
        { id: 'saw_lead',     name: 'Saw Lead',     baseFreq: 261.63, filterFreq: 2800, decay: 0.45, waveform: 'sawtooth' },
        { id: 'square_pluck', name: 'Chiptune',     baseFreq: 329.63, filterFreq: 3500, decay: 0.22, waveform: 'square' },
        { id: 'bell',         name: 'Bell Tone',    baseFreq: 523.25, filterFreq: 5000, decay: 0.60, waveform: 'sine' },
      ],
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
    if (this.context.state === 'suspended') return this.context.resume();
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

  trigger(lane) {
    if (!this.context) return;
    const vol = this.effectiveVolume(lane);
    if (vol <= 0.001) return;
    const now = this.context.currentTime;
    const track = this.trackSettings[lane] || this.trackSettings[0];
    if (lane === 0)      this._playKick(track, vol, now);
    else if (lane === 1) this._playSnare(track, vol, now);
    else if (lane === 2) this._playHat(track, vol, now);
    else if (lane === 3) this._playClap(track, vol, now);
    else if (lane === 4) this._playSynth(track, vol, now);
    else if (lane === 5) this._playSynth(track, vol, now);
  }

  _playKick(cfg, vol, now) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = cfg.waveform || 'sine';
    osc.frequency.setValueAtTime(cfg.baseFreq || 140, now);
    osc.frequency.exponentialRampToValueAtTime(cfg.endFreq || 42, now + cfg.decay);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);
    osc.connect(gain); gain.connect(this.master);
    osc.start(now); osc.stop(now + cfg.decay + 0.05);
  }

  _playSnare(cfg, vol, now) {
    const osc = this.context.createOscillator();
    const oscGain = this.context.createGain();
    osc.type = cfg.waveform || 'triangle';
    osc.frequency.setValueAtTime(cfg.baseFreq || 220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + cfg.decay * 0.5);
    oscGain.gain.setValueAtTime(vol * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);
    osc.connect(oscGain); oscGain.connect(this.master);
    osc.start(now); osc.stop(now + cfg.decay);

    const bufSize = Math.floor(this.context.sampleRate * cfg.decay);
    const buf = this.context.createBuffer(1, bufSize, this.context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.context.createBufferSource();
    noise.buffer = buf;
    const hpf = this.context.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 1000;
    const ng = this.context.createGain();
    ng.gain.setValueAtTime(vol * (cfg.noiseAmount || 0.8), now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);
    noise.connect(hpf); hpf.connect(ng); ng.connect(this.master);
    noise.start(now); noise.stop(now + cfg.decay);
  }

  _playHat(cfg, vol, now) {
    const bufSize = Math.floor(this.context.sampleRate * cfg.decay);
    const buf = this.context.createBuffer(1, bufSize, this.context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.context.createBufferSource();
    noise.buffer = buf;
    const bpf = this.context.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = cfg.baseFreq || 8000; bpf.Q.value = 4.0;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vol * 0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);
    noise.connect(bpf); bpf.connect(gain); gain.connect(this.master);
    noise.start(now); noise.stop(now + cfg.decay);
  }

  _playClap(cfg, vol, now) {
    for (let burst = 0; burst < 3; burst++) {
      const t = now + burst * 0.012;
      const bufSize = Math.floor(this.context.sampleRate * 0.04);
      const buf = this.context.createBuffer(1, bufSize, this.context.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.context.createBufferSource();
      noise.buffer = buf;
      const hpf = this.context.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 1200;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(vol * (cfg.noiseAmount || 0.8) * (burst === 2 ? 1 : 0.5), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + cfg.decay);
      noise.connect(hpf); hpf.connect(gain); gain.connect(this.master);
      noise.start(t); noise.stop(t + cfg.decay);
    }
  }

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
    osc.connect(filter); filter.connect(gain); gain.connect(this.master);
    osc.start(now); osc.stop(now + cfg.decay + 0.05);
  }

  // --- DRIVE MODE ---

  toggleDriveMode() {
    if (!this.context) return false;
    this.driveMode = !this.driveMode;
    if (this.driveMode && !this.drive) this._initDriveOscillator();
    if (!this.driveMode) this.stopDriveSustain();
    return this.driveMode;
  }

  _initDriveOscillator() {
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

  triggerDriveSustain(lane) {
    if (!this.context || !this.driveMode) return;
    if (!this.drive) this._initDriveOscillator();
    const freq = this.driveFrequencies[lane] ?? this.driveFrequencies[0];
    this.drive.frequency.setTargetAtTime(freq, this.context.currentTime, 0.05);
    const ratio = 0.5;
    const cutoff = 200 + ratio * 5500;
    this.driveFilter.frequency.setTargetAtTime(cutoff, this.context.currentTime, 0.06);
    const targetGain = 0.15 * this.masterVolume;
    this.driveGain.gain.setTargetAtTime(targetGain, this.context.currentTime, 0.04);
  }

  stopDriveSustain() {
    if (!this.context || !this.driveGain) return;
    this.driveGain.gain.setTargetAtTime(0, this.context.currentTime, 0.03);
  }

  updateDrive(speed, maxSpeed, lane) {
    if (!this.context || !this.driveMode || !this.drive) return;
    const ratio = Math.max(0, Math.min(1, speed / maxSpeed));
    const freq = this.driveFrequencies[lane] ?? this.driveFrequencies[0];
    this.drive.frequency.setTargetAtTime(freq, this.context.currentTime, 0.05);
    const cutoff = 200 + ratio * 5500;
    this.driveFilter.frequency.setTargetAtTime(cutoff, this.context.currentTime, 0.06);
  }

  // --- SCALE SELECTOR ---

  setScale(rootNote, scaleType) {
    const NOTE_FREQS = {
      'C':  130.81, 'C#': 138.59, 'D':  146.83, 'Eb': 155.56,
      'E':  164.81, 'F':  174.61, 'F#': 185.00, 'G':  196.00,
      'Ab': 207.65, 'A':  220.00, 'Bb': 233.08, 'B':  246.94,
    };
    const SCALES = {
      minor_pentatonic: [0, 3, 7, 10, 12, 15],
      major_pentatonic: [0, 2, 4, 7,  9,  12],
      blues:            [0, 3, 5, 6,  7,  10],
      natural_minor:    [0, 2, 3, 5,  7,  8],
      major:            [0, 2, 4, 5,  7,  9],
      dorian:           [0, 2, 3, 5,  7,  9],
    };
    const base = NOTE_FREQS[rootNote] || NOTE_FREQS['C'];
    const intervals = SCALES[scaleType] || SCALES.minor_pentatonic;
    this.driveFrequencies = intervals.map(s => base * Math.pow(2, s / 12));
    this.currentScale = { rootNote, scaleType };
  }

  scaleNoteNames() {
    const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const SCALES = {
      minor_pentatonic: [0, 3, 7, 10, 12, 15],
      major_pentatonic: [0, 2, 4, 7,  9,  12],
      blues:            [0, 3, 5, 6,  7,  10],
      natural_minor:    [0, 2, 3, 5,  7,  8],
      major:            [0, 2, 4, 5,  7,  9],
      dorian:           [0, 2, 3, 5,  7,  9],
    };
    const rootIdx = NOTE_NAMES.indexOf(this.currentScale.rootNote);
    const intervals = SCALES[this.currentScale.scaleType] || SCALES.minor_pentatonic;
    return intervals.map(s => {
      const semitone = (rootIdx + s) % 12;
      const octave = 3 + Math.floor((rootIdx + s) / 12);
      return `${NOTE_NAMES[semitone]}${octave}`;
    });
  }

  // --- MIXER ---

  setPreset(lane, presetId) {
    const list = this.presets[lane] || [];
    const p = list.find(item => item.id === presetId);
    if (p) Object.assign(this.trackSettings[lane], p);
  }

  setTrackProperty(lane, prop, val) {
    if (this.trackSettings[lane]) this.trackSettings[lane][prop] = val;
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
