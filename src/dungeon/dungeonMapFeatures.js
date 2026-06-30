import { chance, pickMany, randomInt } from "./dungeonTypes.js";

const featurePreferencesByDungeonType = {
  cueva: ["rubble", "pit", "column"],
  guarida: ["rubble", "pit", "column"],
  cripta: ["column", "statue", "altar", "rubble"],
  templo: ["column", "altar", "statue", "pit"],
  fortaleza: ["column", "throne", "rubble", "balcony"],
  alcantarilla: ["bridge", "water", "rubble"],
  mina: ["rubble", "ladder", "pit", "elevationDown"],
  ruina: ["rubble", "column", "statue", "pit"],
  torre: ["stairs", "ladder", "balcony", "elevationUp"],
  laboratorio: ["altar", "column", "statue", "rubble"],
};

export function generateRoomFeatureTiles(rect, config, rng) {
  const features = [];
  const preferences = featurePreferencesByDungeonType[config.dungeonType] || [];

  if (rect.type === "entrada") {
    features.push(createFeature("entrance", rect, rng, true));
  }

  if (rect.type === "jefe") {
    features.push(createFeature("boss", rect, rng, true));
    if (config.dungeonType === "fortaleza" || config.dungeonType === "ruina") {
      features.push(createFeature("throne", rect, rng));
    }
  }

  if (rect.type === "trampa" || rect.hasHazard) {
    features.push(createFeature("trap", rect, rng));
  }

  if (rect.type === "tesoro" || rect.hasTreasure) {
    features.push(createFeature("treasure", rect, rng));
  }

  if (rect.type === "secreto") {
    features.push(createFeature("secret", rect, rng));
  }

  if (rect.shape === "foso-central") {
    features.push(createFeature("pit", rect, rng, true));
  }

  if (rect.shape === "balcon") {
    features.push(createFeature("balcony", rect, rng));
  }

  if (rect.shape === "doble-altura") {
    features.push(createFeature("elevationUp", rect, rng));
    features.push(createFeature("elevationDown", rect, rng));
  }

  if (rect.shape === "anillo" && chance(rng, 0.7)) {
    features.push(createFeature("column", rect, rng, true));
  }

  pickMany(rng, preferences, getPreferenceCount(rect, rng)).forEach((type) => {
    if (type === "water") {
      return;
    }
    features.push(createFeature(type, rect, rng));
  });

  return compactFeatures(features);
}

export function shouldPlaceWaterFeature(config, rect, rng) {
  if (config.dungeonType === "alcantarilla") return rng() < 0.82;
  if (config.dungeonType === "cueva" || config.dungeonType === "mina") return rng() < 0.32;
  if (config.theme === "helado" || config.theme === "natural" || config.theme === "subterraneo") return rng() < 0.24;
  if (rect.zoneRole === "final" && (config.theme === "corrupto" || config.theme === "infernal")) return rng() < 0.18;
  return rng() < 0.08 && rect.type !== "jefe";
}

export function generateWaterPatch(rect, rng) {
  const width = Math.max(1, Math.min(rect.width - 1, randomInt(rng, 1, Math.max(2, Math.floor(rect.width / 2)))));
  const height = Math.max(1, Math.min(rect.height - 1, randomInt(rng, 1, 2)));
  const origin = getInteriorPoint(rect, rng);
  const tiles = [];

  for (let y = origin.y; y < origin.y + height; y += 1) {
    for (let x = origin.x; x < origin.x + width; x += 1) {
      if (isInsideRoom(rect, x, y)) {
        tiles.push(createTileFeature("water", rect, x, y));
      }
    }
  }

  return tiles;
}

export function createMapFeature(type, rect, x, y, extra = {}) {
  return createTileFeature(type, rect, x, y, extra);
}

function createFeature(type, rect, rng, preferCenter = false) {
  const point = preferCenter ? getCenterPoint(rect) : getInteriorPoint(rect, rng);
  return createTileFeature(type, rect, point.x, point.y);
}

function createTileFeature(type, rect, x, y, extra = {}) {
  return {
    type,
    x,
    y,
    roomId: rect.roomId,
    zoneId: rect.zoneId,
    floorLevel: rect.floorLevel,
    ...extra,
  };
}

function getPreferenceCount(rect, rng) {
  if (rect.type === "jefe") return randomInt(rng, 1, 3);
  if (["combate", "puzzle", "tesoro"].includes(rect.type)) return randomInt(rng, 0, 2);
  return chance(rng, 0.38) ? 1 : 0;
}

function getInteriorPoint(rect, rng) {
  const floors = rect.floorCells || [];
  const candidates = floors.filter((cell) => (
    cell.x > rect.x
    && cell.y > rect.y
    && cell.x < rect.x + rect.width - 1
    && cell.y < rect.y + rect.height - 1
  ));
  const pool = candidates.length ? candidates : floors;

  if (!pool.length) {
    return getCenterPoint(rect);
  }

  return pool[randomInt(rng, 0, pool.length - 1)];
}

function getCenterPoint(rect) {
  if (isInsideRoom(rect, rect.centerX, rect.centerY)) {
    return { x: rect.centerX, y: rect.centerY };
  }

  return rect.floorCells?.[Math.floor((rect.floorCells?.length || 1) / 2)] || { x: rect.centerX, y: rect.centerY };
}

function isInsideRoom(rect, x, y) {
  return (rect.floorCells || []).some((cell) => cell.x === x && cell.y === y);
}

function compactFeatures(features) {
  const seen = new Set();
  return features.filter((feature) => {
    if (!feature) {
      return false;
    }
    const key = `${feature.x},${feature.y}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
