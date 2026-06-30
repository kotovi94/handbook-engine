import { chance, pickOne } from "./dungeonTypes.js";

export function assignRoomElevations(rooms, config, rng) {
  const floorByRoomId = new Map();
  let currentLevel = 0;

  rooms.forEach((room, index) => {
    if (index === 0) {
      floorByRoomId.set(room.id, 0);
      return;
    }

    if (shouldStepLevel(room, config, rng)) {
      currentLevel += getLevelDirection(room, config, rng);
      currentLevel = clamp(currentLevel, -2, 3);
    }

    floorByRoomId.set(room.id, currentLevel);
  });

  return floorByRoomId;
}

export function getElevationHint({ room, shape, floorLevel, config }) {
  if (shape === "doble-altura") {
    return "Doble altura: balcones, cuerdas o lineas de vision vertical dentro de la sala.";
  }

  if (shape === "balcon") {
    return "Balcon o cornisa: una parte de la sala domina visualmente otra.";
  }

  if (shape === "piramidal") {
    return "Gradas o terrazas: el centro queda elevado respecto al borde.";
  }

  if (shape === "foso-central") {
    return "Foso central: caer, empujar o cruzar cambia la tactica.";
  }

  if (floorLevel > 0) {
    return `Piso superior +${floorLevel}: accesible por escalera, rampa, cuerda o plataforma.`;
  }

  if (floorLevel < 0) {
    return `Nivel inferior ${floorLevel}: pozo, galeria hundida o tramo excavado.`;
  }

  if (config.dungeonType === "torre") {
    return "Mismo piso por ahora, pero con circulacion vertical cercana.";
  }

  return "Nivel base.";
}

export function getConnectionElevationType(fromRect, toRect) {
  const delta = (toRect.floorLevel || 0) - (fromRect.floorLevel || 0);
  if (delta > 0) return "elevationUp";
  if (delta < 0) return "elevationDown";
  return "";
}

export function getVerticalConnectorTile(fromRect, toRect) {
  const delta = (toRect.floorLevel || 0) - (fromRect.floorLevel || 0);
  if (!delta) {
    return "";
  }

  if (Math.abs(delta) > 1) {
    return "ladder";
  }

  return "stairs";
}

function shouldStepLevel(room, config, rng) {
  if (room.type === "secreto" && chance(rng, 0.28)) return true;
  if (room.type === "jefe" && chance(rng, 0.36)) return true;
  if (config.dungeonType === "torre") return chance(rng, 0.48);
  if (config.dungeonType === "mina") return chance(rng, 0.24);
  if (config.dungeonType === "cueva" || config.dungeonType === "guarida") return chance(rng, 0.18);
  return chance(rng, 0.08);
}

function getLevelDirection(room, config, rng) {
  if (config.dungeonType === "torre") return 1;
  if (config.dungeonType === "mina" || config.dungeonType === "cueva") {
    return pickOne(rng, [-1, -1, 1], -1);
  }
  if (room.type === "jefe") return pickOne(rng, [-1, 1], 1);
  return pickOne(rng, [-1, 1], 1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
