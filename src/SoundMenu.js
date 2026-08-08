// ============================================
// OUTSYNTH — SoundMenu
// ============================================
// In-game modal interface to customize volumes, mute/solo,
// synthesizer models, and sound presets for all 4 tracks.

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
    const laneColors = this.theme.laneColors();
    const tracks = this.audio.trackSettings;

    this.container.innerHTML = `
      <div class="menu-window">
        <div class="menu-header">
          <div>
            <h2 class="menu-title">OUTSYNTH // STUDIO TRACK MIXER & SOUNDS</h2>
            <p class="menu-subtitle">Ajustá volúmenes, mute/solo, timbres y presets de cada carril</p>
          </div>
          <div class="header-actions">
            <div class="master-vol-control">
              <label>MASTER</label>
              <input type="range" id="master-vol-slider" min="0" max="1" step="0.05" value="${this.audio.masterVolume}">
              <span id="master-vol-val">${Math.round(this.audio.masterVolume * 100)}%</span>
            </div>
            <button id="menu-close-btn" class="menu-btn primary">VOLVER A LA RUTA [ESC]</button>
          </div>
        </div>

        <div class="tracks-grid">
          ${tracks.map((track, i) => {
            const color = laneColors[i] || '#fff';
            const presets = this.audio.presets[i] || [];
            return `
              <div class="track-card ${track.muted ? 'is-muted' : ''} ${track.solo ? 'is-solo' : ''}" style="--track-color: ${color}; border-top: 3px solid ${color};">
                <div class="track-card-header">
                  <span class="track-badge" style="background: ${color};">TRACK ${i + 1}</span>
                  <h3 class="track-name" style="color: ${color};">${track.name}</h3>
                  <div class="mute-solo-group">
                    <button class="ms-btn mute-btn ${track.muted ? 'active' : ''}" data-lane="${i}">MUTE</button>
                    <button class="ms-btn solo-btn ${track.solo ? 'active' : ''}" data-lane="${i}">SOLO</button>
                  </div>
                </div>

                <!-- Channel Volume Slider -->
                <div class="control-group">
                  <div class="slider-header">
                    <label>Volumen Canal</label>
                    <span class="val-display" id="vol-val-${i}">${Math.round((track.volume ?? 1) * 100)}%</span>
                  </div>
                  <input type="range" class="vol-slider" data-lane="${i}" min="0" max="1" step="0.05" value="${track.volume ?? 1}">
                </div>

                <!-- Timbre Preset -->
                <div class="control-group">
                  <label>Preset Tímbrico</label>
                  <select class="preset-select" data-lane="${i}">
                    ${presets.map(p => `
                      <option value="${p.id}" ${track.preset === p.id ? 'selected' : ''}>${p.name}</option>
                    `).join('')}
                  </select>
                </div>

                <!-- Waveform Selector -->
                <div class="control-group">
                  <label>Forma de Onda</label>
                  <div class="waveform-pills" data-lane="${i}">
                    ${['sine', 'triangle', 'sawtooth', 'square'].map(wf => `
                      <button class="pill-btn ${track.waveform === wf ? 'active' : ''}" data-wf="${wf}">${wf.slice(0, 4).toUpperCase()}</button>
                    `).join('')}
                  </div>
                </div>

                <!-- Decay Slider -->
                <div class="control-group">
                  <div class="slider-header">
                    <label>Duración / Decay</label>
                    <span class="val-display" id="decay-val-${i}">${track.decay.toFixed(2)}s</span>
                  </div>
                  <input type="range" class="decay-slider" data-lane="${i}" min="0.04" max="0.8" step="0.02" value="${track.decay}">
                </div>

                <!-- Frequency / Pitch Slider -->
                <div class="control-group">
                  <div class="slider-header">
                    <label>Tono Base / Pitch</label>
                    <span class="val-display" id="freq-val-${i}">${Math.round(track.baseFreq)}Hz</span>
                  </div>
                  <input type="range" class="freq-slider" data-lane="${i}" min="${i === 2 ? 2000 : (i === 0 ? 50 : 100)}" max="${i === 2 ? 12000 : (i === 0 ? 300 : 880)}" step="${i === 2 ? 200 : 5}" value="${track.baseFreq}">
                </div>

                <button class="test-sound-btn" data-lane="${i}" style="border-color: ${color}; color: ${color};">
                  ▶ PROBAR CANAL
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="menu-footer">
          <span class="tip-text">CONSEJO: Podés abrir y cerrar este menú en cualquier momento presionando <strong>[ESC]</strong> o <strong>[M]</strong></span>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Close button
    const closeBtn = this.container.querySelector('#menu-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => this.close();
    }

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

    // Channel Volume Sliders
    this.container.querySelectorAll('.vol-slider').forEach(slider => {
      slider.oninput = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        const val = parseFloat(e.target.value);
        this.audio.setTrackProperty(lane, 'volume', val);
        const disp = this.container.querySelector(`#vol-val-${lane}`);
        if (disp) disp.innerText = `${Math.round(val * 100)}%`;
      };
    });

    // Mute Buttons
    this.container.querySelectorAll('.mute-btn').forEach(btn => {
      btn.onclick = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        this.audio.toggleMute(lane);
        this.render();
      };
    });

    // Solo Buttons
    this.container.querySelectorAll('.solo-btn').forEach(btn => {
      btn.onclick = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        this.audio.toggleSolo(lane);
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

    // Waveform pills
    this.container.querySelectorAll('.waveform-pills .pill-btn').forEach(btn => {
      btn.onclick = (e) => {
        const parent = e.target.closest('.waveform-pills');
        const lane = parseInt(parent.dataset.lane, 10);
        const wf = e.target.dataset.wf;
        this.audio.setTrackProperty(lane, 'waveform', wf);
        this.audio.trigger(lane);
        this.render();
      };
    });

    // Decay sliders
    this.container.querySelectorAll('.decay-slider').forEach(slider => {
      slider.oninput = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        const val = parseFloat(e.target.value);
        this.audio.setTrackProperty(lane, 'decay', val);
        const disp = this.container.querySelector(`#decay-val-${lane}`);
        if (disp) disp.innerText = `${val.toFixed(2)}s`;
      };
    });

    // Frequency sliders
    this.container.querySelectorAll('.freq-slider').forEach(slider => {
      slider.oninput = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        const val = parseFloat(e.target.value);
        this.audio.setTrackProperty(lane, 'baseFreq', val);
        const disp = this.container.querySelector(`#freq-val-${lane}`);
        if (disp) disp.innerText = `${Math.round(val)}Hz`;
      };
    });

    // Test Sound buttons
    this.container.querySelectorAll('.test-sound-btn').forEach(btn => {
      btn.onclick = (e) => {
        const lane = parseInt(e.target.dataset.lane, 10);
        this.audio.start();
        this.audio.trigger(lane);
      };
    });
  }

  open() {
    this.isOpen = true;
    this.render();
    this.container.classList.remove('hidden');
  }

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
    if (this.onResume) this.onResume();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }
}
