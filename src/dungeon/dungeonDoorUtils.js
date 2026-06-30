import { formatDoorSummary } from "./doorGenerator.js";

export function getUniqueDoorConnections(map) {
  if (!map) {
    return [];
  }

  const doors = Array.isArray(map.doors) ? map.doors : [];
  const doorCells = Array.isArray(map.cells)
    ? map.cells.filter((cell) => cell.type === "door")
    : [];
  const cellsByDoorId = groupDoorCellsById(doorCells);
  const entries = new Map();

  doors.forEach((door) => {
    const key = getConnectionKeyFromDoor(door);
    const entry = ensureDoorEntry(entries, key, door.roomId, door.connectsTo);
    entry.doors.push(door);
    entry.doorIds.push(door.id);
    entry.positions.push({ x: door.x, y: door.y });

    (cellsByDoorId.get(door.id) || []).forEach((cell) => {
      entry.cells.push(cell);
      entry.positions.push({ x: cell.x, y: cell.y });
    });
  });

  doorCells
    .filter((cell) => !cell.doorId || !doors.some((door) => door.id === cell.doorId))
    .forEach((cell) => {
      const from = cell.roomId || "";
      const to = cell.connection || "";
      const key = from || to ? getConnectionKey(from, to) : `cell:${cell.x},${cell.y}`;
      const entry = ensureDoorEntry(entries, key, from, to);
      entry.cells.push(cell);
      entry.positions.push({ x: cell.x, y: cell.y });
    });

  return [...entries.values()]
    .map(finalizeDoorEntry)
    .sort(compareDoorRows);
}

function groupDoorCellsById(cells) {
  const grouped = new Map();

  cells.forEach((cell) => {
    if (!cell.doorId) {
      return;
    }

    if (!grouped.has(cell.doorId)) {
      grouped.set(cell.doorId, []);
    }

    grouped.get(cell.doorId).push(cell);
  });

  return grouped;
}

function ensureDoorEntry(entries, key, from, to) {
  if (!entries.has(key)) {
    entries.set(key, {
      key,
      fromRoomId: from || "",
      toRoomId: to || "",
      doors: [],
      doorIds: [],
      cells: [],
      positions: [],
    });
  }

  const entry = entries.get(key);
  if (!entry.fromRoomId && from) entry.fromRoomId = from;
  if (!entry.toRoomId && to) entry.toRoomId = to;
  return entry;
}

function finalizeDoorEntry(entry) {
  const doors = entry.doors || [];
  const firstDoor = doors[0] || {};
  const roomIds = unique([
    entry.fromRoomId,
    entry.toRoomId,
    ...doors.flatMap((door) => [door.roomId, door.connectsTo]),
  ].filter(Boolean)).sort(compareRoomIds);
  const summaries = unique(doors.map((door) => door.summary || formatDoorSummary(door)).filter(Boolean));
  const ids = unique(entry.doorIds.filter(Boolean));
  const positions = uniquePositions(entry.positions);
  const kindLabels = unique(doors.map((door) => door.kindLabel).filter(Boolean));
  const stateLabels = unique(doors.map((door) => door.stateLabel).filter(Boolean));
  const materialLabels = unique(doors.map((door) => door.materialLabel).filter(Boolean));
  const connectionKindLabels = unique(doors.map((door) => door.connectionKindLabel).filter(Boolean));
  const connectionShapeLabels = unique(doors.map((door) => door.connectionShapeLabel).filter(Boolean));
  const important = doors.some((door) => door.important) || entry.cells.some((cell) => cell.important);
  const zoneTransition = doors.some((door) => door.zoneTransition);

  return {
    key: entry.key,
    id: ids[0] || entry.key,
    displayId: ids.length > 1 ? ids.join(" / ") : ids[0] || "Puerta manual",
    doorIds: ids,
    doorIdsText: ids.join(", "),
    fromRoomId: roomIds[0] || entry.fromRoomId || "",
    toRoomId: roomIds[1] || entry.toRoomId || "",
    roomIds,
    connectionLabel: roomIds.length >= 2
      ? `${roomIds[0]} <-> ${roomIds[1]}`
      : roomIds[0] || "Acceso sin sala asignada",
    kind: firstDoor.kind || "manual",
    kindLabel: kindLabels.join(" / ") || "Puerta manual",
    connectionKind: firstDoor.connectionKind || entry.cells.find((cell) => cell.route)?.route || "",
    connectionKindLabel: connectionKindLabels.join(" / "),
    connectionShape: firstDoor.connectionShape || entry.cells.find((cell) => cell.connectionShape)?.connectionShape || "",
    connectionShapeLabel: connectionShapeLabels.join(" / "),
    important,
    zoneTransition,
    materialLabel: materialLabels.join(" / "),
    stateLabel: stateLabels.join(" / "),
    cellCount: uniquePositionCount(positions),
    doorCount: doors.length,
    positions,
    positionsText: positions.map((position) => `${position.x},${position.y}`).join(" | "),
    summary: summaries.join(" / ") || "Puerta dibujada manualmente en el mapa.",
    doors,
    cells: entry.cells,
  };
}

function getConnectionKeyFromDoor(door) {
  return door.connectionKey || getConnectionKey(door.roomId || "", door.connectsTo || "");
}

function getConnectionKey(first, second) {
  const values = [first, second].filter(Boolean).sort(compareRoomIds);
  return values.length ? values.join("-") : "unknown";
}

function unique(values) {
  return [...new Set(values)];
}

function uniquePositions(positions) {
  const seen = new Set();
  return positions
    .filter((position) => Number.isFinite(position.x) && Number.isFinite(position.y))
    .filter((position) => {
      const key = `${position.x},${position.y}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function uniquePositionCount(positions) {
  return new Set(positions.map((position) => `${position.x},${position.y}`)).size;
}

function compareDoorRows(first, second) {
  return compareRoomIds(first.fromRoomId, second.fromRoomId)
    || compareRoomIds(first.toRoomId, second.toRoomId)
    || String(first.displayId).localeCompare(String(second.displayId));
}

function compareRoomIds(first, second) {
  const firstNumber = Number(String(first).replace(/\D/g, ""));
  const secondNumber = Number(String(second).replace(/\D/g, ""));

  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber) && firstNumber !== secondNumber) {
    return firstNumber - secondNumber;
  }

  return String(first).localeCompare(String(second));
}
