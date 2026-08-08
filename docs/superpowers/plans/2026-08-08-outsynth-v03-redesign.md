# OUTSYNTH v0.3 Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar OUTSYNTH v0.2 en v0.3: estética monocromática, renderer OutRun correcto, minimap cenital, 6 carriles, salto de carril, rediseño de interacción SPACE/DRIVE, marcas en el piso como eventos, selector de escala musical.

**Architecture:** Todos los cambios extienden la arquitectura existente sin romper contratos. El flujo es: Config → AudioEngine → Input+Vehicle → Game → Renderer → SoundMenu. Cada tarea es independientemente verificable en el navegador. No se agrega ni elimina ningún módulo.

**Tech Stack:** JavaScript ES Modules (vanilla), Canvas 2D API, Web Audio API, YAML via js-yaml CDN, `npx serve` como dev server.

## Global Constraints

- Sin frameworks JS. Sin npm packages nuevos.
- `js-yaml` viene de CDN (importmap en index.html). No modificar el importmap.
- Dev server: `npx -y serve . -p 8080 --cors`. Abrir `http://localhost:8080`.
- Un solo color de acento: `#f5a623` (ámbar). Sin multi-color por carril.
- Todos los carriles (6) son blancos (`#ffffff`) visualmente — diferenciados solo por forma.
- Sin `shadowBlur` en ningún render nuevo.
- Tipografía: `IBM Plex Mono` (reemplaza `Space Mono`).
- Archivos a tocar: `config/default.yaml`, `config/themes/minimalist.yaml`, `config/sounds/classic-kit.yaml`, `src/AudioEngine.js`, `src/InputHandler.js`, `src/Vehicle.js`, `src/Game.js`, `src/Renderer.js`, `src/SoundMenu.js`, `index.html`, `style.css`.

---

## File Map

| Archivo | Qué cambia |
|---------|------------|
| `config/default.yaml` | `lanes.count: 6`, fallbacks corregidos |
| `config/themes/minimalist.yaml` | Paleta monocromática, 6 colores todos `#ffffff` |
| `config/sounds/classic-kit.yaml` | Lanes 4 y 5 (Synth Low, Synth High) |
| `index.html` | Font: IBM Plex Mono |
| `style.css` | Font reference, fondo negro |
| `src/AudioEngine.js` | 6 tracks, `driveMode`, `setScale()`, `triggerDriveSustain()`, `stopDriveSustain()`, `_initDriveOscillator()`, `toggleDriveMode()` |
| `src/InputHandler.js` | `_shift` state, `shiftHeld`, `jumpLeft`, `jumpRight`, `drivePlay` |
| `src/Vehicle.js` | `jumpLane(delta)` |
| `src/Game.js` | WRITE/DRIVE logic, jump wiring, 6-lane initial pattern |
| `src/Renderer.js` | Sky negro, road striped, floor marks, vehicle simple, HUD mínimo, minimap, `recordHit()` |
| `src/SoundMenu.js` | 6 tarjetas, sección DRIVE SCALE |

---

## Task 1: Config & Font Foundation

**Files:**
- Modify: `config/default.yaml`
- Modify: `config/themes/minimalist.yaml`
- Modify: `config/sounds/classic-kit.yaml`
- Modify: `index.html`
- Modify: `style.css`

**Interfaces:**
- Produces: `config.laneCount()` → `6`, `theme.laneColors()` → `['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff']`

- [ ] **Step 1: Actualizar `config/default.yaml`**

Reemplazar el archivo completo:

```yaml
outsynth:
  version: "0.3.0"

  grid:
    mpb: 4
    subdivisions: 4
    quantize: true

  lanes:
    count: 6
    snap_strength: 0.15
    width: 160

  vehicle:
    max_speed: 300
    acceleration: 140
    deceleration: 220
    lateral_speed: 750
    inertia: 0.98

  track:
    default: "oval"
    draw_distance: 300

  audio:
    lookahead_ms: 100
    master_volume: 0.8

  start:
    mode: "press_any_key"

  display:
    target_fps: 60
    canvas_scale: 1

  accent_color: "#f5a623"
```

- [ ] **Step 2: Actualizar `config/themes/minimalist.yaml`**

```yaml
theme:
  name: "Monochrome"

  sky:
    gradient:
      top: "#000000"
      bottom: "#000000"

  horizon:
    color: "#000000"
    glow: false

  road:
    surface: "#111111"
    surface_alt: "#1a1a1a"
    border: "#ffffff"
    center_line: "#333333"
    lane_markers: "#222222"

  lanes:
    colors:
      - "#ffffff"
      - "#ffffff"
      - "#ffffff"
      - "#ffffff"
      - "#ffffff"
      - "#ffffff"

  sprites:
    kick:
      shape: "floor_block"
      scale: 1.0
    snare:
      shape: "floor_double"
      scale: 1.0
    hat:
      shape: "floor_dot"
      scale: 1.0
    clap:
      shape: "floor_triple"
      scale: 1.0
    synth_low:
      shape: "floor_outline"
      scale: 1.0
    synth_high:
      shape: "floor_line"
      scale: 1.0

  gate:
    color: "#ffffff"
    opacity: 0.6
    flash_on_cross: true
    flash_color: "#f5a623"
    flash_duration: 200

  vehicle:
    color: "#ffffff"
    outline: "#000000"
    trail: false

  effects:
    drop_flash_color: "#f5a623"
    drop_flash_duration: 80
    delete_particles: false
    delete_particle_count: 0
    speed_lines: false
    speed_lines_color: "#000000"
    speed_lines_min_speed: 999

  scenery:
    post_color: "#333333"
    post_glow: false
```

- [ ] **Step 3: Actualizar `config/sounds/classic-kit.yaml`** — agregar lanes 4 y 5

