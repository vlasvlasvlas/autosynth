// ============================================
// OUTSYNTH — Game (Main Engine)
// ============================================
// Coordinates state machine, game loop, road, vehicle,
// spatial sequencer, Web Audio engine, 2.5D renderer, and sound studio menu.

import { ConfigLoader } from './ConfigLoader.js';
import { ThemeEngine } from './ThemeEngine.js';
import { InputHandler } from './InputHandler.js';
import { Road } from './Road.js';
import { Vehicle } from './Vehicle.js';
import { Sequencer } from './Sequencer.js';
import { AudioEngine } from './AudioEngine.js';
import { Renderer } from './Renderer.js';
import { SoundMenu } from './SoundMenu.js';

const State = Object.freeze({
  LOADING: 'LOADING',
  START_SCREEN: 'START_SCREEN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
});

class Game {
  constructor() {
    this.config = new ConfigLoader();
    this.theme = new ThemeEngine(this.config);
    this.input = new InputHandler();

    this.road = null;
    this.vehicle = null;
    this.sequencer = null;
    this.audio = null;
    this.renderer = null;
    this.soundMenu = null;

    this.state = State.LOADING;
    this.lastTime = 0;
    this._startFadeStarted = false;

    this._loop = this._loop.bind(this);
    this._onResize = this._onResize.bind(this);
  }

