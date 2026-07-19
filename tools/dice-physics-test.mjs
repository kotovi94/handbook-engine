import assert from "node:assert/strict";
import {
  advanceDicePhysics,
  createDicePhysicsState,
  isDicePhysicsSleeping,
} from "../src/scripts/dicePhysics.js";
import { createDieMesh, faceUpResult } from "../src/scripts/dice3d.js";

const SIDES = [4, 6, 8, 10, 12, 20];
const radius = 64;
const bounds = { radius, width: 960, height: 640 };

for (const sides of SIDES) {
  const mesh = createDieMesh(sides);
  assert.equal(mesh.faces.length, sides, `d${sides} must have ${sides} faces`);
  assert.deepEqual(
    [...mesh.faceValues].sort((a, b) => a - b),
    Array.from({ length: sides }, (_, index) => index + 1),
    `d${sides} face values must be exactly 1..${sides}`,
  );

  const state = createDicePhysicsState({
    ...bounds,
    random: seededRandom(sides * 7919),
  });
  let slept = false;
  for (let frame = 0; frame < 60 * 30; frame += 1) {
    advanceDicePhysics(state, mesh, bounds, 1 / 60);
    assertFiniteState(state, sides);
    assertInsideWorld(state, mesh, bounds, 1.1);
    if (isDicePhysicsSleeping(state)) {
      slept = true;
      break;
    }
  }
  assert.ok(slept, `d${sides} must reach stable physical rest`);

  const result = faceUpResult(mesh, quaternionMatrix(state.orientation));
  assert.ok(result >= 1 && result <= sides, `d${sides} result ${result} must be in range`);

  const settledPosition = [state.x, state.y, state.z];
  for (let frame = 0; frame < 120; frame += 1) {
    advanceDicePhysics(state, mesh, bounds, 1 / 60);
  }
  const drift = Math.hypot(
    state.x - settledPosition[0],
    state.y - settledPosition[1],
    state.z - settledPosition[2],
  );
  assert.ok(drift < 1.5, `d${sides} rest drift ${drift.toFixed(3)} must remain stable`);
  assertInsideWorld(state, mesh, bounds, 1.1);
}

await assertRendererDoesNotForceResult();
console.log("Dice physics tests passed.");

async function assertRendererDoesNotForceResult() {
  const previous = {
    devicePixelRatio: globalThis.devicePixelRatio,
    innerWidth: globalThis.innerWidth,
    innerHeight: globalThis.innerHeight,
    performance: globalThis.performance,
    requestAnimationFrame: globalThis.requestAnimationFrame,
  };
  let now = 0;
  let frames = 0;
  globalThis.devicePixelRatio = 1;
  globalThis.innerWidth = 960;
  globalThis.innerHeight = 640;
  globalThis.performance = { now: () => now };
  globalThis.requestAnimationFrame = (callback) => {
    if (frames >= 12) return 0;
    frames += 1;
    now += 16;
    queueMicrotask(() => callback(now));
    return frames;
  };
  const { animatePolyhedralDie } = await import("../src/scripts/dice3d.js");
  let resolved = false;
  animatePolyhedralDie(fakeCanvas(), 6, 1).then(() => { resolved = true; });
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(resolved, false, "renderer must not force a result when duration expires");
  Object.assign(globalThis, previous);
}

function fakeCanvas() {
  const gradient = { addColorStop() {} };
  const context = new Proxy({}, {
    get(target, property) {
      if (property === "createRadialGradient") return () => gradient;
      if (!(property in target)) target[property] = () => {};
      return target[property];
    },
    set(target, property, value) { target[property] = value; return true; },
  });
  return { clientWidth: 960, clientHeight: 640, getContext: () => context };
}

function assertFiniteState(state, sides) {
  [state.x, state.y, state.z, state.vx, state.vy, state.vz, ...state.angularVelocity, ...state.orientation]
    .forEach((value) => assert.ok(Number.isFinite(value), `d${sides} state must remain finite`));
}

function assertInsideWorld(state, mesh, { width, height }, tolerance) {
  const matrix = quaternionMatrix(state.orientation);
  const lift = Math.max(0, state.z * state.tuning.projectionLift);
  mesh.vertices.forEach((vertex) => {
    const rotated = multiplyMatrixVector(matrix, vertex).map((value) => value * radius);
    const world = [state.x + rotated[0], state.y + rotated[1], state.z + rotated[2]];
    assert.ok(world[0] >= -tolerance && world[0] <= width + tolerance, "die must stay inside horizontal walls");
    assert.ok(world[1] >= lift + state.tuning.topPadding - tolerance && world[1] <= height + tolerance, "die must stay inside vertical walls");
    assert.ok(world[2] >= -tolerance, "die must not pass through the table");
  });
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function quaternionMatrix([x, y, z, w]) {
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}
