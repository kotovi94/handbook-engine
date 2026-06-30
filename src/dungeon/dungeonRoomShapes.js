import { randomInt, weightedPick } from "./dungeonTypes.js";

const roomSizeRanges = {
  entrada: [[4, 7], [4, 7]],
  pasillo: [[3, 5], [5, 10]],
  combate: [[6, 10], [5, 8]],
  trampa: [[4, 7], [4, 7]],
  puzzle: [[5, 8], [5, 8]],
  tesoro: [[4, 6], [4, 6]],
  descanso: [[4, 7], [4, 6]],
  vacia: [[4, 7], [4, 7]],
  jefe: [[7, 11], [6, 10]],
  secreto: [[3, 5], [3, 5]],
};

const shapeWeightsByDungeonType = {
  cueva: [
    ["irregular", 5],
    ["ovalada", 4],
    ["circular", 2],
    ["foso-central", 1],
    ["larga", 1],
  ],
  guarida: [
    ["irregular", 4],
    ["ovalada", 3],
    ["circular", 2],
    ["foso-central", 2],
    ["L", 1],
  ],
  cripta: [
    ["rectangular", 4],
    ["cuadrada", 3],
    ["cruz", 3],
    ["T", 2],
    ["anillo", 1],
  ],
  templo: [
    ["rectangular", 3],
    ["cruz", 4],
    ["circular", 2],
    ["anillo", 2],
    ["piramidal", 1],
  ],
  fortaleza: [
    ["rectangular", 5],
    ["cuadrada", 3],
    ["T", 2],
    ["cruz", 2],
    ["balcon", 1],
  ],
  torre: [
    ["circular", 5],
    ["anillo", 3],
    ["cuadrada", 2],
    ["doble-altura", 2],
    ["balcon", 2],
  ],
  mina: [
    ["larga", 5],
    ["irregular", 3],
    ["rectangular", 2],
    ["L", 2],
    ["foso-central", 1],
  ],
  alcantarilla: [
    ["larga", 4],
    ["rectangular", 3],
    ["T", 2],
    ["L", 2],
    ["irregular", 1],
  ],
  laboratorio: [
    ["rectangular", 4],
    ["cuadrada", 3],
    ["circular", 3],
    ["anillo", 2],
    ["T", 1],
  ],
  ruina: [
    ["irregular", 4],
    ["rectangular", 2],
    ["L", 3],
    ["T", 2],
    ["cruz", 1],
    ["foso-central", 1],
  ],
};

const bossShapeWeights = [
  ["circular", 2],
  ["cruz", 2],
  ["anillo", 2],
  ["piramidal", 2],
  ["doble-altura", 2],
  ["foso-central", 2],
  ["rectangular", 1],
];

export function generateRoomShapeProfile({ room, config, rng }) {
  const shape = selectRoomShape(room, config, rng);
  const [widthRange, heightRange] = roomSizeRanges[room.type] || roomSizeRanges.vacia;
  let width = randomInt(rng, widthRange[0], widthRange[1]);
  let height = randomInt(rng, heightRange[0], heightRange[1]);

  if (shape === "cuadrada" || shape === "circular" || shape === "anillo" || shape === "piramidal") {
    const side = Math.max(width, height);
    width = side;
    height = side;
  }

  if (shape === "larga" || room.type === "pasillo") {
    width = Math.max(width, height + randomInt(rng, 2, 5));
    height = Math.max(3, Math.min(height, 5));
    if (rng() < 0.45) {
      [width, height] = [height, width];
    }
  }

  if (shape === "ovalada") {
    width = Math.max(width, height + randomInt(rng, 1, 3));
  }

  if (shape === "balcon" || shape === "doble-altura") {
    width = Math.max(width, 6);
    height = Math.max(height, 5);
  }

  return {
    shape,
    width,
    height,
    mask: buildRoomMask(shape, width, height, rng),
    shapeHint: getShapeHint(shape),
  };
}

