import {
  advanceDicePhysics,
  createDicePhysicsState,
  isDicePhysicsSleeping,
} from "./dicePhysics.js";

const TAU = Math.PI * 2;

export function animatePolyhedralDie(canvas, sides, duration = 4200) {
  return animatePolyhedralDice(canvas, sides, 1, duration).then(([result]) => result);
}

export function animatePolyhedralDice(canvas, sides, count, duration = 4200) {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new RangeError(`Invalid dice count: ${count}`);
  }
  const mesh = createDieMesh(sides);
  const context = canvas.getContext("2d");
  const pixelRatio = Math.min(2, globalThis.devicePixelRatio || 1);
  const width = Math.max(320, canvas.clientWidth || globalThis.innerWidth || 1280);
  const height = Math.max(320, canvas.clientHeight || globalThis.innerHeight || 720);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  context.scale(pixelRatio, pixelRatio);
  const startedAt = performance.now();
  const radiusScale = count > 1 ? Math.max(0.62, 1 - (count - 1) * 0.1) : 1;
  const radius = Math.max(38, Math.min(88, Math.min(width, height) * 0.105 * radiusScale));
  const states = Array.from({ length: count }, (_, index) => {
    const state = createDicePhysicsState({ radius, width, height });
    const lift = state.z * state.tuning.projectionLift;
    const laneY = height * ((index + 1) / (count + 1));
    state.x = radius * 1.55 + index * radius * 0.3;
    state.y = Math.max(radius + lift + 12, Math.min(height - radius - 12, laneY));
    state.vx *= 0.86 + index * 0.045;
    state.vy += (index - (count - 1) / 2) * 42;
    return state;
  });
  let previousAt = startedAt;
  const landedResults = Array(count).fill(0);
  const minimumVisibleTime = Math.min(700, Math.max(0, duration));

  return new Promise((resolve) => {
    function frame(now) {
      const elapsed = now - startedAt;
      const dt = Math.min(0.033, Math.max(0.001, (now - previousAt) / 1000));
      previousAt = now;
      context.clearRect(0, 0, width, height);
      states.forEach((state, index) => {
        advanceDicePhysics(state, mesh, { radius, width, height }, dt);
        const rolling = quaternionMatrix(state.orientation);
        if (!landedResults[index] && isDicePhysicsSleeping(state)) {
          landedResults[index] = faceUpResult(mesh, rolling);
        }
        drawDie(context, mesh, rolling, landedResults[index], state.x, state.y, state.z, radius);
      });

      if (landedResults.some((result) => !result) || elapsed < minimumVisibleTime) requestAnimationFrame(frame);
      else resolve(landedResults);
    }
    requestAnimationFrame(frame);
  });
}

export function faceUpResult(mesh, matrix) {
  let highestFace = 0;
  let highestZ = -Infinity;
  mesh.faces.forEach((face, index) => {
    const center = centroid(face.map((vertexIndex) => multiplyMatrixVector(matrix, mesh.vertices[vertexIndex])));
    if (center[2] > highestZ) {
      highestZ = center[2];
      highestFace = index;
    }
  });
  return mesh.faceValues[highestFace];
}

export function createDieMesh(sides) {
  let mesh;
  if (sides === 4) mesh = tetrahedronMesh();
  else if (sides === 6) mesh = cubeMesh();
  else if (sides === 8) mesh = octahedronMesh();
  else if (sides === 10) mesh = dualMesh(pentagonalAntiprismMesh());
  else if (sides === 12) mesh = dualMesh(icosahedronMesh());
  else if (sides === 20) mesh = icosahedronMesh();
  else throw new RangeError(`Unsupported polyhedral die: d${sides}`);
  return numberOppositeFaces(normalizeMesh(mesh));
}

function tetrahedronMesh() {
  return {
    vertices: [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]],
    faces: [[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]],
  };
}

function cubeMesh() {
  return {
    vertices: [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ],
    faces: [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [7, 6, 2, 3], [0, 1, 5, 4]],
  };
}

function octahedronMesh() {
  return {
    vertices: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
    faces: [[4, 0, 2], [4, 2, 1], [4, 1, 3], [4, 3, 0], [5, 2, 0], [5, 1, 2], [5, 3, 1], [5, 0, 3]],
  };
}

function pentagonalAntiprismMesh() {
  const vertices = [];
  const height = 0.62;
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * TAU;
    vertices.push([Math.cos(angle), Math.sin(angle), height]);
  }
  for (let index = 0; index < 5; index += 1) {
    const angle = ((index + 0.5) / 5) * TAU;
    vertices.push([Math.cos(angle), Math.sin(angle), -height]);
  }
  const faces = [[0, 1, 2, 3, 4], [9, 8, 7, 6, 5]];
  for (let index = 0; index < 5; index += 1) {
    const next = (index + 1) % 5;
    faces.push([index, 5 + index, next], [next, 5 + index, 5 + next]);
  }
  return { vertices, faces };
}

function icosahedronMesh() {
  const phi = (1 + Math.sqrt(5)) / 2;
  return {
    vertices: [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
    ],
    faces: [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ],
  };
}

