import test from 'node:test';
import assert from 'node:assert/strict';

import { Road } from '../src/Road.js';
import { Sequencer } from '../src/Sequencer.js';
import { Vehicle } from '../src/Vehicle.js';
import { AudioEngine } from '../src/AudioEngine.js';

const ovalTrack = {
  length: 9999,
  segments: [
    { type: 'straight', length: 400 },
    { type: 'curve', length: 250, direction: 'right', intensity: 2 },
    { type: 'straight', length: 350 },
  ],
};

test('Road uses segment geometry as its spatial source of truth', () => {
  const road = new Road(ovalTrack);
  assert.equal(road.length, 1000);
  assert.equal(road.distanceAhead(990, 10), 20);
  assert.equal(road.signedDistance(10, 990), -20);
  assert.equal(road.normalize(-10), 990);
});

test('Road curvature eases at segment boundaries', () => {
  const road = new Road(ovalTrack);
  assert.equal(road.curveAt(400), 0);
  assert.ok(road.curveAt(430) > 0 && road.curveAt(430) < 2);
  assert.equal(road.curveAt(525), 2);
  assert.ok(road.curveAt(630) > 0 && road.curveAt(630) < 2);
  assert.equal(road.curveAt(650), 0);
});

test('Sequencer quantizes spatially, toggles identity, and crosses the loop', () => {
  const sequencer = new Sequencer({ mpb: 4, subdivisions: 4, quantize: true }, 6, 100);
  const added = sequencer.toggle(3, 10.6);
  assert.deepEqual({ action: added.action, lane: added.lane, position: added.position }, {
    action: 'added', lane: 3, position: 11,
  });
  assert.equal(sequencer.events.size, 1);
  assert.deepEqual(sequencer.crossed(10, 12, false).map((event) => event.position), [11]);

  sequencer.toggle(0, 1);
  assert.deepEqual(
    sequencer.crossed(99, 2, true).map((event) => event.position).sort((a, b) => a - b),
    [1],
  );

  const deleted = sequencer.toggle(3, 10.6);
  assert.equal(deleted.action, 'deleted');
  assert.equal(sequencer.events.size, 1);
});

test('Sequencer detects reverse crossings, including reverse loop wrap', () => {
  const sequencer = new Sequencer({ mpb: 4, subdivisions: 4, quantize: true }, 6, 100);
  sequencer.toggle(2, 9);
  sequencer.toggle(0, 11);
  sequencer.toggle(3, 10);
  sequencer.toggle(1, 99);

  assert.deepEqual(
    sequencer.crossed(12, 8, false, true).map((event) => event.position),
    [11, 10, 9],
  );
  assert.deepEqual(
    sequencer.crossed(1, 98, true, true).map((event) => event.position),
    [99],
  );
});

test('Vehicle brakes through zero, reverses, and wraps backwards', () => {
  const physics = {
    maxSpeed: 300,
    reverseMaxSpeed: 150,
    acceleration: 140,
    deceleration: 220,
    lateralSpeed: 750,
    inertia: 0.98,
    laneSnap: 0.15,
  };
  const vehicle = new Vehicle(physics, 6, 160);
  assert.equal(vehicle.lane(), 3);
  assert.equal(vehicle.lateral, 80);

  vehicle.update(1, { accelerate: true, brake: false, left: false, right: false }, 3200);
  assert.equal(vehicle.speed, 140);
  const reverseMovement = vehicle.update(
    1,
    { accelerate: false, brake: true, left: false, right: false },
    3200,
  );
  assert.equal(vehicle.speed, -80);
  assert.equal(reverseMovement.isReverse, true);

  vehicle.position = 1;
  vehicle.speed = -20;
  const wrappedMovement = vehicle.update(
    0.1,
    { accelerate: false, brake: false, left: false, right: false },
    3200,
  );
  assert.equal(wrappedMovement.isReverse, true);
  assert.equal(wrappedMovement.wrapped, true);
  assert.ok(vehicle.position > 3199 && vehicle.position < 3200);
});