```yaml
sound_kit:
  name: "Classic Kit"

  landscape:
    lanes:
      - name: "Kick"
        type: "oscillator"
        waveform: "sine"
        volume: 1.0
        polyphony: "mono"

      - name: "Snare"
        type: "oscillator"
        waveform: "triangle"
        volume: 0.9
        polyphony: "mono"

      - name: "Hi-Hat"
        type: "oscillator"
        waveform: "square"
        volume: 0.7
        polyphony: "poly"

      - name: "Clap"
        type: "oscillator"
        waveform: "square"
        volume: 0.75
        polyphony: "mono"

      - name: "Synth Low"
        type: "oscillator"
        waveform: "sawtooth"
        note: "C3"
        volume: 0.75
        polyphony: "mono"

      - name: "Synth High"
        type: "oscillator"
        waveform: "sine"
        note: "C4"
        volume: 0.7
        polyphony: "mono"

  drive:
    enabled: true
    toggle_key: "d"
    waveform: "sawtooth"
    scale:
      root: "C"
      type: "minor_pentatonic"
      notes: ["C3", "Eb3", "G3", "Bb3", "C4", "Eb4"]
    filter:
      type: "lowpass"
      min_frequency: 200
      max_frequency: 8000
      resonance: 8
    portamento: 0.05
    volume: 0.4
```

- [ ] **Step 4: Actualizar `index.html`** — cambiar fuente

En `<head>`, reemplazar las líneas de Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">
```

Eliminar la línea de `Inter` y `Space Mono`.

- [ ] **Step 5: Actualizar `style.css`** — font y fondo

Reemplazar toda referencia a `'Space Mono'` por `'IBM Plex Mono', monospace`.
Asegurar que `body` y `#outsynth-container` tengan `background: #000`.

Buscar y reemplazar: `"Space Mono"` → `"IBM Plex Mono"`

- [ ] **Step 6: Verificar en navegador**

```bash
npx -y serve . -p 8080 --cors
```

Abrir `http://localhost:8080`. Verificar en consola:
- Sin errores de carga de YAML
- `[ConfigLoader] All configs loaded successfully` en consola
- La pantalla de inicio usa IBM Plex Mono (verificar en DevTools > Elements)

- [ ] **Step 7: Commit**

```bash
git add config/ index.html style.css
git commit -m "feat: config v0.3 — 6 lanes, monochrome theme, IBM Plex Mono"
```

---

## Task 2: AudioEngine — 6 Lanes + Scale + Sustain

**Files:**
- Modify: `src/AudioEngine.js`

**Interfaces:**
- Consumes: nada nuevo del exterior
- Produces:
  - `audio.driveMode` (bool, reemplaza `driveEnabled`)
  - `audio.currentScale` → `{ rootNote: string, scaleType: string }`
  - `audio.driveFrequencies` → `number[6]`
  - `audio.toggleDriveMode()` → `bool`
  - `audio.setScale(rootNote, scaleType)` → `void`
  - `audio.triggerDriveSustain(lane)` → `void`
  - `audio.stopDriveSustain()` → `void`
  - `audio.trigger(lane)` → acepta lanes 0-5
  - `audio.trackSettings` → array de 6 elementos

- [ ] **Step 1: Reemplazar `src/AudioEngine.js` completo**

```js
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
      { id: 'kick',      name: 'KICK',      preset: '808_sub',    waveform: 'sine',     baseFreq: 130,   endFreq: 45,  decay: 0.28, volume: 0.95, muted: false, solo: false },
      { id: 'snare',     name: 'SNARE',     preset: '909_snare',  waveform: 'triangle', baseFreq: 220,   noiseAmount: 0.8, decay: 0.18, volume: 0.85, muted: false, solo: false },
      { id: 'hat',       name: 'HI-HAT',    preset: 'crisp_hat',  waveform: 'square',   baseFreq: 8000,  decay: 0.08, volume: 0.70, muted: false, solo: false },
      { id: 'clap',      name: 'CLAP',      preset: 'cyber_clap', waveform: 'square',   baseFreq: 280,   noiseAmount: 0.95, decay: 0.14, volume: 0.80, muted: false, solo: false },
      { id: 'synth_low', name: 'SYNTH LOW', preset: 'acid_bass',  waveform: 'sawtooth', baseFreq: 130.81, filterFreq: 1400, decay: 0.35, volume: 0.75, muted: false, solo: false },
      { id: 'synth_high',name: 'SYNTH HIGH',preset: 'dream_pad',  waveform: 'sine',     baseFreq: 261.63, filterFreq: 4200, decay: 0.50, volume: 0.70, muted: false, solo: false },
    ];

    this.presets = {
      0: [
        { id: '808_sub',       name: '808 Sub Kick',    baseFreq: 140, endFreq: 42,  decay: 0.32, waveform: 'sine' },
        { id: 'club_punch',    name: 'Club Punch',      baseFreq: 180, endFreq: 52,  decay: 0.22, waveform: 'triangle' },
        { id: 'electro_thump', name: 'Electro Thump',   baseFreq: 220, endFreq: 60,  decay: 0.15, waveform: 'square' },
        { id: 'deep_acoustic', name: 'Deep Acoustic',   baseFreq: 110, endFreq: 38,  decay: 0.40, waveform: 'sine' },
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
    if (lane === 0) this._playKick(track, vol, now);
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
      'C': 130.81, 'C#': 138.59, 'D': 146.83, 'Eb': 155.56,
      'E': 164.81, 'F': 174.61, 'F#': 185.00, 'G': 196.00,
      'Ab': 207.65, 'A': 220.00, 'Bb': 233.08, 'B': 246.94,
    };
    const SCALES = {
      minor_pentatonic: [0, 3, 7, 10, 12, 15],
      major_pentatonic: [0, 2, 4, 7, 9, 12],
      blues:            [0, 3, 5, 6, 7, 10],
      natural_minor:    [0, 2, 3, 5, 7, 8],
      major:            [0, 2, 4, 5, 7, 9],
      dorian:           [0, 2, 3, 5, 7, 9],
    };
    const base = NOTE_FREQS[rootNote] || NOTE_FREQS['C'];
    const intervals = SCALES[scaleType] || SCALES.minor_pentatonic;
    this.driveFrequencies = intervals.map(s => base * Math.pow(2, s / 12));
    this.currentScale = { rootNote, scaleType };
  }

  scaleNoteNames() {
    const NOTE_NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
    const SCALES = {
      minor_pentatonic: [0, 3, 7, 10, 12, 15],
      major_pentatonic: [0, 2, 4, 7, 9, 12],
      blues:            [0, 3, 5, 6, 7, 10],
      natural_minor:    [0, 2, 3, 5, 7, 8],
      major:            [0, 2, 4, 5, 7, 9],
      dorian:           [0, 2, 3, 5, 7, 9],
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
```

