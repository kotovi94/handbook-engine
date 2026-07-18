import { getUniqueDoorConnections } from "./dungeonDoorUtils.js";

export function validateDungeon(dungeon) {
  const issues = [];
  const rooms = Array.isArray(dungeon?.rooms) ? dungeon.rooms : [];

  if (!rooms.length) {
    issues.push(createIssue("error", "no_rooms", "La mazmorra no tiene salas generadas."));
    return issues;
  }

  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const duplicateIds = getDuplicateIds(rooms.map((room) => room.id));
  duplicateIds.forEach((id) => {
    issues.push(createIssue("error", "duplicate_room_id", `El ID de sala ${id} esta duplicado.`));
  });

  const entrance = rooms.find((room) => room.type === "entrada") || rooms[0];
  const finalRoom = roomById.get(dungeon.finalRoomId) || rooms.find((room) => room.type === "jefe") || rooms[rooms.length - 1];

  if (!finalRoom) {
    issues.push(createIssue("warning", "missing_final_room", "No hay sala final clara."));
  }

  rooms.forEach((room) => {
    (room.connections || []).forEach((targetId) => {
      if (!roomById.has(targetId)) {
        issues.push(createIssue("warning", "missing_connection", `${room.id} conecta con ${targetId}, pero esa sala no existe.`));
      }
    });
  });

  if (entrance && finalRoom && !canReachRoom(rooms, entrance.id, finalRoom.id)) {
    issues.push(createIssue("error", "final_unreachable", `La sala final ${finalRoom.id} no es alcanzable desde ${entrance.id}.`));
  }

  if (entrance && finalRoom && finalRoom.type !== "secreto") {
    const publicRooms = rooms.filter((room) => room.type !== "secreto");
    if (!canReachRoom(publicRooms, entrance.id, finalRoom.id)) {
      issues.push(createIssue(
        "warning",
        "secret_blocks_progress",
        "La ruta principal parece depender de una sala secreta. Conviene que los secretos sean atajos, recompensas o información opciónal.",
      ));
    }
  }

  const doorRows = getUniqueDoorConnections(dungeon.map);
  const physicalDoorCount = dungeon.map?.doors?.length || 0;
  if (physicalDoorCount && doorRows.length && physicalDoorCount > doorRows.length) {
    issues.push(createIssue(
      "info",
      "grouped_doors",
      `${physicalDoorCount} piezas de puerta físicas se muestran como ${doorRows.length} conexiones jugables.`,
    ));
  }

  const orphanMapRooms = (dungeon.map?.rooms || [])
    .filter((mapRoom) => !roomById.has(mapRoom.roomId))
    .map((mapRoom) => mapRoom.roomId);
  if (orphanMapRooms.length) {
    issues.push(createIssue("warning", "orphan_map_rooms", `El mapa contiene salas sin ficha: ${orphanMapRooms.join(", ")}.`));
  }

  addMapInspectorWarnings(issues, dungeon, roomById);
  addMapV2Warnings(issues, dungeon, rooms);
  addNarrativeWarnings(issues, dungeon, rooms);
  addZoneWarnings(issues, dungeon, rooms);
  addRouteWarnings(issues, dungeon, rooms);
  addTreasureWarnings(issues, rooms, dungeon.config || {});
  addEncounterWarnings(issues, rooms, dungeon.config || {});
  addMixedEncounterWarnings(issues, dungeon, rooms);
  return issues;
}

function addNarrativeWarnings(issues, dungeon) {
  if (!dungeon.narrative?.cause?.summary) {
    issues.push(createIssue(
      "warning",
      "missing_internal_cause",
      "La mazmorra no tiene causa interna definida. Esto puede hacer que las salas parezcan aisladas.",
    ));
  }

  if (!dungeon.narrative?.situation?.summary) {
    issues.push(createIssue(
      "warning",
      "missing_current_situation",
      "Falta una situación actual para explicar que esta pasando ahora dentro de la mazmorra.",
    ));
  }

  if (!dungeon.narrative?.relationship?.summary && dungeon.inhabitantMix?.hasSecondary) {
    issues.push(createIssue(
      "warning",
      "missing_inhabitant_relationship",
      "Hay habitantes secundarios, pero no hay relación clara entre facciones.",
    ));
  }
}

