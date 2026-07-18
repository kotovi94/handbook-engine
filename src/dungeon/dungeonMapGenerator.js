import { generateDoor } from "./doorGenerator.js";
import {
  buildConnectionPath,
  getConnectionShapeLabel,
  selectConnectionShape,
} from "./dungeonConnectionShapes.js";
import {
  assignRoomElevations,
  getConnectionElevationType,
  getElevationHint,
  getVerticalConnectorTile,
} from "./dungeonElevation.js";
import {
  createMapFeature,
  generateRoomFeatureTiles,
  generateWaterPatch,
  shouldPlaceWaterFeature,
} from "./dungeonMapFeatures.js";
import {
  generateRoomShapeProfile,
  getRoomShapeLabel,
  getShapeFloorCells,
} from "./dungeonRoomShapes.js";
import { createRng, createSeed, pickOne, randomInt } from "./dungeonTypes.js";

export const mapTileTypes = [
  { id: "wall", label: "Muro", symbol: "#", description: "Roca, muro o zona no excavada" },
  { id: "room", label: "Cuarto", symbol: ".", description: "Piso de sala o cámara" },
  { id: "corridor", label: "Pasillo", symbol: ",", description: "Conexión transitable" },
  { id: "door", label: "Puerta", symbol: "+", description: "Puerta, arco cerrado o umbral" },
  { id: "window", label: "Ventana", symbol: "=", description: "Ventana, rejilla o abertura estrecha" },
  { id: "water", label: "Agua", symbol: "~", description: "Agua, hielo fino, canal o charco profundo" },
  { id: "trap", label: "Trampa", symbol: "!", description: "Punto peligroso o mecanismo" },
  { id: "treasure", label: "Tesoro", symbol: "$", description: "Tesoro, cofre, alijo u objeto clave" },
  { id: "secret", label: "Secreto", symbol: "?", description: "Acceso oculto o detalle secreto" },
  { id: "entrance", label: "Entrada", symbol: "E", description: "Entrada principal o punto de inicio" },
  { id: "boss", label: "Jefe", symbol: "B", description: "Sala final, líder o amenaza central" },
  { id: "stairs", label: "Escalera", symbol: "^", description: "Escalera o tramo vertical" },
  { id: "pit", label: "Foso", symbol: "O", description: "Foso, hueco o caída peligrosa" },
  { id: "bridge", label: "Puente", symbol: ":", description: "Puente, pasarela o cruce elevado" },
  { id: "column", label: "Columna", symbol: "o", description: "Columna, pilar o soporte" },
  { id: "rubble", label: "Derrumbe", symbol: "%", description: "Escombros, derrumbe o terreno difícil" },
  { id: "altar", label: "Altar", symbol: "A", description: "Altar, mesa ritual o foco de escena" },
  { id: "statue", label: "Estatua", symbol: "S", description: "Estatua, idolo o figura tallada" },
  { id: "throne", label: "Trono", symbol: "T", description: "Trono, silla dominante o puesto de mando" },
  { id: "ladder", label: "Escala", symbol: "H", description: "Escala, cuerda o elevador simple" },
  { id: "balcony", label: "Balcon", symbol: "_", description: "Balcon, cornisa o plataforma elevada" },
  { id: "exit", label: "Salida", symbol: "X", description: "Salida, escape o cierre externo" },
  { id: "secondaryEntrance", label: "Entrada secundaria", symbol: "e", description: "Entrada secundaria o ruta alternativa de acceso" },
  { id: "blocked", label: "Bloqueado", symbol: "x", description: "Paso bloqueado, derrumbe o barricada" },
  { id: "elevationUp", label: "Sube", symbol: "<", description: "Cambio de elevación hacia arriba" },
  { id: "elevationDown", label: "Baja", symbol: ">", description: "Cambio de elevación hacia abajo" },
];

const tileTypeLookup = Object.fromEntries(mapTileTypes.map((tile) => [tile.id, tile]));
const tileSizeFeet = 5;
const mapBrushTileTypes = mapTileTypes.map((tile) => tile.id);

