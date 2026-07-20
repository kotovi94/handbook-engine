import { getDungeonDisplayLabels } from "./dungeonGenerator.js";
import { getUniqueDoorConnections } from "./dungeonDoorUtils.js";
import { getMapTileLabel, mapTileTypes } from "./dungeonMapGenerator.js";
import {
  DIFFICULTY_OPTIONS,
  ENCOUNTER_DENSITY_OPTIONS,
  getOptionLabel,
  ROOM_TYPE_OPTIONS,
  SIZE_OPTIONS,
  TREASURE_AMOUNT_OPTIONS,
} from "./dungeonTypes.js";
import { formatCreatureEncounterLabel } from "./monsterRules.js";
import { validateDungeon } from "./dungeonValidation.js";

const riskLabels = {
  none: "Sin riesgo",
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  extreme: "Extremo",
};

export function buildDungeonViewModel(dungeon) {
  return {
    overview: buildDungeonOverview(dungeon),
    rooms: buildRoomCards(dungeon),
    encounterRows: buildEncounterRows(dungeon),
    treasureRows: buildTreasureRows(dungeon),
    doorRows: buildDoorRows(dungeon),
    mapLegend: buildMapLegend(dungeon),
    warnings: buildDungeonWarnings(dungeon),
    flow: buildDungeonFlow(dungeon),
    narrative: buildDungeonNarrative(dungeon),
    zones: buildDungeonZones(dungeon),
    ecology: buildDungeonEcology(dungeon),
  };
}

export function buildDungeonOverview(dungeon) {
  const labels = getDungeonDisplayLabels(dungeon || {});
  const config = dungeon?.config || {};
  const finalRoom = (dungeon?.rooms || []).find((room) => room.id === dungeon.finalRoomId);

  return {
    id: dungeon?.id || "",
    name: dungeon?.name || "Mazmorra sin nombre",
    summary: dungeon?.summary || "",
    designNotes: dungeon?.designNotes || "",
    recommendedLevel: dungeon?.recommendedLevel || config.averageLevel || 1,
    roomCount: dungeon?.rooms?.length || dungeon?.roomCount || 0,
    createdAt: dungeon?.createdAt || "",
    updatedAt: dungeon?.updatedAt || "",
    labels,
    narrative: dungeon?.narrative || null,
    inhabitantMix: dungeon?.inhabitantMix || null,
    finalRoom: finalRoom ? {
      id: finalRoom.id,
      name: finalRoom.name,
      type: finalRoom.type,
      typeLabel: getRoomTypeLabel(finalRoom.type),
    } : {
      id: dungeon?.finalRoomId || "",
      name: labels.finalRoom || "",
      type: "",
      typeLabel: "",
    },
    configRows: [
      { label: "Nivel", value: dungeon?.recommendedLevel || config.averageLevel || 1 },
      { label: "Jugadores", value: config.playerCount || 4 },
      { label: "Dificultad", value: getOptionLabel(DIFFICULTY_OPTIONS, config.difficulty) },
      { label: "Tamaño", value: labels.size || getOptionLabel(SIZE_OPTIONS, config.size) },
      { label: "Tipo", value: labels.type },
      { label: "Tema", value: labels.theme },
      { label: "Habitantes", value: labels.inhabitants },
      { label: "Secundarios", value: labels.secondaryInhabitants },
      { label: "Mezcla", value: labels.inhabitantMix },
      { label: "Encuentros", value: getOptionLabel(ENCOUNTER_DENSITY_OPTIONS, config.encounterDensity) },
      { label: "Tesoro", value: getOptionLabel(TREASURE_AMOUNT_OPTIONS, config.treasureAmount) },
    ],
  };
}

export function buildRoomCards(dungeon) {
  const rooms = Array.isArray(dungeon?.rooms) ? dungeon.rooms : [];
  return rooms.map((room) => {
    const encounterUi = buildEncounterUi(room);
    const hazard = normalizeHazard(room);
    const treasure = normalizeTreasure(room);
    const riskLevel = room.riskLevel || inferRiskLevel(room, encounterUi, hazard);

    return {
      id: room.id,
      name: room.name || room.id,
      type: room.type || "vacia",
      typeLabel: getRoomTypeLabel(room.type),
      zoneId: room.zoneId || "",
      zoneName: room.zoneName || "",
      zoneRole: room.zoneRole || "",
      zoneIdentity: room.zoneIdentity || "",
      inhabitantRole: room.inhabitantRole || "",
      localInhabitants: normalizeTextList(room.localInhabitants),
      shape: room.mapShape || room.shape || getMapRoomField(dungeon, room.id, "shape") || "",
      shapeLabel: room.mapShapeLabel || getMapRoomField(dungeon, room.id, "shapeLabel") || "",
      floorLevel: Number.isFinite(room.floorLevel) ? room.floorLevel : Number(getMapRoomField(dungeon, room.id, "floorLevel") || 0),
      elevationHint: room.elevationHint || getMapRoomField(dungeon, room.id, "elevationHint") || "",
      featureTiles: getMapRoomField(dungeon, room.id, "featureTiles") || room.featureTiles || [],
      entrancePoints: getMapRoomField(dungeon, room.id, "entrancePoints") || room.entrancePoints || [],
      connectionPoints: getMapRoomField(dungeon, room.id, "connectionPoints") || room.connectionPoints || [],
      riskLevel,
      riskLabel: riskLabels[riskLevel] || riskLevel,
      functionInSession: room.functionInSession || inferRoomFunction(room),
      readAloud: room.readAloud || room.description || "Describe esta sala cuando el grupo entre.",
      investigationClues: normalizeTextList(room.investigationClues || room.hiddenClue),
      visibleSigns: normalizeTextList(room.visibleSigns || [room.visibleFeature, room.inhabitantSign].filter(Boolean)),
      connections: normalizeTextList(room.connections),
      creatures: buildCreatureRows(room),
      encounterUi,
      hazard,
      treasure,
      dmNotes: normalizeTextList(room.dmNotes || room.notes),
      tags: normalizeTextList(room.tags).length ? normalizeTextList(room.tags) : [room.type || "vacia", riskLevel],
      raw: room,
    };
  });
}