function addZoneWarnings(issues, dungeon, rooms) {
  const zones = Array.isArray(dungeon.zones) ? dungeon.zones : [];
  if (!zones.length) {
    issues.push(createIssue("warning", "missing_zones", "La mazmorra no tiene zonas internas definidas."));
    return;
  }

  const assignedRoomIds = new Set(zones.flatMap((zone) => zone.roomIds || []));
  const unassignedRooms = rooms.filter((room) => !room.zoneId && !assignedRoomIds.has(room.id));
  if (unassignedRooms.length) {
    issues.push(createIssue(
      "warning",
      "rooms_without_zone",
      `Hay salas sin zona interna: ${unassignedRooms.map((room) => room.id).join(", ")}.`,
    ));
  }

  const emptyZones = zones.filter((zone) => !zone.roomIds?.length);
  if (emptyZones.length) {
    issues.push(createIssue(
      "info",
      "empty_zones",
      `Hay zonas sin salas asignadas: ${emptyZones.map((zone) => zone.id).join(", ")}.`,
    ));
  }

  const hasFinalZone = zones.some((zone) => zone.role === "final" && zone.roomIds?.includes(dungeon.finalRoomId));
  if (!hasFinalZone) {
    issues.push(createIssue(
      "warning",
      "final_without_final_zone",
      "La sala final no esta marcada dentro de una zona final.",
    ));
  }
}

function addRouteWarnings(issues, dungeon, rooms) {
  const connections = Array.isArray(dungeon.connections) ? dungeon.connections : [];
  if (!connections.length) {
    return;
  }

  const shortcuts = connections.filter((connection) => ["shortcut", "secret-shortcut", "loop"].includes(connection.kind));
  const secrets = rooms.filter((room) => room.type === "secreto");
  const zoneGates = connections.filter((connection) => connection.zoneTransition);

  if (rooms.length >= 8 && !shortcuts.length) {
    issues.push(createIssue(
      "info",
      "missing_shortcuts",
      "No hay atajos o rutas alternativas marcadas. Considera crear un rodeo o una conexión larga.",
    ));
  }

  if (secrets.length && !connections.some((connection) => String(connection.kind).includes("secret"))) {
    issues.push(createIssue(
      "warning",
      "secret_without_secret_route",
      "Hay salas secretas, pero ninguna conexión esta marcada como secreta o atajo secreto.",
    ));
  }

  if ((dungeon.zones || []).length >= 2 && !zoneGates.length) {
    issues.push(createIssue(
      "info",
      "missing_zone_gates",
      "No hay puertas importantes entre zonas. Un acceso marcado ayuda a separar identidades internas.",
    ));
  }
}

function addMapInspectorWarnings(issues, dungeon, roomById) {
  const map = dungeon?.map;
  if (!map?.cells?.length) {
    return;
  }

  const doorById = new Map((map.doors || []).map((door) => [door.id, door]));
  const badCellRoomIds = new Set();
  const missingDoorIds = new Set();
  const specialTilesWithoutRoom = new Map();
  const specialTypes = new Set([
    "treasure",
    "trap",
    "boss",
    "secret",
    "stairs",
    "pit",
    "bridge",
    "column",
    "rubble",
    "altar",
    "statue",
    "throne",
    "ladder",
    "balcony",
    "exit",
    "secondaryEntrance",
    "blocked",
    "elevationUp",
    "elevationDown",
  ]);

  map.cells.forEach((cell) => {
    if (cell.roomId && !roomById.has(cell.roomId)) {
      badCellRoomIds.add(cell.roomId);
    }

    if (cell.type === "door" && cell.doorId && !doorById.has(cell.doorId)) {
      missingDoorIds.add(cell.doorId);
    }

    if (specialTypes.has(cell.type) && !cell.roomId) {
      if (!specialTilesWithoutRoom.has(cell.type)) {
        specialTilesWithoutRoom.set(cell.type, []);
      }
      specialTilesWithoutRoom.get(cell.type).push(`${cell.x},${cell.y}`);
    }
  });

  if (badCellRoomIds.size) {
    issues.push(createIssue(
      "warning",
      "map_cell_missing_room",
      `Hay celdas del mapa con roomId inexistente: ${[...badCellRoomIds].join(", ")}.`,
    ));
  }

  if (missingDoorIds.size) {
    issues.push(createIssue(
      "warning",
      "map_cell_missing_door",
      `Hay celdas de puerta con doorId inexistente: ${[...missingDoorIds].join(", ")}.`,
    ));
  }

  (map.doors || []).forEach((door) => {
    [door.roomId, door.connectsTo].filter(Boolean).forEach((roomId) => {
      if (!roomById.has(roomId)) {
        issues.push(createIssue(
          "warning",
          "door_missing_room",
          `La puerta ${door.id} conecta con ${roomId}, pero esa sala no existe.`,
        ));
      }
    });
  });

  specialTilesWithoutRoom.forEach((positions, tileType) => {
    issues.push(createIssue(
      "warning",
      "special_tile_without_room",
      `Hay tiles ${tileType} sin roomId: ${positions.slice(0, 6).join(", ")}${positions.length > 6 ? "..." : ""}.`,
    ));
  });

  (dungeon.rooms || [])
    .filter((room) => room.type === "pasillo" && roomHasInspectorContent(room))
    .filter((room) => room.inspectorMode === "minor" || room.excludeFromInspector)
    .forEach((room) => {
      issues.push(createIssue(
        "warning",
        "passage_room_hidden_content",
        `${room.id} es una sala tipo pasillo con contenido, pero esta marcada para no mostrarse completa en el inspector.`,
      ));
    });
}

