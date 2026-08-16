// OUTSYNTH — Events are stored in distance, never in musical time.
export class Sequencer {
  constructor(grid, laneCount, trackLength) {
    this.grid = grid;
    this.laneCount = laneCount;
    this.trackLength = trackLength;
    this.events = new Map();
    this.lastDrop = null;
  }

  quantize(position) {
    const steps = this.grid.steps || 128;
    const unit = this.trackLength / steps;
    const value = this.grid.quantize ? Math.round(position / unit) * unit : position;
    return ((value % this.trackLength) + this.trackLength) % this.trackLength;
  }

  key(lane, position) { return `${lane}:${position.toFixed(4)}`; }

  toggle(lane, position) {
    const quantizedPosition = this.quantize(position);
    const key = this.key(lane, quantizedPosition);
    const existing = this.events.get(key);
    if (existing) {
      this.events.delete(key);
      this.lastDrop = { action: 'deleted', lane, position: quantizedPosition, at: performance.now() };
      return this.lastDrop;
    }
    const event = { lane, position: quantizedPosition };
    this.events.set(key, event);
    this.lastDrop = { action: 'added', ...event, at: performance.now() };
    return this.lastDrop;
  }

  crossed(from, to, wrapped, isReverse = false) {
    const result = [];
    for (const event of this.events.values()) {
      const hit = isReverse
        ? (wrapped
          ? event.position < from || event.position >= to
          : event.position < from && event.position >= to)
        : (wrapped
          ? event.position > from || event.position <= to
          : event.position > from && event.position <= to);
      if (hit) result.push(event);
    }
    result.sort((a, b) => {
      const distanceA = isReverse
        ? (from - a.position + this.trackLength) % this.trackLength
        : (a.position - from + this.trackLength) % this.trackLength;
      const distanceB = isReverse
        ? (from - b.position + this.trackLength) % this.trackLength
        : (b.position - from + this.trackLength) % this.trackLength;
      return distanceA - distanceB;
    });
    return result;
  }

  ahead(position, road, maxDistance) {
    return [...this.events.values()]
      .map(event => ({ ...event, distance: road.distanceAhead(position, event.position) }))
      .filter(event => event.distance > 0 && event.distance < maxDistance)
      .sort((a, b) => b.distance - a.distance);
  }
}
