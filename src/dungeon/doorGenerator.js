import {
  doorMaterialTable,
  doorSizeTable,
  doorStateTable,
  lockQualityTable,
  portcullisLiftTable,
  secretDoorTable,
} from "./dungeonTables.js";
import { chance, pickOne, weightedPick } from "./dungeonTypes.js";

const fortifiedTypes = new Set(["fortaleza", "torre", "ruina", "alcantarilla"]);
const stoneTypes = new Set(["cripta", "templo", "ruina", "cueva"]);
const metalTypes = new Set(["fortaleza", "laboratorio", "mina"]);

export function generateDoor({ index, x, y, room, targetRoom, config, rng }) {
  const id = `D${String(index).padStart(2, "0")}`;
  const kind = selectDoorKind(room, targetRoom, config, rng);

  if (kind === "arco") {
    return withDoorSummary(createArchway({ id, x, y, room, targetRoom }));
  }

  if (kind === "rastrillo") {
    return withDoorSummary(createPortcullis({ id, x, y, room, targetRoom, config, rng }));
  }

  return withDoorSummary(createDoor({ id, x, y, room, targetRoom, config, rng, kind }));
}

export function formatDoorSummary(door) {
  if (!door) {
    return "";
  }

  if (door.kind === "arco") {
    return "Paso abierto; no requiere romper, forzar ni abrir cerradura.";
  }

  const pieces = [
    door.kindLabel,
    door.materialLabel,
    door.sizeLabel,
    door.stateLabel,
  ].filter(Boolean);
  const stats = [];

  if (Number.isFinite(door.ac)) stats.push(`CA ${door.ac}`);
  if (Number.isFinite(door.hp)) stats.push(`PG ${door.hp}`);
  if (Number.isFinite(door.forceOpenDc)) stats.push(`forzar CD ${door.forceOpenDc}`);

  if (door.lock) {
    stats.push(`cerradura ${door.lock.label.toLowerCase()} CD ${door.lock.dc}`);
  }

  if (door.secret) {
    stats.push(`detectar CD ${door.secret.detectionDc}`);
  }

  if (door.portcullis) {
    stats.push(`levantar CD ${door.portcullis.liftDc}`);
  }

  return `${pieces.join(" ")}${stats.length ? ` (${stats.join(", ")})` : ""}. ${door.notes}`;
}

function createArchway({ id, x, y, room, targetRoom }) {
  return {
    id,
    x,
    y,
    roomId: room.roomId,
    connectsTo: targetRoom.roomId,
    connectionKey: getConnectionKey(room.roomId, targetRoom.roomId),
    kind: "arco",
    kindLabel: "Arco de paso",
    material: "",
    materialLabel: "",
    size: "",
    sizeLabel: "",
    state: "abierto",
    stateLabel: "Abierto",
    ac: null,
    hp: null,
    forceOpenDc: null,
    lock: null,
    secret: null,
    portcullis: null,
    notes: "Marca un acceso claro; puede servir como línea de visión, ruido o emboscada.",
  };
}

function withDoorSummary(door) {
  return {
    ...door,
    summary: formatDoorSummary(door),
  };
}

function createPortcullis({ id, x, y, room, targetRoom, config, rng }) {
  const material = chance(rng, config.dungeonType === "fortaleza" ? 0.75 : 0.55) ? "hierro" : "madera";
  const statsMaterial = material === "hierro" ? doorMaterialTable.metal : doorMaterialTable.madera;
  const sizeKey = pickOne(rng, getPortcullisSizes(room, targetRoom), "mediano");
  const liftDc = portcullisLiftTable[material]?.[sizeKey] || 20;
  const state = chance(rng, 0.22) ? "trabado" : "bajado";

  return {
    id,
    x,
    y,
    roomId: room.roomId,
    connectsTo: targetRoom.roomId,
    connectionKey: getConnectionKey(room.roomId, targetRoom.roomId),
    kind: "rastrillo",
    kindLabel: "Rastrillo",
    material,
    materialLabel: material === "hierro" ? "Hierro" : "Madera",
    size: sizeKey,
    sizeLabel: titleCase(sizeKey),
    state,
    stateLabel: state === "trabado" ? "Trabado" : "Bajado",
    ac: statsMaterial.ac,
    hp: statsMaterial.hp,
    forceOpenDc: statsMaterial.forceOpenDc,
    lock: null,
    secret: null,
    portcullis: {
      material,
      size: sizeKey,
      liftDc,
    },
    notes: "Permite ver y atacar a traves del acceso; levantarlo puede requerir fuerza o mecanismo cercano.",
  };
}

