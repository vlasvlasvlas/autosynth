// OUTSYNTH — Looping spatial track model
export class Road {
  constructor(track) {
    this.track = track;
    this.length = track.length;
    this.segments = [];
    let start = 0;
    for (const segment of track.segments || []) {
      this.segments.push({ ...segment, start, end: start + segment.length });
      start += segment.length;
    }
  }

  distanceAhead(from, to) {
    return (to - from + this.length) % this.length;
  }

  curveAt(position) {
    const p = position % this.length;
    const segment = this.segments.find(s => p >= s.start && p < s.end);
    if (!segment || segment.type !== 'curve') return 0;
    const sign = segment.direction === 'left' ? -1 : 1;
    return sign * (segment.intensity || 0);
  }
}
