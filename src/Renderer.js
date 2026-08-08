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

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Visual particles & hit animations
    this.particles = [];
    this.hitWaves = [];
    this.dropEffects = [];

    // Stars for background
    this.stars = [];
    this.initStars();
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

    this.initStars();
    this.drawStaticBackground();
  }

  initStars() {
    this.stars = [];
    const count = Math.floor((this.width * this.height) / 12000);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.46),
        size: Math.random() * 1.6 + 0.4,
        brightness: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 1.5 + 0.5,
      });
    }
  }

  drawStaticBackground() {
    const ctx = this.bgCtx;
    const w = this.width;
    const h = this.height;
    const sky = this.theme.sky();
    const horizonY = h * 0.44;

    // Rich cosmic sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, sky.top || '#060612');
    skyGrad.addColorStop(0.65, sky.bottom || '#0e1026');
    skyGrad.addColorStop(1, '#1b1b38');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY + 2);

    // Distant mountain skyline silhouette
    ctx.fillStyle = '#0a0a18';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const peak = i % 2 === 1 ? horizonY - (18 + Math.sin(i * 1.4) * 12) : horizonY - 4;
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(w, horizonY);
    ctx.closePath();
    ctx.fill();

    // Dark terrain ground beneath road
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, '#0a0a14');
    groundGrad.addColorStop(1, '#040408');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Stars
    for (const star of this.stars) {
      ctx.fillStyle = `rgba(220, 230, 255, ${star.brightness})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Horizon neon glow
    const hGlow = ctx.createLinearGradient(0, horizonY - 30, 0, horizonY + 20);
    hGlow.addColorStop(0, 'transparent');
    hGlow.addColorStop(0.5, 'rgba(120, 100, 255, 0.22)');
    hGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = hGlow;
    ctx.fillRect(0, horizonY - 30, w, 50);

    // Horizon line
    ctx.strokeStyle = 'rgba(200, 210, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();
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

    // 2. Render Z-Depth Sprites (Gates, Musical Events, Scenery)
    this.renderZSprites(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, sequencer, laneColors, laneCount, now);

    // 3. Render Particles & Hit Waves
    this.renderEffects(ctx, dt);

    // 4. Render Vehicle Sprite
    this.renderVehicle(ctx, w, h, vehicle, laneColors, vanishX, now);

    // 5. Render HUD Overlay
    this.renderHUD(world);
  }

  // ---- Road Track with Perspective ----
  renderRoadTrack(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, laneColors, laneCount) {
    const bottomCenterX = w / 2 - (vehicle.lateral / 400) * (w * 0.38);

    // Full road polygon
    ctx.fillStyle = '#0f101d';
    ctx.beginPath();
    ctx.moveTo(vanishX - topW / 2, topY);
    ctx.lineTo(vanishX + topW / 2, topY);
    ctx.lineTo(bottomCenterX + bottomW / 2, bottomY);
    ctx.lineTo(bottomCenterX - bottomW / 2, bottomY);
    ctx.closePath();
    ctx.fill();

    // Road neon borders (outer rails)
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(120, 100, 255, 0.6)';
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 3;

    // Left border
    ctx.beginPath();
    ctx.moveTo(vanishX - topW / 2, topY);
    ctx.lineTo(bottomCenterX - bottomW / 2, bottomY);
    ctx.stroke();

    // Right border
    ctx.beginPath();
    ctx.moveTo(vanishX + topW / 2, topY);
    ctx.lineTo(bottomCenterX + bottomW / 2, bottomY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Individual Lanes with subtle gradient fills
    for (let i = 0; i < laneCount; i++) {
      const t0 = i / laneCount;
      const t1 = (i + 1) / laneCount;

      const topL = vanishX - topW / 2 + topW * t0;
      const topR = vanishX - topW / 2 + topW * t1;
      const botL = bottomCenterX - bottomW / 2 + bottomW * t0;
      const botR = bottomCenterX - bottomW / 2 + bottomW * t1;

      // Active lane glow
      if (i === vehicle.lane()) {
        ctx.fillStyle = laneColors[i] + '18'; // 10% opacity glow
        ctx.beginPath();
        ctx.moveTo(topL, topY);
        ctx.lineTo(topR, topY);
        ctx.lineTo(botR, bottomY);
        ctx.lineTo(botL, bottomY);
        ctx.closePath();
        ctx.fill();
      }

      // Lane divider dashes
      if (i > 0) {
        ctx.strokeStyle = laneColors[i - 1] + '55';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([12, 16]);
        ctx.beginPath();
        ctx.moveTo(topL, topY);
        ctx.lineTo(botL, bottomY);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Animated speed dashes on the road (Z-scrolling grid lines)
    const dashSpacing = 8; // in meters/units
    const offset = (vehicle.position % dashSpacing) / dashSpacing;
    const numDashes = 18;

    for (let d = 0; d < numDashes; d++) {
      const zNorm = (d + offset) / numDashes; // 0 (horizon) to 1 (near)
      const pz = Math.pow(zNorm, 2.4); // perspective exponential curve
      const y = topY + (bottomY - topY) * pz;
      const curW = topW + (bottomW - topW) * pz;
      const curCenterX = vanishX + (bottomCenterX - vanishX) * pz;

      ctx.strokeStyle = `rgba(180, 190, 255, ${0.04 + pz * 0.16})`;
      ctx.lineWidth = Math.max(1, pz * 2.5);
      ctx.beginPath();
      ctx.moveTo(curCenterX - curW / 2, y);
      ctx.lineTo(curCenterX + curW / 2, y);
      ctx.stroke();
    }
  }

  // ---- Z-Depth Sprites (The Core Visual Concept) ----
  renderZSprites(ctx, w, h, topY, bottomY, topW, bottomW, vanishX, vehicle, road, sequencer, laneColors, laneCount, now) {
    const bottomCenterX = w / 2 - (vehicle.lateral / 400) * (w * 0.38);
    const maxLookahead = 280; // Distance ahead in meters

    // Gather events ahead from the sequencer (sorted far to near)
    const eventsAhead = sequencer.ahead(vehicle.position, road, maxLookahead);

    // Also check for the Gate (Position 0)
    const distToGate = road.distanceAhead(vehicle.position, 0);
    const gateAhead = distToGate > 0 && distToGate < maxLookahead;

    const spritesToDraw = [];

    // Add musical event sprites
    for (const ev of eventsAhead) {
      const zDist = ev.distance; // distance in units
      if (zDist <= 0) continue;
      spritesToDraw.push({
        type: 'event',
        lane: ev.lane,
        distance: zDist,
        position: ev.position,
      });
    }

    // Add Gate sprite
    if (gateAhead) {
      spritesToDraw.push({
        type: 'gate',
        distance: distToGate,
      });
    }

    // Sort from farthest to nearest (Painter's Algorithm)
    spritesToDraw.sort((a, b) => b.distance - a.distance);

    // Render each sprite scaled with distance (1/z projection)
    for (const item of spritesToDraw) {
      const zNorm = 1 - Math.min(1, item.distance / maxLookahead); // 0 (horizon) -> 1 (camera)
      const pz = Math.pow(zNorm, 2.2); // exponential perspective projection

      const screenY = topY + (bottomY - topY) * pz;
      const roadW = topW + (bottomW - topW) * pz;
      const roadCX = vanishX + (bottomCenterX - vanishX) * pz;
      const scale = Math.max(0.1, pz * 1.5); // scale factor

      if (item.type === 'gate') {
        this.drawGateSprite(ctx, roadCX, screenY, roadW, scale, now);
      } else if (item.type === 'event') {
        const laneW = roadW / laneCount;
        const laneX = roadCX - roadW / 2 + laneW * (item.lane + 0.5);
        this.drawMusicalEventSprite(ctx, laneX, screenY, item.lane, laneColors[item.lane], scale, pz, now);
      }
    }
  }

  // ---- Draw Gate / Arch (Lap Marker) ----
  drawGateSprite(ctx, cx, cy, roadW, scale, now) {
    const archH = 90 * scale;
    const archW = roadW * 1.05;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18 * scale;
    ctx.lineWidth = Math.max(2, 4 * scale);

    // Arch pillars & top beam
    ctx.beginPath();
    ctx.moveTo(cx - archW / 2, cy);
    ctx.lineTo(cx - archW / 2, cy - archH);
    ctx.lineTo(cx + archW / 2, cy - archH);
    ctx.lineTo(cx + archW / 2, cy);
    ctx.stroke();

    // Luminous Gate Sign "OUTSYNTH // LOOP"
    if (scale > 0.35) {
      ctx.fillStyle = '#00f0ff';
      ctx.font = `bold ${Math.round(11 * scale)}px "Space Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('◆ LOOP GATE ◆', cx, cy - archH - 6 * scale);
    }
    ctx.restore();
  }

  // ---- Draw Musical Event Sprites (Kick, Snare, Hat, Synth) ----
  drawMusicalEventSprite(ctx, x, y, lane, color, scale, pz, now) {
    ctx.save();
    const baseSize = 42 * scale;
    const glowAlpha = Math.min(1, 0.4 + pz * 0.6);

    ctx.shadowColor = color;
    ctx.shadowBlur = (12 + Math.sin(now * 0.008) * 4) * scale;

    switch (lane) {
      case 0: { // Kick — Radiant Monolith Cube
        const w = baseSize * 1.1;
        const h = baseSize * 1.3;
        ctx.fillStyle = color;
        ctx.fillRect(x - w / 2, y - h, w, h);

        // Core glow
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - w * 0.25, y - h * 0.8, w * 0.5, h * 0.6);

        // Ground shadow/reflection
        ctx.fillStyle = color + '44';
        ctx.fillRect(x - w * 0.6, y, w * 1.2, 4 * scale);
        break;
      }

      case 1: { // Snare — Neon Pillar & Diamond
        const size = baseSize * 1.0;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 1.4);
        ctx.lineTo(x + size * 0.6, y - size * 0.7);
        ctx.lineTo(x, y);
        ctx.lineTo(x - size * 0.6, y - size * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.7, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 2: { // Hi-Hat — Rhythm Beacon / Rings
        const rad = baseSize * 0.55;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.5, 3 * scale);
        ctx.beginPath();
        ctx.arc(x, y - rad * 1.2, rad, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y - rad * 1.2, rad * 0.35, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 3: { // Synth — Crystal Energy Tower / Pyramidal Spike
        const w = baseSize * 0.9;
        const h = baseSize * 1.7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x - w / 2, y);
        ctx.closePath();
        ctx.fill();

        // Inner radiant beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }

  // ---- Vehicle Sprite ----
  renderVehicle(ctx, w, h, vehicle, laneColors, vanishX, now) {
    const vx = w / 2;
    const vy = h - 68;
    const currentLane = vehicle.lane();
    const laneColor = laneColors[currentLane] || '#ff3366';
    const isMoving = vehicle.speed > 2;

    ctx.save();

    // 1. Headlight Cones on the highway ahead
    const beamGrad = ctx.createLinearGradient(vx, vy, vx, vy - 180);
    const beamAlpha = isMoving ? 0.22 : 0.08;
    beamGrad.addColorStop(0, `rgba(220, 235, 255, ${beamAlpha})`);
    beamGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(vx - 20, vy);
    ctx.lineTo(vx - 70, vy - 170);
    ctx.lineTo(vx + 70, vy - 170);
    ctx.lineTo(vx + 20, vy);
    ctx.closePath();
    ctx.fill();

    // 2. Vehicle Ground Shadow & Lane Aura
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(vx, vy + 24, 38, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = laneColor + '33';
    ctx.beginPath();
    ctx.ellipse(vx, vy + 22, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cyber Vehicle Body
    const carW = 38;
    const carH = 54;

    // Chassis
    ctx.fillStyle = '#121320';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(vx - carW / 2, vy - carH / 2, carW, carH, [8, 8, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Cockpit Canopy (tinted glass with reflection)
    ctx.fillStyle = '#06060c';
    ctx.strokeStyle = laneColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(vx - carW * 0.35, vy - carH * 0.38, carW * 0.7, carH * 0.48, [6, 6, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Neon Tail Strip (Glows with active instrument lane color)
    ctx.shadowColor = laneColor;
    ctx.shadowBlur = 16;
    ctx.fillStyle = laneColor;
    ctx.fillRect(vx - carW * 0.42, vy + carH * 0.34, carW * 0.84, 5);

    // Twin Exhaust Pulse Particles when moving
    if (isMoving && Math.random() < 0.4) {
      this.particles.push({
        x: vx + (Math.random() < 0.5 ? -carW * 0.3 : carW * 0.3),
        y: vy + carH * 0.4,
        vx: (Math.random() - 0.5) * 20,
        vy: Math.random() * 40 + 20,
        color: laneColor,
        life: 0.35,
        maxLife: 0.35,
        size: Math.random() * 3 + 2,
      });
    }

    ctx.restore();
  }

  // ---- Particle & Trigger Hit Wave Effects ----
  triggerHit(lane, color) {
    this.hitWaves.push({
      x: this.width / 2,
      y: this.height - 70,
      radius: 10,
      maxRadius: 180,
      color: color,
      alpha: 1.0,
    });

    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 240 + 80;
      this.particles.push({
        x: this.width / 2,
        y: this.height - 70,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 60,
        color: color,
        life: 0.5,
        maxLife: 0.5,
        size: Math.random() * 4 + 2,
      });
    }
  }

  triggerDrop(lane, color, isDelete = false) {
    this.dropEffects.push({
      lane,
      color: isDelete ? '#ff3344' : color,
      alpha: 1.0,
      isDelete,
    });
  }

  renderEffects(ctx, dt) {
    // Hit Waves
    this.hitWaves = this.hitWaves.filter(w => {
      w.radius += dt * 420;
      w.alpha -= dt * 2.2;
      if (w.alpha <= 0) return false;
      ctx.strokeStyle = w.color;
      ctx.globalAlpha = Math.max(0, w.alpha);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, w.radius, w.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });

    // Particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) return false;
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1.0;
  }

  // ---- HUD Overlay ----
  renderHUD(world) {
    const ctx = this.hudCtx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    const vehicle = world.vehicle;
    const currentLane = vehicle.lane();
    const laneColors = this.theme.laneColors();
    const activeColor = laneColors[currentLane] || '#ff3366';
    const instrumentNames = ['KICK [BASS]', 'SNARE [PUNCH]', 'HI-HAT [RHYTHM]', 'SYNTH [MELODY]'];

    // 1. Live Musical Telemetry (Top Left)
    const mpb = this.config.get('outsynth.grid.mpb', 4);
    const liveBPM = Math.round((60 * vehicle.speed) / mpb);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '700 20px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${liveBPM} BPM`, 24, 38);

    ctx.font = '400 11px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`SPEED: ${Math.round(vehicle.speed)} u/s  •  MPB: ${mpb}m/beat`, 24, 56);

    // 2. Active Instrument Badge (Top Center)
    ctx.save();
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = activeColor;
    ctx.font = '700 13px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`TRACK ${currentLane + 1} // ${instrumentNames[currentLane]}`, w / 2, 36);
    ctx.restore();

    // 3. Drive Mode Badge & Menu Shortcut (Top Right)
    const driveOn = world.audio?.driveEnabled;
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = driveOn ? '#00f0ff' : 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`[D] DRIVE: ${driveOn ? 'ON' : 'OFF'}  •  [ESC/M] SOUND STUDIO`, w - 24, 38);

    // 4. Interactive Bottom Controls Helper
    ctx.font = '400 11px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('▲/▼ SPEED   •   ◀/▶ LANE   •   [SPACE] DROP NOTE   •   [D] DRIVE   •   [ESC/M] SOUNDS', w / 2, h - 18);
  }
}