  async boot() {
    console.log('[Game] Booting OUTSYNTH...');
    this.state = State.LOADING;

    // 1. Load YAML configs
    await this.config.load();
    this.theme.init();

    // 2. Initialize Core World Models
    const trackConfig = this.config.track();
    const laneCount = this.config.laneCount();
    const laneWidth = this.config.get('outsynth.lanes.width', 200);
    const physics = this.config.vehiclePhysics();
    const grid = this.config.grid();

    this.road = new Road(trackConfig);
    this.vehicle = new Vehicle(physics, laneCount, laneWidth);
    this.sequencer = new Sequencer(grid, laneCount, this.road.length);
    this.audio = new AudioEngine(this.config.sounds(), this.config.get('outsynth.audio.master_volume', 0.8));

    // Empezamos limpios (0 sonidos) por solicitud del usuario

    // 3. Setup Canvas & Renderer
    const bgCanvas = document.getElementById('bg-canvas');
    const roadCanvas = document.getElementById('road-canvas');
    const hudCanvas = document.getElementById('hud-canvas');

    this.renderer = new Renderer(bgCanvas, roadCanvas, hudCanvas, this.config, this.theme);
    window.addEventListener('resize', this._onResize);
    this._onResize();

    // 4. Sound Menu
    this.soundMenu = new SoundMenu(this.audio, this.theme, this.sequencer, () => {
      this.state = State.PLAYING;
    });

    // Bind floating UI buttons
    document.getElementById('btn-config')?.addEventListener('click', () => {
      this.soundMenu.toggle();
    });
    document.getElementById('btn-help')?.addEventListener('click', () => {
      document.getElementById('help-modal')?.classList.remove('hidden');
    });
    document.getElementById('close-help-btn')?.addEventListener('click', () => {
      document.getElementById('help-modal')?.classList.add('hidden');
    });
    document.getElementById('help-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'help-modal') {
        e.target.classList.add('hidden');
      }
    });

    this.state = State.START_SCREEN;
    this._startFadeStarted = false;

    // Listen for custom event from accent color picker
    window.addEventListener('outsynth-accent-change', (e) => {
      this.theme.accentColor = e.detail.color;
      this.renderer.setAccentColor(e.detail.color);
    });

    // 5. Input Listener
    this.input.init();

    // 6. Start Screen Ready
    this.state = State.START_SCREEN;
    this.lastTime = performance.now();
    requestAnimationFrame(this._loop);
  }

  _onResize() {
    const dpr = window.devicePixelRatio || 1;
    this.renderer.resize(window.innerWidth, window.innerHeight, dpr);
  }

  _loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.state === State.START_SCREEN) {
      if (this.input.anyKeyPressed() && !this._startFadeStarted) {
        this._startFadeStarted = true;
        this.renderer.setAccentColor(window._outsynthAccentColor);
        // Resume Audio Context on User Gesture
        this.audio.start();

        const startScreenEl = document.getElementById('start-screen');
        if (startScreenEl) {
          startScreenEl.classList.add('hidden');
          document.getElementById('floating-ui')?.classList.remove('hidden');
          setTimeout(() => {
            startScreenEl.style.display = 'none';
            this.state = State.PLAYING;
          }, 600);
        } else {
          this.state = State.PLAYING;
        }
      }
    } else if (this.state === State.PLAYING) {
      // Check pause / open sound menu or close help
      if (this.input.pause) {
        const helpModal = document.getElementById('help-modal');
        if (helpModal && !helpModal.classList.contains('hidden')) {
          helpModal.classList.add('hidden');
        } else {
          this.audio.stopDriveSustain();
          this.state = State.PAUSED;
          this.soundMenu.open();
        }
      } else {
        this._update(dt);
        this.renderer.render({
          vehicle: this.vehicle,
          road: this.road,
          sequencer: this.sequencer,
          audio: this.audio,
          input: this.input,
        }, dt, now);
      }
    } else if (this.state === State.PAUSED) {
      // Toggle sound menu off if pause key pressed again
      if (this.input.pause) {
        this.soundMenu.close();
      }
    }

    this.input.endFrame();
    requestAnimationFrame(this._loop);
  }

  _update(dt) {
    const movement = this.vehicle.update(dt, this.input, this.road.length);

    // Instant two-lane jump from the approved v0.3 interaction model.
    if (this.input.jumpLeft) this.vehicle.jumpLane(-2);
    if (this.input.jumpRight) this.vehicle.jumpLane(2);
    const lane = this.vehicle.lane();

    // Toggle DRIVE mode (D key)
    if (this.input.toggleDrive) {
      this.audio.toggleDriveMode();
    }

    // Pattern Templates (0-9 keys)
    const digit = this.input.digitPressed;
    if (digit !== null) {
      this._loadTemplate(digit);
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
        if (!isDelete) this.renderer.recordHit(lane, dropResult.position);
      }
    }

    // Spatial triggers: events crossed by vehicle
    const crossedEvents = this.sequencer.crossed(
      movement.previousPosition,
      movement.position,
      movement.wrapped,
      movement.isReverse,
    );
    for (const ev of crossedEvents) {
      if (this.input.erase && ev.lane === lane) {
        this.sequencer.events.delete(this.sequencer.key(ev.lane, ev.position));
        continue;
      }
      this.audio.trigger(ev.lane, movement.isReverse);
      this.renderer.recordHit(ev.lane, ev.position);
    }
  }

  _loadTemplate(index) {
    this.sequencer.events.clear();
    if (index === 0) return;

    const l = this.road.length;
    // The track holds exactly 32 beats. Old templates used 16 units per beat.
    // We scale them so they map correctly to the absolute road length.
    const unitsPerBeat = l / 32; 
    const s = unitsPerBeat / 16;
    const add = (lane, pos) => this.sequencer.toggle(lane, pos * s);
    const maxI = l / s;

    if (index === 1) { // House
      for (let i = 0; i < maxI; i += 32) { add(0, i); add(2, i + 16); }
      for (let i = 32; i < maxI; i += 64) add(1, i);
    } else if (index === 2) { // Techno Drive (4-measure progression)
      for (let i = 0; i < maxI; i += 256) {
        // Measures 1-3: Core 4-to-the-floor beat
        for (let m = 0; m < 192; m += 16) {
          add(0, i + m); // Kick
          add(2, i + m + 8); // Offbeat Hat
        }
        // Measure 4: Techno Build-up (snare rush, no kick)
        for (let m = 192; m < 256; m += 8) {
          add(1, i + m); // Fast snares
          add(2, i + m); // Fast hats
        }
        
        // Synth Low (Lane 4): Rolling Bass on Measures 1 & 2
        for (let m = 0; m < 128; m += 32) {
          add(4, i + m + 4); add(4, i + m + 12); add(4, i + m + 20);
        }
        // Synth Low: Driving 8ths on Measure 3
        for (let m = 128; m < 192; m += 16) {
          add(4, i + m); add(4, i + m + 8);
        }
        
        // Synth High (Lane 5): Sparse eerie stabs on measure 2
        add(5, i + 64 + 16); add(5, i + 64 + 48);
        // Synth High: Frantic rising stabs on measure 4 build
        add(5, i + 192); add(5, i + 208); add(5, i + 224); add(5, i + 240);
      }
    } else if (index === 3) { // Electro Break
      for (let i = 0; i < maxI; i += 64) {
        add(0, i); add(0, i + 24); add(1, i + 32);
        add(2, i); add(2, i + 16); add(2, i + 32); add(2, i + 48);
      }
    } else if (index === 4) { // Synthwave Pop (256 units = 4 measures)
      for (let i = 0; i < maxI; i += 256) {
        // Base drums
        for (let m = 0; m < 256; m += 64) {
          add(0, i + m); add(0, i + m + 32); // Kick
          add(1, i + m + 16); add(1, i + m + 48); // Snare
          for (let j = 8; j < 64; j += 16) add(2, i + m + j); // Hat
        }
        // Drum fill end of measure 4
        add(1, i + 192 + 56); add(0, i + 192 + 56);
        
        // Synth Low (Lane 4)
        add(4, i); add(4, i + 16);
        add(4, i + 64); add(4, i + 80); add(4, i + 112);
        add(4, i + 128); add(4, i + 144);
        add(4, i + 192); add(4, i + 208); add(4, i + 240);

        // Synth High (Lane 5) - Responses
        add(5, i + 48); add(5, i + 56);
        add(5, i + 96); add(5, i + 104);
        add(5, i + 176); add(5, i + 184);
        add(5, i + 224); add(5, i + 240); // Big chord finish
      }
    } else if (index === 5) { // Minimal (with variation every 4th measure)
      for (let i = 0; i < maxI; i += 256) {
        // Core minimal groove for 3 measures
        for (let m = 0; m < 192; m += 64) {
          add(0, i + m); // Kick
          add(2, i + m + 48); // Late hat
          add(5, i + m + 16); // Syncopated synth
        }
        // 4th measure: Complexity / Variation fill
        add(0, i + 192); add(0, i + 192 + 32); // Double kick
        add(2, i + 192 + 16); add(2, i + 192 + 48); // More hats
        add(4, i + 192 + 32); // Surprise sub bass hit
        add(5, i + 192 + 16); add(5, i + 192 + 40); add(5, i + 192 + 56); // Synth cascade
      }
    } else if (index === 6) { // Ambient Space / Downtempo Groove
      for (let i = 0; i < maxI; i += 256) {
        // Deep slow kick (every 128)
        add(0, i); add(0, i + 128);
        // Distant snare/clap (every 128, offset 64)
        add(1, i + 64); add(1, i + 192);
        
        // Rolling ambient bass (Lane 4)
        add(4, i + 16); add(4, i + 32); add(4, i + 80); add(4, i + 96);
        add(4, i + 144); add(4, i + 160); add(4, i + 208); add(4, i + 224);

        // Sweeping High Synth (Lane 5) - very spaced out
        add(5, i + 48); add(5, i + 112);
        add(5, i + 176); add(5, i + 240);
        
        // Occasional hat glitch for texture
        add(2, i + 120); add(2, i + 124); add(2, i + 248); add(2, i + 252);
      }
    } else if (index === 7) { // Electro Pop Call & Response (4 measures)
      for (let i = 0; i < maxI; i += 256) {
        // Drums
        for (let m = 0; m < 256; m += 64) {
          add(0, i + m); add(0, i + m + 32); // Kick
          add(1, i + m + 16); add(1, i + m + 48); // Snare
          add(2, i + m + 8); add(2, i + m + 24); add(2, i + m + 40); add(2, i + m + 56); // Hats
        }
        
        // "CALL": Synth Low (Lane 4) plays mostly on measures 1 and 3
        add(4, i); add(4, i + 8); add(4, i + 24); add(4, i + 32); 
        add(4, i + 128); add(4, i + 136); add(4, i + 152); add(4, i + 160);

        // "RESPONSE": Synth High (Lane 5) answers on measures 2 and 4
        add(5, i + 64 + 16); add(5, i + 64 + 32); add(5, i + 64 + 48);
        add(5, i + 192 + 16); add(5, i + 192 + 32); add(5, i + 192 + 40); add(5, i + 192 + 48);
      }
    } else if (index === 8) { // Polyrhythm
      for (let i = 0; i < maxI; i += 24) add(0, i);
      for (let i = 0; i < maxI; i += 32) add(2, i);
      for (let i = 0; i < maxI; i += 40) add(5, i);
    } else if (index === 9) { // Chaos Random Fill
      for (let i = 0; i < maxI; i += 16) {
        add(Math.floor(Math.random() * 6), i);
        if (Math.random() > 0.5) add(Math.floor(Math.random() * 6), i + 8);
      }
    }
  }
}

// Boot the Game
const game = new Game();
game.boot().catch(err => {
  console.error('[Game] Boot error:', err);
  document.body.innerHTML = `
    <div style="color:#ff3366;padding:2em;font-family:monospace;background:#06060c;min-height:100vh;">
      <h2>OUTSYNTH // Error al iniciar</h2>
      <pre>${err.stack || err.message}</pre>
    </div>
  `;
});
