import { dungeonTypeTables, visualThemeTables } from "./dungeonTables.js";
import { pickOne } from "./dungeonTypes.js";

const sizeZoneCount = {
  pequena: 2,
  mediana: 3,
  grande: 4,
  megamazmorra: 5,
};

const roleOrder = ["approach", "original", "border", "inner", "final"];

export function generateDungeonZones({ rooms, config, narrative, inhabitantMix, finalRoomId, rng }) {
  const zoneCount = Math.min(sizeZoneCount[config.size] || 3, Math.max(2, rooms.length));
  const roles = buildZoneRoles(zoneCount, rooms);
  const distances = getRoomDistances(rooms, rooms[0]?.id || "R01");
  const maxDistance = Math.max(1, ...[...distances.values()]);
  const zones = roles.map((role, index) => createZone({
    role,
    index,
    config,
    narrative,
    inhabitantMix,
    rng,
  }));
  const assignments = {};

  rooms.forEach((room) => {
    const zone = selectZoneForRoom({ room, zones, distances, maxDistance, finalRoomId });
    assignments[room.id] = zone.id;
  });

  const populatedZones = zones.map((zone) => ({
    ...zone,
    roomIds: rooms.filter((room) => assignments[room.id] === zone.id).map((room) => room.id),
  }));

  return rebalanceEmptyZones(populatedZones, assignments, rooms);
}

export function getZoneForRoom(zones = [], roomId) {
  return zones.find((zone) => zone.roomIds?.includes(roomId)) || null;
}

export function describeZoneTransition(firstZone, secondZone, narrative) {
  if (!firstZone || !secondZone || firstZone.id === secondZone.id) {
    return "";
  }

  const hook = narrative?.doorHooks?.[0] || "el acceso marca un cambio claro de territorio";
  return `Puerta entre zonas: ${firstZone.name} -> ${secondZone.name}; ${hook}.`;
}

function buildZoneRoles(zoneCount, rooms) {
  const roles = zoneCount === 3
    ? ["approach", "border", "final"]
    : roleOrder.slice(0, zoneCount);
  roles[roles.length - 1] = "final";

  if (rooms.some((room) => room.type === "secreto") && !roles.includes("secret")) {
    roles.splice(Math.max(1, roles.length - 1), 0, "secret");
  }

  return roles.slice(0, Math.min(rooms.length, Math.max(2, roles.length)));
}

function createZone({ role, index, config, narrative, inhabitantMix, rng }) {
  const type = dungeonTypeTables[config.dungeonType] || dungeonTypeTables.cripta;
  const theme = visualThemeTables[config.theme] || visualThemeTables.oscuro;
  const owner = getZoneOwner(role, inhabitantMix);
  const name = buildZoneName(role, type, theme, narrative, rng);
  const identity = buildZoneIdentity(role, type, theme, narrative, owner);

  return {
    id: `Z${String(index + 1).padStart(2, "0")}`,
    name,
    role,
    order: index + 1,
    identity,
    owner,
    inhabitants: owner === "mixed"
      ? [inhabitantMix?.primary?.id, inhabitantMix?.secondary?.id].filter(Boolean)
      : [owner].filter(Boolean),
    theme: config.theme,
    causeId: narrative?.cause?.id || "",
    clues: buildZoneClues(role, narrative, owner),
    trapBias: getTrapBias(role, narrative),
    treasureBias: getTreasureBias(role),
    doorTone: getDoorTone(role, narrative),
    roomIds: [],
  };
}

function selectZoneForRoom({ room, zones, distances, maxDistance, finalRoomId }) {
  if (room.id === finalRoomId || room.type === "jefe") {
    return zones.find((zone) => zone.role === "final") || zones[zones.length - 1];
  }

  if (room.type === "secreto") {
    return zones.find((zone) => zone.role === "secret") || zones.find((zone) => zone.role === "inner") || zones[zones.length - 1];
  }

  if (room.type === "entrada") {
    return zones[0];
  }

  const distance = distances.get(room.id) ?? 0;
  const progress = distance / maxDistance;

  if (progress < 0.25) {
    return zones.find((zone) => zone.role === "approach") || zones[0];
  }

  if (progress < 0.52) {
    return zones.find((zone) => zone.role === "original") || zones[1] || zones[0];
  }

  if (progress < 0.75) {
    return zones.find((zone) => zone.role === "border") || zones[Math.min(2, zones.length - 1)];
  }

  return zones.find((zone) => zone.role === "inner") || zones.find((zone) => zone.role === "final") || zones[zones.length - 1];
}