- [ ] **Step 2: Verificar en consola del navegador**

Abrir DevTools > Console después de cargar la app. Ejecutar:
```js
// El game está en window sólo si lo exponés — verificar via log
// Verificar que no hay errores de JS en la carga
```

Verificar que `[Game] Booting OUTSYNTH...` aparece sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/AudioEngine.js
git commit -m "feat: AudioEngine v0.3 — 6 lanes, driveMode, setScale, sustain"
```

---

## Task 3: InputHandler + Vehicle — Jump & DrivePlay

**Files:**
- Modify: `src/InputHandler.js`
- Modify: `src/Vehicle.js`

**Interfaces:**
- Produces:
  - `input.shiftHeld` → `bool`
  - `input.jumpLeft` → `bool` (wasPressed ArrowLeft con Shift)
  - `input.jumpRight` → `bool` (wasPressed ArrowRight con Shift)
  - `input.drivePlay` → `bool` (isDown Space)
  - `input.left` → ahora solo true si !shiftHeld
  - `input.right` → ahora solo true si !shiftHeld
  - `vehicle.jumpLane(delta: number)` → `void`

- [ ] **Step 1: Modificar `src/InputHandler.js`**

En el constructor, agregar: `this._shift = false;`

En `_onKeyDown`, agregar al inicio del método:
```js
if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
  this._shift = true;
}
```

En `_onKeyUp`, agregar:
```js
if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
  this._shift = false;
}
```

En el static `GAME_KEYS`, agregar `'ShiftLeft'` y `'ShiftRight'`.

Reemplazar los getters de acción al final del archivo:
```js
get shiftHeld() { return this._shift; }
get accelerate() { return this.isDown('ArrowUp'); }
get brake()      { return this.isDown('ArrowDown'); }
get left()       { return !this._shift && this.isDown('ArrowLeft'); }
get right()      { return !this._shift && this.isDown('ArrowRight'); }
get jumpLeft()   { return this._shift && this.wasPressed('ArrowLeft'); }
get jumpRight()  { return this._shift && this.wasPressed('ArrowRight'); }
get drop()       { return !this.drivePlayActive && this.wasPressed('Space'); }
get drivePlay()  { return this.isDown('Space'); }
get toggleDrive(){ return this.wasPressed('KeyD'); }
get pause()      { return this.wasPressed('Escape') || this.wasPressed('KeyM') || this.wasPressed('KeyP'); }
```

> Nota: `drop` ahora solo dispara si NO estamos en drive mode. La distinción real la hace `Game._update` leyendo `audio.driveMode`. El getter `drop` sigue siendo `wasPressed('Space')` — `Game` decide qué hacer con él.

Simplificar: reemplazar sólo los getters `left`, `right` y agregar los nuevos. El `drop` y `drivePlay` quedan:
```js
get drop()      { return this.wasPressed('Space'); }
get drivePlay() { return this.isDown('Space'); }
```

- [ ] **Step 2: Modificar `src/Vehicle.js`**

Agregar el método `jumpLane` dentro de la clase:
```js
jumpLane(delta) {
  const halfRoad = (this.laneCount * this.laneWidth) / 2;
  const currentLane = this.lane();
  const targetLane = Math.max(0, Math.min(this.laneCount - 1, currentLane + delta));
  this.lateral = -halfRoad + targetLane * this.laneWidth + this.laneWidth / 2;
}
```

- [ ] **Step 3: Verificar en consola**

Con el juego cargado y en PLAYING, abrir consola. La lógica de jump se probará en Task 4. Por ahora verificar que no hay errores de syntax:
```bash
node --check src/InputHandler.js
node --check src/Vehicle.js
```

- [ ] **Step 4: Commit**

```bash
git add src/InputHandler.js src/Vehicle.js
git commit -m "feat: jump lane (Shift+arrow) + drivePlay (Space hold)"
```

---

## Task 4: Game — SPACE/DRIVE Logic + Jump Wiring

**Files:**
- Modify: `src/Game.js`

**Interfaces:**
- Consumes:
  - `input.jumpLeft`, `input.jumpRight`, `input.drivePlay`, `input.drop`
  - `audio.driveMode`, `audio.toggleDriveMode()`, `audio.triggerDriveSustain(lane)`, `audio.stopDriveSustain()`, `audio.updateDrive(speed, maxSpeed, lane)`
  - `vehicle.jumpLane(delta)`
  - `renderer.recordHit(lane, position)`

- [ ] **Step 1: Actualizar el método `_update` en `src/Game.js`**

Reemplazar el método `_update` completo:
```js
_update(dt) {
  const laneCount = this.config.laneCount();
  const movement = this.vehicle.update(dt, this.input, this.road.length);
  const lane = this.vehicle.lane();

  // Jump (Shift + arrow)
  if (this.input.jumpLeft)  this.vehicle.jumpLane(-2);
  if (this.input.jumpRight) this.vehicle.jumpLane(+2);

  // Toggle DRIVE mode (D key)
  if (this.input.toggleDrive) {
    this.audio.toggleDriveMode();
  }

  if (this.audio.driveMode) {
    // DRIVE mode: Space held = sustain, release = silence
    if (this.input.drivePlay) {
      this.audio.triggerDriveSustain(lane);
    } else {
      this.audio.stopDriveSustain();
    }
    this.audio.updateDrive(this.vehicle.speed, this.config.vehiclePhysics().maxSpeed, lane);
  } else {
    // WRITE mode: Space tap = paint floor + play once
    this.audio.stopDriveSustain();
    if (this.input.drop) {
      const dropResult = this.sequencer.toggle(lane, this.vehicle.position);
      const isDelete = dropResult?.action === 'deleted';
      this.audio.trigger(lane);
      this.renderer.triggerDrop(lane, isDelete);
    }
  }

  // Spatial triggers: events crossed by vehicle
  const crossedEvents = this.sequencer.crossed(movement.previousPosition, movement.position, movement.wrapped);
  for (const ev of crossedEvents) {
    this.audio.trigger(ev.lane);
    this.renderer.recordHit(ev.lane, ev.position);
  }
}
```

- [ ] **Step 2: Actualizar el patrón inicial (pre-populate) para 6 carriles**

En el método `boot()`, reemplazar las líneas `this.sequencer.toggle(...)` con un patrón de 6 carriles:
```js
// Pre-populate: kick pattern
this.sequencer.toggle(0, 16);
this.sequencer.toggle(0, 48);
this.sequencer.toggle(0, 80);
this.sequencer.toggle(0, 112);
// Snare
this.sequencer.toggle(1, 32);
this.sequencer.toggle(1, 64);
this.sequencer.toggle(1, 96);
// Hi-Hat
this.sequencer.toggle(2, 16);
this.sequencer.toggle(2, 24);
this.sequencer.toggle(2, 32);
this.sequencer.toggle(2, 40);
// Clap
this.sequencer.toggle(3, 48);
this.sequencer.toggle(3, 80);
// Synth Low
this.sequencer.toggle(4, 40);
this.sequencer.toggle(4, 88);
// Synth High
this.sequencer.toggle(5, 64);
this.sequencer.toggle(5, 104);
```

- [ ] **Step 3: Verificar funcionamiento**

- Cargar el juego, presionar cualquier tecla para iniciar
- Probar Shift+→: el vehículo debe saltar 2 carriles de golpe
- Probar D: activar DRIVE mode (verificar en consola `audio.driveMode === true`)
- Con DRIVE activo, sostener SPACE: debe sonar continuamente
- Soltar SPACE: silencio
- Con DRIVE inactivo, tocar SPACE: debe sonar una vez y colocar un evento

- [ ] **Step 4: Commit**

```bash
git add src/Game.js
git commit -m "feat: WRITE/DRIVE mode, jump wiring, 6-lane initial pattern"
```

---

## Task 5: Renderer — Sky, Road & Stripes

**Files:**
- Modify: `src/Renderer.js`

Este task reemplaza el fondo, cielo y carretera. Las secciones de sprites y HUD se mantienen temporalmente intactas; se reemplazan en Tasks 6 y 7.

**Interfaces:**
- Consumes: `config.get('outsynth.accent_color', '#f5a623')` para el color de acento
- Produces: `this.accentColor` disponible para Tasks siguientes

- [ ] **Step 1: Agregar `accentColor` al constructor de `Renderer`**

Al inicio del constructor, después de `this.config = config;`:
```js
this.accentColor = config.get('outsynth.accent_color', '#f5a623');
this.recentHits = new Map(); // para flash de eventos
```

- [ ] **Step 2: Agregar método `recordHit`**

Al final de la clase, antes del cierre `}`:
```js
recordHit(lane, position) {
  this.recentHits.set(`${lane}:${position.toFixed(4)}`, performance.now());
}