export function generateDungeonMap(dungeon, config = dungeon?.config || {}, rng = createRng(createSeed())) {
  const rooms = dungeon?.rooms || [];

  if (!rooms.length) {
    return createEmptyMap();
  }

  const connectionMetaByKey = getConnectionMetaByKey(dungeon?.connections || []);
  const abstractPositions = generateAbstractPositions(rooms, rng);
  const roomRects = generateRoomRects(rooms, abstractPositions, config, rng);
  const cellMap = new Map();

  roomRects.forEach((rect) => drawRoom(cellMap, rect));
  const doors = drawConnections(cellMap, roomRects, config, rng, connectionMetaByKey);
  placeRoomFeatures(cellMap, roomRects, config, rng);
  placeAccessFeatures(cellMap, roomRects, config, rng);

  return normalizeMap(cellMap, roomRects, doors, {
    version: 2,
    seed: createSeed(),
    tileSizeFeet,
    brushTypes: mapBrushTileTypes,
    zones: dungeon?.zones || [],
    connections: dungeon?.connections || [],
  });
}

export function regenerateDungeonMap(dungeon) {
  const rng = createRng(createSeed());
  return {
    ...dungeon,
    map: generateDungeonMap(dungeon, dungeon.config, rng),
    updatedAt: new Date().toISOString(),
  };
}

export function updateDungeonMapCell(map, x, y, patch) {
  if (!map?.cells?.length) {
    return map;
  }

  const removedDoorIds = new Set();
  const cells = map.cells.map((cell) => {
    if (cell.x !== x || cell.y !== y) {
      return cell;
    }

    if (cell.doorId && patch.type !== "door") {
      removedDoorIds.add(cell.doorId);
    }

    return normalizeCell({ ...cell, ...patch });
  });

  return {
    ...map,
    cells,
    doors: removedDoorIds.size
      ? (map.doors || []).filter((door) => !removedDoorIds.has(door.id))
      : (map.doors || []),
  };
}

export function getMapTileLabel(type) {
  return tileTypeLookup[type]?.label || type || "";
}

export function getMapTileSymbol(type) {
  return tileTypeLookup[type]?.symbol || " ";
}

export function renderAsciiDungeonMap(map) {
  if (!map?.cells?.length) {
    return "";
  }

  const lookup = new Map(map.cells.map((cell) => [`${cell.x},${cell.y}`, cell]));
  const rows = [];

  for (let y = 0; y < map.height; y += 1) {
    let row = "";
    for (let x = 0; x < map.width; x += 1) {
      const cell = lookup.get(`${x},${y}`);
      row += getMapTileSymbol(cell?.type || "wall");
    }
    rows.push(row.replace(/\s+$/g, ""));
  }

  return rows.join("\n");
}

function createEmptyMap() {
  return {
    version: 2,
    seed: createSeed(),
    tileSizeFeet,
    width: 0,
    height: 0,
    cells: [],
    rooms: [],
    doors: [],
    features: [],
    brushTypes: mapBrushTileTypes,
  };
}

