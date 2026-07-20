import { regenerateEnemiesForRoom, regenerateEnemiesForRooms } from "./encounterGenerator.js";
import { generateInhabitantMix, getInhabitantLabel } from "./dungeonInhabitantMixes.js";
import { generateDungeonNarrative, formatNarrativeNotes } from "./dungeonNarrativeThreads.js";
import {
  dungeonDecayTable,
  dungeonLayoutPrincipleTable,
  dungeonTypeTables,
  dungeonQuirkTable,
  inhabitantTables,
  nameTable,
  visualThemeTables,
} from "./dungeonTables.js";
import {
  createRng,
  createSeed,
  DUNGEON_TYPE_OPTIONS,
  DUNGEON_VERSION,
  getOptionLabel,
  INHABITANT_OPTIONS,
  normalizeDungeonConfig,
  pickMany,
  pickOne,
  randomInt,
  SIZE_OPTIONS,
  THEME_OPTIONS,
  weightedPick,
} from "./dungeonTypes.js";
import { generateDungeonMap, regenerateDungeonMap as regenerateMap } from "./dungeonMapGenerator.js";
import { generateDungeonZones, getZoneForRoom } from "./dungeonZones.js";
import { generateRoom, regenerateRoom } from "./roomGenerator.js";
import { regenerateTreasureForRoom, regenerateTreasureForRooms } from "./treasureGenerator.js";

const roomCountRanges = {
  pequena: [6, 8],
  mediana: [10, 14],
  grande: [17, 23],
  megamazmorra: [30, 42],
};

const densityCombatWeight = {
  baja: 2,
  media: 4,
  alta: 6,
};

const sizeExtraConnectionScale = {
  pequena: 0.12,
  mediana: 0.18,
  grande: 0.22,
  megamazmorra: 0.28,
};

export function generateDungeon(configInput = {}) {
  const config = normalizeDungeonConfig(configInput);
  const seed = createSeed();
  const rng = createRng(seed);
  const roomCount = generateRoomCount(config, rng);
  const roomTypes = generateRoomTypes(roomCount, config, rng);
  const connectionGraph = generateConnectionGraph(roomTypes, config, rng);
  const roomShells = roomTypes.map((roomType, index) => {
    const roomId = getRoomId(index + 1);
    return {
      id: roomId,
      type: roomType,
      connections: connectionGraph.connections[roomId] || [],
    };
  });
  const inhabitantMix = generateInhabitantMix(config, rng);
  const narrative = generateDungeonNarrative(config, inhabitantMix, rng);
  const finalRoomId = roomShells[roomShells.length - 1]?.id || "R01";
  const zonePlan = generateDungeonZones({
    rooms: roomShells,
    config,
    narrative,
    inhabitantMix,
    finalRoomId,
    rng,
  });
  const connections = decorateConnectionsWithZones(connectionGraph.edges, zonePlan.zones, narrative);
  const rooms = roomTypes.map((roomType, index) => {
    const roomId = getRoomId(index + 1);
    const zone = getZoneForRoom(zonePlan.zones, roomId);
    return generateRoom({
      index: index + 1,
      roomType,
      config,
      connections: connectionGraph.connections[roomId] || [],
      zone,
      inhabitantMix,
      narrative,
      rng,
    });
  });
  const dungeon = {
    id: `dungeon-${seed}`,
    version: DUNGEON_VERSION,
    seed,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft",
    campaignId: "",
    sessionNumber: null,
    name: generateDungeonName(config, rng),
    summary: generateDungeonSummary(config, roomCount, finalRoomId, rng, narrative, inhabitantMix),
    designNotes: generateDungeonDesignNotes(config, rng, narrative, zonePlan.zones),
    recommendedLevel: config.averageLevel,
    roomCount,
    type: config.dungeonType,
    theme: config.theme,
    inhabitants: config.inhabitants,
    inhabitantMix,
    narrative,
    zones: zonePlan.zones,
    connections,
    finalRoomId,
    config,
    rooms,
  };

  return {
    ...dungeon,
    map: generateDungeonMap(dungeon, config, rng),
  };
}