export function buildEncounterRows(dungeon) {
  return buildRoomCards(dungeon)
    .filter((room) => room.encounterUi.creatureBlocks.length || room.creatures.length)
    .map((room) => ({
      roomId: room.id,
      roomName: room.name,
      roomType: room.typeLabel,
      difficultyLabel: room.encounterUi.difficultyLabel,
      budgetXp: room.encounterUi.budgetXp,
      spentXp: room.encounterUi.spentXp,
      remainingXp: room.encounterUi.remainingXp,
      highestCr: room.encounterUi.highestCr,
      dangerLevel: room.encounterUi.dangerLevel,
      warnings: room.encounterUi.warnings,
      creatureBlocks: room.encounterUi.creatureBlocks.length ? room.encounterUi.creatureBlocks : room.creatures,
    }));
}

export function buildTreasureRows(dungeon) {
  return buildRoomCards(dungeon)
    .filter((room) => room.treasure.hasTreasure)
    .map((room) => ({
      roomId: room.id,
      roomName: room.name,
      roomType: room.typeLabel,
      summary: room.treasure.summary,
      coins: room.treasure.coins,
      items: room.treasure.items,
      clues: room.treasure.clues,
      keys: room.treasure.keys,
      valueHint: room.treasure.valueHint,
    }));
}

export function buildDoorRows(dungeon) {
  return getUniqueDoorConnections(dungeon?.map).map((door) => ({
    ...door,
    roomsText: door.connectionLabel,
    kindText: [
      door.important ? "Importante" : "",
      door.connectionKindLabel,
      door.connectionShapeLabel,
      door.kindLabel,
      door.materialLabel,
      door.stateLabel,
    ].filter(Boolean).join(" - "),
  }));
}

export function buildDungeonNarrative(dungeon) {
  const narrative = dungeon?.narrative;
  const mix = dungeon?.inhabitantMix;

  if (!narrative && !mix) {
    return null;
  }

  return {
    cause: narrative?.cause?.label || "Sin causa definida",
    causeSummary: narrative?.cause?.summary || "",
    situation: narrative?.situation?.summary || "",
    relationship: narrative?.relationship?.label || mix?.relationship?.label || "",
    relationshipSummary: narrative?.relationship?.summary || mix?.relationship?.summary || "",
    mixSummary: mix?.summary || "",
    clues: normalizeTextList(narrative?.globalClues),
    finalHooks: normalizeTextList(narrative?.finalHooks),
  };
}

export function buildDungeonZones(dungeon) {
  return (dungeon?.zones || []).map((zone) => ({
    id: zone.id,
    name: zone.name,
    role: zone.role,
    identity: zone.identity,
    owner: zone.owner,
    inhabitants: normalizeTextList(zone.inhabitants),
    roomIds: normalizeTextList(zone.roomIds),
    clues: normalizeTextList(zone.clues),
    doorTone: zone.doorTone || "",
  }));
}

export function buildMapLegend(dungeon) {
  const cells = dungeon?.map?.cells || [];
  const counts = cells.reduce((acc, cell) => {
    acc[cell.type] = (acc[cell.type] || 0) + 1;
    return acc;
  }, {});

  return mapTileTypes.map((tile) => ({
    ...tile,
    label: getMapTileLabel(tile.id),
    count: counts[tile.id] || 0,
    used: Boolean(counts[tile.id]),
  }));
}

export function buildDungeonWarnings(dungeon) {
  return validateDungeon(dungeon);
}

export function buildMapTargetFromCell(dungeon, cell) {
  if (!cell || cell.type === "wall") {
    return { kind: null, cell: cell ? cloneCellTarget(cell) : null };
  }

  if (cell.type === "door") {
    const door = cell.doorId ? getDoorById(dungeon, cell.doorId) : getDoorAtCell(dungeon, cell);
    return {
      kind: door ? "door" : "tile",
      doorId: door?.id || cell.doorId || "",
      cell: cloneCellTarget(cell),
      focusSection: "doors",
    };
  }

  if (cell.roomId) {
    return {
      kind: "room",
      roomId: cell.roomId,
      cell: cloneCellTarget(cell),
      focusSection: getFocusSectionForTile(cell.type),
    };
  }

  if (cell.type === "corridor") {
    return {
      kind: "corridor",
      cell: cloneCellTarget(cell),
      focusSection: "overview",
    };
  }

  return {
    kind: "tile",
    cell: cloneCellTarget(cell),
    focusSection: getFocusSectionForTile(cell.type),
  };
}

