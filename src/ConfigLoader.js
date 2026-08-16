// ============================================
// OUTSYNTH — ConfigLoader
// ============================================
// Loads and merges YAML configuration files.
// All game parameters are driven by YAML configs.
//
// Usage:
//   const config = new ConfigLoader();
//   await config.load();
//   config.get('outsynth.grid.mpb')  // → 4
//   config.theme()                    // → theme object
//   config.sounds()                   // → sound_kit object
//   config.track()                    // → track object

import jsyaml from 'js-yaml';

export class ConfigLoader {
  constructor() {
    /** @type {Object} Merged default config */
    this._defaults = {};
    /** @type {Object} Active theme config */
    this._theme = {};
    /** @type {Object} Active sound kit config */
    this._sounds = {};
    /** @type {Object} Active track config */
    this._track = {};
    /** @type {boolean} Whether configs have been loaded */
    this._loaded = false;
  }

  /**
   * Load all configuration files.
   * @param {Object} [options] - Override default file paths
   * @param {string} [options.defaultConfig='config/default.yaml']
   * @param {string} [options.theme='config/themes/minimalist.yaml']
   * @param {string} [options.sounds='config/sounds/classic-kit.yaml']
   * @param {string} [options.track='config/tracks/oval.yaml']
   */
  async load(options = {}) {
    const paths = {
      defaultConfig: options.defaultConfig || 'config/default.yaml',
      theme:         options.theme         || 'config/themes/minimalist.yaml',
      sounds:        options.sounds        || 'config/sounds/classic-kit.yaml',
      track:         options.track         || 'config/tracks/oval.yaml',
    };

    try {
      const [defaults, theme, sounds, track] = await Promise.all([
        this._fetchYaml(paths.defaultConfig),
        this._fetchYaml(paths.theme),
        this._fetchYaml(paths.sounds),
        this._fetchYaml(paths.track),
      ]);

      this._defaults = defaults || {};
      this._theme    = theme    || {};
      this._sounds   = sounds   || {};
      this._track    = track    || {};
      this._loaded   = true;

      console.log('[ConfigLoader] All configs loaded successfully');
      console.log('[ConfigLoader] Theme:', this._theme.theme?.name);
      console.log('[ConfigLoader] Sound kit:', this._sounds.sound_kit?.name);
      console.log('[ConfigLoader] Track:', this._track.track?.name);

    } catch (err) {
      console.error('[ConfigLoader] Failed to load configs:', err);
      throw err;
    }
  }

  /**
   * Fetch and parse a single YAML file.
   * @param {string} path - Relative path to the YAML file
   * @returns {Promise<Object>} Parsed YAML object
   */
  async _fetchYaml(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }
    const text = await response.text();
    return jsyaml.load(text);
  }

  /**
   * Get a nested value from the default config using dot notation.
   * @param {string} path - Dot-separated path, e.g. 'outsynth.grid.mpb'
   * @param {*} [fallback] - Default value if path not found
   * @returns {*} The config value
   */
  get(path, fallback = undefined) {
    const keys = path.split('.');
    let value = this._defaults;
    for (const key of keys) {
      if (value == null || typeof value !== 'object') return fallback;
      value = value[key];
    }
    return value !== undefined ? value : fallback;
  }

  /**
   * Get the active theme configuration.
   * @returns {Object} Theme config (the 'theme' key from the YAML)
   */
  theme() {
    return this._theme.theme || {};
  }

  /**
   * Get the active sound kit configuration.
   * @returns {Object} Sound kit config
   */
  sounds() {
    return this._sounds.sound_kit || {};
  }

  /**
   * Get the active track configuration.
   * @returns {Object} Track config
   */
  track() {
    return this._track.track || {};
  }

  /**
   * Check if configs have been loaded.
   * @returns {boolean}
   */
  isLoaded() {
    return this._loaded;
  }

  /**
   * Get lane colors from the active theme.
   * @returns {string[]} Array of hex color strings
   */
  laneColors() {
    return this.theme().lanes?.colors || Array(6).fill('#ffffff');
  }

  /**
   * Get the number of lanes.
   * @returns {number}
   */
  laneCount() {
    return this.get('outsynth.lanes.count', 6);
  }

  /**
   * Get grid configuration.
   * @returns {{ mpb: number, subdivisions: number, quantize: boolean }}
   */
  grid() {
    return {
      mpb:           this.get('outsynth.grid.mpb', 4),
      subdivisions:  this.get('outsynth.grid.subdivisions', 4),
      quantize:      this.get('outsynth.grid.quantize', true),
    };
  }

  /**
   * Get vehicle physics configuration.
   * @returns {Object} Vehicle physics params
   */
  vehiclePhysics() {
    return {
      maxSpeed:      this.get('outsynth.vehicle.max_speed', 300),
      reverseMaxSpeed: this.get('outsynth.vehicle.reverse_max_speed', 150),
      acceleration:  this.get('outsynth.vehicle.acceleration', 120),
      deceleration:  this.get('outsynth.vehicle.deceleration', 200),
      lateralSpeed:  this.get('outsynth.vehicle.lateral_speed', 400),
      inertia:       this.get('outsynth.vehicle.inertia', 0.98),
      laneSnap:      this.get('outsynth.lanes.snap_strength', 0.15),
    };
  }
}