export function regenerateDungeonName(dungeon) {
  const rng = createRng(createSeed());
  return touchDungeon({
    ...dungeon,
    name: generateDungeonName(dungeon.config, rng),
  });
}

export function regenerateDungeonEnemies(dungeon) {
  const rng = createRng(createSeed());
  return touchDungeon({
    ...dungeon,
    rooms: regenerateEnemiesForRooms(dungeon.rooms || [], dungeon.config, rng, dungeon),
  });
}

export function regenerateDungeonTreasure(dungeon) {
  const rng = createRng(createSeed());
  return touchDungeon({
    ...dungeon,
    rooms: regenerateTreasureForRooms(dungeon.rooms || [], dungeon.config, rng, dungeon),
  });
}

export function regenerateDungeonRoom(dungeon, roomId) {
  const rng = createRng(createSeed());
  const zone = getZoneForRoom(dungeon.zones || [], roomId);
  return touchDungeon({
    ...dungeon,
    rooms: (dungeon.rooms || []).map((room) => (
      room.id === roomId ? regenerateRoom(room, dungeon.config, rng, {
        zone,
        inhabitantMix: dungeon.inhabitantMix,
        narrative: dungeon.narrative,
      }) : room
    )),
  });
}

export function regenerateDungeonRoomEnemies(dungeon, roomId) {
  const rng = createRng(createSeed());
  const zone = getZoneForRoom(dungeon.zones || [], roomId);
  return touchDungeon({
    ...dungeon,
    rooms: (dungeon.rooms || []).map((room) => (
      room.id === roomId ? regenerateEnemiesForRoom(room, dungeon.config, rng, {
        zone,
        inhabitantMix: dungeon.inhabitantMix,
        narrative: dungeon.narrative,
      }) : room
    )),
  });
}

export function regenerateDungeonRoomTreasure(dungeon, roomId) {
  const rng = createRng(createSeed());
  const zone = getZoneForRoom(dungeon.zones || [], roomId);
  return touchDungeon({
    ...dungeon,
    rooms: (dungeon.rooms || []).map((room) => (
      room.id === roomId ? regenerateTreasureForRoom(room, dungeon.config, rng, {
        zone,
        narrative: dungeon.narrative,
      }) : room
    )),
  });
}

export function regenerateDungeonMap(dungeon) {
  return regenerateMap(dungeon);
}

export function getDungeonDisplayLabels(dungeon) {
  const secondaryId = dungeon.inhabitantMix?.secondary?.id || dungeon.config?.secondaryInhabitants;
  const secondaryLabel = dungeon.inhabitantMix?.secondary?.label
    || (secondaryId && !["automatico", "ninguno"].includes(secondaryId) ? getInhabitantLabel(secondaryId) : "");

  return {
    type: getOptionLabel(DUNGEON_TYPE_OPTIONS, dungeon.type),
    theme: getOptionLabel(THEME_OPTIONS, dungeon.theme),
    inhabitants: getOptionLabel(INHABITANT_OPTIONS, dungeon.inhabitants),
    secondaryInhabitants: secondaryLabel || "Sin secundarios",
    inhabitantMix: dungeon.inhabitantMix?.hasSecondary
      ? `${dungeon.inhabitantMix.primary.label} + ${dungeon.inhabitantMix.secondary.label}`
      : getOptionLabel(INHABITANT_OPTIONS, dungeon.inhabitants),
    size: getOptionLabel(SIZE_OPTIONS, dungeon.config?.size),
    finalRoom: dungeon.rooms?.find((room) => room.id === dungeon.finalRoomId)?.name || dungeon.finalRoomId,
  };
}

function generateRoomCount(config, rng) {
  const range = roomCountRanges[config.size] || roomCountRanges.mediana;
  return randomInt(rng, range[0], range[1]);
}