function createDoor({ id, x, y, room, targetRoom, config, rng, kind }) {
  const material = selectDoorMaterial(room, targetRoom, config, rng);
  const materialStats = doorMaterialTable[material] || doorMaterialTable.madera;
  const size = selectDoorSize(room, targetRoom, config, rng);
  const state = kind === "secreta"
    ? { id: "oculta", label: "Oculta", note: "No debe ser la única ruta hacia el progreso principal." }
    : weightedPick(rng, doorStateTable, doorStateTable[1]);
  const lock = state?.usesLock ? generateLock(config, rng) : null;
  const secret = kind === "secreta" ? weightedPick(rng, secretDoorTable, secretDoorTable[1]) : null;
  const hp = materialStats.hp * size.hpMultiplier;
  const forceOpenDc = materialStats.forceOpenDc + size.dcBonus;

  return {
    id,
    x,
    y,
    roomId: room.roomId,
    connectsTo: targetRoom.roomId,
    connectionKey: getConnectionKey(room.roomId, targetRoom.roomId),
    kind,
    kindLabel: kind === "secreta" ? "Puerta secreta" : "Puerta",
    material,
    materialLabel: materialStats.label,
    size: size.id,
    sizeLabel: size.label,
    state: state.id,
    stateLabel: state.label,
    ac: materialStats.ac,
    hp,
    forceOpenDc,
    lock,
    secret,
    portcullis: null,
    notes: buildDoorNotes(kind, state, lock),
  };
}

function selectDoorKind(room, targetRoom, config, rng) {
  if (room.type === "secreto" || targetRoom.type === "secreto") {
    return "secreta";
  }

  const isFortified = fortifiedTypes.has(config.dungeonType);
  const isGateRoom = room.type === "entrada" || targetRoom.type === "entrada" || room.type === "jefe" || targetRoom.type === "jefe";

  if (isFortified && chance(rng, isGateRoom ? 0.24 : 0.1)) {
    return "rastrillo";
  }

  if (chance(rng, config.dungeonType === "cueva" ? 0.2 : 0.08)) {
    return "arco";
  }

  return "puerta";
}

function selectDoorMaterial(room, targetRoom, config, rng) {
  const weights = [
    { id: "madera", weight: 5 },
    { id: "piedra", weight: stoneTypes.has(config.dungeonType) ? 4 : 1 },
    { id: "metal", weight: metalTypes.has(config.dungeonType) ? 4 : 1 },
    { id: "cristal", weight: config.dungeonType === "laboratorio" || config.theme === "feerico" ? 2 : 0.4 },
  ];

  if (room.type === "jefe" || targetRoom.type === "jefe") {
    weights.find((item) => item.id === "metal").weight += 2;
    weights.find((item) => item.id === "piedra").weight += 2;
  }

  if (room.type === "secreto" || targetRoom.type === "secreto") {
    weights.find((item) => item.id === "piedra").weight += 4;
  }

  return weightedPick(rng, weights, weights[0]).id;
}

function selectDoorSize(room, targetRoom, config, rng) {
  const weights = doorSizeTable.map((size) => ({ ...size }));

  if (room.type === "jefe" || targetRoom.type === "jefe" || config.dungeonType === "templo") {
    weights.find((item) => item.id === "grande").weight += 2;
    weights.find((item) => item.id === "monumental").weight += 1;
  }

  return weightedPick(rng, weights, weights[0]);
}

function generateLock(config, rng) {
  const weights = lockQualityTable.map((quality) => ({ ...quality }));

  if (config.difficulty === "facil") {
    weights.find((item) => item.id === "inferior").weight += 2;
  }

  if (config.difficulty === "dificil" || config.difficulty === "mortal") {
    weights.find((item) => item.id === "superior").weight += 2;
  }

  const quality = weightedPick(rng, weights, weights[1]);
  const actionTime = quality.dc >= 20 || config.difficulty === "mortal" ? "1 minuto" : "1 acción";

  return {
    id: quality.id,
    label: quality.label,
    dc: quality.dc,
    tool: "Herramientas de ladrón",
    actionTime,
  };
}

function getPortcullisSizes(room, targetRoom) {
  if (room.type === "jefe" || targetRoom.type === "jefe") {
    return ["grande", "enorme"];
  }

  if (room.type === "entrada" || targetRoom.type === "entrada") {
    return ["mediano", "grande"];
  }

  return ["mediano", "mediano", "grande"];
}

function buildDoorNotes(kind, state, lock) {
  if (kind === "secreta") {
    return "Trata este acceso como recompensa, atajo o información opciónal.";
  }

  if (state?.id === "barrada") {
    return "No tiene cerradura Útil desde el lado bloqueado; la barra puede levantarse desde el lado correcto.";
  }

  if (state?.id === "atascada") {
    return "Puede abrirse con fuerza, herramientas o tiempo, pero hace ruido si se fuerza.";
  }

  if (lock) {
    return `Abrir con ${lock.tool.toLowerCase()}: ${lock.actionTime}.`;
  }

  return state?.note || "Ajusta posicion, ruido y tiempo según la mesa.";
}

function getConnectionKey(first, second) {
  return [first, second].sort().join("-");
}

function titleCase(value) {
  return String(value)
    .split("-")
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(" ");
}
