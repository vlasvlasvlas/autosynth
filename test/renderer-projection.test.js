import test from 'node:test';
import assert from 'node:assert/strict';

import { Road } from '../src/Road.js';
import { Vehicle } from '../src/Vehicle.js';

function fakeContext() {
  return new Proxy({}, {
    get(target, property) {
      if (!(property in target)) target[property] = () => {};
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
}

function fakeCanvas() {
  const context = fakeContext();
  return { width: 0, height: 0, getContext: () => context };
}

test('Renderer keeps the vehicle and active lane in the same road projection', async () => {
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 720,
    _outsynthAccentColor: '#f5a623',
    addEventListener() {},
  };

  const { Renderer } = await import('../src/Renderer.js');
  const config = {
    get(path, fallback) {
      if (path === 'outsynth.track.draw_distance') return 300;
      return fallback;
    },
    laneCount: () => 6,
  };
  const theme = {
    road: () => ({
      surface: '#111111',
      surfaceAlt: '#181818',
      border: '#ffffff',
      laneMarkers: '#222222',
    }),
  };
  const renderer = new Renderer(fakeCanvas(), fakeCanvas(), fakeCanvas(), config, theme);
  const vehicle = new Vehicle({
    maxSpeed: 300,
    acceleration: 140,
    deceleration: 220,
    lateralSpeed: 750,
    inertia: 0.98,
    laneSnap: 0.15,
  }, 6, 160);
  const road = new Road({
    length: 900,
    segments: [
      { type: 'straight', length: 400 },
      { type: 'curve', length: 250, direction: 'right', intensity: 2 },
      { type: 'straight', length: 250 },
    ],
  });

  const straightProjection = renderer._buildRoadProjection(vehicle, road);
  const near = straightProjection.samples[0];
  const halfRoad = vehicle.laneCount * vehicle.laneWidth / 2;
  const vehicleRatio = (vehicle.lateral + halfRoad) / (vehicle.laneCount * vehicle.laneWidth);
  const vehicleX = renderer._roadX(near, vehicleRatio);
  const laneCenterRatio = (vehicle.lane() + 0.5) / vehicle.laneCount;
  assert.equal(vehicleX, renderer._roadX(near, laneCenterRatio));

  vehicle.position = 380;
  const curvedProjection = renderer._buildRoadProjection(vehicle, road);
  assert.ok(curvedProjection.samples.at(-1).centerX > curvedProjection.samples[0].centerX);
  assert.ok(curvedProjection.samples.at(-1).y < curvedProjection.samples[0].y);
  assert.ok(curvedProjection.samples.at(-1).width < curvedProjection.samples[0].width);
});