function generateRoomTypes(roomCount, config, rng) {
  const types = ["entrada"];
  const weights = [
    { id: "pasillo", weight: 3 },
    { id: "combate", weight: densityCombatWeight[config.encounterDensity] || densityCombatWeight.media },
    { id: "trampa", weight: config.difficulty === "mortal" ? 3 : 2 },
    { id: "puzzle", weight: 2 },
    { id: "tesoro", weight: config.treasureAmount === "alto" ? 3 : 2 },
    { id: "descanso", weight: config.size === "pequena" ? 1 : 2 },
    { id: "vacia", weight: 2 },
    { id: "secreto", weight: config.treasureAmount === "bajo" ? 1 : 2 },
  ];

  while (types.length < roomCount - 1) {
    types.push(weightedPick(rng, weights).id);
  }

  ensureRoomType(types, "combate", rng);
  ensureRoomType(types, "tesoro", rng);
  ensureRoomType(types, "trampa", rng);
  types.push("jefe");
  return types;
}

function ensureRoomType(types, roomType, rng) {
  if (types.includes(roomType) || types.length <= 3) {
    return;
  }

  const protectedTypes = new Set(["combate", "tesoro", "trampa"]);
  const candidates = types
    .map((type, index) => ({ type, index }))
    .filter((item) => item.index > 0 && !protectedTypes.has(item.type));
  const selected = pickOne(rng, candidates, null);

  if (selected) {
    types[selected.index] = roomType;
  }
}

function generateConnectionGraph(roomTypes, config, rng) {
  const roomCount = roomTypes.length;
  const connections = {};
  const edges = [];

  for (let index = 1; index <= roomCount; index += 1) {
    connections[getRoomId(index)] = new Set();
  }

  const roomIds = roomTypes.map((_, index) => getRoomId(index + 1));
  const finalRoomId = roomIds[roomIds.length - 1];
  const secretIds = roomIds.filter((roomId, index) => roomTypes[index] === "secreto");
  const publicIds = roomIds.filter((roomId) => !secretIds.includes(roomId));
  const mainPath = buildMainPath(publicIds, config, rng);
  connectPath(connections, edges, mainPath, "main", "Ruta principal hacia la sala final.");

  publicIds
    .filter((roomId) => !mainPath.includes(roomId))
    .forEach((roomId) => {
      const anchor = pickPathAnchor(mainPath, roomId, rng);
      addConnection(connections, edges, anchor, roomId, "branch", "Rama lateral con contenido opciónal o rodeo.");

      if (rng() < 0.42) {
        const reconnect = pickLaterAnchor(mainPath, anchor, rng);
        if (reconnect && reconnect !== anchor) {
          addConnection(connections, edges, roomId, reconnect, "loop", "Ruta alternativa que evita volver por el mismo pasillo.");
        }
      }
    });

  addAlternativeRoutes(connections, edges, mainPath, config, rng);
  addSecretRoutes(connections, edges, secretIds, publicIds, finalRoomId, config, rng);

  return {
    connections: Object.fromEntries(
    Object.entries(connections).map(([roomId, set]) => [
      roomId,
      [...set].sort(compareRoomIds),
    ]),
    ),
    edges: edges.map((edge) => ({
      ...edge,
      key: getConnectionKey(edge.from, edge.to),
    })),
  };
}

function buildMainPath(publicIds, config, rng) {
  if (publicIds.length <= 2) {
    return publicIds;
  }

  const targetRatio = {
    pequena: 0.72,
    mediana: 0.62,
    grande: 0.55,
    megamazmorra: 0.48,
  }[config.size] || 0.62;
  const desiredLength = Math.max(3, Math.min(publicIds.length, Math.round(publicIds.length * targetRatio)));
  const first = publicIds[0];
  const final = publicIds[publicIds.length - 1];
  const middle = publicIds.slice(1, -1);
  const step = middle.length / Math.max(1, desiredLength - 2);
  const selected = [first];

  for (let index = 0; index < desiredLength - 2; index += 1) {
    const base = Math.floor(index * step);
    const jitter = randomInt(rng, 0, Math.max(0, Math.ceil(step) - 1));
    const candidate = middle[Math.min(middle.length - 1, base + jitter)];
    if (candidate && !selected.includes(candidate)) {
      selected.push(candidate);
    }
  }

  selected.push(final);
  return selected.sort(compareRoomIds);
}

