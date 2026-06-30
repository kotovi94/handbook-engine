import { randomInt, weightedPick } from "./dungeonTypes.js";

const connectionWeightsByDungeonType = {
  cueva: [
    ["tunel-natural", 5],
    ["zigzag", 2],
    ["diagonal-escalonada", 2],
    ["L", 1],
  ],
  guarida: [
    ["tunel-natural", 4],
    ["zigzag", 2],
    ["L", 2],
    ["pasaje-bloqueado", 1],
  ],
  mina: [
    ["recta", 3],
    ["tunel-natural", 3],
    ["zigzag", 2],
    ["escalera", 1],
    ["pasaje-bloqueado", 2],
  ],
  alcantarilla: [
    ["recta", 3],
    ["L", 3],
    ["puente", 3],
    ["diagonal-escalonada", 1],
  ],
  torre: [
    ["escalera", 4],
    ["L", 2],
    ["recta", 2],
    ["pasaje-secreto", 1],
  ],
  fortaleza: [
    ["recta", 3],
    ["L", 3],
    ["pasaje-bloqueado", 1],
    ["pasaje-secreto", 1],
  ],
  templo: [
    ["recta", 3],
    ["L", 3],
    ["escalera", 1],
    ["pasaje-secreto", 1],
  ],
  cripta: [
    ["L", 3],
    ["recta", 2],
    ["pasaje-secreto", 2],
    ["pasaje-bloqueado", 1],
  ],
  laboratorio: [
    ["recta", 3],
    ["L", 3],
    ["pasaje-bloqueado", 1],
    ["pasaje-secreto", 1],
  ],
  ruina: [
    ["L", 2],
    ["zigzag", 2],
    ["diagonal-escalonada", 2],
    ["pasaje-bloqueado", 2],
    ["puente", 1],
  ],
};

export function selectConnectionShape({ connectionMeta = {}, config = {}, fromRect, toRect, rng }) {
  if (String(connectionMeta.kind || "").includes("secret")) {
    return "pasaje-secreto";
  }

  if (fromRect?.floorLevel !== toRect?.floorLevel) {
    return "escalera";
  }

  if (connectionMeta.kind === "shortcut" && rng() < 0.35) {
    return "diagonal-escalonada";
  }

  if (connectionMeta.kind === "loop" && rng() < 0.35) {
    return "zigzag";
  }

  const weights = connectionWeightsByDungeonType[config.dungeonType] || connectionWeightsByDungeonType.cripta;
  return weightedPick(rng, toWeightedObjects(weights), { id: "L" }).id;
}

export function buildConnectionPath(start, end, shape, rng) {
  if (shape === "recta") {
    return buildSteppedLine(start, end);
  }

  if (shape === "diagonal-escalonada") {
    return buildSteppedDiagonal(start, end);
  }

  if (shape === "zigzag" || shape === "tunel-natural") {
    return buildZigzagPath(start, end, rng, shape === "tunel-natural" ? 3 : 2);
  }

  if (shape === "puente") {
    return buildBridgePath(start, end);
  }

  if (shape === "escalera") {
    return buildStairPath(start, end);
  }

  return buildLPath(start, end, rng);
}

export function getConnectionShapeLabel(shape) {
  const labels = {
    recta: "Recta",
    L: "L",
    "diagonal-escalonada": "Diagonal escalonada",
    zigzag: "Zigzag",
    "tunel-natural": "Tunel natural",
    puente: "Puente",
    escalera: "Escalera",
    "pasaje-secreto": "Pasaje secreto",
    "pasaje-bloqueado": "Pasaje bloqueado",
  };
  return labels[shape] || shape || "";
}

function buildLPath(start, end, rng) {
  const bend = rng() < 0.5
    ? { x: end.x, y: start.y }
    : { x: start.x, y: end.y };
  return uniquePoints([...buildSteppedLine(start, bend), ...buildSteppedLine(bend, end)]);
}

function buildSteppedLine(start, end) {
  const points = [];
  let x = start.x;
  let y = start.y;
  const dx = Math.sign(end.x - start.x);
  const dy = Math.sign(end.y - start.y);

  points.push({ x, y });
  while (x !== end.x || y !== end.y) {
    if (x !== end.x) x += dx;
    if (y !== end.y) y += dy;
    points.push({ x, y });
  }
  return points;
}

function buildSteppedDiagonal(start, end) {
  const points = [];
  let x = start.x;
  let y = start.y;
  const dx = Math.sign(end.x - start.x);
  const dy = Math.sign(end.y - start.y);
  let horizontalTurn = true;

  points.push({ x, y });
  while (x !== end.x || y !== end.y) {
    if ((horizontalTurn && x !== end.x) || y === end.y) {
      x += dx;
    } else if (y !== end.y) {
      y += dy;
    }
    horizontalTurn = !horizontalTurn;
    points.push({ x, y });
  }
  return points;
}

function buildZigzagPath(start, end, rng, bends) {
  const points = [start];
  let current = start;

  for (let index = 0; index < bends; index += 1) {
    const progress = (index + 1) / (bends + 1);
    const baseX = Math.round(start.x + (end.x - start.x) * progress);
    const baseY = Math.round(start.y + (end.y - start.y) * progress);
    const offset = randomInt(rng, -2, 2);
    const bend = Math.abs(end.x - start.x) > Math.abs(end.y - start.y)
      ? { x: baseX, y: baseY + offset }
      : { x: baseX + offset, y: baseY };
    points.push(...buildLPath(current, bend, rng));
    current = bend;
  }

  points.push(...buildLPath(current, end, rng));
  return uniquePoints(points);
}

function buildBridgePath(start, end) {
  return buildSteppedLine(start, end);
}

function buildStairPath(start, end) {
  return buildLPath(start, end, () => 0.2);
}

function uniquePoints(points) {
  const seen = new Set();
  return points.filter((point) => {
    const key = `${point.x},${point.y}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function toWeightedObjects(entries) {
  return entries.map(([id, weight]) => ({ id, weight }));
}
