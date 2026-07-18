import { inhabitantTables } from "./dungeonTables.js";
import {
  INHABITANT_OPTIONS,
  weightedPick,
} from "./dungeonTypes.js";

const noSecondaryIds = new Set(["", "ninguno"]);

const fallbackSecondaryWeights = [
  { id: "cultistas", weight: 2 },
  { id: "bestias", weight: 2 },
  { id: "constructos", weight: 1 },
  { id: "no-muertos", weight: 1 },
];

const secondaryWeightsByPrimary = {
  goblins: [
    { id: "bestias", weight: 4 },
    { id: "orcos", weight: 3 },
    { id: "kobolds", weight: 2 },
    { id: "cultistas", weight: 1 },
  ],
  orcos: [
    { id: "goblins", weight: 3 },
    { id: "bestias", weight: 3 },
    { id: "cultistas", weight: 2 },
    { id: "demonios", weight: 1 },
  ],
  kobolds: [
    { id: "dragones-menores", weight: 5 },
    { id: "bestias", weight: 3 },
    { id: "constructos", weight: 1 },
  ],
  "no-muertos": [
    { id: "cultistas", weight: 4 },
    { id: "demonios", weight: 2 },
    { id: "constructos", weight: 1 },
  ],
  bestias: [
    { id: "demonios", weight: 3 },
    { id: "elementales", weight: 2 },
    { id: "aberraciones", weight: 2 },
    { id: "goblins", weight: 1 },
  ],
  cultistas: [
    { id: "demonios", weight: 5 },
    { id: "no-muertos", weight: 3 },
    { id: "aberraciones", weight: 2 },
    { id: "constructos", weight: 1 },
  ],
  constructos: [
    { id: "cultistas", weight: 2 },
    { id: "elementales", weight: 2 },
    { id: "kobolds", weight: 1 },
  ],
  aberraciones: [
    { id: "cultistas", weight: 3 },
    { id: "bestias", weight: 2 },
    { id: "demonios", weight: 1 },
  ],
  elementales: [
    { id: "cultistas", weight: 2 },
    { id: "constructos", weight: 2 },
    { id: "bestias", weight: 1 },
  ],
  demonios: [
    { id: "cultistas", weight: 4 },
    { id: "bestias", weight: 2 },
    { id: "no-muertos", weight: 1 },
  ],
  "dragones-menores": [
    { id: "kobolds", weight: 4 },
    { id: "cultistas", weight: 2 },
    { id: "bestias", weight: 1 },
  ],
};

const themeSecondaryBias = {
  infernal: "demonios",
  corrupto: "demonios",
  feérico: "aberraciones",
  volcanico: "elementales",
  helado: "elementales",
  abandonado: "no-muertos",
  natural: "bestias",
  subterraneo: "aberraciones",
};

const relationships = {
  single: {
    id: "single",
    label: "Dominio principal",
    summary: "Un solo grupo define casi toda la ocupación actual.",
    encounterNote: "Los encuentros usan una identidad dominante y variaciones por zona.",
  },
  contamination: {
    id: "contamination",
    label: "Contaminacion territorial",
    summary: "El grupo secundario no controla todo el lugar: altera una zona y deforma lo que ya vivia alli.",
    encounterNote: "Usa habitantes primarios en zonas externas, secundarios en la zona final y encuentros mixtos en el borde.",
  },
  summoners: {
    id: "summoners",
    label: "Invocadores y convocados",
    summary: "Un grupo inteligente abrió paso al otro y ahora intenta dirigirlo, contenerlo o sobrevivirlo.",
    encounterNote: "Combina líderes o ritualistas con amenazas secundarias cerca de sellos y puertas importantes.",
  },
  servants: {
    id: "servants",
    label: "Amos y servidores",
    summary: "Un grupo usa al otro como guardianes, mascotas, mano de obra o defensa de capas internas.",
    encounterNote: "Deja rastros del grupo subordinado antes de mostrar al grupo dominante.",
  },
  rivals: {
    id: "rivals",
    label: "Rivalidad interna",
    summary: "Dos facciones comparten el sitio por necesidad y chocan por territorio, comida o acceso.",
    encounterNote: "Los encuentros pueden interrumpirse, negociar o cambiar de objetivo si aparece la otra faccion.",
  },
  originalInvader: {
    id: "original-invader",
    label: "Habitantes originales e invasores",
    summary: "El grupo principal pertenece al sitio; el secundario entro por una grieta, rito, saqueo o accidente.",
    encounterNote: "Marca zonas antiguas con signos primarios y zonas nuevas con presion del invasor.",
  },
};

const pairRelationships = {
  "bestias:demonios": "contamination",
  "bestias:aberraciones": "contamination",
  "bestias:elementales": "contamination",
  "cultistas:demonios": "summoners",
  "cultistas:no-muertos": "summoners",
  "cultistas:aberraciones": "summoners",
  "no-muertos:cultistas": "summoners",
  "kobolds:dragones-menores": "servants",
  "dragones-menores:kobolds": "servants",
  "goblins:orcos": "rivals",
  "orcos:goblins": "rivals",
  "constructos:cultistas": "servants",
};