export function buildRoomInspectorModel(dungeon, roomId, focusSection = "overview") {
  const room = getRoomById(dungeon, roomId);

  if (!room) {
    return {
      kind: "empty",
      title: "Área sin datos",
      message: roomId ? `No existe una sala con ID ${roomId}.` : "Selecciona un área del mapa.",
    };
  }

  const roomDoors = getRoomDoors(dungeon, room.id);
  const sections = [
    {
      id: "overview",
      title: "Resumen",
      items: [
        room.functionInSession,
        room.zoneName ? `Zona: ${room.zoneName}` : "",
        room.shapeLabel ? `Forma: ${room.shapeLabel}` : "",
        Number.isFinite(room.floorLevel) ? `Nivel: ${room.floorLevel}` : "",
        room.elevationHint || "",
        room.zoneIdentity || "",
        `Conexiones: ${room.connections.join(", ") || "sin conexiones"}`,
      ].filter(Boolean),
    },
    {
      id: "readAloud",
      title: "Ambiente",
      items: [room.readAloud, ...room.visibleSigns],
    },
    {
      id: "clues",
      title: "Pistas",
      items: room.investigationClues,
    },
    {
      id: "mapFeatures",
      title: "Mapa y elevación",
      items: [
        room.shapeLabel ? `Forma: ${room.shapeLabel}` : "",
        Number.isFinite(room.floorLevel) ? `Nivel de piso: ${room.floorLevel}` : "",
        room.elevationHint || "",
        room.featureTiles.length ? `Tiles especiales: ${summarizeFeatureTiles(room.featureTiles)}` : "",
        room.entrancePoints.length ? `Entradas: ${room.entrancePoints.length}` : "",
        room.connectionPoints.length ? `Puntos de conexión: ${room.connectionPoints.length}` : "",
      ].filter(Boolean),
    },
    {
      id: "creatures",
      title: room.type === "jefe" ? "Criaturas / Jefe" : "Encuentro",
      items: [
        ...room.encounterUi.creatureBlocks.map((block) => block.label),
        room.encounterUi.budgetXp ? `XP usado: ${room.encounterUi.spentXp}/${room.encounterUi.budgetXp}. Dificultad: ${room.encounterUi.difficultyLabel}.` : "",
        ...room.encounterUi.warnings,
      ].filter(Boolean),
    },
    {
      id: "hazard",
      title: "Peligro o trampa",
      items: room.hazard.hasHazard
        ? [
          room.hazard.summary,
          room.hazard.trigger ? `Disparador: ${room.hazard.trigger}` : "",
          room.hazard.countermeasure ? `Contramedida: ${room.hazard.countermeasure}` : "",
          room.hazard.visibility ? `Pista visible: ${room.hazard.visibility}` : "",
        ].filter(Boolean)
        : [],
    },
    {
      id: "treasure",
      title: "Tesoro",
      items: room.treasure.hasTreasure
        ? [
          room.treasure.summary,
          room.treasure.coins ? `Monedas: ${room.treasure.coins}` : "",
          room.treasure.items.length ? `Objetos: ${room.treasure.items.join("; ")}` : "",
          room.treasure.clues.length ? `Pistas: ${room.treasure.clues.join("; ")}` : "",
          room.treasure.keys.length ? `Llaves: ${room.treasure.keys.join("; ")}` : "",
        ].filter(Boolean)
        : [],
    },
    {
      id: "doors",
      title: "Puertas",
      items: roomDoors.map((door) => `${door.displayId}: ${door.connectionLabel}. ${door.summary}`),
      doors: roomDoors,
    },
    {
      id: "notes",
      title: "Notas DM",
      items: [
        ...room.dmNotes,
        room.raw?.monsterNotes || "",
      ].filter(Boolean),
    },
    {
      id: "secret",
      title: "Secreto",
      items: room.type === "secreto"
        ? [
          "Esta sala debe funcionar como recompensa, atajo, pista o opción extra.",
          ...room.visibleSigns,
          ...room.dmNotes,
        ].filter(Boolean)
        : [],
    },
  ];

  return {
    kind: "room",
    focusSection,
    title: `${room.id}. ${room.name}`,
    room,
    roomDoors,
    isPassageRoom: room.type === "pasillo",
    badges: [
      { label: room.typeLabel, tone: "type" },
      { label: `Riesgo ${room.riskLabel}`, tone: room.riskLevel },
      room.zoneName ? { label: room.zoneName, tone: "neutral" } : null,
      room.shapeLabel ? { label: room.shapeLabel, tone: "neutral" } : null,
      Number.isFinite(room.floorLevel) && room.floorLevel !== 0 ? { label: `Nivel ${room.floorLevel}`, tone: "neutral" } : null,
      { label: `${room.connections.length} conexiones`, tone: "neutral" },
    ].filter(Boolean),
    sections,
    copyText: buildRoomCopyText(room, roomDoors),
  };
}

export function buildDoorInspectorModel(dungeon, doorId) {
  const doorData = getDoorById(dungeon, doorId);

  if (!doorData) {
    return {
      kind: "empty",
      title: "Puerta sin datos",
      message: doorId ? `No existe una puerta con ID ${doorId}.` : "Esta puerta no tiene ID asignado.",
    };
  }

  const { exactDoor, connection } = doorData;
  const door = exactDoor || connection.doors?.[0] || connection;
  const roomLinks = (connection.roomIds || [door.roomId, door.connectsTo])
    .filter(Boolean)
    .map((roomId) => getRoomById(dungeon, roomId))
    .filter(Boolean)
    .map((room) => ({ id: room.id, name: room.name, typeLabel: room.typeLabel }));

  return {
    kind: "door",
    focusSection: "doors",
    title: `Puerta ${door.id || connection.displayId}`,
    door,
    connection,
    roomLinks,
    fields: [
      ["Conexión", connection.connectionLabel],
      ["Tipo", door.kindLabel || connection.kindLabel],
      ["Material", door.materialLabel || connection.materialLabel || "Sin material"],
      ["Tamaño", door.sizeLabel || "Sin tamaño"],
      ["Estado", door.stateLabel || connection.stateLabel || "Sin estado"],
      ["CA", numberOrEmpty(door.ac)],
      ["PG", numberOrEmpty(door.hp)],
      ["CD forzar", numberOrEmpty(door.forceOpenDc)],
      ["Cerradura", door.lock ? `${door.lock.label} CD ${door.lock.dc}` : "Sin cerradura"],
      ["Secreta", door.secret ? `Detectar CD ${door.secret.detectionDc}` : "No"],
      ["Rastrillo", door.portcullis ? `Levantar CD ${door.portcullis.liftDc}` : "No"],
    ],
    notes: [
      door.notes || "",
      connection.summary || "",
      "Forzar o romper esta puerta puede hacer ruido y alertar salas cercanas.",
    ].filter(Boolean),
    copyText: buildDoorCopyText(door, connection),
  };
}

