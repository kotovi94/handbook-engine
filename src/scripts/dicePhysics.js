const TAU = Math.PI * 2;

export const DICE_PHYSICS_DEFAULTS = Object.freeze({
  gravity: 1800,
  airDrag: 0.035,
  angularAirDrag: 0.025,
  restitution: 0.34,
  restitutionVelocityThreshold: 55,
  staticFriction: 0.56,
  dynamicFriction: 0.42,
  rollingResistance: 0.34,
  wallRestitution: 0.42,
  wallFriction: 0.3,
  projectionLift: 0.34,
  topPadding: 8,
  fixedStep: 1 / 240,
  maxSubSteps: 12,
  contactSlop: 0.35,
  correctionPercent: 0.82,
  sleepGroundedTime: 0.42,
  sleepLinearSpeed: 9,
  sleepAngularSpeed: 0.32,
});

export function createDicePhysicsState({ radius, width, height, random = randomUnit, tuning = {} }) {
  const config = { ...DICE_PHYSICS_DEFAULTS, ...tuning };
  const launchElevation = radius * 1.8;
  const visualLift = launchElevation * config.projectionLift;
  return {
    x: radius + 8,
    y: Math.max(radius + visualLift + 12, height * (0.34 + random() * 0.32)),
    z: launchElevation,
    vx: Math.max(420, Math.min(980, width * (0.5 + random() * 0.22))),
    vy: (random() - 0.5) * Math.min(720, height * 0.75),
    vz: Math.max(520, Math.min(850, height * (0.72 + random() * 0.24))),
    orientation: randomQuaternion(random),
    angularVelocity: [(random() - 0.5) * 20, (random() - 0.5) * 24, (random() - 0.5) * 18],
    inverseMass: 1,
    inverseInertia: 0,
    accumulator: 0,
    groundedFor: 0,
    sleeping: false,
    tuning: config,
  };
}

export function advanceDicePhysics(state, mesh, { radius, width, height }, dt) {
  if (state.sleeping) return state;
  const fixedStep = state.tuning.fixedStep;
  state.accumulator += Math.min(dt, fixedStep * state.tuning.maxSubSteps);
  if (!state.inverseInertia) state.inverseInertia = 1 / (inertiaCoefficient(mesh) * radius * radius);
  let steps = 0;
  while (state.accumulator >= fixedStep && steps < state.tuning.maxSubSteps) {
    integratePhysicsStep(state, mesh, radius, width, height, fixedStep);
    state.accumulator -= fixedStep;
    steps += 1;
  }
  if (meetsSleepThresholds(state)) {
    state.vx = 0;
    state.vy = 0;
    state.vz = 0;
    state.angularVelocity = [0, 0, 0];
    state.accumulator = 0;
    state.sleeping = true;
  }
  return state;
}

export function isDicePhysicsSleeping(state) {
  return state.sleeping || meetsSleepThresholds(state);
}

function meetsSleepThresholds(state) {
  return state.groundedFor > state.tuning.sleepGroundedTime
    && Math.hypot(state.vx, state.vy, state.vz) < state.tuning.sleepLinearSpeed
    && length(state.angularVelocity) < state.tuning.sleepAngularSpeed;
}

function integratePhysicsStep(state, mesh, radius, width, height, dt) {
  const tuning = state.tuning;
  state.x += state.vx * dt;
  state.y += state.vy * dt;
  state.z += state.vz * dt;
  state.vz -= tuning.gravity * dt;
  const airDrag = Math.exp(-tuning.airDrag * dt);
  state.vx *= airDrag;
  state.vy *= airDrag;
  state.angularVelocity = scale(state.angularVelocity, Math.exp(-tuning.angularAirDrag * dt));
  state.orientation = integrateQuaternion(state.orientation, state.angularVelocity, dt);

  solveWallContacts(state, mesh, radius, width, height);
  state.groundedFor = solveBoardContact(state, mesh, radius, dt)
    ? state.groundedFor + dt
    : 0;
}

function solveBoardContact(state, mesh, radius, dt) {
  const tuning = state.tuning;
  const matrix = quaternionMatrix(state.orientation);
  const rotatedVertices = mesh.vertices.map((vertex) => scale(multiplyMatrixVector(matrix, vertex), radius));
  const lowestZ = Math.min(...rotatedVertices.map((vertex) => vertex[2]));
  const penetration = -(state.z + lowestZ);
  if (penetration < -tuning.contactSlop) return false;

  const tolerance = Math.max(tuning.contactSlop, radius * 0.012);
  const contacts = rotatedVertices.filter((vertex) => vertex[2] <= lowestZ + tolerance);
  if (penetration > 0) state.z += Math.max(0, penetration - tuning.contactSlop) * tuning.correctionPercent;
  const normal = [0, 0, 1];
  let totalNormalImpulse = 0;
  for (let pass = 0; pass < 4; pass += 1) {
    contacts.forEach((contact) => {
      const velocity = contactVelocity(state, contact);
      if (velocity[2] >= 0 && pass === 0) return;
      const restitution = velocity[2] < -tuning.restitutionVelocityThreshold ? tuning.restitution : 0;
      const normalImpulse = solveImpulse(state, contact, normal, -(1 + restitution) * velocity[2] / contacts.length);
      if (normalImpulse > 0) {
        applyContactImpulse(state, contact, scale(normal, normalImpulse));
        totalNormalImpulse += normalImpulse;
      }
    });
  }

  contacts.forEach((contact) => applyFriction(state, contact, normal, totalNormalImpulse / contacts.length));
  const resistance = Math.exp(-tuning.rollingResistance * dt);
  state.vx *= resistance;
  state.vy *= resistance;
  return true;
}