function addMapV2Warnings(issues, dungeon, rooms) {
  const map = dungeon?.map;
  if (!map?.cells?.length) {
    return;
  }

  const entranceCells = map.cells.filter((cell) => cell.type === "entrance" && cell.roomId);
  const exitCells = map.cells.filter((cell) => cell.type === "exit" && cell.roomId);
  const secondaryEntranceCells = map.cells.filter((cell) => cell.type === "secondaryEntrance" && cell.roomId);
  const entranceRoom = entranceCells[0]?.roomId || rooms.find((room) => room.type === "entrada")?.id || rooms[0]?.id;
  const exitRoom = exitCells[0]?.roomId || "";
  const finalRoomId = dungeon.finalRoomId || rooms.find((room) => room.type === "jefe")?.id || rooms[rooms.length - 1]?.id;

  if (!entranceCells.length) {
    issues.push(createIssue("warning", "missing_map_entrance", "El mapa visual no tiene tile de entrada principal."));
  }

  if (!exitCells.length) {
    issues.push(createIssue("warning", "missing_map_exit", "El mapa visual no tiene tile de salida."));
  }

  if (rooms.length >= 10 && !secondaryEntranceCells.length) {
    issues.push(createIssue("info", "missing_secondary_entrance", "El mapa no tiene entrada secundaria; puede estar bien, pero una ruta extra ayuda en mazmorras medianas o grandes."));
  }

  if (entranceRoom && exitRoom && !canReachRoom(rooms, entranceRoom, exitRoom)) {
    issues.push(createIssue("error", "exit_unreachable", `La salida visual en ${exitRoom} no es alcanzable desde ${entranceRoom}.`));
  }

  if (finalRoomId && exitRoom && !canReachRoom(rooms, finalRoomId, exitRoom)) {
    issues.push(createIssue("warning", "final_cannot_reach_exit", `La salida ${exitRoom} no parece alcanzable desde la sala final ${finalRoomId}.`));
  }

  const mapRooms = map.rooms || [];
  const roomsWithoutShape = mapRooms.filter((room) => !room.shape).map((room) => room.roomId);
  if (roomsWithoutShape.length) {
    issues.push(createIssue("warning", "map_rooms_without_shape", `Hay salas visuales sin shape: ${roomsWithoutShape.join(", ")}.`));
  }

  const verticalRooms = mapRooms.filter((room) => Number(room.floorLevel) !== 0);
  const verticalTiles = map.cells.filter((cell) => ["stairs", "ladder", "elevationUp", "elevationDown"].includes(cell.type));
  if (verticalRooms.length && !verticalTiles.length) {
    issues.push(createIssue("warning", "vertical_without_tiles", "Hay salas en otro nivel, pero no hay escaleras, escalas o marcadores de elevación en el mapa."));
  }
}

function addTreasureWarnings(issues, rooms, config) {
  const treasureRooms = rooms.filter((room) => hasRoomTreasure(room));

  if (config.treasureAmount !== "bajo" && rooms.length >= 8 && treasureRooms.length <= 1) {
    issues.push(createIssue(
      "warning",
      "low_treasure_spread",
      "El tesoro esta muy concentrado. Puedes repartir pistas, llaves o recompensas menores en más salas.",
    ));
  }

  if (config.treasureAmount === "alto" && treasureRooms.length > Math.ceil(rooms.length * 0.7)) {
    issues.push(createIssue(
      "info",
      "high_treasure_density",
      "Hay tesoro en muchas salas. Puede funcionar, pero revisa que no todo parezca recompensa principal.",
    ));
  }
}

