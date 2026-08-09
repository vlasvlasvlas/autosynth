// ============================================
// OUTSYNTH — Renderer
// ============================================
// High-performance 2.5D perspective canvas renderer.
// Renders sky, horizon, highway lanes with Z-depth,
// glowing musical sprites approaching along Z axis,
// animated vehicle with headlight beams and particle effects.

import { ThemeEngine } from './ThemeEngine.js';

export class Renderer {
  constructor(bgCanvas, roadCanvas, hudCanvas, config, theme) {
    this.bgCanvas = bgCanvas;
    this.roadCanvas = roadCanvas;
    this.hudCanvas = hudCanvas;
    this.bgCtx = bgCanvas.getContext('2d');
    this.roadCtx = roadCanvas.getContext('2d');
    this.hudCtx = hudCanvas.getContext('2d');
    this.config = config;
    this.theme = theme;

    // Accent color for highlights (amber)
    this.accentColor = window._outsynthAccentColor || config.get('outsynth.accent_color', '#f5a623');
    // Flash map: keyed by "lane:position", value = performance.now() timestamp
    this.recentHits = new Map();

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Hit wave animations (particles removed in v0.3)
    this.particles = [];
    this.hitWaves = [];
  }

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

    this.drawStaticBackground();
  }

  drawStaticBackground() {
    const ctx = this.bgCtx;
    const w = this.width;
    const h = this.height;
    // Deep dark background
    ctx.fillStyle = '#050014';
    ctx.fillRect(0, 0, w, h);

    // Glowing horizon sun/gradient
    const horizonY = h * 0.44;
    const grad = ctx.createLinearGradient(0, horizonY - 150, 0, horizonY);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, this.accentColor + '40'); // Glowing neon aura
    ctx.fillStyle = grad;
    ctx.fillRect(0, horizonY - 150, w, 150);
    
    // Horizon line
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.accentColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
  }

  // ---- Main Frame Render ----
  render(world, dt, now) {
    const ctx = this.roadCtx;
    const w = this.width;
    const h = this.height;
    const horizonY = h * 0.44;

    ctx.clearRect(0, 0, w, h);

    const laneColors = this.theme.laneColors();
    const laneCount = this.config.laneCount();
    const vehicle = world.vehicle;
    const road = world.road;
    const sequencer = world.sequencer;

    // Road dimensions
    const topW = Math.max(24, w * 0.04);
    const bottomW = Math.min(w * 0.88, 1400);
    const topY = horizonY;
    const bottomY = h + 10;
    const curve = road.curveAt(vehicle.position);
    const vanishX = w / 2 - (vehicle.lateral / 400) * (w * 0.1) + curve * 30;

    // 1. Draw Road Surface & Lanes
    this.renderRoadTrack(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, laneColors, laneCount);

    // 2. Render Floor Marks (Events as perspective road marks + Gate)
    this.renderFloorMarks(ctx, vehicle, sequencer, road, vanishX);

    // 3. Render Particles & Hit Waves
    this.renderEffects(ctx, dt);

    // 4. Render Vehicle Sprite
    this.renderVehicle(ctx, w, h, vehicle, laneColors, vanishX, now);

    // 5. Render HUD Overlay
    this.renderHUD(world);
  }

  // ---- Road Track with Perspective (Synthwave Grid) ----
  renderRoadTrack(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, laneColors, laneCount) {
    const bottomCenterX = w / 2 - (vehicle.lateral / 400) * (w * 0.38);

    // Road polygon fill
    ctx.fillStyle = '#0a001a'; // dark purple/black
    ctx.beginPath();
    ctx.moveTo(vanishX - topW / 2, topY);
    ctx.lineTo(vanishX + topW / 2, topY);
    ctx.lineTo(bottomCenterX + bottomW / 2, bottomY);
    ctx.lineTo(bottomCenterX - bottomW / 2, bottomY);
    ctx.closePath();
    ctx.fill();

    // Horizontal grid lines (moving towards camera)
    const numStripes = 20;
    const stripeOffset = (vehicle.position % 8) / 8;
    ctx.strokeStyle = this.accentColor + '40'; // neon grid color with alpha
    ctx.lineWidth = 1.5;
    ctx.shadowColor = this.accentColor;
    ctx.shadowBlur = 5;

    for (let i = 0; i < numStripes; i++) {
      const t = Math.pow(Math.min(1, (i + stripeOffset) / numStripes), 2.2);
      const y = topY + (bottomY - topY) * t;
      const curW = topW + (bottomW - topW) * t;
      const cx = vanishX + (bottomCenterX - vanishX) * t;
      
      ctx.beginPath();
      ctx.moveTo(cx - curW / 2, y);
      ctx.lineTo(cx + curW / 2, y);
      ctx.stroke();
    }

    // Vertical grid lines (Lane dividers)
    for (let i = 0; i <= laneCount; i++) {
      const t = i / laneCount;
      const topX = vanishX - topW / 2 + topW * t;
      const botX = bottomCenterX - bottomW / 2 + bottomW * t;
      
      ctx.lineWidth = (i === 0 || i === laneCount) ? 3 : 1;
      ctx.strokeStyle = (i === 0 || i === laneCount) ? '#ffffff' : this.accentColor + '60';
      ctx.shadowBlur = (i === 0 || i === laneCount) ? 10 : 4;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(botX, bottomY);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0; // reset
  }

  // ---- Floor Marks — Events as Perspective Road Marks ----
  renderFloorMarks(ctx, vehicle, sequencer, road, vanishX) {
    const w = this.width;
    const h = this.height;
    const horizonY = h * 0.44;
    const topY = horizonY;
    const bottomY = h + 10;
    const topW = Math.max(24, w * 0.04);
    const bottomW = Math.min(w * 0.88, 1400);
    const bottomCenterX = w / 2 - (vehicle.lateral / 400) * (w * 0.38);
    const curve = road.curveAt(vehicle.position);
    const laneCount = this.config.laneCount();
    const maxLookahead = 280;

    const eventsAhead = sequencer.ahead(vehicle.position, road, maxLookahead);
    const distToGate = road.distanceAhead(vehicle.position, 0);
    const gateAhead = distToGate > 0 && distToGate < maxLookahead;

    // Merge gate into item list so it sorts correctly with events (painter's algorithm)
    const allItems = [...eventsAhead];
    if (gateAhead) allItems.push({ isGate: true, distance: distToGate });
    allItems.sort((a, b) => b.distance - a.distance);

    for (const item of allItems) {
      if (item.distance <= 0) continue;
      const zNorm = 1 - Math.min(1, item.distance / maxLookahead);
      const pz = Math.pow(zNorm, 2.2);
      if (pz < 0.01) continue;

      const screenY = topY + (bottomY - topY) * pz;
      if (screenY <= topY) continue; // clip at horizon

      const roadW = topW + (bottomW - topW) * pz;
      const roadCX = vanishX + (bottomCenterX - vanishX) * pz;

      if (item.isGate) {
        this._drawGate(ctx, roadCX, screenY, roadW, pz);
        continue;
      }

      const laneW = roadW / laneCount;
      const curveOffset = curve * (1 - item.distance / maxLookahead) * 80;
      const laneCX = roadCX - roadW / 2 + laneW * (item.lane + 0.5) + curveOffset;

      const hit = this.isRecentlyHit(item.lane, item.position);
      const color = hit ? this.accentColor : '#ffffff';

      // BASE_SIZE scale formula: large near camera, small at horizon
      const scale = 2800 / (item.distance + 1);
      const markW = (bottomW / laneCount) * Math.min(1, scale / 100);
      const markH = Math.max(2, scale / 12);

      this._drawFloorMark(ctx, item.lane, laneCX, screenY, markW, markH, color);
    }
  }

  // ---- Floor Mark Shape Renderer ----
  _drawFloorMark(ctx, shape, cx, y, markW, markH, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15; // glowing paint effect

    switch (shape) {
      case 0: // Kick — solid painted block
        ctx.fillRect(cx - markW / 2 + 2, y - markH / 2, markW - 4, markH);
        break;

      case 1: // Snare — two thick lines
        ctx.fillRect(cx - markW / 2 + 2, y - markH / 2, markW - 4, markH * 0.3);
        ctx.fillRect(cx - markW / 2 + 2, y + markH * 0.2, markW - 4, markH * 0.3);
        break;

      case 2: // Hi-Hat — glowing dots (or small squares)
        for (let x = cx - markW / 2 + 6; x < cx + markW / 2 - 2; x += 12) {
          ctx.fillRect(x, y - markH / 4, Math.max(2, markH / 2), Math.max(2, markH / 2));
        }
        break;

      case 3: // Clap — three thick blocks
        ctx.fillRect(cx - markW / 2 + 2, y - markH / 2, markW - 4, markH * 0.2);
        ctx.fillRect(cx - markW / 2 + 2, y - markH * 0.1, markW - 4, markH * 0.2);
        ctx.fillRect(cx - markW / 2 + 2, y + markH * 0.3, markW - 4, markH * 0.2);
        break;

      case 4: // Synth Low — outline glowing rect
        ctx.lineWidth = Math.max(2, markH * 0.2);
        ctx.strokeRect(cx - markW / 2 + 2, y - markH / 2, markW - 4, markH);
        break;

      case 5: // Synth High — single thick center line
        ctx.fillRect(cx - markW / 2 + 2, y - markH * 0.15, markW - 4, markH * 0.3);
        break;
    }
    ctx.restore();
  }

  // ---- Gate / Loop Arch Marker ----
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

  // ---- Vehicle Sprite ----
  renderVehicle(ctx, w, h, vehicle, laneColors, vanishX, now) {
    const bottomW = Math.min(w * 0.88, 1400);
    const halfRoad = (vehicle.laneCount * vehicle.laneWidth) / 2;
    const lateralT = (vehicle.lateral + halfRoad) / (vehicle.laneCount * vehicle.laneWidth);
    const vx = w / 2 - bottomW / 2 + bottomW * lateralT;
    const vy = h * 0.82;
    const carW = 80;
    const carH = 36;

    ctx.save();
    ctx.shadowBlur = 0;

    // White body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(vx - carW / 2, vy - carH / 2, carW, carH);

    // Black outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(vx - carW / 2, vy - carH / 2, carW, carH);

    // Accent rear strip
    ctx.fillStyle = this.accentColor;
    ctx.fillRect(vx - carW / 2, vy + carH / 2 - 4, carW, 4);

    ctx.restore();
  }

  // ---- Hit Wave Effects ----
  triggerHit(lane, color) {
    this.hitWaves.push({
      lane: lane,
      yPos: 0.82, // relative Y on screen
      radius: 8,
      maxRadius: 140,
      color: color || this.accentColor,
      alpha: 1.0,
    });
  }

  triggerDrop(lane, isDelete = false) {
    if (!isDelete) {
      this.triggerHit(lane, '#ffffff'); // bright flash on drop
    }
  }

  renderEffects(ctx, dt) {
    const w = this.width;
    const h = this.height;
    const bottomW = Math.min(w * 0.88, 1400);
    const laneCount = this.config.laneCount();
    const laneW = bottomW / laneCount;

    // Hit waves
    this.hitWaves = this.hitWaves.filter(w => {
      w.radius += dt * 400;
      w.alpha -= dt * 3.0;
      if (w.alpha <= 0) return false;
      
      // Calculate X center based on lane
      // Simple approximation for the effect location
      const startX = (this.width / 2) - (bottomW / 2);
      const laneCX = startX + (laneW * (w.lane + 0.5));
      const cy = h * w.yPos;

      ctx.save();
      ctx.strokeStyle = w.color;
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = Math.max(0, w.alpha);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(laneCX, cy, w.radius, w.radius * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      
      return true;
    });
    this.particles = [];
  }

  // ---- Hit Flash Tracking (consumed by Tasks 6, 7, 8) ----
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

  // ---- HUD Overlay ----
  renderHUD(world) {
    const ctx = this.hudCtx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    const vehicle = world.vehicle;
    const mpb = this.config.get('outsynth.grid.mpb', 4);
    const liveBPM = Math.round((60 * vehicle.speed) / mpb);
    const currentLane = vehicle.lane();

    // BPM — top left, large
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 32px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${liveBPM}`, 24, 44);

    ctx.font = '400 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('BPM', 24, 58);

    // Active lane name — top center
    const laneNames = ['KICK', 'SNARE', 'HI-HAT', 'CLAP', 'SYNTH L', 'SYNTH H'];
    const laneName = world.audio?.trackSettings?.[currentLane]?.name || laneNames[currentLane] || '';
    ctx.font = '400 13px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(laneName, w / 2, 38);

    // DRIVE indicator — top right
    const driveOn = world.audio?.driveMode;
    ctx.font = '400 13px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = driveOn ? this.accentColor : 'rgba(255,255,255,0.2)';
    ctx.fillText(driveOn ? 'DRIVE' : '·', w - 24, 38);

    // Controls hint — bottom center
    ctx.font = '400 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('◀ ▶ LANES  |  ▲ ▼ DRIVE  |  Z JUMP  |  SPACE PAINT', w / 2, h - 24);

    // Minimap — bottom right
    this.renderMinimap(ctx, world.vehicle, world.sequencer, world.road);
  }

  // ---- Cenital Minimap ----
  renderMinimap(hudCtx, vehicle, sequencer, road) {
    const ctx = hudCtx;
    const w = this.width;
    const h = this.height;

    const SIZE = 130;
    const PAD = 16;
    const mapLeft = w - PAD - SIZE;
    const mapTop = h - PAD - SIZE;
    const cx = mapLeft + 65;
    const cy = mapTop + 65;
    const rx = 52;
    const ry = 40;

    ctx.save();

    // Background: black rect
    ctx.fillStyle = '#000000';
    ctx.fillRect(mapLeft, mapTop, SIZE, SIZE);

    // Track outline: white thin ellipse
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Angle mapping helper
    const mapAngle = (pos) => (pos / road.length) * Math.PI * 2 - Math.PI / 2;

    // All events: white 2px dots at their oval position
    ctx.fillStyle = '#ffffff';
    for (const ev of sequencer.events.values()) {
      const t = mapAngle(ev.position);
      const ex = cx + rx * Math.cos(t);
      const ey = cy + ry * Math.sin(t);
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vehicle: 4px filled circle in accent color
    const vt = mapAngle(vehicle.position);
    const vx = cx + rx * Math.cos(vt);
    const vy = cy + ry * Math.sin(vt);
    ctx.fillStyle = this.accentColor;
    ctx.beginPath();
    ctx.arc(vx, vy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
