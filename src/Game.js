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

    // Pre-populate a rhythm on the track so the world has music immediately
    // Kick pattern
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

    // 3. Setup Canvas & Renderer
    const bgCanvas = document.getElementById('bg-canvas');
    const roadCanvas = document.getElementById('road-canvas');
    const hudCanvas = document.getElementById('hud-canvas');

    this.renderer = new Renderer(bgCanvas, roadCanvas, hudCanvas, this.config, this.theme);
    window.addEventListener('resize', this._onResize);
    this._onResize();

    // 4. Sound Menu
    this.soundMenu = new SoundMenu(this.audio, this.theme, () => {
      this.state = State.PLAYING;
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
        // Resume Audio Context on User Gesture
        this.audio.start();

        const startScreenEl = document.getElementById('start-screen');
        if (startScreenEl) {
          startScreenEl.classList.add('hidden');
          setTimeout(() => {
            startScreenEl.style.display = 'none';
            this.state = State.PLAYING;
          }, 600);
        } else {
          this.state = State.PLAYING;
        }
      }
    } else if (this.state === State.PLAYING) {
      // Check pause / open sound menu
      if (this.input.pause) {
        this.state = State.PAUSED;
        this.soundMenu.open();
      } else {
        this._update(dt);
        this.renderer.render({
          vehicle: this.vehicle,
          road: this.road,
          sequencer: this.sequencer,
          audio: this.audio,
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
