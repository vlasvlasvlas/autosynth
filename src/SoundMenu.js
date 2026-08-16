// ============================================
// OUTSYNTH — SoundMenu v0.3
// ============================================
// Sound Studio modal: 6 track cards + DRIVE SCALE selector.
// Monochromatic palette (#000 / whites / greys), accent #f5a623.
// IBM Plex Mono throughout. No per-track colours.

export class SoundMenu {
  constructor(audioEngine, themeEngine, sequencer, onResume) {
    this.audio = audioEngine;
    this.theme = themeEngine;
    this.sequencer = sequencer;
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
            <h2 class="menu-title">OUTSYNTH // SOUND STUDIO</h2>
          </div>
          <div class="header-actions">
            <div class="master-vol-control">
              <label>MASTER</label>
              <input type="range" id="master-vol-slider" min="0" max="1" step="0.05" value="${this.audio.masterVolume}">
              <span id="master-vol-val">${Math.round(this.audio.masterVolume * 100)}%</span>
            </div>
            <button id="menu-close-btn" class="menu-btn primary">[ESC]</button>
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
          <span class="scale-preview" id="scale-preview">${noteNames.join(' · ')}</span>

          <span class="scale-label" style="margin-left: auto;">GRID STEPS</span>
          <select id="grid-steps">
            ${[16, 32, 64, 128, 256].map(s => `<option value="${s}" ${s === (this.sequencer.grid.steps || 128) ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>

        <div class="tracks-grid">
          ${tracks.map((track, i) => {
            const presets = this.audio.presets[i] || [];
            return `
              <div class="track-card ${track.muted ? 'is-muted' : ''} ${track.solo ? 'is-solo' : ''}">
                <div class="track-card-header">
                  <span class="track-badge" style="background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8);">T${i + 1}</span>
                  <h3 class="track-name" style="color: #e0e0e0;">${track.name}</h3>
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
                <button class="test-sound-btn" data-lane="${i}" style="border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.7);">▶ TEST</button>
              </div>
            `;
          }).join('')}
          
          <div class="track-card" style="border-color: ${this.theme.accentColor}55;">
            <div class="track-card-header">
              <span class="track-badge" style="background: ${this.theme.accentColor}; color: #000;">DRIVE</span>
              <h3 class="track-name" style="color: ${this.theme.accentColor};">SYNTHESIS</h3>
            </div>
            <div class="control-group">
              <div class="slider-header">
                <label style="color: ${this.theme.accentColor};">VOL</label>
                <span class="val-display" id="drive-vol-val" style="color: ${this.theme.accentColor};">${Math.round(this.audio.driveSettings.volume * 100)}%</span>
              </div>
              <input type="range" id="drive-vol-slider" min="0" max="1" step="0.05" value="${this.audio.driveSettings.volume}">
            </div>
            <div class="control-group">
              <label style="color: ${this.theme.accentColor};">MODULE TIMBRE</label>
              <select id="drive-preset" style="border-color: ${this.theme.accentColor};">
                ${this.audio.drivePresets.map(p => `<option value="${p.id}" ${p.id === this.audio.currentDrivePresetId ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
            <button id="test-drive-btn" style="width: 100%; margin-top: auto; background: transparent; border: 1px solid ${this.theme.accentColor}55; color: ${this.theme.accentColor}; padding: 0.5rem; font: inherit; cursor: pointer;">[HOLD] TO TEST</button>
          </div>
        </div>

        <div class="menu-footer">
          <span class="tip-text">[ESC] or [M] to return · [D] toggle DRIVE mode · [SHIFT+◀▶] lane jump</span>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Close button
    const closeBtn = this.container.querySelector('#menu-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    // Master Volume
    const masterSlider = this.container.querySelector('#master-vol-slider');
    if (masterSlider) {
      masterSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        this.audio.setMasterVolume(val);
        const disp = this.container.querySelector('#master-vol-val');
        if (disp) disp.innerText = `${Math.round(val * 100)}%`;
      };
    }

    // Scale selectors
    const scaleRoot = this.container.querySelector('#scale-root');
    const scaleTypeEl = this.container.querySelector('#scale-type');
    const updateScale = () => {
      this.audio.setScale(scaleRoot.value, scaleTypeEl.value);
      const preview = this.container.querySelector('#scale-preview');
      if (preview) preview.textContent = this.audio.scaleNoteNames().join(' · ');
    };
    if (scaleRoot) scaleRoot.onchange = updateScale;
    if (scaleTypeEl) scaleTypeEl.onchange = updateScale;

    // Grid Steps selector
    const gridStepsEl = this.container.querySelector('#grid-steps');
    if (gridStepsEl) {
      gridStepsEl.onchange = (e) => {
        this.sequencer.grid.steps = parseInt(e.target.value, 10);
      };
    }

    // Drive Timbre selector
    const drivePresetEl = this.container.querySelector('#drive-preset');
    if (drivePresetEl) {
      drivePresetEl.onchange = (e) => {
        this.audio.setDrivePreset(e.target.value);
      };
    }
    
    // Drive Volume Slider
    const driveVolSlider = this.container.querySelector('#drive-vol-slider');
    if (driveVolSlider) {
      driveVolSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        this.audio.setDriveVolume(val);
        const disp = this.container.querySelector('#drive-vol-val');
        if (disp) disp.innerText = `${Math.round(val * 100)}%`;
      };
    }

    // Drive Test Button
    const testDriveBtn = this.container.querySelector('#test-drive-btn');
    if (testDriveBtn) {
      const startDrive = () => {
        this.audio.start();
        if (!this.audio.driveMode) this.audio.toggleDriveMode();
        this.audio.triggerDriveSustain(0);
      };
      const stopDrive = () => {
        this.audio.stopDriveSustain();
      };
      testDriveBtn.onmousedown = startDrive;
      testDriveBtn.onmouseup = stopDrive;
      testDriveBtn.onmouseleave = stopDrive;
    }

    // Channel volume sliders
    this.container.querySelectorAll('.vol-slider').forEach(slider => {
      slider.oninput = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        const val = parseFloat(e.target.value);
        this.audio.setTrackProperty(lane, 'volume', val);
        const disp = this.container.querySelector(`#vol-val-${lane}`);
        if (disp) disp.innerText = `${Math.round(val * 100)}%`;
      };
    });

    // Mute buttons
    this.container.querySelectorAll('.mute-btn').forEach(btn => {
      btn.onclick = (e) => {
        this.audio.toggleMute(parseInt(e.target.dataset.lane, 10));
        this.render();
      };
    });

    // Solo buttons
    this.container.querySelectorAll('.solo-btn').forEach(btn => {
      btn.onclick = (e) => {
        this.audio.toggleSolo(parseInt(e.target.dataset.lane, 10));
        this.render();
      };
    });

    // Preset dropdowns
    this.container.querySelectorAll('.preset-select').forEach(sel => {
      sel.onchange = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        this.audio.setPreset(lane, e.target.value);
        this.audio.trigger(lane);
        this.render();
      };
    });

    // Test sound buttons
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