function rebalanceEmptyZones(zones, assignments, rooms) {
  const emptyZones = zones.filter((zone) => !zone.roomIds.length);

  emptyZones.forEach((zone) => {
    const donor = [...zones]
      .filter((candidate) => candidate.roomIds.length > 1 && candidate.role !== "final")
      .sort((first, second) => second.roomIds.length - first.roomIds.length)[0];

    if (!donor) {
      return;
    }

    const movableId = donor.roomIds[donor.roomIds.length - 1];
    assignments[movableId] = zone.id;
    donor.roomIds = donor.roomIds.filter((roomId) => roomId !== movableId);
    zone.roomIds = [movableId];
  });

  return {
    zones: zones.map((zone) => ({
      ...zone,
      roomIds: rooms.filter((room) => assignments[room.id] === zone.id).map((room) => room.id),
    })),
    assignments,
  };
}

function getRoomDistances(rooms, startId) {
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const distances = new Map([[startId, 0]]);
  const queue = [startId];

  while (queue.length) {
    const currentId = queue.shift();
    const distance = distances.get(currentId) || 0;

    (roomById.get(currentId)?.connections || []).forEach((nextId) => {
      if (!roomById.has(nextId) || distances.has(nextId)) {
        return;
      }

      distances.set(nextId, distance + 1);
      queue.push(nextId);
    });
  }

  return distances;
}

function getZoneOwner(role, inhabitantMix) {
  const primary = inhabitantMix?.primary?.id || "";
  const secondary = inhabitantMix?.secondary?.id || "";

  if (!secondary) return primary;
  if (role === "final" || role === "inner") return secondary;
  if (role === "border" || role === "secret") return "mixed";
  return primary;
}

function buildZoneName(role, type, theme, narrative, rng) {
  const namesByRole = {
    approach: ["Umbral", "Acceso", "Boca", "Primer Anillo"],
    original: ["Territorio Viejo", "Zona Antigua", "Galerias Originales", "Camara Madre"],
    border: ["Frontera Rota", "Paso Disputado", "Zona de Contacto", "Borde Inestable"],
    inner: ["Nucleo Alterado", "Camino Interno", "Anillo Profundo", "Zona Sellada"],
    final: ["Corazon", "Foco Final", "Centro", "Camara Raiz"],
    secret: ["Ruta Oculta", "Atajo Sellado", "Camara Lateral", "Paso Viejo"],
  };
  const base = pickOne(rng, namesByRole[role] || namesByRole.original);
  const anchor = pickOne(rng, type.anchors, "piedra vieja");
  const detail = pickOne(rng, theme.details, narrative?.cause?.label || "marca interna");
  return `${base} de ${anchor || detail}`.replace(/\s+/g, " ").trim();
}

function buildZoneIdentity(role, type, theme, narrative, owner) {
  const causeText = narrative?.cause?.label?.toLowerCase() || "la causa interna";
  const roleText = {
    approach: "entrada legible y rastros de ocupacion exterior",
    original: `uso original de ${type.label.toLowerCase()} todavia reconocible`,
    border: "frontera donde las facciones y la causa interna se mezclan",
    inner: `zona transformada por ${causeText}`,
    final: `foco de ${causeText} y decision final de la mazmorra`,
    secret: "ruta opcional con informacion, atajo o recompensa",
  }[role] || "zona reconocible";
  const ownerText = owner === "mixed" ? "dos presencias en tension" : owner ? `presencia de ${owner}` : "presencia incierta";
  return `${roleText}; ${ownerText}; ${theme.moods?.[0] || "tono definido"}`;
}

function buildZoneClues(role, narrative, owner) {
  const clues = [
    ...(narrative?.globalClues || []),
  ];

  if (role === "border") {
    clues.unshift("los rastros cambian de direccion como si dos grupos evitaran cruzarse");
  }

  if (role === "final") {
    clues.unshift(narrative?.finalHooks?.[0] || "la causa interna se vuelve visible aqui");
  }

  if (role === "secret") {
    clues.unshift("el polvo, el aire o una reparacion delatan una ruta que no aparece a simple vista");
  }

  if (owner === "mixed") {
    clues.unshift("marcas de dos facciones se superponen sin borrar del todo las anteriores");
  }

  return [...new Set(clues)].slice(0, 4);
}

function getTrapBias(role, narrative) {
  if (role === "border") return "frontera";
  if (role === "final") return narrative?.cause?.id || "final";
  if (role === "secret") return "oculta";
  return "local";
}

function getTreasureBias(role) {
  if (role === "final") return "foco";
  if (role === "secret") return "opcional";
  if (role === "border") return "abandonado";
  return "local";
}

function getDoorTone(role, narrative) {
  if (role === "final") return narrative?.doorHooks?.[0] || "puerta de umbral importante";
  if (role === "border") return "puerta usada como frontera o contencion";
  if (role === "secret") return "acceso oculto, atajo o ruta de servicio olvidada";
  return "acceso funcional de la zona";
}
