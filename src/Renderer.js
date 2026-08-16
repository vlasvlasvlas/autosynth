// OUTSYNTH — segmented pseudo-3D road and spatial sequencer renderer.
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

    this.accentColor = window._outsynthAccentColor || config.get('outsynth.accent_color', '#f5a623');
    this.recentHits = new Map();
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this._onAccentChange = (event) => this.setAccentColor(event.detail?.color);
    window.addEventListener('outsynth-accent-change', this._onAccentChange);
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;

    [this.bgCanvas, this.roadCanvas, this.hudCanvas].forEach((canvas) => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    });

    this.drawStaticBackground();
  }

  setAccentColor(color) {
    if (!/^#[0-9a-f]{6}$/i.test(color || '')) return;
    this.accentColor = color;
    this.drawStaticBackground();
  }

  drawStaticBackground() {
    const ctx = this.bgCtx;
    const width = this.bgCanvas.width;
    const height = this.bgCanvas.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Deep synthwave/cyberpunk minimalist gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a0512'); // Very dark purple top
    grad.addColorStop(0.42, '#000000'); // Horizon line is black
    grad.addColorStop(1, '#05020a'); // Dark ground

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  render(world, dt, now) {
    const ctx = this.roadCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    const projection = this._buildRoadProjection(world.vehicle, world.road);
    this.renderRoadTrack(ctx, projection, world.vehicle);
    this.renderFloorMarks(ctx, projection, world.vehicle, world.sequencer, world.road);
    this.renderVehicle(ctx, projection, world.vehicle, now);
    this.renderHUD(world);
  }

  // Build one shared road model for the surface, lane lines, gate and events.
  // Curvature is accumulated across the visible segments instead of moving a
  // single vanishing point when the vehicle crosses a segment boundary.
  _buildRoadProjection(vehicle, road) {
    const width = this.width;
    const height = this.height;
    const horizonY = height * 0.42;
    const playheadY = height * 0.82;
    const maxDistance = this.config.get('outsynth.track.draw_distance', 300);
    const step = 8;
    const topWidth = Math.max(14, width * 0.025);
    const playheadWidth = Math.min(width * 0.72, 1080);
    const bottomWidth = Math.min(width * 0.9, 1400);
    const samples = [{
      distance: 0,
      centerX: width / 2,
      width: playheadWidth,
      y: playheadY,
      perspective: 1,
    }];

    let heading = 0;
    let pathOffset = 0;
    let previousDistance = 0;

    for (let distance = step; distance <= maxDistance + step; distance += step) {
      const clampedDistance = Math.min(distance, maxDistance);
      const delta = clampedDistance - previousDistance;
      if (delta <= 0) break;

      const midpoint = previousDistance + delta / 2;
      const curvature = road.curveAt(vehicle.position + midpoint);
      const normalizedStep = delta / maxDistance;
      heading += curvature * normalizedStep * 0.58;
      pathOffset += heading * normalizedStep;

      const depth = 1 - clampedDistance / maxDistance;
      const perspective = Math.pow(Math.max(0, depth), 2.2);
      const boundedOffset = Math.max(-0.68, Math.min(0.68, pathOffset));
      samples.push({
        distance: clampedDistance,
        centerX: width / 2 + boundedOffset * width * 0.34,
        width: topWidth + (playheadWidth - topWidth) * perspective,
        y: horizonY + (playheadY - horizonY) * perspective,
        perspective,
      });
      previousDistance = clampedDistance;
    }

    return {
      samples,
      step,
      maxDistance,
      horizonY,
      playheadY,
      playheadWidth,
      tail: {
        distance: -1,
        centerX: width / 2,
        width: bottomWidth,
        y: height + 2,
        perspective: 1.2,
      },
    };
  }

  _sampleProjection(projection, distance) {
    if (distance <= 0) return projection.samples[0];
    if (distance >= projection.maxDistance) return projection.samples.at(-1);

    const samples = projection.samples;
    for (let i = 1; i < samples.length; i++) {
      const far = samples[i];
      if (far.distance < distance) continue;
      const near = samples[i - 1];
      const span = far.distance - near.distance || 1;
      const t = (distance - near.distance) / span;
      return {
        distance,
        centerX: lerp(near.centerX, far.centerX, t),
        width: lerp(near.width, far.width, t),
        y: lerp(near.y, far.y, t),
        perspective: lerp(near.perspective, far.perspective, t),
      };
    }
    return samples.at(-1);
  }

  _roadX(slice, ratio) {
    return slice.centerX - slice.width / 2 + slice.width * ratio;
  }

  _quad(ctx, near, far, leftRatio = 0, rightRatio = 1) {
    ctx.beginPath();
    ctx.moveTo(this._roadX(near, leftRatio), near.y);
    ctx.lineTo(this._roadX(near, rightRatio), near.y);
    ctx.lineTo(this._roadX(far, rightRatio), far.y);
    ctx.lineTo(this._roadX(far, leftRatio), far.y);
    ctx.closePath();
  }

  renderRoadTrack(ctx, projection, vehicle) {
    const roadTheme = this.theme.road();
    const laneCount = this.config.laneCount();
    const samples = projection.samples;

    // Road behind the playhead fills the bottom of the frame.
    ctx.fillStyle = roadTheme.surface || '#111111';
    this._quad(ctx, projection.tail, samples[0]);
    ctx.fill();

    // Absolute spatial bands move only because the vehicle changes position.
    for (let index = samples.length - 1; index > 0; index--) {
      const far = samples[index];
      const near = samples[index - 1];
      const worldPosition = vehicle.position + (near.distance + far.distance) / 2;
      const band = Math.floor(worldPosition / 16);
      ctx.fillStyle = band % 2 === 0
        ? (roadTheme.surface || '#111111')
        : (roadTheme.surfaceAlt || '#181818');
      this._quad(ctx, near, far);
      ctx.fill();
    }

    // Active lane highlight follows every curved slice of the road.
    const activeLane = vehicle.lane();
    const leftRatio = activeLane / laneCount;
    const rightRatio = (activeLane + 1) / laneCount;
    ctx.fillStyle = hexWithAlpha(this.accentColor, 18);
    this._quad(ctx, projection.tail, samples[0], leftRatio, rightRatio);
    ctx.fill();
    for (let index = samples.length - 1; index > 0; index--) {
      this._quad(ctx, samples[index - 1], samples[index], leftRatio, rightRatio);
      ctx.fill();
    }

    // Lane dividers and road borders use the same centerline samples.
    ctx.shadowBlur = 0;
    for (let lane = 1; lane < laneCount; lane++) {
      const ratio = lane / laneCount;
      ctx.strokeStyle = roadTheme.laneMarkers || 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([15, 20]);
      ctx.beginPath();
      ctx.moveTo(this._roadX(projection.tail, ratio), projection.tail.y);
      for (const slice of samples) ctx.lineTo(this._roadX(slice, ratio), slice.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.accentColor;
    for (const ratio of [0, 1]) {
      ctx.strokeStyle = roadTheme.border || this.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this._roadX(projection.tail, ratio), projection.tail.y);
      for (const slice of samples) ctx.lineTo(this._roadX(slice, ratio), slice.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  renderFloorMarks(ctx, projection, vehicle, sequencer, road) {
    const laneCount = this.config.laneCount();
    const steps = sequencer.grid.steps || 128;
    const unit = sequencer.trackLength / steps;
    const items = [];

    for (const event of sequencer.events.values()) {
      let distance = road.distanceAhead(vehicle.position, event.position);
      const signedDistance = road.signedDistance(vehicle.position, event.position);
      if (signedDistance <= 0 && Math.abs(signedDistance) <= unit / 2 + 0.001) distance = 0;
      if (distance >= 0 && distance < projection.maxDistance) {
        items.push({ ...event, distance });
      }
    }

    const gatePosition = road.track.gate_position ?? 0;
    const gateDistance = road.distanceAhead(vehicle.position, gatePosition);
    if (gateDistance > 0 && gateDistance < projection.maxDistance) {
      items.push({ isGate: true, distance: gateDistance });
    }

    items.sort((a, b) => b.distance - a.distance);
    for (const item of items) {
      if (item.isGate) {
        this._drawGate(ctx, projection, item.distance);
        continue;
      }
      const color = this.isRecentlyHit(item.lane, item.position) ? this.accentColor : '#ffffff';
      const isRecentlyHit = this.isRecentlyHit(item.lane, item.position);
      const instrumentIds = ['kick', 'snare', 'hat', 'clap', 'synth_low', 'synth_high'];
      const shape = this.theme.sprite(instrumentIds[item.lane]).shape;
      this._drawFloorMark(ctx, projection, item.lane, item.distance, laneCount, color, shape, isRecentlyHit);
    }
  }

  _drawFloorMark(ctx, projection, lane, distance, laneCount, color, shape, isRecentlyHit) {
    const displayDistance = Math.max(
      distance,
      shape === 'floor_triple' ? 2.5 : shape === 'floor_double' ? 2 : 0,
    );
    const drawBand = (centerDistance, depth, inset = 0.14, fill = true) => {
      const near = this._sampleProjection(projection, Math.max(0, centerDistance - depth / 2));
      const far = this._sampleProjection(projection, Math.min(projection.maxDistance, centerDistance + depth / 2));
      const laneStart = lane / laneCount;
      const laneEnd = (lane + 1) / laneCount;
      const laneSpan = 1 / laneCount;
      const left = laneStart + laneSpan * inset;
      const right = laneEnd - laneSpan * inset;
      this._quad(ctx, near, far, left, right);
      if (fill) ctx.fill(); else ctx.stroke();
    };

    const drawLine = (centerDistance, dashed = false) => {
      const slice = this._sampleProjection(projection, centerDistance);
      const laneStart = lane / laneCount;
      const laneSpan = 1 / laneCount;
      const left = laneStart + laneSpan * 0.14;
      const right = laneStart + laneSpan * 0.86;
      ctx.setLineDash(dashed ? [Math.max(2, slice.width / laneCount * 0.08), Math.max(2, slice.width / laneCount * 0.07)] : []);
      ctx.beginPath();
      ctx.moveTo(this._roadX(slice, left), slice.y);
      ctx.lineTo(this._roadX(slice, right), slice.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    
    // Add neon glow to the graffiti
    ctx.shadowBlur = isRecentlyHit ? 15 : 5;
    ctx.shadowColor = color;
    
    const perspective = this._sampleProjection(projection, displayDistance).perspective;
    ctx.lineWidth = Math.max(1, perspective * 2);

    if (shape === 'floor_block') {
      drawBand(displayDistance, 6);
    } else if (shape === 'floor_double') {
      drawBand(displayDistance - 1.8, 1.3);
      drawBand(displayDistance + 1.8, 1.3);
    } else if (shape === 'floor_dot') {
      drawLine(displayDistance, true);
    } else if (shape === 'floor_triple') {
      drawBand(displayDistance - 2.2, 0.9);
      drawBand(displayDistance, 0.9);
      drawBand(displayDistance + 2.2, 0.9);
    } else if (shape === 'floor_outline') {
      ctx.lineWidth = Math.max(1, perspective * 2.5);
      drawBand(displayDistance, 6, 0.14, false);
    } else {
      ctx.lineWidth = Math.max(1, perspective * 1.2);
      drawLine(displayDistance);
    }
    ctx.restore();
  }

  _drawGate(ctx, projection, distance) {
    const slice = this._sampleProjection(projection, distance);
    if (slice.y <= projection.horizonY) return;
    const height = Math.max(3, slice.width * 0.18);
    const left = this._roadX(slice, 0);
    const right = this._roadX(slice, 1);

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, slice.perspective * 2);
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(left, slice.y);
    ctx.lineTo(left, slice.y - height);
    ctx.lineTo(right, slice.y - height);
    ctx.lineTo(right, slice.y);
    ctx.stroke();
    if (slice.perspective > 0.25) {
      ctx.fillStyle = this.accentColor;
      ctx.font = `${Math.max(7, Math.round(10 * slice.perspective))}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('LOOP', slice.centerX, slice.y - height - 4);
    }
    ctx.restore();
  }

  renderVehicle(ctx, projection, vehicle, now) {
    const slice = projection.samples[0];
    const halfRoad = (vehicle.laneCount * vehicle.laneWidth) / 2;
    const lateralRatio = (vehicle.lateral + halfRoad) / (vehicle.laneCount * vehicle.laneWidth);
    const x = this._roadX(slice, lateralRatio);
    const groundY = projection.playheadY + 2;
    const laneWidth = slice.width / vehicle.laneCount;
    const carWidth = Math.min(64, laneWidth * 0.5);
    const carHeight = Math.max(20, carWidth * 0.35);
    const jumping = now - vehicle.lastLaneJumpAt < 80;
    const movingReverse = vehicle.speed < -0.1;

    ctx.save();
    
    // Draw a sleek chevron/arrow instead of a box
    ctx.beginPath();
    if (movingReverse) {
      ctx.moveTo(x, groundY); // Tip pointing down
      ctx.lineTo(x + carWidth / 2, groundY - carHeight); // Top right
      ctx.lineTo(x, groundY - carHeight * 0.7); // Inner dip
      ctx.lineTo(x - carWidth / 2, groundY - carHeight); // Top left
    } else {
      ctx.moveTo(x, groundY - carHeight); // Tip pointing up
      ctx.lineTo(x + carWidth / 2, groundY); // Bottom right
      ctx.lineTo(x, groundY - carHeight * 0.3); // Inner dip
      ctx.lineTo(x - carWidth / 2, groundY); // Bottom left
    }
    ctx.closePath();

    ctx.fillStyle = '#11131a'; // Dark body
    ctx.fill();

    ctx.shadowBlur = jumping ? 15 : 8;
    ctx.shadowColor = this.accentColor;
    ctx.strokeStyle = jumping ? '#ffffff' : this.accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Engine glow at the back
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.accentColor;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (movingReverse) {
      ctx.moveTo(x - carWidth * 0.2, groundY - carHeight * 0.85);
      ctx.lineTo(x + carWidth * 0.2, groundY - carHeight * 0.85);
      ctx.lineTo(x, groundY - carHeight * 1.1);
    } else {
      ctx.moveTo(x - carWidth * 0.2, groundY - carHeight * 0.15);
      ctx.lineTo(x + carWidth * 0.2, groundY - carHeight * 0.15);
      ctx.lineTo(x, groundY + carHeight * 0.1);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  recordHit(lane, position) {
    this.recentHits.set(`${lane}:${position.toFixed(4)}`, performance.now());
  }

  isRecentlyHit(lane, position) {
    const key = `${lane}:${position.toFixed(4)}`;
    const timestamp = this.recentHits.get(key);
    if (timestamp === undefined) return false;
    if (performance.now() - timestamp > 80) {
      this.recentHits.delete(key);
      return false;
    }
    return true;
  }

  renderHUD(world) {
    const ctx = this.hudCtx;
    const width = this.width;
    ctx.clearRect(0, 0, width, this.height);

    // The track is universally defined as 32 beats long (8 measures of 4/4).
    const unitsPerBeat = world.road.length / 32;
    const bpm = Math.round((60 * Math.abs(world.vehicle.speed)) / unitsPerBeat);
    const lane = world.vehicle.lane();
    const fallbackNames = ['KICK', 'SNARE', 'HI-HAT', 'CLAP', 'SYNTH L', 'SYNTH H'];
    const baseLaneName = world.audio?.trackSettings?.[lane]?.name || fallbackNames[lane] || '';
    const laneName = world.vehicle.speed < -0.1 ? `${baseLaneName} · REV` : baseLaneName;

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 32px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${bpm} BPM`, 24, 44);

    ctx.font = '400 13px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(laneName, width / 2, 38);

    // Action Status Display
    let statusText = '';
    let statusColor = '#ffffff';
    
    if (world.input?.erase) {
      statusText = 'ERASING [X]';
      statusColor = '#ff3366';
    } else if (world.input?.shiftHeld) {
      statusText = 'LANE JUMP [SHIFT]';
      statusColor = this.accentColor;
    } else if (world.input?.drivePlay) {
      statusText = world.audio?.driveMode ? 'PLAYING SYNTH' : 'DROPPING MARK';
      statusColor = this.accentColor;
    } else {
      // Idle helper text
      statusText = world.audio?.driveMode ? '[SPACE] = SYNTH' : '[SPACE] = PAINT';
      statusColor = 'rgba(255, 255, 255, 0.4)';
    }

    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, width / 2, 60);

    this.renderMinimap(ctx, world.vehicle, world.sequencer, world.road);
  }

  renderMinimap(ctx, vehicle, sequencer, road) {
    const size = 130;
    const padding = 16;
    const left = this.width - padding - size;
    const top = this.height - padding - size;
    const centerX = left + size / 2;
    const centerY = top + size / 2;
    const radiusX = 52;
    const radiusY = 40;
    const angleFor = (position) => (road.normalize(position) / road.length) * Math.PI * 2 - Math.PI / 2;

    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(left, top, size, size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    const steps = sequencer.grid.steps || 128;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
      const x1 = centerX + (radiusX - 3) * Math.cos(angle);
      const y1 = centerY + (radiusY - 3) * Math.sin(angle);
      const x2 = centerX + (radiusX + 3) * Math.cos(angle);
      const y2 = centerY + (radiusY + 3) * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${steps} STEPS`, centerX, centerY + radiusY + 16);

    ctx.fillStyle = '#ffffff';
    for (const event of sequencer.events.values()) {
      const angle = angleFor(event.position);
      ctx.beginPath();
      ctx.arc(centerX + radiusX * Math.cos(angle), centerY + radiusY * Math.sin(angle), 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const vehicleAngle = angleFor(vehicle.position);
    ctx.fillStyle = this.accentColor;
    ctx.beginPath();
    ctx.arc(
      centerX + radiusX * Math.cos(vehicleAngle),
      centerY + radiusY * Math.sin(vehicleAngle),
      4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexWithAlpha(hex, alpha) {
  return `${hex}${Math.max(0, Math.min(255, alpha)).toString(16).padStart(2, '0')}`;
}
