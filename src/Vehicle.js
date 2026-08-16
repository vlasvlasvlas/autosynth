// OUTSYNTH — Vehicle state and spatial movement
export class Vehicle {
  constructor(physics, laneCount, laneWidth) {
    this.physics = physics;
    this.laneCount = laneCount;
    this.laneWidth = laneWidth;
    this.position = 0;
    this.speed = 0;
    this.lateral = this.laneCenter(Math.floor(laneCount / 2));
    this.lastLaneJumpAt = -Infinity;
  }

  update(dt, input, trackLength) {
    const {
      maxSpeed,
      reverseMaxSpeed = maxSpeed * 0.5,
      acceleration,
      deceleration,
      lateralSpeed,
      inertia,
      laneSnap = 0,
    } = this.physics;

    if (input.accelerate) {
      this.speed += (this.speed < 0 ? deceleration : acceleration) * dt;
    } else if (input.brake) {
      this.speed -= (this.speed > 0 ? deceleration : acceleration) * dt;
    }
    this.speed = Math.max(-reverseMaxSpeed, Math.min(maxSpeed, this.speed));

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.lateral += direction * lateralSpeed * dt;

    const halfRoad = (this.laneCount * this.laneWidth) / 2;
    const minLateral = -halfRoad + this.laneWidth / 2;
    const maxLateral = halfRoad - this.laneWidth / 2;
    this.lateral = Math.max(minLateral, Math.min(maxLateral, this.lateral));

    if (direction === 0 && laneSnap > 0) {
      const target = this.laneCenter(this.lane());
      const snapFactor = 1 - Math.pow(1 - Math.min(laneSnap, 0.95), dt * 60);
      this.lateral += (target - this.lateral) * snapFactor;
    }

    const previousPosition = this.position;
    this.position = ((this.position + this.speed * dt) % trackLength + trackLength) % trackLength;
    const isReverse = this.speed < 0;
    const wrapped = isReverse
      ? this.position > previousPosition
      : this.position < previousPosition;
    return { previousPosition, position: this.position, wrapped, isReverse };
  }

  lane() {
    const halfRoad = (this.laneCount * this.laneWidth) / 2;
    return Math.max(0, Math.min(this.laneCount - 1,
      Math.floor((this.lateral + halfRoad) / this.laneWidth)));
  }

  laneOffset() {
    const halfRoad = (this.laneCount * this.laneWidth) / 2;
    return (this.lateral + halfRoad) / (this.laneCount * this.laneWidth) - 0.5;
  }

  laneCenter(lane) {
    const halfRoad = (this.laneCount * this.laneWidth) / 2;
    const clampedLane = Math.max(0, Math.min(this.laneCount - 1, lane));
    return -halfRoad + clampedLane * this.laneWidth + this.laneWidth / 2;
  }

  jumpLane(delta) {
    const targetLane = Math.max(0, Math.min(this.laneCount - 1, this.lane() + delta));
    this.lateral = this.laneCenter(targetLane);
    this.lastLaneJumpAt = performance.now();
  }
}
