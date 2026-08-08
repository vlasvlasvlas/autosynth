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
    this.accentColor = config.get('outsynth.accent_color', '#f5a623');
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
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
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
    const vanishX = w / 2 - (vehicle.lateral / 400) * (w * 0.1);

    // 1. Draw Road Surface & Lanes
    this.renderRoadTrack(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, laneColors, laneCount);

    // 2. Render Floor Marks (Events as perspective road marks + Gate)
    this.renderFloorMarks(ctx, vehicle, sequencer, road);

    // 3. Render Particles & Hit Waves
    this.renderEffects(ctx, dt);

    // 4. Render Vehicle Sprite
    this.renderVehicle(ctx, w, h, vehicle, laneColors, vanishX, now);

    // 5. Render HUD Overlay
    this.renderHUD(world);
  }

  // ---- Road Track with Perspective (OutRun-style stripes) ----
  renderRoadTrack(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, laneColors, laneCount) {
    const bottomCenterX = w / 2 - (vehicle.lateral / 400) * (w * 0.38);

    // Road polygon fill (near-black base)
    ctx.fillStyle = '#0d0d0d';
    ctx.beginPath();
    ctx.moveTo(vanishX - topW / 2, topY);
    ctx.lineTo(vanishX + topW / 2, topY);
    ctx.lineTo(bottomCenterX + bottomW / 2, bottomY);
    ctx.lineTo(bottomCenterX - bottomW / 2, bottomY);
    ctx.closePath();
    ctx.fill();

    // OutRun-style alternating stripes (white/grey by depth)
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
      ctx.fillStyle = i % 2 === 0 ? '#cccccc' : '#888888';
      ctx.beginPath();
      ctx.moveTo(cx0 - w0 / 2, y0);
      ctx.lineTo(cx0 + w0 / 2, y0);
      ctx.lineTo(cx1 + w1 / 2, y1);
      ctx.lineTo(cx1 - w1 / 2, y1);
      ctx.closePath();
      ctx.fill();
    }

    // Lane dividers (thin grey dashed lines in perspective)
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

    // Road borders (solid white, no glow)
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

  // ---- Floor Marks — Events as Perspective Road Marks ----
  renderFloorMarks(ctx, vehicle, sequencer, road) {
    const w = this.width;
    const h = this.height;
    const horizonY = h * 0.44;
    const topY = horizonY;
    const bottomY = h + 10;
    const topW = Math.max(24, w * 0.04);
    const bottomW = Math.min(w * 0.88, 1400);
    const vanishX = w / 2 - (vehicle.lateral / 400) * (w * 0.1);
    const bottomCenterX = w / 2 - (vehicle.lateral / 400) * (w * 0.38);
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
      const laneCX = roadCX - roadW / 2 + laneW * (item.lane + 0.5);

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

    switch (shape) {
      case 0: // Kick — filled rect (full lane width × markH)
        ctx.fillRect(cx - markW / 2, y - markH / 2, markW, markH);
        break;

      case 1: // Snare — two parallel horizontal lines
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - markW / 2, y - 2); ctx.lineTo(cx + markW / 2, y - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - markW / 2, y + 2); ctx.lineTo(cx + markW / 2, y + 2); ctx.stroke();
        break;

      case 2: // Hi-Hat — dotted line (3px dot every 8px)
        for (let x = cx - markW / 2; x < cx + markW / 2; x += 8) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 3: // Clap — three parallel horizontal lines
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - markW / 2, y - 3); ctx.lineTo(cx + markW / 2, y - 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - markW / 2, y); ctx.lineTo(cx + markW / 2, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - markW / 2, y + 3); ctx.lineTo(cx + markW / 2, y + 3); ctx.stroke();
        break;

      case 4: // Synth Low — outline rect, no fill
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - markW / 2, y - markH / 2, markW, markH);
        break;

      case 5: // Synth High — single thin horizontal line
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - markW / 2, y); ctx.lineTo(cx + markW / 2, y); ctx.stroke();
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
    const vx = w / 2;
    const vy = h * 0.82;
    const carW = 80;
    const carH = 36;

    ctx.save();

    // Body — white rectangle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(vx - carW / 2, vy - carH / 2, carW, carH);

    // 2px black stroke outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(vx - carW / 2, vy - carH / 2, carW, carH);

    // Accent rear strip (bottom 4px)
    ctx.fillStyle = this.accentColor;
    ctx.fillRect(vx - carW / 2, vy + carH / 2 - 4, carW, 4);

    ctx.restore();
  }

  // ---- Hit Wave Effects (particles removed in v0.3) ----
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

  triggerDrop(lane, isDelete = false) {
    if (!isDelete) {
      this.triggerHit(lane, this.accentColor);
    }
  }

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
