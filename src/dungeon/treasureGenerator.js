import { getLevelRange, treasureTable } from "./dungeonTables.js";
import { chance, pickMany, pickOne, randomInt } from "./dungeonTypes.js";

const treasureChanceByRoom = {
  entrada: 0.12,
  pasillo: 0.08,
  combate: 0.28,
  trampa: 0.2,
  puzzle: 0.45,
  tesoro: 1,
  descanso: 0.18,
  vacia: 0.22,
  jefe: 1,
  secreto: 0.92,
};

const treasureAmountScale = {
  bajo: 0.65,
  normal: 1,
  alto: 1.45,
};

export function generateTreasure(config, roomType, rng, context = {}) {
  return formatTreasureDetails(generateTreasureDetails(config, roomType, rng, context));
}

export function generateTreasureBundle(config, roomType, rng, context = {}) {
  const treasureDetails = generateTreasureDetails(config, roomType, rng, context);
  return {
    treasure: formatTreasureDetails(treasureDetails),
    treasureDetails,
  };
}

export function generateTreasureDetails(config, roomType, rng, context = {}) {
  const chanceScale = treasureAmountScale[config.treasureAmount] || treasureAmountScale.normal;
  const roomChance = treasureChanceByRoom[roomType] ?? 0.2;

  const narrativeHook = pickNarrativeTreasureHook(context, rng);
  const shouldForceInfo = narrativeHook && ["jefe", "tesoro", "secreto", "puzzle"].includes(roomType);

  if (!chance(rng, Math.min(1, roomChance * chanceScale)) && !shouldForceInfo) {
    return createEmptyTreasure();
  }

  if (shouldForceInfo && roomType !== "jefe" && roomType !== "tesoro" && !chance(rng, Math.min(1, roomChance * chanceScale))) {
    const details = {
      hasTreasure: true,
      coins: "",
      items: [],
      clues: [narrativeHook],
      keys: [],
      valueHint: "Información",
    };
    return {
      ...details,
      summary: formatTreasureDetails(details),
    };
  }

  const range = getLevelRange(config.averageLevel);
  const coins = generateCoinText(config, roomType, chanceScale, rng);
  const pool = getTreasurePool(config.treasureAmount, range.id);
  const pickCount = roomType === "jefe" || roomType === "tesoro" ? 2 : 1;
  const picks = pickMany(rng, pool, pickCount);
  const mundane = pickOne(rng, treasureTable.mundane);
  const clues = [...generateTreasureClues(roomType, rng), narrativeHook].filter(Boolean);
  const keys = generateTreasureKeys(roomType, rng);

  const details = {
    hasTreasure: true,
    coins,
    items: [...picks, mundane].filter(Boolean),
    clues,
    keys,
    valueHint: getTreasureValueHint(roomType),
  };

  return {
    ...details,
    summary: formatTreasureDetails(details),
  };
}

export function regenerateTreasureForRooms(rooms, config, rng, dungeon = {}) {
  return rooms.map((room) => {
    return regenerateTreasureForRoom(room, config, rng, {
      zone: getZoneForRoom(dungeon, room),
      narrative: dungeon.narrative,
    });
  });
}

export function regenerateTreasureForRoom(room, config, rng, context = {}) {
  const treasure = generateTreasureBundle(config, room.type, rng, context);
  return {
    ...room,
    ...treasure,
  };
}

export function formatTreasureDetails(details) {
  if (!details?.hasTreasure) {
    return "";
  }

  return [
    details.coins,
    ...(details.items || []),
    ...(details.clues || []),
    ...(details.keys || []),
  ].filter(Boolean).join("; ");
}

function getTreasurePool(amount, rangeId) {
  const base = amount === "alto"
    ? [...treasureTable.normal, ...treasureTable.high]
    : amount === "bajo"
      ? [...treasureTable.low, ...treasureTable.mundane]
      : [...treasureTable.low, ...treasureTable.normal];

  if (rangeId === "paragon" || rangeId === "legendary") {
    return [...base, ...treasureTable.high];
  }

  return base;
}

function generateCoinText(config, roomType, scale, rng) {
  if (config.treasureAmount === "bajo" && roomType !== "jefe" && roomType !== "tesoro" && roomType !== "secreto") {
    return "";
  }

  const levelBand = Math.max(1, Math.ceil(config.averageLevel / 4));
  const roomScale = roomType === "jefe" ? 3 : roomType === "tesoro" ? 2 : 1;
  const base = randomInt(rng, 8, 18) * levelBand * roomScale;
  const coins = Math.max(5, Math.round(base * scale));
  return `${coins} monedas en mezcla local`;
}

function generateTreasureClues(roomType, rng) {
  if (roomType === "puzzle") {
    return [pickOne(rng, [
      "pista sobre el orden correcto de un mecanismo",
      "nota con una palabra clave incompleta",
      "marcas que explican una ruta segura",
    ])];
  }

  if (roomType === "secreto") {
    return [pickOne(rng, [
      "mapa parcial de una ruta secundaria",
      "símbolo que coincide con una puerta oculta",
      "diario breve de un ocupante anterior",
    ])];
  }

  if (roomType === "jefe" && chance(rng, 0.45)) {
    return ["pista sobre lo que atrae o sostiene al líder de la mazmorra"];
  }

  return [];
}

function generateTreasureKeys(roomType, rng) {
  if ((roomType === "tesoro" || roomType === "jefe" || roomType === "secreto") && chance(rng, 0.28)) {
    return [pickOne(rng, [
      "llave menor",
      "sello de acceso",
      "pieza de mecanismo",
    ])];
  }

  return [];
}

function pickNarrativeTreasureHook(context, rng) {
  const hooks = [
    ...(context.narrative?.treasureHooks || []),
    ...(context.zone?.clues || []),
  ].filter(Boolean);

  return pickOne(rng, hooks, "");
}

function getZoneForRoom(dungeon, room) {
  return (dungeon.zones || []).find((zone) => zone.roomIds?.includes(room.id)) || null;
}

function getTreasureValueHint(roomType) {
  if (roomType === "jefe" || roomType === "tesoro") return "Recompensa principal";
  if (roomType === "secreto") return "Recompensa opciónal";
  return "Recompensa menor";
}

function createEmptyTreasure() {
  return {
    hasTreasure: false,
    summary: "",
    coins: "",
    items: [],
    clues: [],
    keys: [],
    valueHint: "",
  };
}