function generateAbstractPositions(rooms, rng) {
  const positions = new Map();
  const occupied = new Set();
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  positions.set(rooms[0].id, { x: 0, y: 0 });
  occupied.add("0,0");

  for (let index = 1; index < rooms.length; index += 1) {
    const room = rooms[index];
    const parent = findPlacedParent(room, rooms[index - 1], positions);
    const origin = positions.get(parent.id) || { x: 0, y: 0 };
    const shuffled = shuffle(directions, rng);
    let placed = false;

    for (let distance = 1; distance <= 3 && !placed; distance += 1) {
      for (const direction of shuffled) {
        const candidate = {
          x: origin.x + direction.x * distance,
          y: origin.y + direction.y * distance,
        };
        const key = `${candidate.x},${candidate.y}`;

        if (!occupied.has(key)) {
          positions.set(room.id, candidate);
          occupied.add(key);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      const fallback = getGridFallback(index, rooms.length, occupied);
      positions.set(room.id, fallback);
      occupied.add(`${fallback.x},${fallback.y}`);
    }
  }

  return positions;
}

function findPlacedParent(room, fallbackRoom, positions) {
  const placedConnections = (room.connections || [])
    .filter((roomId) => positions.has(roomId));

  if (placedConnections.length) {
    return { id: placedConnections[0] };
  }

  return fallbackRoom || room;
}

function getGridFallback(index, count, occupied) {
  const columns = Math.ceil(Math.sqrt(count));
  let candidate = {
    x: index % columns,
    y: Math.floor(index / columns),
  };

  while (occupied.has(`${candidate.x},${candidate.y}`)) {
    candidate = { x: candidate.x + 1, y: candidate.y };
  }

  return candidate;
}

function generateRoomRects(rooms, abstractPositions, config, rng) {
  const spacingX = 16;
  const spacingY = 13;
  const floorByRoomId = assignRoomElevations(rooms, config, rng);

  return rooms.map((room) => {
    const position = abstractPositions.get(room.id) || { x: 0, y: 0 };
    const profile = generateRoomShapeProfile({ room, config, rng });
    const width = profile.width;
    const height = profile.height;
    const floorLevel = floorByRoomId.get(room.id) || 0;

    const centerX = position.x * spacingX;
    const centerY = position.y * spacingY;
    const originX = centerX - Math.floor(width / 2);
    const originY = centerY - Math.floor(height / 2);
    const floorCells = getShapeFloorCells(profile.mask).map((cell) => ({
      x: originX + cell.x,
      y: originY + cell.y,
    }));
    const boundaryCells = getBoundaryCells(floorCells);
    const labelPoint = getBestLabelPoint(floorCells, centerX, centerY);

    return {
      roomId: room.id,
      name: room.name,
      type: room.type,
      shape: profile.shape,
      shapeLabel: getRoomShapeLabel(profile.shape),
      shapeHint: profile.shapeHint,
      floorLevel,
      elevationHint: getElevationHint({ room, shape: profile.shape, floorLevel, config }),
      zoneId: room.zoneId || "",
      zoneName: room.zoneName || "",
      zoneRole: room.zoneRole || "",
      inhabitantRole: room.inhabitantRole || "",
      x: originX,
      y: originY,
      width,
      height,
      centerX,
      centerY,
      labelX: labelPoint.x,
      labelY: labelPoint.y,
      floorCells,
      boundaryCells,
      featureTiles: [],
      entrancePoints: [],
      connectionPoints: [],
      connections: room.connections || [],
      hasTreasure: Boolean(room.treasure),
      hasHazard: Boolean(room.hazard),
    };
  });
}

function drawRoom(cellMap, rect) {
  rect.floorCells.forEach((cell) => {
    setCell(cellMap, cell.x, cell.y, {
      type: "room",
      roomId: rect.roomId,
      zoneId: rect.zoneId,
      floorLevel: rect.floorLevel,
    });
  });
}

function drawConnections(cellMap, rects, config, rng, connectionMetaByKey) {
  const rectById = new Map(rects.map((rect) => [rect.roomId, rect]));
  const drawn = new Set();
  const doors = [];

  rects.forEach((rect) => {
    (rect.connections || []).forEach((targetId) => {
      const pairKey = [rect.roomId, targetId].sort().join("-");
      if (drawn.has(pairKey)) {
        return;
      }

      const target = rectById.get(targetId);
      if (!target) {
        return;
      }

      const connectionMeta = connectionMetaByKey.get(getConnectionKey(rect.roomId, targetId)) || {};
      const connectionShape = selectConnectionShape({
        connectionMeta,
        config,
        fromRect: rect,
        toRect: target,
        rng,
      });
      const start = getDoorPoint(rect, target);
      const end = getDoorPoint(target, rect);
      const elevationType = getConnectionElevationType(rect, target);
      const connectorTile = getVerticalConnectorTile(rect, target);
      drawCorridor(cellMap, start, end, rng, {
        ...connectionMeta,
        connectionShape,
        elevationType,
        connectorTile,
        floorLevel: rect.floorLevel,
      });

      const startDoor = decorateDoorForConnection(generateDoor({
        index: doors.length + 1,
        x: start.x,
        y: start.y,
        room: rect,
        targetRoom: target,
        config,
        rng,
      }), { ...connectionMeta, connectionShape, elevationType }, rect, target);
      doors.push(startDoor);
      rect.connectionPoints.push(createConnectionPoint(start, target.roomId, connectionMeta, connectionShape));
      setCell(cellMap, start.x, start.y, {
        type: "door",
        roomId: rect.roomId,
        connection: targetId,
        doorId: startDoor.id,
        zoneId: rect.zoneId,
        route: connectionMeta.kind || "",
        connectionShape,
        floorLevel: rect.floorLevel,
        important: connectionMeta.important || false,
      });

      const endDoor = decorateDoorForConnection(generateDoor({
        index: doors.length + 1,
        x: end.x,
        y: end.y,
        room: target,
        targetRoom: rect,
        config,
        rng,
      }), { ...connectionMeta, connectionShape, elevationType }, target, rect);
      doors.push(endDoor);
      target.connectionPoints.push(createConnectionPoint(end, rect.roomId, connectionMeta, connectionShape));
      setCell(cellMap, end.x, end.y, {
        type: "door",
        roomId: target.roomId,
        connection: rect.roomId,
        doorId: endDoor.id,
        zoneId: target.zoneId,
        route: connectionMeta.kind || "",
        connectionShape,
        floorLevel: target.floorLevel,
        important: connectionMeta.important || false,
      });
      drawn.add(pairKey);
    });
  });

  return doors;
}

function drawCorridor(cellMap, start, end, rng, connectionMeta = {}) {
  const path = buildConnectionPath(start, end, connectionMeta.connectionShape || "L", rng);
  const middleIndex = Math.floor(path.length / 2);

  path.forEach((point, index) => {
    const extra = {};
    if (connectionMeta.connectionShape === "puente" && index > 0 && index < path.length - 1) {
      extra.type = "bridge";
    }
    if (connectionMeta.connectorTile && index === middleIndex) {
      extra.type = connectionMeta.connectorTile;
    }
    if (connectionMeta.elevationType && index === Math.max(1, middleIndex - 1)) {
      extra.type = connectionMeta.elevationType;
    }
    if (connectionMeta.connectionShape === "pasaje-bloqueado" && index === middleIndex) {
      extra.type = "blocked";
    }
    setCorridorCell(cellMap, point.x, point.y, connectionMeta, extra);
  });
}

function setCorridorCell(cellMap, x, y, connectionMeta = {}, extra = {}) {
  const existing = getCell(cellMap, x, y);
  if (!existing || existing.type === "wall") {
    setCell(cellMap, x, y, {
      type: extra.type || "corridor",
      route: connectionMeta.kind || "",
      connectionShape: connectionMeta.connectionShape || "",
      floorLevel: connectionMeta.floorLevel || 0,
      important: connectionMeta.important || false,
    });
  }
}

function getDoorPoint(rect, target) {
  const candidates = rect.boundaryCells?.length ? rect.boundaryCells : rect.floorCells;
  return candidates.reduce((best, point) => {
    const score = Math.abs(point.x - target.centerX) + Math.abs(point.y - target.centerY);
    return !best || score < best.score ? { ...point, score } : best;
  }, null) || { x: rect.centerX, y: rect.centerY };
}

function placeRoomFeatures(cellMap, rects, config, rng) {
  rects.forEach((rect) => {
    const features = generateRoomFeatureTiles(rect, config, rng);
    features.forEach((feature) => applyFeatureTile(cellMap, rect, feature));

    if (rect.zoneRole === "border" && rng() < 0.28) {
      const point = getInteriorPoint(rect, rng);
      applyFeatureTile(cellMap, rect, createMapFeature("trap", rect, point.x, point.y));
    }

    if (rect.zoneRole === "final" && rect.type !== "jefe" && rng() < 0.22) {
      const point = getInteriorPoint(rect, rng);
      applyFeatureTile(cellMap, rect, createMapFeature("secret", rect, point.x, point.y));
    }

    if (shouldPlaceWaterFeature(config, rect, rng)) {
      generateWaterPatch(rect, rng).forEach((feature) => applyFeatureTile(cellMap, rect, feature));
    }

    if (shouldPlaceWindow(config, rect, rng)) {
      placeWindow(cellMap, rect, rng);
    }
  });
}

function applyFeatureTile(cellMap, rect, feature) {
  if (!feature || !isPointInRoom(rect, feature.x, feature.y)) {
    return;
  }

  const existing = getCell(cellMap, feature.x, feature.y);
  if (existing && existing.type !== "room" && !canFeatureReplace(feature.type, existing.type)) {
    return;
  }

  rect.featureTiles.push({
    type: feature.type,
    x: feature.x,
    y: feature.y,
    floorLevel: feature.floorLevel ?? rect.floorLevel,
  });
  setCell(cellMap, feature.x, feature.y, {
    type: feature.type,
    roomId: rect.roomId,
    zoneId: rect.zoneId,
    floorLevel: feature.floorLevel ?? rect.floorLevel,
  });
}

function canFeatureReplace(nextType, currentType) {
  if (currentType === "door") {
    return false;
  }

  const highPriority = new Set(["entrance", "secondaryEntrance", "exit", "boss", "treasure", "secret"]);
  if (highPriority.has(currentType) && !highPriority.has(nextType)) {
    return false;
  }

  return true;
}

function placeAccessFeatures(cellMap, rects, config, rng) {
  const entrance = rects.find((rect) => rect.type === "entrada") || rects[0];
  const finalRoom = rects.find((rect) => rect.type === "jefe") || rects[rects.length - 1];
  const publicRooms = rects.filter((rect) => rect.type !== "secreto");

  if (entrance) {
    const point = getAvailableFeaturePoint(cellMap, entrance, { x: entrance.centerX - 20, y: entrance.centerY });
    entrance.entrancePoints.push({ ...point, kind: "primary" });
    applyFeatureTile(cellMap, entrance, createMapFeature("entrance", entrance, point.x, point.y));
  }

  if (shouldHaveSecondaryEntrance(config, rects, rng)) {
    const sideRoom = pickOne(rng, publicRooms.slice(1, Math.max(2, Math.floor(publicRooms.length * 0.65))), publicRooms[1] || entrance);
    if (sideRoom) {
      const point = getAvailableFeaturePoint(cellMap, sideRoom, { x: sideRoom.centerX + 20, y: sideRoom.centerY });
      sideRoom.entrancePoints.push({ ...point, kind: "secondary" });
      applyFeatureTile(cellMap, sideRoom, createMapFeature("secondaryEntrance", sideRoom, point.x, point.y));
    }
  }

  if (finalRoom) {
    const point = getAvailableFeaturePoint(cellMap, finalRoom, { x: finalRoom.centerX + 20, y: finalRoom.centerY + 20 });
    applyFeatureTile(cellMap, finalRoom, createMapFeature("exit", finalRoom, point.x, point.y));
  }
}

function shouldPlaceWater(config, rect, rng) {
  if (rect.zoneRole === "final" && (config.theme === "corrupto" || config.theme === "infernal")) return rng() < 0.18;
  if (config.dungeonType === "alcantarilla") return rng() < 0.75;
  if (config.dungeonType === "cueva" || config.dungeonType === "mina") return rng() < 0.28;
  if (config.theme === "helado" || config.theme === "natural" || config.theme === "subterraneo") return rng() < 0.22;
  return rng() < 0.08 && rect.type !== "jefe";
}

function shouldPlaceWindow(config, rect, rng) {
  if (rect.type === "pasillo" || rect.type === "secreto") return false;
  if (config.dungeonType === "torre" || config.dungeonType === "fortaleza") return rng() < 0.45;
  if (config.dungeonType === "templo" || config.dungeonType === "laboratorio") return rng() < 0.24;
  return rng() < 0.1;
}

function placeWaterPatch(cellMap, rect, rng) {
  const width = Math.max(1, Math.min(rect.width - 1, randomInt(rng, 1, 3)));
  const height = Math.max(1, Math.min(rect.height - 1, randomInt(rng, 1, 2)));
  const origin = getInteriorPoint(rect, rng);

  for (let y = origin.y; y < origin.y + height; y += 1) {
    for (let x = origin.x; x < origin.x + width; x += 1) {
      if (x < rect.x + rect.width && y < rect.y + rect.height) {
        setCell(cellMap, x, y, { type: "water", roomId: rect.roomId, zoneId: rect.zoneId });
      }
    }
  }
}

function placeWindow(cellMap, rect, rng) {
  const point = pickOne(rng, rect.boundaryCells, getInteriorPoint(rect, rng));

  setCell(cellMap, point.x, point.y, { type: "window", roomId: rect.roomId, zoneId: rect.zoneId });
}

function setFeature(cellMap, rect, type, rng, preferCenter = false) {
  const point = preferCenter
    ? { x: rect.centerX, y: rect.centerY }
    : getInteriorPoint(rect, rng);
  setCell(cellMap, point.x, point.y, { type, roomId: rect.roomId, zoneId: rect.zoneId });
}

function getInteriorPoint(rect, rng) {
  const interior = (rect.floorCells || []).filter((cell) => (
    cell.x > rect.x
    && cell.y > rect.y
    && cell.x < rect.x + rect.width - 1
    && cell.y < rect.y + rect.height - 1
  ));
  const pool = interior.length ? interior : rect.floorCells || [];

  return pickOne(rng, pool, { x: rect.centerX, y: rect.centerY });
}

function normalizeMap(cellMap, roomRects, doors, metadata) {
  const activeCells = [...cellMap.values()];
  const minX = Math.min(...activeCells.map((cell) => cell.x)) - 2;
  const minY = Math.min(...activeCells.map((cell) => cell.y)) - 2;
  const maxX = Math.max(...activeCells.map((cell) => cell.x)) + 2;
  const maxY = Math.max(...activeCells.map((cell) => cell.y)) + 2;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const normalizedLookup = new Map();
  const cells = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const source = getCell(cellMap, x, y) || { type: "wall" };
      const cell = normalizeCell({
        ...source,
        x: x - minX,
        y: y - minY,
      });
      cells.push(cell);
      normalizedLookup.set(`${cell.x},${cell.y}`, cell);
    }
  }

  const rooms = roomRects.map((rect) => ({
    roomId: rect.roomId,
    name: rect.name,
    type: rect.type,
    shape: rect.shape,
    shapeLabel: rect.shapeLabel,
    shapeHint: rect.shapeHint,
    floorLevel: rect.floorLevel,
    elevationHint: rect.elevationHint,
    zoneId: rect.zoneId,
    zoneName: rect.zoneName,
    zoneRole: rect.zoneRole,
    inhabitantRole: rect.inhabitantRole,
    x: rect.x - minX,
    y: rect.y - minY,
    width: rect.width,
    height: rect.height,
    centerX: rect.centerX - minX,
    centerY: rect.centerY - minY,
    labelX: rect.labelX - minX,
    labelY: rect.labelY - minY,
    entrancePoints: normalizePoints(rect.entrancePoints, minX, minY),
    connectionPoints: normalizePoints(rect.connectionPoints, minX, minY),
    featureTiles: normalizeFeatureTiles(rect.featureTiles, minX, minY),
  }));
  const normalizedDoors = (doors || []).map((door) => ({
    ...door,
    x: door.x - minX,
    y: door.y - minY,
  }));

  rooms.forEach((room) => {
    const centerCell = normalizedLookup.get(`${room.labelX},${room.labelY}`) || normalizedLookup.get(`${room.centerX},${room.centerY}`);
    if (centerCell && centerCell.type === "room") {
      centerCell.label = room.roomId.replace(/^R/, "");
    }
  });

  return {
    version: 1,
    ...metadata,
    width,
    height,
    widthFeet: width * metadata.tileSizeFeet,
    heightFeet: height * metadata.tileSizeFeet,
    cells,
    rooms,
    doors: normalizedDoors,
    features: rooms.flatMap((room) => room.featureTiles || []),
  };
}