export function buildCorridorInspectorModel(dungeon, cell) {
  const nearbyRooms = getNearbyRoomsForCorridor(dungeon, cell);
  const connectionText = nearbyRooms.length >= 2
    ? `${nearbyRooms[0].id} <-> ${nearbyRooms[1].id}`
    : nearbyRooms.length === 1
      ? `Cerca de ${nearbyRooms[0].id}`
      : "Corredor sin contenido especifico.";

  return {
    kind: "corridor",
    focusSection: "overview",
    title: "Corredor",
    cell: cloneCellTarget(cell),
    typeLabel: "Ruta de transito",
    connectionText,
    route: cell?.route || "",
    connectionShape: cell?.connectionShape || "",
    floorLevel: Number.isFinite(cell?.floorLevel) ? cell.floorLevel : 0,
    nearbyRooms,
    details: {
      description: cell?.description || "",
      ambience: cell?.ambience || "",
      readAloud: cell?.readAloud || "",
      encounters: cell?.encounters || "",
      traps: cell?.traps || "",
      treasures: cell?.treasures || "",
      secrets: cell?.secrets || "",
      explorationStatus: cell?.explorationStatus || "unexplored",
      dmNotes: cell?.dmNotes || "",
    },
    usage: [
      "Escuchar antes de entrar a la siguiente sala.",
      "Mover miniaturas y medir distancia en pies.",
      "Resolver una emboscada menor o una patrulla corta.",
      "Usarlo para persecucion, retirada o bloqueo temporal.",
      "Hacer que el ruido alerte una sala cercana.",
    ],
    message: nearbyRooms.length ? "" : "Corredor sin contenido especifico.",
  };
}

export function buildMapTooltipModel(dungeon, cell) {
  const target = buildMapTargetFromCell(dungeon, cell);

  if (!target.kind) {
    return null;
  }

  if (target.kind === "door") {
    const door = getDoorById(dungeon, target.doorId);
    return {
      kind: "door",
      title: door?.exactDoor?.id || target.doorId || "Puerta",
      subtitle: door?.connection?.connectionLabel || "Acceso",
      hint: door?.exactDoor?.stateLabel || door?.connection?.stateLabel || "Click para ver puerta",
    };
  }

  if (target.kind === "room") {
    const room = getRoomById(dungeon, target.roomId);
    if (!room) {
      return {
        kind: "room",
        title: target.roomId,
        subtitle: "Sala sin datos",
        hint: "Click para revisar",
      };
    }

    return {
      kind: "room",
      title: `${room.id} - ${room.name}`,
      subtitle: getTooltipSubtitleForRoom(cell.type, room),
      hint: "Click para ver detalles",
    };
  }

  if (target.kind === "corridor") {
    const corridor = buildCorridorInspectorModel(dungeon, cell);
    return {
      kind: "corridor",
      title: "Corredor",
      subtitle: corridor.connectionText,
      hint: "Click para uso en mesa",
    };
  }

  return {
    kind: "tile",
    title: getMapTileLabel(cell.type),
    subtitle: cell.roomId || "Tile de mapa",
    hint: "Click para inspeccionar",
  };
}

export function getRoomDoors(dungeon, roomId) {
  return buildDoorRows(dungeon).filter((door) => door.roomIds.includes(roomId));
}

export function getDoorById(dungeon, doorId) {
  const doors = dungeon?.map?.doors || [];
  const exactDoor = doors.find((door) => door.id === doorId) || null;
  const connection = buildDoorRows(dungeon).find((door) => (
    door.id === doorId
    || door.displayId === doorId
    || door.doorIds.includes(doorId)
  )) || null;

  if (!exactDoor && !connection) {
    return null;
  }

  return {
    id: doorId,
    exactDoor,
    connection: connection || {
      displayId: exactDoor.id,
      connectionLabel: [exactDoor.roomId, exactDoor.connectsTo].filter(Boolean).join(" <-> "),
      roomIds: [exactDoor.roomId, exactDoor.connectsTo].filter(Boolean),
      summary: exactDoor.summary || "",
      kindLabel: exactDoor.kindLabel || "",
      materialLabel: exactDoor.materialLabel || "",
      stateLabel: exactDoor.stateLabel || "",
      doors: [exactDoor],
      doorIds: [exactDoor.id],
    },
  };
}

export function getRoomById(dungeon, roomId) {
  return buildRoomCards(dungeon).find((room) => room.id === roomId) || null;
}

export function getNearbyRoomsForCorridor(dungeon, cell) {
  if (!dungeon?.map?.cells?.length || !cell) {
    return [];
  }

  const cells = dungeon.map.cells || [];
  const nearbyByRoom = new Map();
  const radius = 5;

  cells.forEach((candidate) => {
    if (!candidate.roomId) {
      return;
    }

    const distance = Math.abs(candidate.x - cell.x) + Math.abs(candidate.y - cell.y);
    if (distance > radius) {
      return;
    }

    const current = nearbyByRoom.get(candidate.roomId);
    if (!current || distance < current.distance) {
      nearbyByRoom.set(candidate.roomId, { roomId: candidate.roomId, distance });
    }
  });

  const nearby = [...nearbyByRoom.values()]
    .sort((first, second) => first.distance - second.distance)
    .slice(0, 4)
    .map((entry) => getRoomById(dungeon, entry.roomId))
    .filter(Boolean);

  if (nearby.length) {
    return nearby;
  }

  return (dungeon.map.rooms || [])
    .map((roomRect) => ({
      room: getRoomById(dungeon, roomRect.roomId),
      distance: getDistanceToRect(cell, roomRect),
    }))
    .filter((item) => item.room)
    .sort((first, second) => first.distance - second.distance)
    .slice(0, 3)
    .map((item) => item.room);
}

