// OUTSYNTH — Vehicle state and spatial movement
export class Vehicle {
  constructor(physics, laneCount, laneWidth) {
    this.physics = physics;
    this.laneCount = laneCount;
    this.laneWidth = laneWidth;
    this.position = 0;
    this.speed = 0;
    this.lateral = 0;
  }

  update(dt, input, trackLength) {
    const { maxSpeed, acceleration, deceleration, lateralSpeed, inertia } = this.physics;
    if (input.accelerate) this.speed += acceleration * dt;
    else if (input.brake) this.speed -= deceleration * dt;
    else this.speed *= Math.pow(inertia, dt * 60);
    this.speed = Math.max(0, Math.min(maxSpeed, this.speed));

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.lateral += direction * lateralSpeed * dt;
    const halfRoad = (this.laneCount * this.laneWidth) / 2;
    this.lateral = Math.max(-halfRoad, Math.min(halfRoad, this.lateral));

    const previousPosition = this.position;
    this.position = (this.position + this.speed * dt) % trackLength;
    return { previousPosition, position: this.position, wrapped: this.position < previousPosition };
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
}