test('Vehicle lane jumps land at lane centers and clamp to road edges', () => {
  const vehicle = new Vehicle({
    maxSpeed: 300,
    acceleration: 140,
    deceleration: 220,
    lateralSpeed: 750,
    inertia: 0.98,
    laneSnap: 0.15,
  }, 6, 160);

  vehicle.jumpLane(-2);
  assert.equal(vehicle.lane(), 1);
  assert.equal(vehicle.lateral, vehicle.laneCenter(1));
  vehicle.jumpLane(-20);
  assert.equal(vehicle.lane(), 0);
  assert.equal(vehicle.lateral, vehicle.laneCenter(0));
  vehicle.jumpLane(20);
  assert.equal(vehicle.lane(), 5);
  assert.equal(vehicle.lateral, vehicle.laneCenter(5));
});

test('AudioEngine consumes YAML lane and DRIVE configuration', () => {
  const audio = new AudioEngine({
    landscape: {
      lanes: [
        { name: 'Configured Kick', waveform: 'triangle', volume: 0.42 },
        {}, {}, {}, {},
        { name: 'Configured High', waveform: 'square', note: 'A4', volume: 0.33 },
      ],
    },
    drive: {
      waveform: 'triangle',
      volume: 0.27,
      portamento: 0.09,
      scale: { root: 'D3', type: 'major' },
      filter: { min_frequency: 300, max_frequency: 6000, resonance: 5 },
    },
  });

  assert.equal(audio.trackSettings[0].name, 'CONFIGURED KICK');
  assert.equal(audio.trackSettings[0].waveform, 'triangle');
  assert.equal(audio.trackSettings[0].volume, 0.42);
  assert.ok(Math.abs(audio.trackSettings[5].baseFreq - 440) < 0.01);
  assert.deepEqual(audio.currentScale, { rootNote: 'D', scaleType: 'major' });
  assert.deepEqual(audio.scaleNoteNames(), ['D3', 'E3', 'F#3', 'G3', 'A3', 'B3']);
  assert.equal(audio.driveSettings.volume, 0.27);
  assert.equal(audio.driveSettings.filterMax, 6000);
});

test('AudioEngine gives every reverse instrument a swell and click-free release', () => {
  const audio = new AudioEngine({});
  const fakeAudio = createFakeAudioContext();
  audio.context = fakeAudio.context;
  audio.master = { connect() {} };

  for (let lane = 0; lane < 6; lane++) audio.trigger(lane, true);

  assert.equal(fakeAudio.gainParams.length, 7);
  for (const param of fakeAudio.gainParams) {
    assert.deepEqual(param.calls[0], { method: 'set', value: 0.0001, time: 10 });
    assert.equal(param.calls.at(-1).method, 'ramp');
    assert.equal(param.calls.at(-1).value, 0.0001);
  }

  const kickFrequency = fakeAudio.oscillators[0].frequency.calls;
  assert.equal(kickFrequency[0].value, 45);
  assert.equal(kickFrequency[1].value, 130);
});

function createFakeAudioContext() {
  const gainParams = [];
  const oscillators = [];

  const makeParam = (initialValue = 0) => ({
    value: initialValue,
    calls: [],
    setValueAtTime(value, time) { this.calls.push({ method: 'set', value, time }); },
    exponentialRampToValueAtTime(value, time) { this.calls.push({ method: 'ramp', value, time }); },
    setTargetAtTime(value, time, constant) {
      this.calls.push({ method: 'target', value, time, constant });
    },
  });

  const makeNode = (extra = {}) => ({
    connect() {},
    start() {},
    stop() {},
    ...extra,
  });

  const context = {
    currentTime: 10,
    sampleRate: 1000,
    createOscillator() {
      const oscillator = makeNode({ frequency: makeParam(), type: 'sine' });
      oscillators.push(oscillator);
      return oscillator;
    },
    createGain() {
      const gain = makeParam(1);
      gainParams.push(gain);
      return makeNode({ gain });
    },
    createBiquadFilter() {
      return makeNode({ frequency: makeParam(), Q: makeParam(), type: 'lowpass' });
    },
    createBuffer(_channels, size) {
      const data = new Float32Array(size);
      return { getChannelData: () => data };
    },
    createBufferSource() {
      return makeNode({ buffer: null });
    },
  };

  return { context, gainParams, oscillators };
}