isRecentlyHit(lane, position) {
  const key = `${lane}:${position.toFixed(4)}`;
  const t = this.recentHits.get(key);
  if (!t) return false;
  if (performance.now() - t > 80) { this.recentHits.delete(key); return false; }
  return true;
}
```

- [ ] **Step 3: Reemplazar `drawStaticBackground`**

```js
drawStaticBackground() {
  const ctx = this.bgCtx;
  const w = this.width;
  const h = this.height;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
}
```

- [ ] **Step 4: Reemplazar `renderRoadTrack`**

```js
renderRoadTrack(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, laneColors, laneCount) {
  const bottomCenterX = w / 2 - (vehicle.lateral / 400) * (w * 0.38);

  // Road polygon fill (near-black)
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.moveTo(vanishX - topW / 2, topY);
  ctx.lineTo(vanishX + topW / 2, topY);
  ctx.lineTo(bottomCenterX + bottomW / 2, bottomY);
  ctx.lineTo(bottomCenterX - bottomW / 2, bottomY);
  ctx.closePath();
  ctx.fill();

  // OutRun-style alternating stripes
  const numStripes = 14;
  const stripeOffset = (vehicle.position % 8) / 8;
  for (let i = 0; i < numStripes; i++) {
    const t0 = Math.pow(Math.min(1, (i + stripeOffset) / numStripes), 2.2);
    const t1 = Math.pow(Math.min(1, (i + 1 + stripeOffset) / numStripes), 2.2);
    const y0 = topY + (bottomY - topY) * t0;
    const y1 = topY + (bottomY - topY) * t1;
    const w0 = topW + (bottomW - topW) * t0;
    const w1 = topW + (bottomW - topW) * t1;
    const cx0 = vanishX + (bottomCenterX - vanishX) * t0;
    const cx1 = vanishX + (bottomCenterX - vanishX) * t1;
    ctx.fillStyle = i % 2 === 0 ? '#151515' : '#111111';
    ctx.beginPath();
    ctx.moveTo(cx0 - w0 / 2, y0);
    ctx.lineTo(cx0 + w0 / 2, y0);
    ctx.lineTo(cx1 + w1 / 2, y1);
    ctx.lineTo(cx1 - w1 / 2, y1);
    ctx.closePath();
    ctx.fill();
  }

  // Lane dividers (thin white lines)
  for (let i = 1; i < laneCount; i++) {
    const t = i / laneCount;
    const topX = vanishX - topW / 2 + topW * t;
    const botX = bottomCenterX - bottomW / 2 + bottomW * t;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(botX, bottomY);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Road borders (white, solid)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(vanishX - topW / 2, topY);
  ctx.lineTo(bottomCenterX - bottomW / 2, bottomY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(vanishX + topW / 2, topY);
  ctx.lineTo(bottomCenterX + bottomW / 2, bottomY);
  ctx.stroke();

  // Active lane subtle highlight (accent color, very low opacity)
  const activeLane = vehicle.lane();
  const at0 = activeLane / laneCount;
  const at1 = (activeLane + 1) / laneCount;
  ctx.fillStyle = this.accentColor + '0a'; // ~4% opacity
  ctx.beginPath();
  ctx.moveTo(vanishX - topW / 2 + topW * at0, topY);
  ctx.lineTo(vanishX - topW / 2 + topW * at1, topY);
  ctx.lineTo(bottomCenterX - bottomW / 2 + bottomW * at1, bottomY);
  ctx.lineTo(bottomCenterX - bottomW / 2 + bottomW * at0, bottomY);
  ctx.closePath();
  ctx.fill();
}
```

- [ ] **Step 5: Limpiar el método `initStars` y desactivarlo**

En `resize()`, comentar o eliminar la llamada a `this.initStars()` y `this.drawStaticBackground()`:
```js
resize(w, h, dpr = 1) {
  this.width = w;
  this.height = h;
  [this.bgCanvas, this.roadCanvas, this.hudCanvas].forEach(c => {
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  });
  this.drawStaticBackground(); // ahora solo pinta negro
}
```

- [ ] **Step 6: Verificar en navegador**

- El cielo debe ser negro puro
- La carretera debe mostrar franjas sutiles que se mueven al acelerar
- Bordes blancos limpios sin glow
- El carril activo tiene un destello muy sutil en ámbar al cambiarse de carril

- [ ] **Step 7: Commit**

```bash
git add src/Renderer.js
git commit -m "feat: renderer — black sky, striped road, no glow"
```

---

## Task 6: Renderer — Eventos como Marcas en el Piso

**Files:**
- Modify: `src/Renderer.js`

Este task reemplaza `renderZSprites` (los objetos 3D) por marcas planas sobre el asfalto vistas en perspectiva.

- [ ] **Step 1: Reemplazar `renderZSprites` completo**

```js
renderZSprites(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, sequencer, laneColors, laneCount, now) {
  const bottomCenterX = w / 2 - (vehicle.lateral / 400) * (w * 0.38);
  const maxLookahead = 280;

  const eventsAhead = sequencer.ahead(vehicle.position, road, maxLookahead);
  const distToGate = road.distanceAhead(vehicle.position, 0);
  const gateAhead = distToGate > 0 && distToGate < maxLookahead;

  // Gate
  if (gateAhead) {
    const zNorm = 1 - Math.min(1, distToGate / maxLookahead);
    const pz = Math.pow(zNorm, 2.2);
    const screenY = topY + (bottomY - topY) * pz;
    const roadW = topW + (bottomW - topW) * pz;
    const roadCX = vanishX + (bottomCenterX - vanishX) * pz;
    this._drawGate(ctx, roadCX, screenY, roadW, pz);
  }

  // Floor marks (farthest to nearest — painter's algorithm)
  for (const ev of eventsAhead) {
    if (ev.distance <= 0) continue;
    const zNorm = 1 - Math.min(1, ev.distance / maxLookahead);
    const pz = Math.pow(zNorm, 2.2);
    if (pz < 0.01) continue;

    const screenY = topY + (bottomY - topY) * pz;
    if (screenY < topY) continue; // clip at horizon

    const roadW = topW + (bottomW - topW) * pz;
    const roadCX = vanishX + (bottomCenterX - vanishX) * pz;
    const laneW = roadW / laneCount;
    const laneCX = roadCX - roadW / 2 + laneW * (ev.lane + 0.5);

    const hit = this.isRecentlyHit(ev.lane, ev.position);
    const color = hit ? this.accentColor : '#ffffff';
    const markW = laneW * 0.72;
    const markH = Math.max(2, pz * 10);

    this._drawFloorMark(ctx, ev.lane, laneCX, screenY, markW, markH, color, pz);
  }
}

_drawFloorMark(ctx, lane, cx, y, markW, markH, color, pz) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, pz * 1.5);

  switch (lane) {
    case 0: // Kick — bloque lleno
      ctx.fillRect(cx - markW / 2, y - markH, markW, markH);
      break;

    case 1: // Snare — doble línea
      ctx.beginPath(); ctx.moveTo(cx - markW / 2, y - markH * 0.25); ctx.lineTo(cx + markW / 2, y - markH * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - markW / 2, y - markH * 0.75); ctx.lineTo(cx + markW / 2, y - markH * 0.75); ctx.stroke();
      break;

    case 2: // Hi-Hat — línea punteada
      ctx.setLineDash([Math.max(2, markW * 0.08), Math.max(2, markW * 0.08)]);
      ctx.beginPath(); ctx.moveTo(cx - markW / 2, y - markH / 2); ctx.lineTo(cx + markW / 2, y - markH / 2); ctx.stroke();
      ctx.setLineDash([]);
      break;

    case 3: // Clap — triple línea
      for (let i = 0; i < 3; i++) {
        const ly = y - markH * (0.2 + i * 0.3);
        ctx.beginPath(); ctx.moveTo(cx - markW / 2, ly); ctx.lineTo(cx + markW / 2, ly); ctx.stroke();
      }
      break;

    case 4: // Synth Low — rectángulo hueco
      ctx.strokeRect(cx - markW / 2, y - markH, markW, markH);
      break;

    case 5: // Synth High — línea fina central
      ctx.lineWidth = Math.max(1, pz * 0.8);
      ctx.beginPath(); ctx.moveTo(cx - markW / 2, y - markH / 2); ctx.lineTo(cx + markW / 2, y - markH / 2); ctx.stroke();
      break;
  }
  ctx.restore();
}