function solveWallContacts(state, mesh, radius, width, height) {
  const matrix = quaternionMatrix(state.orientation);
  const vertices = mesh.vertices.map((vertex) => scale(multiplyMatrixVector(matrix, vertex), radius));
  const lift = Math.max(0, state.z * state.tuning.projectionLift);
  const planes = [
    { normal: [1, 0, 0], distance: 0 },
    { normal: [-1, 0, 0], distance: -width },
    { normal: [0, 1, 0], distance: lift + state.tuning.topPadding },
    { normal: [0, -1, 0], distance: -height },
  ];
  planes.forEach(({ normal, distance }) => {
    let deepest = null;
    let penetration = 0;
    vertices.forEach((vertex) => {
      const world = [state.x + vertex[0], state.y + vertex[1], state.z + vertex[2]];
      const depth = distance - dot(world, normal);
      if (depth > penetration) { penetration = depth; deepest = vertex; }
    });
    if (!deepest) return;
    state.x += normal[0] * penetration * state.tuning.correctionPercent;
    state.y += normal[1] * penetration * state.tuning.correctionPercent;
    const velocity = contactVelocity(state, deepest);
    const normalSpeed = dot(velocity, normal);
    if (normalSpeed < 0) {
      const impulse = solveImpulse(state, deepest, normal, -(1 + state.tuning.wallRestitution) * normalSpeed);
      applyContactImpulse(state, deepest, scale(normal, impulse));
      applyFriction(state, deepest, normal, impulse, state.tuning.wallFriction);
    }
  });
}

function applyFriction(state, contact, normal, normalImpulse, coefficient = state.tuning.dynamicFriction) {
  const velocity = contactVelocity(state, contact);
  const normalSpeed = dot(velocity, normal);
  const tangent = add(velocity, scale(normal, -normalSpeed));
  const speed = length(tangent);
  if (speed < 0.0001 || normalImpulse <= 0) return;
  const direction = scale(tangent, -1 / speed);
  const desired = solveImpulse(state, contact, direction, speed);
  const staticLimit = state.tuning.staticFriction * normalImpulse;
  const magnitude = desired <= staticLimit ? desired : Math.min(desired, coefficient * normalImpulse);
  applyContactImpulse(state, contact, scale(direction, magnitude));
}

function solveImpulse(state, contact, direction, desiredVelocityChange) {
  const lever = cross(contact, direction);
  const denominator = state.inverseMass + state.inverseInertia * dot(lever, lever);
  return Math.max(0, desiredVelocityChange / Math.max(denominator, 1e-9));
}

function contactVelocity(state, contact) {
  return add([state.vx, state.vy, state.vz], cross(state.angularVelocity, contact));
}

function applyContactImpulse(state, contact, impulse) {
  state.vx += impulse[0] * state.inverseMass;
  state.vy += impulse[1] * state.inverseMass;
  state.vz += impulse[2] * state.inverseMass;
  state.angularVelocity = add(state.angularVelocity, scale(cross(contact, impulse), state.inverseInertia));
}

function inertiaCoefficient(mesh) {
  if (mesh.faces.length === 4) return 0.4;
  if (mesh.faces.length === 6) return 1 / 3;
  return 0.4;
}

function randomUnit() {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] / 0x100000000;
  }
  return Math.random();
}

function randomQuaternion(random) {
  const first = random();
  const second = random();
  const third = random();
  return [
    Math.sqrt(1 - first) * Math.sin(TAU * second),
    Math.sqrt(1 - first) * Math.cos(TAU * second),
    Math.sqrt(first) * Math.sin(TAU * third),
    Math.sqrt(first) * Math.cos(TAU * third),
  ];
}

function integrateQuaternion([x, y, z, w], [wx, wy, wz], dt) {
  return normalizeQuaternion([
    x + 0.5 * (wx * w + wy * z - wz * y) * dt,
    y + 0.5 * (-wx * z + wy * w + wz * x) * dt,
    z + 0.5 * (wx * y - wy * x + wz * w) * dt,
    w + 0.5 * (-wx * x - wy * y - wz * z) * dt,
  ]);
}

function quaternionMatrix([x, y, z, w]) {
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

function normalizeQuaternion(quaternion) {
  const magnitude = Math.sqrt(quaternion.reduce((sum, value) => sum + value * value, 0)) || 1;
  return quaternion.map((value) => value / magnitude);
}

function multiplyMatrixVector(matrix, vector) { return matrix.map((row) => dot(row, vector)); }
function centroid(points) { return points[0].map((_, axis) => points.reduce((sum, point) => sum + point[axis], 0) / points.length); }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function add(a, b) { return a.map((value, index) => value + b[index]); }
function dot(a, b) { return a.reduce((sum, value, index) => sum + value * b[index], 0); }
function length(vector) { return Math.sqrt(dot(vector, vector)); }
function scale(vector, amount) { return vector.map((value) => value * amount); }
