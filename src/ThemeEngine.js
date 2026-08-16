// ============================================
// OUTSYNTH — ThemeEngine
// ============================================
// Reads theme YAML and exposes color palettes, sprite styles,
// and visual parameters for the renderer.
//
// Usage:
//   const theme = new ThemeEngine(configLoader);
//   theme.sky()        → { top: '#050508', bottom: '#12121e' }
//   theme.laneColor(0) → '#ff3366'
//   theme.sprite('kick') → { shape: 'floor_block', scale: 1 }

export class ThemeEngine {
  /**
   * @param {import('./ConfigLoader.js').ConfigLoader} config
   */
  constructor(config) {
    this._config = config;
    this._theme = {};
  }

  /**
   * Initialize theme from loaded config.
   * Call after ConfigLoader.load() completes.
   */
  init() {
    this._theme = this._config.theme();
    console.log('[ThemeEngine] Initialized theme:', this._theme.name || 'unnamed');
  }

  /** @returns {string} Theme name */
  name() {
    return this._theme.name || 'Untitled';
  }

  // ---- Sky ----

  /** @returns {{ top: string, bottom: string }} Sky gradient colors */
  sky() {
    return this._theme.sky?.gradient || { top: '#050508', bottom: '#12121e' };
  }

  // ---- Horizon ----

  /** @returns {{ color: string, glow: boolean }} */
  horizon() {
    return {
      color: this._theme.horizon?.color || '#1a1a2e',
      glow:  this._theme.horizon?.glow  || false,
    };
  }

  // ---- Road ----

  /** @returns {Object} Road surface colors */
  road() {
    const r = this._theme.road || {};
    return {
      surface:     r.surface      || '#0e0e0e',
      surfaceAlt:  r.surface_alt  || '#0a0a0a',
      border:      r.border       || '#2a2a3a',
      centerLine:  r.center_line  || '#1e1e2e',
      laneMarkers: r.lane_markers || '#161622',
    };
  }

  // ---- Lanes ----

  /**
   * Get accent color for a specific lane.
   * @param {number} index - Lane index (0-based)
   * @returns {string} Hex color
   */
  laneColor(index) {
    const colors = this._theme.lanes?.colors || Array(6).fill('#ffffff');
    return colors[index % colors.length];
  }

  /**
   * Get all lane colors.
   * @returns {string[]}
   */
  laneColors() {
    return this._theme.lanes?.colors || Array(6).fill('#ffffff');
  }

  // ---- Sprites ----

  /**
   * Get sprite visual config for an instrument type.
   * @param {string} type - 'kick' | 'snare' | 'hat' | 'synth'
   * @returns {Object} Sprite appearance config
   */
  sprite(type) {
    const defaults = {
      shape: 'floor_line',
      glow: false,
      pulse_on_trigger: false,
      blink_on_trigger: false,
      trail: false,
      scale: 1.0,
    };
    return { ...defaults, ...(this._theme.sprites?.[type] || {}) };
  }

  // ---- Gate ----

  /** @returns {Object} Gate (lap marker) visual config */
  gate() {
    const g = this._theme.gate || {};
    return {
      color:         g.color          || '#ffffff',
      opacity:       g.opacity        || 0.5,
      flashOnCross:  g.flash_on_cross || true,
      flashColor:    g.flash_color    || '#ffffff',
      flashDuration: g.flash_duration || 300,
    };
  }

  // ---- Vehicle ----

  /** @returns {Object} Vehicle visual config */
  vehicle() {
    const v = this._theme.vehicle || {};
    return {
      color:   v.color   || '#ffffff',
      outline: v.outline || '#333333',
      trail:   v.trail   || false,
    };
  }

  // ---- Effects ----

  /** @returns {Object} Visual effects config */
  effects() {
    const e = this._theme.effects || {};
    return {
      dropFlashColor:      e.drop_flash_color    || '#ffffff',
      dropFlashDuration:   e.drop_flash_duration  || 150,
      deleteParticles:     e.delete_particles     ?? true,
      deleteParticleCount: e.delete_particle_count || 12,
      speedLines:          e.speed_lines          ?? true,
      speedLinesColor:     e.speed_lines_color    || '#222233',
      speedLinesMinSpeed:  e.speed_lines_min_speed || 100,
    };
  }

  // ---- Scenery ----

  /** @returns {Object} Roadside scenery config */
  scenery() {
    const s = this._theme.scenery || {};
    return {
      postColor: s.post_color || '#1a1a2e',
      postGlow:  s.post_glow  || false,
    };
  }

  // ---- Utilities ----

  /**
   * Parse a hex color string to RGB components.
   * @param {string} hex - Hex color (e.g. '#ff3366')
   * @returns {{ r: number, g: number, b: number }} RGB values (0-255)
   */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Interpolate between two hex colors.
   * @param {string} colorA - Start hex color
   * @param {string} colorB - End hex color
   * @param {number} t - Interpolation factor (0-1)
   * @returns {string} Interpolated hex color
   */
  static lerpColor(colorA, colorB, t) {
    const a = ThemeEngine.hexToRgb(colorA);
    const b = ThemeEngine.hexToRgb(colorB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bv = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r}, ${g}, ${bv})`;
  }
}