_drawGate(ctx, cx, y, roadW, scale) {
  const archH = 60 * scale;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, 2 * scale);
  ctx.beginPath();
  ctx.moveTo(cx - roadW / 2, y);
  ctx.lineTo(cx - roadW / 2, y - archH);
  ctx.lineTo(cx + roadW / 2, y - archH);
  ctx.lineTo(cx + roadW / 2, y);
  ctx.stroke();
  if (scale > 0.3) {
    ctx.fillStyle = this.accentColor;
    ctx.font = `${Math.round(9 * scale)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('LOOP', cx, y - archH - 4 * scale);
  }
  ctx.restore();
}
```

- [ ] **Step 2: Eliminar `drawMusicalEventSprite` y `drawGateSprite`**

Borrar los métodos `drawMusicalEventSprite` y `drawGateSprite` del archivo (ya reemplazados).

- [ ] **Step 3: Verificar en navegador**

- Circular por la pista: los eventos colocados deben verse como marcas planas en el asfalto
- Lane 0 = bloque lleno, Lane 1 = doble línea, Lane 2 = punteado, Lane 3 = triple, Lane 4 = outline, Lane 5 = línea fina
- Al cruzar un evento debe destellar en ámbar brevemente
- El pórtico de vuelta debe ser un arco blanco simple con texto "LOOP" en ámbar

- [ ] **Step 4: Commit**

```bash
git add src/Renderer.js
git commit -m "feat: renderer — events as floor marks, accent flash on hit"
```

---

## Task 7: Renderer — Vehículo + HUD Mínimo

**Files:**
- Modify: `src/Renderer.js`

- [ ] **Step 1: Reemplazar `renderVehicle`**

```js
renderVehicle(ctx, w, h, vehicle, laneColors, vanishX, now) {
  const vx = w / 2;
  const vy = h - 68;
  const carW = 34;
  const carH = 50;

  ctx.save();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(vx, vy + 22, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(vx - carW / 2, vy - carH / 2, carW, carH);

  // Accent rear strip
  ctx.fillStyle = this.accentColor;
  ctx.fillRect(vx - carW / 2, vy + carH / 2 - 5, carW, 5);

  ctx.restore();
}
```

- [ ] **Step 2: Reemplazar `renderHUD`**

```js
renderHUD(world) {
  const ctx = this.hudCtx;
  const w = this.width;
  const h = this.height;
  ctx.clearRect(0, 0, w, h);

  const vehicle = world.vehicle;
  const mpb = this.config.get('outsynth.grid.mpb', 4);
  const liveBPM = Math.round((60 * vehicle.speed) / mpb);
  const laneNames = ['KICK', 'SNARE', 'HI-HAT', 'CLAP', 'SYNTH L', 'SYNTH H'];
  const currentLane = vehicle.lane();

  // BPM — top left, large
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 32px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${liveBPM}`, 24, 44);

  ctx.font = '400 11px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('BPM', 24, 58);

  // Active lane — top center
  ctx.font = '400 12px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(laneNames[currentLane] || '', w / 2, 38);

  // DRIVE indicator — top right (minimal)
  const driveOn = world.audio?.driveMode;
  ctx.font = '400 11px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = driveOn ? this.accentColor : 'rgba(255,255,255,0.2)';
  ctx.fillText(driveOn ? 'DRIVE' : '·', w - 24, 38);
}
```

- [ ] **Step 3: Limpiar `renderEffects`**

Eliminar el bloque de `dropEffects` si aún está en el código (ya no se usa el flash de color en hit wave — se usa `recordHit` en su lugar). Mantener `hitWaves` y `particles` solo si se usan en otro lugar, de lo contrario simplificar:

```js
renderEffects(ctx, dt) {
  // Hit waves
  this.hitWaves = this.hitWaves.filter(w => {
    w.radius += dt * 320;
    w.alpha -= dt * 2.5;
    if (w.alpha <= 0) return false;
    ctx.strokeStyle = this.accentColor;
    ctx.globalAlpha = Math.max(0, w.alpha);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, w.radius, w.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    return true;
  });
  ctx.globalAlpha = 1.0;
  // No particles in v0.3
  this.particles = [];
}
```

Y en `triggerHit`, simplificar para no agregar partículas:
```js
triggerHit(lane, color) {
  this.hitWaves.push({
    x: this.width / 2,
    y: this.height - 70,
    radius: 8,
    maxRadius: 140,
    color: this.accentColor,
    alpha: 0.8,
  });
}
```

En `triggerDrop`, simplificar (sólo registra el hit wave si no es delete):
```js
triggerDrop(lane, isDelete = false) {
  if (!isDelete) {
    this.triggerHit(lane, this.accentColor);
  }
}
```

- [ ] **Step 4: Verificar en navegador**

- El vehículo es un rectángulo blanco simple con franja ámbar en la cola
- El HUD muestra solo BPM grande (top-left), nombre del carril activo (top-center), indicador DRIVE (top-right, solo cuando está activo en ámbar)
- Sin partículas, sin montañas, sin glow

- [ ] **Step 5: Commit**

```bash
git add src/Renderer.js
git commit -m "feat: renderer — minimal vehicle rect, clean HUD"
```

---

## Task 8: Renderer — Minimap Cenital

**Files:**
- Modify: `src/Renderer.js`

- [ ] **Step 1: Agregar `renderMinimap` al final del método `render`**

En el método `render()`, después de `this.renderHUD(world)`, agregar:
```js
this.renderMinimap(world.vehicle, world.sequencer, world.road);
```

- [ ] **Step 2: Agregar el método `renderMinimap`**

```js
renderMinimap(vehicle, sequencer, road) {
  const ctx = this.hudCtx;
  const w = this.width;
  const h = this.height;

  const SIZE = 120;
  const PAD = 16;
  const mx = w - PAD - SIZE / 2;
  const my = h - PAD - SIZE / 2;
  const rx = SIZE * 0.42;
  const ry = SIZE * 0.28;

  // Background
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.ellipse(mx, my, rx + 8, ry + 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Track outline
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Event dots
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (const ev of sequencer.events.values()) {
    const t = (ev.position / road.length) * Math.PI * 2 - Math.PI / 2;
    const ex = mx + rx * Math.cos(t);
    const ey = my + ry * Math.sin(t);
    ctx.beginPath();
    ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vehicle dot (accent color)
  const vt = (vehicle.position / road.length) * Math.PI * 2 - Math.PI / 2;
  const vx = mx + rx * Math.cos(vt);
  const vy = my + ry * Math.sin(vt);
  ctx.fillStyle = this.accentColor;
  ctx.beginPath();
  ctx.arc(vx, vy, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
```

- [ ] **Step 3: Verificar en navegador**

- En la esquina inferior derecha aparece un minimap oval oscuro
- Un punto blanco pequeño marca cada evento colocado sobre el trazo del óvalo
- El punto ámbar se mueve alrededor del óvalo siguiendo la posición del vehículo
- Al completar una vuelta el punto ámbar vuelve al inicio

- [ ] **Step 4: Commit**

```bash
git add src/Renderer.js
git commit -m "feat: renderer — cenital minimap bottom-right"
```

---

## Task 9: SoundMenu — 6 Tarjetas + Selector de Escala

**Files:**
- Modify: `src/SoundMenu.js`

**Interfaces:**
- Consumes: `audio.trackSettings[6]`, `audio.setScale(rootNote, scaleType)`, `audio.scaleNoteNames()`, `audio.currentScale`

- [ ] **Step 1: Reemplazar `src/SoundMenu.js` completo**

```js
export class SoundMenu {
  constructor(audioEngine, themeEngine, onResume) {
    this.audio = audioEngine;
    this.theme = themeEngine;
    this.onResume = onResume;
    this.container = null;
    this.isOpen = false;
    this.initDOM();
  }

  initDOM() {
    let el = document.getElementById('sound-menu');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sound-menu';
      el.className = 'modal-overlay hidden';
      document.getElementById('outsynth-container').appendChild(el);
    }
    this.container = el;
    this.render();
  }

  render() {
    const tracks = this.audio.trackSettings;
    const noteNames = this.audio.scaleNoteNames();
    const { rootNote, scaleType } = this.audio.currentScale;

    const ROOTS = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
    const SCALE_TYPES = [
      { id: 'minor_pentatonic', name: 'Minor Penta' },
      { id: 'major_pentatonic', name: 'Major Penta' },
      { id: 'blues',            name: 'Blues' },
      { id: 'natural_minor',    name: 'Natural Minor' },
      { id: 'major',            name: 'Major' },
      { id: 'dorian',           name: 'Dorian' },
    ];

    this.container.innerHTML = `
      <div class="menu-window">
        <div class="menu-header">
          <div>
            <h2 class="menu-title">OUTSYNTH // STUDIO</h2>
          </div>
          <div class="header-actions">
            <div class="master-vol-control">
              <label>MASTER</label>
              <input type="range" id="master-vol-slider" min="0" max="1" step="0.05" value="${this.audio.masterVolume}">
              <span id="master-vol-val">${Math.round(this.audio.masterVolume * 100)}%</span>
            </div>
            <button id="menu-close-btn" class="menu-btn primary">VOLVER [ESC]</button>
          </div>
        </div>

        <div class="scale-section">
          <span class="scale-label">DRIVE SCALE</span>
          <select id="scale-root">
            ${ROOTS.map(r => `<option value="${r}" ${r === rootNote ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          <select id="scale-type">
            ${SCALE_TYPES.map(s => `<option value="${s.id}" ${s.id === scaleType ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
          <span class="scale-preview">${noteNames.join(' · ')}</span>
        </div>

        <div class="tracks-grid">
          ${tracks.map((track, i) => {
            const presets = this.audio.presets[i] || [];
            return `
              <div class="track-card ${track.muted ? 'is-muted' : ''} ${track.solo ? 'is-solo' : ''}">
                <div class="track-card-header">
                  <span class="track-badge">T${i + 1}</span>
                  <h3 class="track-name">${track.name}</h3>
                  <div class="mute-solo-group">
                    <button class="ms-btn mute-btn ${track.muted ? 'active' : ''}" data-lane="${i}">M</button>
                    <button class="ms-btn solo-btn ${track.solo ? 'active' : ''}" data-lane="${i}">S</button>
                  </div>
                </div>
                <div class="control-group">
                  <div class="slider-header">
                    <label>VOL</label>
                    <span class="val-display" id="vol-val-${i}">${Math.round((track.volume ?? 1) * 100)}%</span>
                  </div>
                  <input type="range" class="vol-slider" data-lane="${i}" min="0" max="1" step="0.05" value="${track.volume ?? 1}">
                </div>
                <div class="control-group">
                  <label>PRESET</label>
                  <select class="preset-select" data-lane="${i}">
                    ${presets.map(p => `<option value="${p.id}" ${track.preset === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                  </select>
                </div>
                <div class="control-group">
                  <div class="slider-header">
                    <label>DECAY</label>
                    <span class="val-display" id="decay-val-${i}">${track.decay.toFixed(2)}s</span>
                  </div>
                  <input type="range" class="decay-slider" data-lane="${i}" min="0.04" max="0.8" step="0.02" value="${track.decay}">
                </div>
                <button class="test-sound-btn" data-lane="${i}">▶ TEST</button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="menu-footer">
          <span class="tip-text">[ESC] o [M] para volver · [D] toggle DRIVE mode · [SHIFT+◀▶] salto de carril</span>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const closeBtn = this.container.querySelector('#menu-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const masterSlider = this.container.querySelector('#master-vol-slider');
    if (masterSlider) {
      masterSlider.oninput = (e) => {
        this.audio.setMasterVolume(parseFloat(e.target.value));
        const disp = this.container.querySelector('#master-vol-val');
        if (disp) disp.innerText = `${Math.round(parseFloat(e.target.value) * 100)}%`;
      };
    }

    // Scale selectors
    const scaleRoot = this.container.querySelector('#scale-root');
    const scaleType = this.container.querySelector('#scale-type');
    const updateScale = () => {
      this.audio.setScale(scaleRoot.value, scaleType.value);
      const preview = this.container.querySelector('.scale-preview');
      if (preview) preview.textContent = this.audio.scaleNoteNames().join(' · ');
    };
    if (scaleRoot) scaleRoot.onchange = updateScale;
    if (scaleType) scaleType.onchange = updateScale;

    // Channel volume
    this.container.querySelectorAll('.vol-slider').forEach(slider => {
      slider.oninput = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        const val = parseFloat(e.target.value);
        this.audio.setTrackProperty(lane, 'volume', val);
        const disp = this.container.querySelector(`#vol-val-${lane}`);
        if (disp) disp.innerText = `${Math.round(val * 100)}%`;
      };
    });

    // Mute
    this.container.querySelectorAll('.mute-btn').forEach(btn => {
      btn.onclick = (e) => {
        this.audio.toggleMute(parseInt(e.target.dataset.lane, 10));
        this.render();
      };
    });

    // Solo
    this.container.querySelectorAll('.solo-btn').forEach(btn => {
      btn.onclick = (e) => {
        this.audio.toggleSolo(parseInt(e.target.dataset.lane, 10));
        this.render();
      };
    });

    // Preset
    this.container.querySelectorAll('.preset-select').forEach(sel => {
      sel.onchange = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        this.audio.setPreset(lane, e.target.value);
        this.audio.trigger(lane);
        this.render();
      };
    });

    // Decay
    this.container.querySelectorAll('.decay-slider').forEach(slider => {
      slider.oninput = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        const val = parseFloat(e.target.value);
        this.audio.setTrackProperty(lane, 'decay', val);
        const disp = this.container.querySelector(`#decay-val-${lane}`);
        if (disp) disp.innerText = `${val.toFixed(2)}s`;
      };
    });

    // Test
    this.container.querySelectorAll('.test-sound-btn').forEach(btn => {
      btn.onclick = (e) => {
        this.audio.start();
        this.audio.trigger(parseInt(e.target.dataset.lane, 10));
      };
    });
  }

  open()   { this.isOpen = true;  this.render(); this.container.classList.remove('hidden'); }
  close()  { this.isOpen = false; this.container.classList.add('hidden'); if (this.onResume) this.onResume(); }
  toggle() { this.isOpen ? this.close() : this.open(); }
}
```

- [ ] **Step 2: Agregar estilos para `.scale-section` en `style.css`**

```css
.scale-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-wrap: wrap;
}
.scale-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.1em;
  min-width: 90px;
}
.scale-preview {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: #f5a623;
  letter-spacing: 0.08em;
}
.scale-section select {
  background: #111;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.15);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  padding: 4px 8px;
}
```

- [ ] **Step 3: Verificar en navegador**

- Abrir Sound Studio (ESC): se muestran 6 tarjetas de canal (KICK, SNARE, HI-HAT, CLAP, SYNTH LOW, SYNTH HIGH)
- La sección DRIVE SCALE en la parte superior muestra root + scale type y el preview de notas: `C3 · Eb3 · G3 · Bb3 · C4 · Eb4`
- Cambiar el root a D: el preview se actualiza a `D3 · F3 · A3 · C4 · D4 · F4`
- Cambiar la escala a Blues: el preview se actualiza en tiempo real
- Botón TEST en cada tarjeta dispara el sonido del canal

- [ ] **Step 4: Commit**

```bash
git add src/SoundMenu.js style.css
git commit -m "feat: SoundMenu — 6 tracks, DRIVE SCALE selector with note preview"
```

---

## Self-Review

**Spec coverage:**

| Sección del spec | Task |
|-----------------|------|
| Paleta monocromática + acento único | Task 1 (YAML) + Task 5 (sky/road) + Task 7 (HUD) |
| Sin shadowBlur, sin partículas decorativas | Task 7 (renderEffects simplificado) |
| Tipografía IBM Plex Mono | Task 1 (index.html + style.css) |
| HUD mínimo (solo BPM + lane) | Task 7 |
| Perspectiva OutRun — 1/z sprites | Task 6 (_drawFloorMark usa pz lineal) |
| Curvatura en sprites | ✅ Task 6 (pendiente: agregar curve shift en renderZSprites) |
| Franjas de carretera | Task 5 |
| Clipping en horizonte | Task 6 (condición `screenY < topY`) |
| Marcas planas en el piso | Task 6 |
| Flash de acento al cruzar evento | Task 5 (recordHit/isRecentlyHit) + Task 6 (uso) |
| Vehículo simple | Task 7 |
| Minimap cenital | Task 8 |
| 6 carriles | Task 1 (YAML) + Task 2 (Audio) |
| Salto de carril (Shift+flecha) | Task 3 + Task 4 |
| WRITE mode (SPACE tap = pintar piso) | Task 4 |
| DRIVE mode (D key, SPACE hold = sustain) | Task 2 + Task 4 |
| Selector de escala (root + type) | Task 2 (setScale) + Task 9 (UI) |
| Preview de notas en Sound Studio | Task 9 |

**Curvatura en sprites (gap encontrado):** La sección de curvatura del spec requiere desplazar los sprites X según la curva. En Task 6, `renderZSprites` no lo implementa todavía. Agregar al inicio de `renderZSprites`:

```js
const curveShift = road.curveAt(vehicle.position) * 80; // CURVE_SHIFT = 80
```

Y en el cálculo de `laneCX`:
```js
const curveOffset = curveShift * (1 - Math.min(1, ev.distance / maxLookahead));
const laneCX = roadCX - roadW / 2 + laneW * (ev.lane + 0.5) + curveOffset;
```

Esto está incorporado en el código de Task 6 arriba. ✅

**Placeholder scan:** Sin TBD ni TODO en ningún step.

**Type consistency:** `recordHit(lane, position)` en Task 5 → usado en Task 4 (`renderer.recordHit(ev.lane, ev.position)`) ✅. `audio.driveMode` definido en Task 2, consumido en Task 4 ✅. `vehicle.jumpLane(delta)` definido en Task 3, llamado en Task 4 ✅. `audio.scaleNoteNames()` definido en Task 2, llamado en Task 9 ✅.