function connectPath(connections, edges, path, kind, purpose) {
  for (let index = 1; index < path.length; index += 1) {
    addConnection(connections, edges, path[index - 1], path[index], kind, purpose);
  }
}

function addAlternativeRoutes(connections, edges, mainPath, config, rng) {
  const shortcutCount = Math.max(1, Math.ceil(mainPath.length * (sizeExtraConnectionScale[config.size] || 0.18)));

  for (let count = 0; count < shortcutCount; count += 1) {
    if (mainPath.length < 4) {
      return;
    }

    const fromIndex = randomInt(rng, 0, Math.max(0, Math.floor(mainPath.length / 2) - 1));
    const toIndex = randomInt(rng, Math.min(mainPath.length - 1, fromIndex + 2), mainPath.length - 1);
    const from = mainPath[fromIndex];
    const to = mainPath[toIndex];
    addConnection(connections, edges, from, to, toIndex - fromIndex >= 3 ? "shortcut" : "loop", "Atajo o ruta alternativa entre tramos de la ruta principal.");
  }
}

function addSecretRoutes(connections, edges, secretIds, publicIds, finalRoomId, config, rng) {
  secretIds.forEach((secretId) => {
    const entranceSide = publicIds[Math.max(0, randomInt(rng, 0, Math.max(0, Math.floor(publicIds.length / 2))))] || publicIds[0];
    const lateStart = Math.max(0, Math.floor(publicIds.length * 0.55));
    const lateSide = publicIds[randomInt(rng, lateStart, publicIds.length - 1)] || finalRoomId;
    addConnection(connections, edges, entranceSide, secretId, "secret", "Entrada oculta hacia recompensa, información o atajo.");

    if (config.size !== "pequena" || rng() < 0.5) {
      addConnection(connections, edges, secretId, lateSide, "secret-shortcut", "Atajo secreto opciónal que no bloquea el progreso principal.");
    }
  });
}

function pickPathAnchor(mainPath, roomId, rng) {
  const roomNumber = Number(roomId.replace(/\D/g, ""));
  const earlier = mainPath.filter((id) => Number(id.replace(/\D/g, "")) < roomNumber);
  const pool = earlier.length ? earlier : mainPath;
  return pickOne(rng, pool, mainPath[0]);
}

function pickLaterAnchor(mainPath, anchor, rng) {
  const anchorIndex = mainPath.indexOf(anchor);
  const later = mainPath.slice(Math.max(0, anchorIndex + 1));
  return pickOne(rng, later, "");
}

function addConnection(connections, edges, first, second, kind, purpose) {
  if (!first || !second || first === second) {
    return;
  }

  const key = getConnectionKey(first, second);
  const existing = edges.find((edge) => getConnectionKey(edge.from, edge.to) === key);

  connections[first].add(second);
  connections[second].add(first);

  if (existing) {
    if (!existing.kinds.includes(kind)) {
      existing.kinds.push(kind);
    }
    existing.kind = getDominantConnectionKind(existing.kinds);
    existing.purpose = existing.purpose || purpose;
    return;
  }

  edges.push({
    from: first,
    to: second,
    kind,
    kinds: [kind],
    purpose,
    important: false,
  });
}

