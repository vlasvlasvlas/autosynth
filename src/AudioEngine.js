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

    this.driveNodes = null;
    this.driveMode = false;
    this._driveSustainActive = false;

    const driveConfig = this.soundKitConfig.drive || {};
    this.driveAvailable = driveConfig.enabled ?? true;
    this.drivePresets = driveConfig.presets || [];
    this.currentDrivePresetId = this.drivePresets[0]?.id || 'default';

    this.driveSettings = {
      waveform: driveConfig.waveform || 'sawtooth',
      volume: driveConfig.volume ?? 0.4,
      portamento: driveConfig.portamento ?? 0.05,
      filterMin: driveConfig.filter?.min_frequency ?? 200,
      filterMax: driveConfig.filter?.max_frequency ?? 8000,
      filterResonance: driveConfig.filter?.resonance ?? 8,
    };

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

    const configuredLanes = this.soundKitConfig.landscape?.lanes || [];
    configuredLanes.slice(0, this.trackSettings.length).forEach((laneConfig, lane) => {
      const updates = {};
      if (laneConfig.name) updates.name = laneConfig.name.toUpperCase();
      if (laneConfig.waveform) updates.waveform = laneConfig.waveform;
      if (laneConfig.volume !== undefined) updates.volume = laneConfig.volume;
      if (laneConfig.note) updates.baseFreq = noteToFrequency(laneConfig.note);
      Object.assign(this.trackSettings[lane], updates);
    });

    const configuredScale = driveConfig.scale || {};
    this.setScale(configuredScale.root || 'C', configuredScale.type || 'minor_pentatonic');
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

  trigger(lane, isReverse = false) {
    if (!this.context) return;
    const vol = this.effectiveVolume(lane);
    if (vol <= 0.001) return;
    const now = this.context.currentTime;
    const track = this.trackSettings[lane] || this.trackSettings[0];
    if (lane === 0)      this._playKick(track, vol, now, isReverse);
    else if (lane === 1) this._playSnare(track, vol, now, isReverse);
    else if (lane === 2) this._playHat(track, vol, now, isReverse);
    else if (lane === 3) this._playClap(track, vol, now, isReverse);
    else if (lane === 4) this._playSynth(track, vol, now, isReverse);
    else if (lane === 5) this._playSynth(track, vol, now, isReverse);
  }

  _playKick(cfg, vol, now, isReverse) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = cfg.waveform || 'sine';
    const envelope = scheduleEnvelope(gain.gain, vol, now, cfg.decay, isReverse);
    osc.frequency.setValueAtTime(isReverse ? (cfg.endFreq || 42) : (cfg.baseFreq || 140), now);
    osc.frequency.exponentialRampToValueAtTime(
      isReverse ? (cfg.baseFreq || 140) : (cfg.endFreq || 42),
      isReverse ? envelope.peakTime : envelope.end,
    );
    osc.connect(gain); gain.connect(this.master);
    osc.start(now); osc.stop(envelope.end + 0.02);
  }

  _playSnare(cfg, vol, now, isReverse) {
    const osc = this.context.createOscillator();
    const oscGain = this.context.createGain();
    osc.type = cfg.waveform || 'triangle';
    const tonalEnvelope = scheduleEnvelope(oscGain.gain, vol * 0.7, now, cfg.decay, isReverse);
    osc.frequency.setValueAtTime(isReverse ? 80 : (cfg.baseFreq || 220), now);
    osc.frequency.exponentialRampToValueAtTime(
      isReverse ? (cfg.baseFreq || 220) : 80,
      isReverse ? tonalEnvelope.peakTime : now + cfg.decay * 0.5,
    );
    osc.connect(oscGain); oscGain.connect(this.master);
    osc.start(now); osc.stop(tonalEnvelope.end + 0.01);

    const bufSize = Math.floor(this.context.sampleRate * cfg.decay);
    const buf = this.context.createBuffer(1, bufSize, this.context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.context.createBufferSource();
    noise.buffer = buf;
    const hpf = this.context.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 1000;
    const ng = this.context.createGain();
    const noiseEnvelope = scheduleEnvelope(
      ng.gain,
      vol * (cfg.noiseAmount || 0.8),
      now,
      cfg.decay,
      isReverse,
    );
    noise.connect(hpf); hpf.connect(ng); ng.connect(this.master);
    noise.start(now); noise.stop(noiseEnvelope.end + 0.01);
  }

  _playHat(cfg, vol, now, isReverse) {
    const bufSize = Math.floor(this.context.sampleRate * cfg.decay);
    const buf = this.context.createBuffer(1, bufSize, this.context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.context.createBufferSource();
    noise.buffer = buf;
    const bpf = this.context.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = cfg.baseFreq || 8000; bpf.Q.value = 4.0;
    const gain = this.context.createGain();
    const envelope = scheduleEnvelope(gain.gain, vol * 0.85, now, cfg.decay, isReverse);
    noise.connect(bpf); bpf.connect(gain); gain.connect(this.master);
    noise.start(now); noise.stop(envelope.end + 0.01);
  }

  _playClap(cfg, vol, now, isReverse) {
    if (isReverse) {
      const duration = Math.max(0.08, cfg.decay + 0.04);
      const bufferSize = Math.floor(this.context.sampleRate * duration);
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.context.createBufferSource();
      noise.buffer = buffer;
      const hpf = this.context.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 1200;
      const gain = this.context.createGain();
      const envelope = scheduleEnvelope(
        gain.gain,
        vol * (cfg.noiseAmount || 0.8),
        now,
        duration,
        true,
      );
      noise.connect(hpf); hpf.connect(gain); gain.connect(this.master);
      noise.start(now); noise.stop(envelope.end + 0.01);
      return;
    }

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

  _playSynth(cfg, vol, now, isReverse) {
    const osc = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    osc.type = cfg.waveform || 'sawtooth';
    osc.frequency.setValueAtTime(cfg.baseFreq || 261.63, now);
    filter.type = 'lowpass';
    const envelope = scheduleEnvelope(gain.gain, vol * 0.75, now, cfg.decay, isReverse);
    filter.frequency.setValueAtTime(isReverse ? 400 : (cfg.filterFreq || 2400), now);
    filter.frequency.exponentialRampToValueAtTime(
      isReverse ? (cfg.filterFreq || 2400) : 400,
      isReverse ? envelope.peakTime : envelope.end,
    );
    osc.connect(filter); filter.connect(gain); gain.connect(this.master);
    osc.start(now); osc.stop(envelope.end + 0.02);
  }

  // --- DRIVE MODE ---

  toggleDriveMode() {
    if (!this.context || !this.driveAvailable) return false;
    this.driveMode = !this.driveMode;
    if (this.driveMode && (!this.driveNodes || !this.driveNodes.gain)) this._initDriveModule();
    if (!this.driveMode) this.stopDriveSustain();
    this._driveSustainActive = false;
    return this.driveMode;
  }

  _initDriveModule() {
    const moduleType = this.driveSettings.module || 'analog_dual';
    this.driveNodes = {};
    const now = this.context.currentTime;

    if (moduleType === 'analog_dual') {
      const osc1 = this.context.createOscillator();
      const osc2 = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      
      osc1.type = this.driveSettings.waveform || 'sawtooth';
      osc2.type = this.driveSettings.waveform || 'sawtooth';
      osc1.detune.value = -(this.driveSettings.detune || 15);
      osc2.detune.value = (this.driveSettings.detune || 15);
      
      filter.type = 'lowpass';
      filter.frequency.value = this.driveSettings.filterMin;
      filter.Q.value = this.driveSettings.filterResonance;
      
      gain.gain.value = 0;
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      
      osc1.start(now);
      osc2.start(now);
      
      this.driveNodes = { osc1, osc2, filter, gain };

    } else if (moduleType === 'fm_bell') {
      const carrier = this.context.createOscillator();
      const modulator = this.context.createOscillator();
      const modGain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      
      carrier.type = 'sine';
      modulator.type = 'triangle';
      
      modGain.gain.value = 800; // FM index
      
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      
      filter.type = 'lowpass';
      filter.frequency.value = this.driveSettings.filterMax; // Bells are bright
      filter.Q.value = this.driveSettings.filterResonance;
      
      gain.gain.value = 0;
      carrier.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      
      carrier.start(now);
      modulator.start(now);
      
      this.driveNodes = { osc1: carrier, mod: modulator, modGain, filter, gain };

    } else if (moduleType === 'bass_pulse') {
      const osc = this.context.createOscillator();
      const sub = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      
      osc.type = 'square';
      sub.type = 'square';
      
      filter.type = 'lowpass';
      filter.frequency.value = this.driveSettings.filterMin;
      filter.Q.value = this.driveSettings.filterResonance;
      
      gain.gain.value = 0;
      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      
      osc.start(now);
      sub.start(now);
      
      this.driveNodes = { osc1: osc, sub, filter, gain };

    } else if (moduleType === 'robot_phase') {
      const osc = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const lfo = this.context.createOscillator();
      const lfoGain = this.context.createGain();
      const gain = this.context.createGain();
      
      osc.type = 'sawtooth';
      lfo.type = 'sine';
      lfo.frequency.value = 4;
      lfoGain.gain.value = 1000;
      
      filter.type = 'bandpass';
      filter.frequency.value = 1500;
      filter.Q.value = this.driveSettings.filterResonance;
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      
      osc.start(now);
      lfo.start(now);
      
      this.driveNodes = { osc1: osc, lfo, lfoGain, filter, gain };

    } else if (moduleType === 'industrial_pwm') {
      const osc = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      
      osc.type = 'square';
      filter.type = 'lowpass';
      filter.frequency.value = this.driveSettings.filterMax;
      filter.Q.value = this.driveSettings.filterResonance;
      
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      
      osc.start(now);
      
      this.driveNodes = { osc1: osc, filter, gain };

    } else if (moduleType === 'lofi_casio') {
      const osc = this.context.createOscillator();
      const waveShaper = this.context.createWaveShaper();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      
      osc.type = 'sine';
      
      const curve = new Float32Array(256);
      for (let i=0; i<256; ++i) {
        let x = i * 2 / 256 - 1;
        curve[i] = (3 + 20) * x * 20 * (Math.PI / 180) / (Math.PI + 20 * Math.abs(x));
      }
      waveShaper.curve = curve;
      
      filter.type = 'lowpass';
      filter.frequency.value = this.driveSettings.filterMax;
      filter.Q.value = 1;
      
      gain.gain.value = 0;
      osc.connect(waveShaper);
      waveShaper.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      
      osc.start(now);
      
      this.driveNodes = { osc1: osc, filter, gain, waveShaper };
    }
  }

  triggerDriveSustain(lane) {
    if (!this.context || !this.driveMode) return;
    if (!this.driveNodes || !this.driveNodes.gain) this._initDriveModule();
    
    const freq = this.driveFrequencies[lane] ?? this.driveFrequencies[0];
    this._setModuleFrequency(freq);
    
    // Only schedule the envelope if we just pressed the key, to avoid Web Audio API spam
    if (!this._driveSustainActive) {
      this.driveNodes.gain.gain.cancelScheduledValues(this.context.currentTime);
      this.driveNodes.gain.gain.setTargetAtTime(this.driveSettings.volume, this.context.currentTime, 0.04);
      this._driveSustainActive = true;
    }
  }

  stopDriveSustain() {
    if (!this.context || !this.driveNodes || !this.driveNodes.gain) return;
    if (this._driveSustainActive) {
      this.driveNodes.gain.gain.cancelScheduledValues(this.context.currentTime);
      this.driveNodes.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.03);
      this._driveSustainActive = false;
    }
  }
  
  _setModuleFrequency(freq) {
    const t = this.context.currentTime;
    const p = this.driveSettings.portamento;
    const nodes = this.driveNodes;
    
    if (nodes.osc1) nodes.osc1.frequency.setTargetAtTime(freq, t, p);
    if (nodes.osc2) nodes.osc2.frequency.setTargetAtTime(freq, t, p);
    
    if (nodes.mod) {
      nodes.mod.frequency.setTargetAtTime(freq * 2.01, t, p);
    }
    
    if (nodes.sub) {
      nodes.sub.frequency.setTargetAtTime(freq / 2, t, p);
    }
  }

  updateDrive(speed, maxSpeed, lane) {
    if (!this.context || !this.driveMode || !this.driveNodes || !this.driveNodes.gain) return;
    
    const ratio = Math.max(0, Math.min(1, Math.abs(speed) / maxSpeed));
    const freq = this.driveFrequencies[lane] ?? this.driveFrequencies[0];
    this._setModuleFrequency(freq);
    
    const cutoff = this.driveSettings.filterMin
      + ratio * (this.driveSettings.filterMax - this.driveSettings.filterMin);
      
    if (this.driveNodes.filter) {
      this.driveNodes.filter.frequency.setTargetAtTime(cutoff, this.context.currentTime, 0.06);
    }
    if (this.driveNodes.lfo) {
      this.driveNodes.lfo.frequency.setTargetAtTime(1 + ratio * 8, this.context.currentTime, 0.1);
    }
  }

  setDriveVolume(val) {
    this.driveSettings.volume = Math.max(0, Math.min(1, val));
    if (this.driveMode && this.driveNodes && this.driveNodes.gain) {
      if (this._driveSustainActive) {
        this.driveNodes.gain.gain.cancelScheduledValues(this.context.currentTime);
        this.driveNodes.gain.gain.setTargetAtTime(this.driveSettings.volume, this.context.currentTime, 0.02);
      }
    }
  }

  setDrivePreset(presetId) {
    const preset = this.drivePresets.find(p => p.id === presetId);
    if (!preset) return;
    this.currentDrivePresetId = presetId;
    
    this.driveSettings.module = preset.module || 'analog_dual';
    this.driveSettings.detune = preset.detune || 15;
    if (preset.waveform) this.driveSettings.waveform = preset.waveform;
    if (preset.filter_min !== undefined) this.driveSettings.filterMin = preset.filter_min;
    if (preset.filter_max !== undefined) this.driveSettings.filterMax = preset.filter_max;
    if (preset.resonance !== undefined) this.driveSettings.filterResonance = preset.resonance;
    if (preset.portamento !== undefined) this.driveSettings.portamento = preset.portamento;

    // Rebuild graph immediately
    if (this.driveNodes && this.driveNodes.gain) {
      const wasPlaying = this.driveNodes.gain.gain.value > 0.01;
      
      for (const key of ['osc1', 'osc2', 'mod', 'sub', 'lfo']) {
        if (this.driveNodes[key]) {
          this.driveNodes[key].stop();
          this.driveNodes[key].disconnect();
        }
      }
      
      this._initDriveModule();
      if (wasPlaying) {
        this.driveNodes.gain.gain.value = this.driveSettings.volume;
        this._driveSustainActive = true;
      } else {
        this._driveSustainActive = false;
      }
    }
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
    const parsedRoot = String(rootNote).match(/^[A-G](?:#|b)?/)?.[0] || 'C';
    const normalizedRoot = NOTE_FREQS[parsedRoot] ? parsedRoot : 'C';
    const normalizedScale = SCALES[scaleType] ? scaleType : 'minor_pentatonic';
    const base = NOTE_FREQS[normalizedRoot];
    const intervals = SCALES[normalizedScale];
    this.driveFrequencies = intervals.map(s => base * Math.pow(2, s / 12));
    this.currentScale = { rootNote: normalizedRoot, scaleType: normalizedScale };
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

function noteToFrequency(note) {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(note);
  if (!match) return 261.63;
  const pitchClasses = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
    E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
    Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  };
  const pitch = `${match[1]}${match[2] || ''}`;
  const midi = (Number(match[3]) + 1) * 12 + pitchClasses[pitch];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function scheduleEnvelope(param, peak, now, duration, isReverse) {
  const safeDuration = Math.max(0.02, Number(duration) || 0.2);
  const end = now + safeDuration;
  if (!isReverse) {
    param.setValueAtTime(Math.max(0.0001, peak), now);
    param.exponentialRampToValueAtTime(0.0001, end);
    return { peakTime: now, end };
  }

  // A reverse transient swells into its attack, then gets a tiny release so
  // oscillator-based sounds do not end at peak amplitude with an audible click.
  const release = Math.min(0.012, safeDuration * 0.2);
  const peakTime = end - release;
  param.setValueAtTime(0.0001, now);
  param.exponentialRampToValueAtTime(Math.max(0.0001, peak), peakTime);
  param.exponentialRampToValueAtTime(0.0001, end);
  return { peakTime, end };
}
