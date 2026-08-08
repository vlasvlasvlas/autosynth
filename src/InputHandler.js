// ============================================
// OUTSYNTH — InputHandler
// ============================================
// Captures keyboard input and exposes clean state.
// Tracks pressed/held/released states per key.
//
// Usage:
//   const input = new InputHandler();
//   input.init();
//   
//   // In game loop:
//   if (input.isDown('ArrowUp')) { ... }
//   if (input.wasPressed('Space')) { ... }  // true only on first frame
//   input.endFrame();  // reset pressed/released states

export class InputHandler {
  constructor() {
    /** @type {Set<string>} Keys currently held down */
    this._down = new Set();
    /** @type {Set<string>} Keys pressed this frame (first frame only) */
    this._pressed = new Set();
    /** @type {Set<string>} Keys released this frame */
    this._released = new Set();
    /** @type {boolean} Whether any key was pressed this frame */
    this._anyKeyPressed = false;
    /** @type {boolean} Whether the handler is active */
    this._active = false;

    // Bind handlers for clean removal
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  /**
   * Start listening for keyboard events.
   */
  init() {
    if (this._active) return;
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this._active = true;
    console.log('[InputHandler] Initialized');
  }

  /**
   * Stop listening for keyboard events.
   */
  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._active = false;
    this._down.clear();
    this._pressed.clear();
    this._released.clear();
  }

  // ---- Event Handlers ----

  /** @param {KeyboardEvent} e */
  _onKeyDown(e) {
    // Prevent default for game keys (avoid scrolling, etc.)
    if (InputHandler.GAME_KEYS.has(e.code)) {
      e.preventDefault();
    }

    // Only register press on first frame (not key repeat)
    if (!this._down.has(e.code)) {
      this._pressed.add(e.code);
      this._anyKeyPressed = true;
    }

    this._down.add(e.code);
  }

  /** @param {KeyboardEvent} e */
  _onKeyUp(e) {
    this._down.delete(e.code);
    this._released.add(e.code);
  }

  // ---- Query State ----

  /**
   * Is the key currently held down?
   * @param {string} code - KeyboardEvent.code (e.g. 'ArrowUp', 'Space')
   * @returns {boolean}
   */
  isDown(code) {
    return this._down.has(code);
  }

  /**
   * Was the key just pressed this frame? (true only once per press)
   * @param {string} code
   * @returns {boolean}
   */
  wasPressed(code) {
    return this._pressed.has(code);
  }

  /**
   * Was the key just released this frame?
   * @param {string} code
   * @returns {boolean}
   */
  wasReleased(code) {
    return this._released.has(code);
  }

  /**
   * Was any key pressed this frame?
   * Used for "press any key" start screen.
   * @returns {boolean}
   */
  anyKeyPressed() {
    return this._anyKeyPressed;
  }

  // ---- Frame Lifecycle ----

  /**
   * Call at the END of each game loop frame.
   * Clears pressed/released states for next frame.
   */
  endFrame() {
    this._pressed.clear();
    this._released.clear();
    this._anyKeyPressed = false;
  }

  // ---- Action Mapping ----
  // High-level game actions mapped from raw keys

  /** @returns {boolean} Accelerating */
  get accelerate() { return this.isDown('ArrowUp'); }

  /** @returns {boolean} Braking */
  get brake() { return this.isDown('ArrowDown'); }

  /** @returns {boolean} Moving left */
  get left() { return this.isDown('ArrowLeft'); }

  /** @returns {boolean} Moving right */
  get right() { return this.isDown('ArrowRight'); }

  /** @returns {boolean} DROP action (place/remove event) — first frame only */
  get drop() { return this.wasPressed('Space'); }

  /** @returns {boolean} Toggle DRIVE SOUND — first frame only */
  get toggleDrive() { return this.wasPressed('KeyD'); }

  /** @returns {boolean} Pause/Menu — first frame only */
  get pause() { return this.wasPressed('Escape') || this.wasPressed('KeyM') || this.wasPressed('KeyP'); }
}

/**
 * Set of key codes that should have their default browser behavior prevented.
 * @type {Set<string>}
 */
InputHandler.GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', 'KeyD', 'Escape', 'KeyM', 'KeyP'
]);