function dualMesh(source) {
  const vertices = source.faces.map((face) => normalize(centroid(face.map((index) => source.vertices[index]))));
  const faces = source.vertices.map((vertex, vertexIndex) => {
    const adjacent = source.faces
      .map((face, faceIndex) => face.includes(vertexIndex) ? faceIndex : -1)
      .filter((faceIndex) => faceIndex >= 0);
    const axis = normalize(vertex);
    const helper = Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
    const tangent = normalize(cross(helper, axis));
    const bitangent = cross(axis, tangent);
    return adjacent.sort((a, b) => {
      const pointA = vertices[a];
      const pointB = vertices[b];
      return Math.atan2(dot(pointA, bitangent), dot(pointA, tangent))
        - Math.atan2(dot(pointB, bitangent), dot(pointB, tangent));
    });
  });
  return { vertices, faces };
}

function normalizeMesh(mesh) {
  const radius = Math.max(...mesh.vertices.map((vertex) => length(vertex)));
  return { vertices: mesh.vertices.map((vertex) => scale(vertex, 1 / radius)), faces: mesh.faces };
}

function numberOppositeFaces(mesh) {
  const normals = mesh.faces.map((face) => normalize(centroid(face.map((index) => mesh.vertices[index]))));
  const faceValues = Array(mesh.faces.length).fill(0);
  const unused = new Set(mesh.faces.map((_, index) => index));
  let low = 1;
  while (unused.size) {
    const first = unused.values().next().value;
    unused.delete(first);
    let opposite = null;
    let mostOpposed = Infinity;
    unused.forEach((candidate) => {
      const alignment = dot(normals[first], normals[candidate]);
      if (alignment < mostOpposed) { mostOpposed = alignment; opposite = candidate; }
    });
    faceValues[first] = low;
    if (opposite !== null) {
      unused.delete(opposite);
      faceValues[opposite] = mesh.faces.length + 1 - low;
    }
    low += 1;
  }
  return { ...mesh, faceValues };
}

function drawDie(context, mesh, matrix, result, boardX, boardY, elevation, radius) {
  const shadowScale = Math.max(0.25, 1 - elevation / (radius * 5));
  context.save();
  context.translate(boardX, boardY + radius * 0.25);
  context.scale(shadowScale, 0.24 * shadowScale);
  const shadow = context.createRadialGradient?.(0, 0, 4, 0, 0, radius) || null;
  if (shadow) {
    shadow.addColorStop(0, "rgba(0,0,0,.48)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = shadow;
  } else context.fillStyle = "rgba(0,0,0,.3)";
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.fill();
  context.restore();

  const centerX = boardX;
  const centerY = boardY - elevation * 0.34;

  const transformed = mesh.vertices.map((vertex) => multiplyMatrixVector(matrix, vertex));
  const projected = transformed.map(([x, y, z]) => {
    const perspective = 1 / (2.9 - z);
    return [centerX + x * radius * 2.75 * perspective, centerY - y * radius * 2.75 * perspective, z];
  });
  const faces = mesh.faces.map((face, index) => ({
    face,
    index,
    depth: face.reduce((sum, vertexIndex) => sum + transformed[vertexIndex][2], 0) / face.length,
  })).sort((a, b) => a.depth - b.depth);

  faces.forEach(({ face, index, depth }) => {
    const points = face.map((vertexIndex) => projected[vertexIndex]);
    context.beginPath();
    points.forEach((point, pointIndex) => pointIndex ? context.lineTo(point[0], point[1]) : context.moveTo(point[0], point[1]));
    context.closePath();
    const faceValue = mesh.faceValues[index];
    const landed = faceValue === result;
    const light = Math.round(35 + ((depth + 1) / 2) * 22);
    context.fillStyle = landed ? "hsl(39 82% 58%)" : `hsl(12 58% ${light}%)`;
    context.strokeStyle = landed ? "#fff1b8" : "rgba(255,255,255,.58)";
    context.lineWidth = landed ? 3 : 1.4;
    context.fill();
    context.stroke();

    if (depth > -0.22) {
      const center = centroid(points);
      context.save();
      context.translate(center[0], center[1]);
      context.fillStyle = landed ? "#2d160d" : "#fff";
      context.strokeStyle = landed ? "#fff3bd" : "rgba(45,15,10,.7)";
      context.lineWidth = landed ? 3.5 : 2.2;
      const fontSize = Math.max(11, radius * (landed ? 0.25 : 0.18));
      context.font = `${landed ? 800 : 700} ${fontSize}px system-ui, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.strokeText(String(faceValue), 0, 0);
      context.fillText(String(faceValue), 0, 0);
      context.restore();
    }
  });
}

function quaternionMatrix([x, y, z, w]) {
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

function multiplyMatrixVector(matrix, vector) { return matrix.map((row) => dot(row, vector)); }
function centroid(points) { return points[0].map((_, axis) => points.reduce((sum, point) => sum + point[axis], 0) / points.length); }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a.reduce((sum, value, index) => sum + value * b[index], 0); }
function length(vector) { return Math.sqrt(dot(vector, vector)); }
function normalize(vector) { const magnitude = length(vector) || 1; return vector.map((value) => value / magnitude); }
function scale(vector, amount) { return vector.map((value) => value * amount); }