function normalizeCell(cell) {
  const type = tileTypeLookup[cell.type] ? cell.type : "wall";
  return {
    x: cell.x,
    y: cell.y,
    type,
    roomId: cell.roomId || "",
    zoneId: cell.zoneId || "",
    label: cell.label || "",
    connection: cell.connection || "",
    doorId: cell.doorId || "",
    route: cell.route || "",
    connectionShape: cell.connectionShape || "",
    floorLevel: Number.isFinite(cell.floorLevel) ? cell.floorLevel : 0,
    important: Boolean(cell.important),
  };
}

function getConnectionMetaByKey(connections) {
  return new Map((connections || []).map((connection) => [
    connection.key || getConnectionKey(connection.from, connection.to),
    connection,
  ]));
}

function decorateDoorForConnection(door, connectionMeta, room, targetRoom) {
  if (!connectionMeta?.kind && !connectionMeta?.important) {
    return door;
  }

  const routeLabel = getRouteLabel(connectionMeta.kind);
  const zoneText = connectionMeta.zoneTransition
    ? ` Cruza de ${room.zoneName || room.roomId} a ${targetRoom.zoneName || targetRoom.roomId}.`
    : "";
  const importanceText = connectionMeta.important
    ? ` Acceso importante: ${connectionMeta.purpose || routeLabel}.`
    : "";
  const notes = `${door.notes || ""}${zoneText}${importanceText}`.replace(/\s+/g, " ").trim();

  return {
    ...door,
    connectionKind: connectionMeta.kind || "",
    connectionKindLabel: routeLabel,
    connectionShape: connectionMeta.connectionShape || "",
    connectionShapeLabel: getConnectionShapeLabel(connectionMeta.connectionShape),
    connectionPurpose: connectionMeta.purpose || "",
    elevationType: connectionMeta.elevationType || "",
    important: Boolean(connectionMeta.important),
    zoneTransition: Boolean(connectionMeta.zoneTransition),
    fromZoneId: connectionMeta.fromZoneId || "",
    toZoneId: connectionMeta.toZoneId || "",
    notes,
    summary: `${door.summary || ""}${importanceText}`.replace(/\s+/g, " ").trim(),
  };
}