export function generateInhabitantMix(config, rng) {
  const primary = createInhabitantRef(config.inhabitants);
  const requestedSecondary = config.secondaryInhabitants || "automatico";
  const secondaryId = resolveSecondaryId(config, requestedSecondary, rng);
  const secondary = secondaryId ? createInhabitantRef(secondaryId) : null;
  const relationship = secondary
    ? getRelationship(primary.id, secondary.id)
    : relationships.single;

  return {
    primary,
    secondary,
    relationship,
    hasSecondary: Boolean(secondary),
    summary: secondary
      ? `${primary.label} dominan la entrada y las zonas estables; ${secondary.label} presionan desde otra zona. ${relationship.summary}`
      : `${primary.label} son la presencia dominante. ${relationship.summary}`,
    encounterGuidance: relationship.encounterNote,
  };
}

export function chooseRoomInhabitant({ roomType, zone, inhabitantMix, rng }) {
  const mix = inhabitantMix || {};
  const primary = mix.primary || createInhabitantRef("goblins");
  const secondary = mix.secondary || null;

  if (!secondary) {
    return createRoomInhabitantRole("primary", [primary], primary.id, "La sala pertenece al grupo principal.");
  }

  if (roomType === "jefe" || zone?.role === "final") {
    return createRoomInhabitantRole("secondary", [secondary], secondary.id, "La presion secundaria domina esta zona.");
  }

  if (zone?.role === "border" || roomType === "trampa" || roomType === "puzzle") {
    return createRoomInhabitantRole("mixed", [primary, secondary], secondary.id, "Aqué se superponen rastros de ambos grupos.");
  }

  if (roomType === "secreto" && rng() < 0.5) {
    return createRoomInhabitantRole("mixed", [primary, secondary], primary.id, "El secreto muestra como se cruzan las facciones.");
  }

  return createRoomInhabitantRole("primary", [primary], primary.id, "La ocupación original sigue siendo visible.");
}

export function getInhabitantTable(id) {
  return inhabitantTables[id] || inhabitantTables.goblins;
}

export function getInhabitantLabel(id) {
  return INHABITANT_OPTIONS.find((option) => option.id === id)?.label || id || "";
}

export function formatInhabitantList(refs = []) {
  return refs.map((ref) => ref.label).filter(Boolean).join(" + ");
}

function resolveSecondaryId(config, requestedSecondary, rng) {
  if (noSecondaryIds.has(requestedSecondary)) {
    return "";
  }

  if (requestedSecondary !== "automatico" && requestedSecondary !== config.inhabitants) {
    return requestedSecondary;
  }

  const probability = getAutomaticMixChance(config);
  if (rng() > probability) {
    return "";
  }

  const weights = getSecondaryWeights(config);
  const selected = weightedPick(rng, weights, null);
  return selected?.id && selected.id !== config.inhabitants ? selected.id : "";
}

function getAutomaticMixChance(config) {
  const sizeChance = {
    pequena: 0.3,
    mediana: 0.52,
    grande: 0.72,
    megamazmorra: 0.9,
  }[config.size] || 0.52;
  const themeBonus = ["infernal", "corrupto", "feerico", "volcanico", "abandonado"].includes(config.theme) ? 0.18 : 0;
  return Math.min(0.95, sizeChance + themeBonus);
}

function getSecondaryWeights(config) {
  const weights = [...(secondaryWeightsByPrimary[config.inhabitants] || fallbackSecondaryWeights)]
    .filter((item) => item.id !== config.inhabitants)
    .map((item) => ({ ...item }));
  const biasedId = themeSecondaryBias[config.theme];
  const biased = weights.find((item) => item.id === biasedId);

  if (biased) {
    biased.weight += 3;
  } else if (biasedId && biasedId !== config.inhabitants) {
    weights.push({ id: biasedId, weight: 3 });
  }

  return weights.length ? weights : fallbackSecondaryWeights.filter((item) => item.id !== config.inhabitants);
}

function getRelationship(primaryId, secondaryId) {
  const key = `${primaryId}:${secondaryId}`;
  const reverseKey = `${secondaryId}:${primaryId}`;
  const relationshipId = pairRelationships[key] || pairRelationships[reverseKey] || pickRelationshipByPair(primaryId, secondaryId);
  return relationships[relationshipId] || relationships.originalInvader;
}

function pickRelationshipByPair(primaryId, secondaryId) {
  if (primaryId === "bestias" || secondaryId === "bestias") return "originalInvader";
  if (primaryId === "cultistas" || secondaryId === "cultistas") return "summoners";
  if (primaryId === "constructos" || secondaryId === "constructos") return "servants";
  return "rivals";
}

function createInhabitantRef(id) {
  const table = getInhabitantTable(id);
  return {
    id,
    label: table.label || getInhabitantLabel(id),
  };
}

function createRoomInhabitantRole(role, inhabitants, signSource, note) {
  return {
    role,
    inhabitants,
    signSource,
    label: formatInhabitantList(inhabitants),
    note,
  };
}