function addEncounterWarnings(issues, rooms, config) {
  const combatRooms = rooms.filter((room) => ["combate", "jefe"].includes(room.type));
  const roomsWithoutEnemies = combatRooms.filter((room) => !hasOfficialEncounterCreature(room));

  if (roomsWithoutEnemies.length) {
    issues.push(createIssue(
      "warning",
      "combat_without_creatures",
      `Hay salas de combate sin criaturas sugeridas: ${roomsWithoutEnemies.map((room) => room.id).join(", ")}.`,
    ));
  }

  if (config.encounterDensity === "alta" && combatRooms.length < Math.max(2, Math.floor(rooms.length * 0.2))) {
    issues.push(createIssue(
      "info",
      "encounter_density_mismatch",
      "La densidad de encuentros está en alta, pero el mapa tiene pocas salas de combate.",
    ));
  }
}

function hasOfficialEncounterCreature(room) {
  if ((room.creatures || []).some((creature) => (
    creature?.isOfficial === true
    && creature.source === "monster-manual-2024"
    && creature.name
  ))) {
    return true;
  }

  return (room.enemies || []).some((line) => (
    /\(CR\s+/i.test(String(line || ""))
    && !/^(\d+\s+)?Creature templates?:/i.test(String(line || "").trim())
  ));
}

function addMixedEncounterWarnings(issues, dungeon, rooms) {
  if (!dungeon.inhabitantMix?.hasSecondary) {
    return;
  }

  const mixedRooms = rooms.filter((room) => (
    room.inhabitantRole === "mixed"
    || room.encounterPlan?.factions?.isMixed
    || (room.localInhabitants || []).length > 1
  ));

  if (!mixedRooms.length) {
    issues.push(createIssue(
      "info",
      "secondary_without_mixed_rooms",
      "Hay habitantes secundarios, pero no hay salas marcadas como mixtas. Una frontera con encuentro mixto mejora la cohesion.",
    ));
  }

  const finalRoom = rooms.find((room) => room.id === dungeon.finalRoomId);
  if (finalRoom && dungeon.inhabitantMix.secondary && !usesInhabitant(finalRoom, dungeon.inhabitantMix.secondary.id)) {
    issues.push(createIssue(
      "info",
      "final_not_using_secondary",
      "La sala final no refleja claramente la presencia secundaria; revisa si deberia aparecer alli.",
    ));
  }
}

function canReachRoom(rooms, startId, targetId) {
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  if (!roomById.has(startId) || !roomById.has(targetId)) {
    return false;
  }

  const seen = new Set([startId]);
  const queue = [startId];

  while (queue.length) {
    const currentId = queue.shift();
    if (currentId === targetId) {
      return true;
    }

    const room = roomById.get(currentId);
    (room?.connections || []).forEach((connectionId) => {
      if (!roomById.has(connectionId) || seen.has(connectionId)) {
        return;
      }

      seen.add(connectionId);
      queue.push(connectionId);
    });
  }

  return false;
}

function hasRoomTreasure(room) {
  if (room.treasureDetails) {
    return Boolean(
      room.treasureDetails.coins
      || room.treasureDetails.items?.length
      || room.treasureDetails.clues?.length
      || room.treasureDetails.keys?.length,
    );
  }

  return Boolean(String(room.treasure || "").trim());
}

function roomHasInspectorContent(room) {
  return Boolean(
    room.enemies?.length
    || room.creatures?.length
    || String(room.hazard || "").trim()
    || room.hazardDetails?.hasHazard
    || hasRoomTreasure(room)
    || room.investigationClues?.length
  );
}

function usesInhabitant(room, inhabitantId) {
  return (room.localInhabitants || []).some((inhabitant) => inhabitant.id === inhabitantId)
    || room.encounterPlan?.factions?.primary === inhabitantId
    || room.encounterPlan?.factions?.secondary === inhabitantId
    || (room.tags || []).includes(inhabitantId);
}

function getDuplicateIds(ids) {
  const seen = new Set();
  const duplicates = new Set();

  ids.forEach((id) => {
    if (seen.has(id)) {
      duplicates.add(id);
      return;
    }
    seen.add(id);
  });

  return [...duplicates];
}

function createIssue(severity, code, message) {
  return { severity, code, message };
}