function getRouteLabel(kind) {
  const labels = {
    main: "Ruta principal",
    branch: "Rama",
    loop: "Ruta alternativa",
    shortcut: "Atajo",
    secret: "Secreto",
    "secret-shortcut": "Atajo secreto",
    "zone-gate": "Puerta entre zonas",
  };
  return labels[kind] || "Conexión";
}

function getConnectionKey(first, second) {
  return [first, second].filter(Boolean).sort(compareRoomIds).join("-");
}

function setCell(cellMap, x, y, patch) {
  const existing = getCell(cellMap, x, y) || { x, y, type: "wall" };
  cellMap.set(`${x},${y}`, normalizeCell({ ...existing, ...patch, x, y }));
}

function getBoundaryCells(floorCells) {
  const lookup = new Set(floorCells.map((cell) => `${cell.x},${cell.y}`));
  return floorCells.filter((cell) => (
    !lookup.has(`${cell.x + 1},${cell.y}`)
    || !lookup.has(`${cell.x - 1},${cell.y}`)
    || !lookup.has(`${cell.x},${cell.y + 1}`)
    || !lookup.has(`${cell.x},${cell.y - 1}`)
  ));
}

function getBestLabelPoint(floorCells, centerX, centerY) {
  return floorCells.reduce((best, point) => {
    const score = Math.abs(point.x - centerX) + Math.abs(point.y - centerY);
    return !best || score < best.score ? { ...point, score } : best;
  }, null) || { x: centerX, y: centerY };
}