export function buildDungeonFlow(dungeon) {
  const rooms = Array.isArray(dungeon?.rooms) ? dungeon.rooms : [];
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const entrance = rooms.find((room) => room.type === "entrada") || rooms[0] || null;
  const finalRoom = roomById.get(dungeon?.finalRoomId)
    || rooms.find((room) => room.type === "jefe")
    || rooms[rooms.length - 1]
    || null;
  const edges = [];
  const seen = new Set();

  rooms.forEach((room) => {
    (room.connections || []).forEach((targetId) => {
      const key = [room.id, targetId].sort(compareRoomIds).join("-");
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({
          from: room.id,
          to: targetId,
          label: `${room.id} <-> ${targetId}`,
        });
      }
    });
  });

  return {
    entranceId: entrance?.id || "",
    finalRoomId: finalRoom?.id || "",
    mainPath: entrance && finalRoom ? findPath(rooms, entrance.id, finalRoom.id) : [],
    branchRooms: rooms
      .filter((room) => (room.connections || []).length >= 3)
      .map((room) => ({ id: room.id, name: room.name, exits: room.connections.length })),
    shortcuts: (dungeon?.connections || [])
      .filter((connection) => ["shortcut", "secret-shortcut", "loop"].includes(connection.kind))
      .map((connection) => ({
        from: connection.from,
        to: connection.to,
        kind: connection.kind,
      })),
    zoneGates: (dungeon?.connections || [])
      .filter((connection) => connection.zoneTransition)
      .map((connection) => ({
        from: connection.from,
        to: connection.to,
        fromZoneName: connection.fromZoneName,
        toZoneName: connection.toZoneName,
      })),
    secretRooms: rooms
      .filter((room) => room.type === "secreto")
      .map((room) => ({ id: room.id, name: room.name, connections: room.connections || [] })),
    nodes: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      typeLabel: getRoomTypeLabel(room.type),
      connectionCount: (room.connections || []).length,
    })),
    edges,
  };
}

export function buildDungeonEcology(dungeon) {
  if (dungeon?.inhabitants !== "bestias" && dungeon?.config?.inhabitants !== "bestias") {
    return null;
  }

  const rooms = buildRoomCards(dungeon);
  const encounterRows = buildEncounterRows(dungeon);
  const waterRooms = getRoomsWithMapTile(dungeon?.map, "water");
  const nestingRoom = rooms.find((room) => ["descanso", "secreto", "jefe"].includes(room.type)) || rooms[0];
  const huntingRooms = rooms.filter((room) => ["entrada", "pasillo", "combate"].includes(room.type)).slice(0, 4);
  const dominant = encounterRows
    .flatMap((row) => row.creatureBlocks)
    .find((block) => block.role === "principal" || block.roleLabel === "principal");

  return {
    reasonTheyAreHere: inferBeastReason(dungeon),
    foodSource: inferFoodSource(dungeon),
    nestingArea: nestingRoom ? `${nestingRoom.id} - ${nestingRoom.name}` : "Sin nido claro",
    huntingArea: huntingRooms.length
      ? huntingRooms.map((room) => `${room.id} - ${room.name}`).join(", ")
      : "Rutas cercanas a la entrada",
    waterSource: waterRooms.length
      ? waterRooms.join(", ")
      : inferFallbackWaterSource(dungeon),
    dominantCreature: dominant?.name || encounterRows[0]?.creatureBlocks?.[0]?.name || "Depredador local",
    fearOrWeakness: "Ruidos fuertes, fuego controlado, alimento fácil o una salida abierta pueden cambiar su reacción.",
    noiseReaction: "Si el grupo hace mucho ruido, una sala cercana puede investigar antes de atacar.",
    tracksAndSigns: buildTracksAndSigns(rooms),
    nonCombatSolutions: [
      "Ofrecer comida y retirarse despacio.",
      "Abrir una ruta de escape para que el territorio deje de parecer una jaula.",
      "Evitar el nido y bordear el área de caza.",
    ],
  };
}