function decorateConnectionsWithZones(edges, zones, narrative) {
  const zoneByRoomId = new Map();
  zones.forEach((zone) => {
    (zone.roomIds || []).forEach((roomId) => {
      zoneByRoomId.set(roomId, zone);
    });
  });

  return edges.map((edge) => {
    const fromZone = zoneByRoomId.get(edge.from);
    const toZone = zoneByRoomId.get(edge.to);
    const zoneTransition = Boolean(fromZone && toZone && fromZone.id !== toZone.id);
    const important = zoneTransition || edge.kind === "shortcut" || edge.kind === "secret-shortcut";
    const kind = zoneTransition && edge.kind === "main" ? "zone-gate" : edge.kind;

    return {
      ...edge,
      kind,
      zoneTransition,
      important,
      fromZoneId: fromZone?.id || "",
      toZoneId: toZone?.id || "",
      fromZoneName: fromZone?.name || "",
      toZoneName: toZone?.name || "",
      purpose: zoneTransition
        ? `Puerta importante entre ${fromZone.name} y ${toZone.name}. ${pickFirst(narrative?.doorHooks) || edge.purpose}`
        : edge.purpose,
    };
  });
}

function getDominantConnectionKind(kinds) {
  const priority = ["secret-shortcut", "secret", "shortcut", "zone-gate", "loop", "branch", "main"];
  return priority.find((kind) => kinds.includes(kind)) || kinds[0] || "main";
}

function getConnectionKey(first, second) {
  return [first, second].sort(compareRoomIds).join("-");
}

function pickFirst(items) {
  return Array.isArray(items) ? items[0] : "";
}

function generateDungeonName(config, rng) {
  const dungeonType = dungeonTypeTables[config.dungeonType] || dungeonTypeTables.cripta;
  const theme = visualThemeTables[config.theme] || visualThemeTables.oscuro;
  const site = pickOne(rng, dungeonType.sites, "Mazmorra");
  const adjective = pickOne(rng, theme.adjectives, "");
  const suffix = pickOne(rng, nameTable.suffixes, "Sombras");
  const epithet = pickOne(rng, nameTable.epithets, "");
  const formats = [
    `${site} ${adjective} de los ${suffix}`,
    `${site} ${epithet}`,
    `${site} ${adjective} ${epithet}`,
    `${site} de los ${suffix}`,
  ];

  return formats[randomInt(rng, 0, formats.length - 1)].replace(/\s+/g, " ").trim();
}

function generateDungeonSummary(config, roomCount, finalRoomId, rng, narrative, inhabitantMix) {
  const type = dungeonTypeTables[config.dungeonType] || dungeonTypeTables.cripta;
  const theme = visualThemeTables[config.theme] || visualThemeTables.oscuro;
  const inhabitants = inhabitantTables[config.inhabitants] || inhabitantTables.goblins;
  const mood = pickOne(rng, theme.moods, "peligrosa");
  const anchor = pickOne(rng, type.anchors, "rastros antiguos");
  const sign = inhabitantMix?.hasSecondary
    ? inhabitantMix.summary
    : pickOne(rng, inhabitants.signs, "señales de ocupación");

  return `${type.label} ${mood} con ${roomCount} salas, ${anchor} y ${sign}. ${narrative?.premise || ""} La sala final sugerida es ${finalRoomId}.`.replace(/\s+/g, " ").trim();
}

function generateDungeonDesignNotes(config, rng, narrative, zones = []) {
  const decay = pickOne(rng, dungeonDecayTable, dungeonDecayTable[3]);
  const quirk = pickOne(rng, dungeonQuirkTable, dungeonQuirkTable[0]);
  const principles = pickMany(rng, dungeonLayoutPrincipleTable, 3);
  const densityHint = config.encounterDensity === "alta"
    ? "Las rutas alternativas ayudan a evitar que todo sea una cadena de combates."
    : "Deja espacios para exploración, escucha y decisiones sin combate.";

  return `Estado: ${decay.label}. ${decay.effect} Rasgo estructural: ${quirk}. ${formatNarrativeNotes(narrative, zones)} Guía de mapa: ${principles.join(" ")} ${densityHint}`;
}

function getRoomId(index) {
  return `R${String(index).padStart(2, "0")}`;
}

function compareRoomIds(first, second) {
  return Number(first.replace(/\D/g, "")) - Number(second.replace(/\D/g, ""));
}

function touchDungeon(dungeon) {
  return {
    ...dungeon,
    updatedAt: new Date().toISOString(),
  };
}