function getBestBoundaryPoint(rect, target) {
  const candidates = rect.boundaryCells?.length ? rect.boundaryCells : rect.floorCells;
  return candidates.reduce((best, point) => {
    const score = Math.abs(point.x - target.x) + Math.abs(point.y - target.y);
    return !best || score < best.score ? { ...point, score } : best;
  }, null) || getBestLabelPoint(rect.floorCells, rect.centerX, rect.centerY);
}

function getAvailableFeaturePoint(cellMap, rect, target) {
  const candidates = [
    ...(rect.boundaryCells || []),
    ...(rect.floorCells || []),
  ];
  const ranked = candidates
    .map((point) => ({
      ...point,
      score: Math.abs(point.x - target.x) + Math.abs(point.y - target.y),
      existing: getCell(cellMap, point.x, point.y),
    }))
    .filter((point) => !point.existing || point.existing.type === "room")
    .sort((first, second) => first.score - second.score);

  return ranked[0] || getBestBoundaryPoint(rect, target);
}

function createConnectionPoint(point, targetRoomId, connectionMeta, connectionShape) {
  return {
    x: point.x,
    y: point.y,
    targetRoomId,
    route: connectionMeta.kind || "",
    connectionShape,
    important: Boolean(connectionMeta.important),
  };
}

function isPointInRoom(rect, x, y) {
  return (rect.floorCells || []).some((cell) => cell.x === x && cell.y === y);
}

function shouldHaveSecondaryEntrance(config, rects, rng) {
  if (rects.length < 7) {
    return false;
  }

  if (config.size === "grande" || config.size === "megamazmorra") {
    return rng() < 0.72;
  }

  return rng() < 0.38;
}

function normalizePoints(points, minX, minY) {
  return (points || []).map((point) => ({
    ...point,
    x: point.x - minX,
    y: point.y - minY,
  }));
}

function normalizeFeatureTiles(features, minX, minY) {
  return (features || []).map((feature) => ({
    ...feature,
    x: feature.x - minX,
    y: feature.y - minY,
  }));
}

function getCell(cellMap, x, y) {
  return cellMap.get(`${x},${y}`);
}

function shuffle(items, rng) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function compareRoomIds(first, second) {
  const firstNumber = Number(String(first).replace(/\D/g, ""));
  const secondNumber = Number(String(second).replace(/\D/g, ""));

  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber) && firstNumber !== secondNumber) {
    return firstNumber - secondNumber;
  }

  return String(first).localeCompare(String(second));
}