export function buildEncounterUi(room) {
  const plan = room?.encounterPlan || null;
  const structuredCreatures = normalizeCreatureObjects(room?.creatures);
  const enemyLines = normalizeTextList(room?.enemies).filter((line) => !isNarrativeTemplateLine(line));
  const creatureLines = structuredCreatures.length
    ? structuredCreatures.map((creature) => creature.label).filter(Boolean)
    : normalizeTextList(room?.enemies || room?.creatures).filter((line) => !isNarrativeTemplateLine(line));
  const groups = Array.isArray(plan?.groups) ? plan.groups : [];
  const creatureBlocks = groups.map((group, index) => {
    const creature = structuredCreatures[index] || null;
    const line = creatureLines[index] || "";
    return {
      role: group.role || "",
      roleLabel: getEncounterRoleLabel(group.role),
      count: creature?.count || group.count || 0,
      cr: creature?.cr || group.cr || "",
      crValue: Number(creature?.crValue ?? group.crValue) || 0,
      xpEach: creature?.xpEach || group.xpEach || 0,
      totalXp: creature?.totalXp || group.totalXp || 0,
      name: creature?.name || extractCreatureName(line) || getEncounterRoleLabel(group.role),
      flavorName: creature?.flavorName || "",
      label: creature?.label || line || `${group.count || 1} criatura(s) ${getEncounterRoleLabel(group.role)} (CR ${group.cr || "?"})`,
      source: creature?.source || "",
      sourceId: creature?.sourceId || "",
      isOfficial: Boolean(creature?.isOfficial),
      tacticalRole: creature?.tacticalRole || group.role || "",
      creatureType: creature?.creatureType || "",
      habitat: creature?.habitat || [],
      treasure: creature?.treasure || [],
    };
  });
  const extraLines = structuredCreatures.length
    ? normalizeTextList(room?.encounterExtras || enemyLines.slice(structuredCreatures.length))
    : creatureLines.slice(groups.length);
  const extras = extraLines.map((line) => ({
    role: "extra",
    roleLabel: "Extra",
    count: "",
    cr: "",
    crValue: 0,
    xpEach: 0,
    totalXp: 0,
    name: extractCreatureName(line) || line,
    label: line,
  }));
  const highestCr = Math.max(0, ...creatureBlocks.map((block) => Number(block.crValue) || 0));
  const budgetXp = plan?.adjustedBudgetXp || 0;
  const spentXp = plan?.spentXp || creatureBlocks.reduce((sum, block) => sum + (block.totalXp || 0), 0);

  return {
    difficultyLabel: plan?.difficultyLabel || (creatureLines.length ? "Narrativo" : "Sin encuentro"),
    budgetXp,
    spentXp,
    remainingXp: plan?.remainingXp || Math.max(0, budgetXp - spentXp),
    highestCr,
    creatureBlocks: [...creatureBlocks, ...extras],
    warnings: normalizeTextList(plan?.warnings),
    dangerLevel: inferDangerLevel(plan, highestCr),
  };
}

function buildCreatureRows(room) {
  const creatures = normalizeCreatureObjects(room?.creatures);
  if (creatures.length) {
    return creatures;
  }

  return normalizeTextList(room?.enemies).map((line) => ({
    name: extractCreatureName(line) || line,
    flavorName: "",
    label: line,
    source: "",
    sourceId: "",
    isOfficial: false,
  })).filter((creature) => !isNarrativeTemplateLine(creature.label));
}

function normalizeHazard(room) {
  const details = room?.hazardDetails || {};
  const summary = details.summary || room?.hazard || "";

  return {
    hasHazard: Boolean(String(summary).trim()),
    summary,
    trigger: details.trigger || inferHazardTrigger(summary),
    effect: details.effect || summary,
    countermeasure: details.countermeasure || inferHazardCountermeasure(summary),
    visibility: details.visibility || (summary ? "Tiene una pista visible si se observa la sala." : ""),
  };
}

function getMapRoomField(dungeon, roomId, fieldName) {
  const mapRoom = (dungeon?.map?.rooms || []).find((room) => room.roomId === roomId);
  return mapRoom?.[fieldName];
}

function summarizeFeatureTiles(features = []) {
  const counts = features.reduce((acc, feature) => {
    acc[feature.type] = (acc[feature.type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([type, count]) => `${type} x${count}`)
    .join(", ");
}

function normalizeTreasure(room) {
  const details = room?.treasureDetails || {};
  const text = room?.treasure || details.summary || "";
  const parts = splitTreasureText(text);
  const coins = details.coins || parts.find((part) => /moneda|coin/i.test(part)) || "";
  const keys = normalizeTextList(details.keys).concat(parts.filter((part) => /llave|clave|sigilo|sello/i.test(part)));
  const clues = normalizeTextList(details.clues).concat(parts.filter((part) => /pista|mapa|nota|marca|diario/i.test(part)));
  const knownParts = new Set([coins, ...keys, ...clues].filter(Boolean));
  const items = normalizeTextList(details.items).concat(parts.filter((part) => !knownParts.has(part)));

  return {
    hasTreasure: Boolean(String(text).trim() || coins || items.length || keys.length || clues.length),
    summary: details.summary || text,
    coins,
    items: unique(items),
    clues: unique(clues),
    keys: unique(keys),
    valueHint: details.valueHint || inferTreasureValueHint(room),
  };
}

function inferRiskLevel(room, encounterUi, hazard) {
  if (room.type === "jefe" || encounterUi.dangerLevel === "extreme") return "extreme";
  if (room.type === "combate" || room.type === "trampa" || encounterUi.dangerLevel === "high") return "high";
  if (hazard.hasHazard || room.type === "puzzle" || encounterUi.creatureBlocks.length) return "medium";
  if (room.type === "tesoro" || room.type === "secreto") return "low";
  return "none";
}

function inferRoomFunction(room) {
  const byType = {
    entrada: "Presentar el tono, el primer rastro y una decisión de ruta.",
    pasillo: "Conectar salas y crear tensión de movimiento.",
    combate: "Poner presion táctica y mostrar como actuan los habitantes.",
    trampa: "Cobrar atencion, exploración y recursos.",
    puzzle: "Dar una pausa de deducción o manipulación del entorno.",
    tesoro: "Recompensar exploración y sembrar objetos Útiles.",
    descanso: "Permitir recuperación breve o negociación.",
    vacia: "Dar aire, pistas y ritmo sin combate inmediato.",
    jefe: "Cerrar el objetivo de la mazmorra con una amenaza clara.",
    secreto: "Premiar curiosidad con atajo, información o botín opciónal.",
  };

  return byType[room.type] || "Resolver una escena corta de exploración.";
}

function inferDangerLevel(plan, highestCr) {
  if (!plan) return "none";
  const ratio = plan.adjustedBudgetXp ? (plan.spentXp || 0) / plan.adjustedBudgetXp : 0;
  if (plan.difficultyLabel === "Mortal" || highestCr > plan.level + 1 || ratio >= 1.1) return "extreme";
  if (plan.difficultyLabel === "Alta" || highestCr > plan.level || ratio >= 0.9) return "high";
  if (ratio >= 0.55) return "medium";
  return "low";
}

function getEncounterRoleLabel(role) {
  const labels = {
    principal: "Principal",
    apoyo: "Apoyo",
    extra: "Extra",
  };
  return labels[role] || role || "Criatura";
}

function getRoomTypeLabel(type) {
  return getOptionLabel(ROOM_TYPE_OPTIONS, type) || type || "";
}

function normalizeTextList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeTextItem).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCreatureObjects(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const creature = {
        name: String(item.name || "").trim(),
        flavorName: String(item.flavorName || "").trim(),
        label: String(item.label || "").trim(),
        count: Number(item.count) || 0,
        cr: String(item.cr || item.suggestedCr || "").trim(),
        crValue: Number(item.crValue) || 0,
        xpEach: Number(item.xpEach) || 0,
        totalXp: Number(item.totalXp) || 0,
        tacticalRole: item.tacticalRole || item.role || "",
        encounterRole: item.encounterRole || "",
        source: item.source || "",
        sourceId: item.sourceId || "",
        isOfficial: item.isOfficial === true || item.source === "monster-manual-2024",
        creatureType: item.creatureType || "",
        size: item.size || "",
        habitat: Array.isArray(item.habitat) ? item.habitat : [],
        treasure: Array.isArray(item.treasure) ? item.treasure : [],
        extractionConfidence: item.extractionConfidence || "",
        suggestedCr: item.suggestedCr || "",
      };

      creature.label = creature.label || formatCreatureEncounterLabel(creature);
      return creature;
    })
    .filter((creature) => creature.label || creature.name || creature.flavorName)
    .filter((creature) => creature.source !== "template-narrative" && creature.name !== "Creature template");
}