export function getShapeFloorCells(mask) {
  const cells = [];
  for (let y = 0; y < mask.length; y += 1) {
    for (let x = 0; x < mask[y].length; x += 1) {
      if (mask[y][x]) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

export function getRoomShapeLabel(shape) {
  const labels = {
    rectangular: "Rectangular",
    cuadrada: "Cuadrada",
    larga: "Larga",
    circular: "Circular",
    ovalada: "Ovalada",
    cruz: "Cruz",
    L: "L",
    T: "T",
    irregular: "Irregular",
    anillo: "Anillo",
    piramidal: "Piramidal",
    "doble-altura": "Doble altura",
    balcon: "Balcon",
    "foso-central": "Foso central",
  };
  return labels[shape] || shape || "";
}

function selectRoomShape(room, config, rng) {
  if (room.type === "jefe") {
    return weightedPick(rng, toWeightedObjects(bossShapeWeights), { id: "rectangular" }).id;
  }

  if (room.type === "secreto") {
    return weightedPick(rng, toWeightedObjects([["rectangular", 2], ["irregular", 2], ["L", 1], ["ovalada", 1]]), { id: "rectangular" }).id;
  }

  const weights = shapeWeightsByDungeonType[config.dungeonType] || shapeWeightsByDungeonType.cripta;
  return weightedPick(rng, toWeightedObjects(weights), { id: "rectangular" }).id;
}

function buildRoomMask(shape, width, height, rng) {
  const mask = createMask(width, height, false);

  if (shape === "circular" || shape === "ovalada") {
    fillEllipse(mask, width, height);
    return ensureMaskHasFloor(mask);
  }

  if (shape === "cruz") {
    fillRect(mask, Math.floor(width * 0.35), 0, Math.max(2, Math.ceil(width * 0.3)), height);
    fillRect(mask, 0, Math.floor(height * 0.35), width, Math.max(2, Math.ceil(height * 0.3)));
    return ensureMaskHasFloor(mask);
  }

  if (shape === "L") {
    const thickW = Math.max(2, Math.ceil(width * 0.45));
    const thickH = Math.max(2, Math.ceil(height * 0.45));
    fillRect(mask, 0, 0, thickW, height);
    fillRect(mask, 0, height - thickH, width, thickH);
    return maybeMirrorMask(mask, rng);
  }

  if (shape === "T") {
    const stemW = Math.max(2, Math.ceil(width * 0.35));
    const stemX = Math.floor((width - stemW) / 2);
    const barH = Math.max(2, Math.ceil(height * 0.35));
    fillRect(mask, 0, 0, width, barH);
    fillRect(mask, stemX, 0, stemW, height);
    return maybeMirrorMask(mask, rng);
  }

  if (shape === "irregular") {
    fillRect(mask, 0, 0, width, height);
    carveIrregularCorners(mask, rng);
    return ensureMaskHasFloor(mask);
  }

  if (shape === "anillo") {
    fillEllipse(mask, width, height);
    const innerX = Math.max(1, Math.floor(width * 0.28));
    const innerY = Math.max(1, Math.floor(height * 0.28));
    const innerW = Math.max(1, width - innerX * 2);
    const innerH = Math.max(1, height - innerY * 2);
    for (let y = innerY; y < innerY + innerH; y += 1) {
      for (let x = innerX; x < innerX + innerW; x += 1) {
        mask[y][x] = false;
      }
    }
    return ensureMaskHasFloor(mask);
  }

  if (shape === "piramidal") {
    for (let y = 0; y < height; y += 1) {
      const inset = Math.floor((Math.abs(y - Math.floor(height / 2)) / Math.max(1, height / 2)) * Math.max(1, width * 0.28));
      fillRect(mask, inset, y, width - inset * 2, 1);
    }
    return ensureMaskHasFloor(mask);
  }

  fillRect(mask, 0, 0, width, height);
  return mask;
}

function createMask(width, height, value) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => value));
}

function fillRect(mask, x, y, width, height) {
  for (let row = y; row < y + height && row < mask.length; row += 1) {
    for (let col = x; col < x + width && col < mask[row].length; col += 1) {
      if (row >= 0 && col >= 0) {
        mask[row][col] = true;
      }
    }
  }
}

function fillEllipse(mask, width, height) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const rx = Math.max(1, width / 2);
  const ry = Math.max(1, height / 2);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if ((dx * dx) + (dy * dy) <= 0.92) {
        mask[y][x] = true;
      }
    }
  }
}

function carveIrregularCorners(mask, rng) {
  const height = mask.length;
  const width = mask[0]?.length || 0;
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  corners.forEach(([x, y]) => {
    if (rng() < 0.65) {
      mask[y][x] = false;
      if (width > 4 && rng() < 0.5) mask[y][clamp(x + (x === 0 ? 1 : -1), 0, width - 1)] = false;
      if (height > 4 && rng() < 0.5) mask[clamp(y + (y === 0 ? 1 : -1), 0, height - 1)][x] = false;
    }
  });
}

function maybeMirrorMask(mask, rng) {
  if (rng() < 0.33) {
    return mask.map((row) => [...row].reverse());
  }

  if (rng() < 0.5) {
    return [...mask].reverse();
  }

  return mask;
}

function ensureMaskHasFloor(mask) {
  const cells = getShapeFloorCells(mask);
  if (cells.length) {
    return mask;
  }

  const centerY = Math.floor(mask.length / 2);
  const centerX = Math.floor((mask[0]?.length || 1) / 2);
  mask[centerY][centerX] = true;
  return mask;
}

function getShapeHint(shape) {
  const hints = {
    irregular: "Muros naturales o rotos; evita lineas perfectas.",
    anillo: "Camara con vacio, pilar grande o zona inaccesible al centro.",
    "doble-altura": "Techo alto, plataformas o lineas de vision vertical.",
    balcon: "Borde elevado con vision sobre otra parte de la sala.",
    "foso-central": "Centro peligroso que altera movimiento y empujones.",
    piramidal: "Gradas o terrazas que concentran la escena hacia el centro.",
  };
  return hints[shape] || "Forma base de sala.";
}

function toWeightedObjects(entries) {
  return entries.map(([id, weight]) => ({ id, weight }));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
