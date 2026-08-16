// OUTSYNTH — Looping spatial track model
export class Road {
  constructor(track) {
    this.track = track;
    this.segments = [];
    let start = 0;
    for (const segment of track.segments || []) {
      this.segments.push({ ...segment, start, end: start + segment.length });
      start += segment.length;
    }
    this.length = start > 0 ? start : track.length;
  }

  distanceAhead(from, to) {
    return (this.normalize(to) - this.normalize(from) + this.length) % this.length;
  }

  signedDistance(from, to) {
    const ahead = this.distanceAhead(from, to);
    return ahead > this.length / 2 ? ahead - this.length : ahead;
  }

  normalize(position) {
    return ((position % this.length) + this.length) % this.length;
  }

  curveAt(position) {
    const p = this.normalize(position);
    const segment = this.segments.find(s => p >= s.start && p < s.end);
    if (!segment || segment.type !== 'curve') return 0;

    // Ease the curve in and out so segment boundaries do not cause the
    // perspective to jump from one vanishing point to another.
    const local = p - segment.start;
    const transition = Math.min(60, segment.length * 0.25);
    const entry = smoothstep(0, transition, local);
    const exit = 1 - smoothstep(segment.length - transition, segment.length, local);
    const sign = segment.direction === 'left' ? -1 : 1;
    return sign * (segment.intensity || 0) * entry * exit;
  }
}

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