function normalizeTextItem(item) {
  if (item && typeof item === "object") {
    return String(item.label || item.name || item.summary || "").trim();
  }

  return String(item).trim();
}

function splitTreasureText(value) {
  return String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractCreatureName(line) {
  return String(line || "")
    .replace(/^\d+\s+/, "")
    .replace(/\s*\(CR .*$/i, "")
    .replace(/\s*\(.*XP.*$/i, "")
    .trim();
}

function isNarrativeTemplateLine(line) {
  return /^(\d+\s+)?Creature templates?:/i.test(String(line || "").trim());
}

function inferHazardTrigger(summary) {
  if (!summary) return "";
  if (/puzzle/i.test(summary)) return "Interaccion incorrecta con el mecanismo.";
  if (/entrada oculta|secreta/i.test(summary)) return "Avanzar rápido sin revisar el entorno.";
  return "Movimiento descuidado, ruido o manipulación del área.";
}

function inferHazardCountermeasure(summary) {
  if (!summary) return "";
  if (/visión|niebla|humo|polvo/i.test(summary)) return "Luz, aireacion, espera o movimiento lento.";
  if (/derrumba|inestable/i.test(summary)) return "Cruzar de uno en uno o reforzar el paso.";
  if (/puzzle/i.test(summary)) return "Usar pistas de otras salas antes de activar piezas.";
  return "Detectar la pista visible, desactivar con herramientas o rodear el punto peligroso.";
}

function inferTreasureValueHint(room) {
  if (room?.type === "jefe" || room?.type === "tesoro") return "Recompensa principal";
  if (room?.type === "secreto") return "Recompensa opciónal";
  return "Recompensa menor";
}

function findPath(rooms, startId, targetId) {
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const queue = [[startId]];
  const seen = new Set([startId]);

  while (queue.length) {
    const path = queue.shift();
    const currentId = path[path.length - 1];
    if (currentId === targetId) {
      return path;
    }

    (roomById.get(currentId)?.connections || []).forEach((nextId) => {
      if (!roomById.has(nextId) || seen.has(nextId)) {
        return;
      }

      seen.add(nextId);
      queue.push([...path, nextId]);
    });
  }

  return [];
}

function getRoomsWithMapTile(map, tileType) {
  if (!map?.cells?.length) {
    return [];
  }

  return unique(map.cells
    .filter((cell) => cell.type === tileType && cell.roomId)
    .map((cell) => cell.roomId))
    .sort(compareRoomIds);
}

function inferBeastReason(dungeon) {
  const type = dungeon?.type || dungeon?.config?.dungeonType;
  if (type === "guarida" || type === "cueva") return "El lugar funciona como territorio, refugio o nido.";
  if (type === "alcantarilla" || type === "ruina") return "Hay comida, sombra y pocos depredadores inteligentes.";
  return "Las bestias entraron por comida, seguridad o por haber sido encerradas aquí.";
}

function inferFoodSource(dungeon) {
  const type = dungeon?.type || dungeon?.config?.dungeonType;
  if (type === "alcantarilla") return "Ratas, peces, desperdicios y restos arrastrados por el agua.";
  if (type === "cueva" || type === "natural") return "Hongos, animales menores y presas que cruzan la zona.";
  return "Restos de ocupantes anteriores, alijos abandonados y criaturas pequeñas.";
}

function inferFallbackWaterSource(dungeon) {
  const type = dungeon?.type || dungeon?.config?.dungeonType;
  if (type === "alcantarilla") return "Canales bajos fuera de la ruta principal.";
  if (type === "cueva" || type === "mina") return "Filtraciones en grietas o charcos subterraneos.";
  return "Agua almacenada, humedad de muros o salida cercana.";
}

function buildTracksAndSigns(rooms) {
  const signs = rooms
    .flatMap((room) => room.visibleSigns || [])
    .slice(0, 4);

  if (signs.length) {
    return signs.join(" ");
  }

  return "Huellas, pelo, huesos pequeños, marcas de garras y olor territorial.";
}

function cloneCellTarget(cell) {
  if (!cell) {
    return null;
  }

  return {
    x: cell.x,
    y: cell.y,
    type: cell.type,
    roomId: cell.roomId || "",
    doorId: cell.doorId || "",
    connection: cell.connection || "",
    label: cell.label || "",
    zoneId: cell.zoneId || "",
    route: cell.route || "",
    connectionShape: cell.connectionShape || "",
    floorLevel: Number.isFinite(cell.floorLevel) ? cell.floorLevel : 0,
    description: cell.description || "",
    ambience: cell.ambience || "",
    readAloud: cell.readAloud || "",
    encounters: cell.encounters || "",
    traps: cell.traps || "",
    treasures: cell.treasures || "",
    secrets: cell.secrets || "",
    explorationStatus: cell.explorationStatus || "",
    dmNotes: cell.dmNotes || "",
  };
}

function getFocusSectionForTile(type) {
  const sectionByType = {
    entrance: "readAloud",
    boss: "creatures",
    trap: "hazard",
    treasure: "treasure",
    secret: "secret",
    door: "doors",
    stairs: "overview",
    ladder: "overview",
    bridge: "overview",
    pit: "hazard",
    blocked: "hazard",
    elevationUp: "overview",
    elevationDown: "overview",
    altar: "clues",
    statue: "clues",
    throne: "creatures",
    exit: "overview",
    secondaryEntrance: "overview",
  };

  return sectionByType[type] || "overview";
}

function getDoorAtCell(dungeon, cell) {
  return (dungeon?.map?.doors || []).find((door) => door.x === cell?.x && door.y === cell?.y) || null;
}

function getTooltipSubtitleForRoom(tileType, room) {
  if (tileType === "treasure") return `Tesoro en ${room.id}`;
  if (tileType === "trap") return `Peligro en ${room.id}`;
  if (tileType === "boss") return `Jefe en ${room.id}`;
  if (tileType === "secret") return `Secreto en ${room.id}`;
  if (tileType === "entrance") return `Entrada - riesgo ${room.riskLabel}`;
  return `${room.typeLabel} - riesgo ${room.riskLabel}`;
}

function buildRoomCopyText(room, roomDoors) {
  const lines = [
    `${room.id}. ${room.name}`,
    `Tipo: ${room.typeLabel}`,
    `Riesgo: ${room.riskLabel}`,
    room.shapeLabel ? `Forma: ${room.shapeLabel}` : "",
    Number.isFinite(room.floorLevel) ? `Nivel: ${room.floorLevel}` : "",
    `Conexiones: ${room.connections.join(", ") || "Sin conexiones"}`,
    "",
    "Ambiente:",
    room.readAloud,
  ];

  if (room.investigationClues.length) {
    lines.push("", "Pistas:", ...room.investigationClues.map((item) => `- ${item}`));
  }

  if (room.encounterUi.creatureBlocks.length) {
    lines.push("", "Encuentro:", ...room.encounterUi.creatureBlocks.map((block) => `- ${block.label}`));
  }

  if (room.hazard.hasHazard) {
    lines.push("", "Peligro:", room.hazard.summary);
  }

  if (room.treasure.hasTreasure) {
    lines.push("", "Tesoro:", room.treasure.summary);
  }

  if (roomDoors.length) {
    lines.push("", "Puertas:", ...roomDoors.map((door) => `- ${door.displayId}: ${door.connectionLabel}`));
  }

  if (room.dmNotes.length) {
    lines.push("", "Notas DM:", ...room.dmNotes.map((item) => `- ${item}`));
  }

  return lines.filter((line) => line !== undefined && line !== null).join("\n");
}

function buildDoorCopyText(door, connection) {
  return [
    `Puerta ${door.id || connection.displayId}`,
    `Conexión: ${connection.connectionLabel}`,
    `Tipo: ${door.kindLabel || connection.kindLabel || "Sin tipo"}`,
    `Material: ${door.materialLabel || connection.materialLabel || "Sin material"}`,
    `Estado: ${door.stateLabel || connection.stateLabel || "Sin estado"}`,
    Number.isFinite(door.ac) ? `CA: ${door.ac}` : "",
    Number.isFinite(door.hp) ? `PG: ${door.hp}` : "",
    Number.isFinite(door.forceOpenDc) ? `CD forzar: ${door.forceOpenDc}` : "",
    door.lock ? `Cerradura: ${door.lock.label} CD ${door.lock.dc}` : "",
    door.secret ? `Detectar secreto: CD ${door.secret.detectionDc}` : "",
    "",
    door.notes || "",
    connection.summary || "",
  ].filter(Boolean).join("\n");
}

function numberOrEmpty(value) {
  return Number.isFinite(value) ? String(value) : "Sin dato";
}

function getDistanceToRect(cell, rect) {
  const dx = Math.max(rect.x - cell.x, 0, cell.x - (rect.x + rect.width - 1));
  const dy = Math.max(rect.y - cell.y, 0, cell.y - (rect.y + rect.height - 1));
  return dx + dy;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function compareRoomIds(first, second) {
  const firstNumber = Number(String(first).replace(/\D/g, ""));
  const secondNumber = Number(String(second).replace(/\D/g, ""));

  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber) && firstNumber !== secondNumber) {
    return firstNumber - secondNumber;
  }

  return String(first).localeCompare(String(second));
}
