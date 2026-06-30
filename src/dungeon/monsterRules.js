import { getLevelRange, inhabitantTables } from "./dungeonTables.js";
import { pickMany, pickOne } from "./dungeonTypes.js";
import { formatEncounterPlanSummary } from "./encounterBudget.js";

export const monsterTreasureModes = {
  variado: {
    label: "Botin variado",
    note: "Puede mezclar monedas, objetos utiles y un hallazgo especial.",
  },
  personal: {
    label: "Botin personal",
    note: "Pequenos valores llevados encima o guardados en un puesto cercano.",
  },
  arcano: {
    label: "Tema arcano",
    note: "Componentes, formulas, focos, cristales o objetos de estudio.",
  },
  armas: {
    label: "Tema marcial",
    note: "Armas, armaduras, municion, estandartes o equipo de guerra.",
  },
  ritual: {
    label: "Tema ritual",
    note: "Simbolos, reliquias menores, ofrendas o instrumentos ceremoniales.",
  },
  reliquia: {
    label: "Tema reliquia",
    note: "Objetos antiguos, restos historicos o piezas con valor cultural.",
  },
  ninguno: {
    label: "Sin interes por tesoro",
    note: "Cualquier tesoro presente es incidental o pertenece a victimas previas.",
  },
};

export function createOfficialEncounterCreature({
  monster,
  group,
  flavorName = "",
  tacticalRole = "",
  source = "monster-manual-2024",
} = {}) {
  const count = normalizeCount(group?.count);
  const xpEach = Number(monster?.xp) || Number(group?.xpEach) || 0;
  const creature = {
    name: String(monster?.name || "").trim(),
    flavorName: normalizeFlavorName(flavorName, monster?.name),
    label: "",
    count,
    cr: String(monster?.cr || group?.cr || ""),
    crValue: Number(group?.crValue) || 0,
    xpEach,
    totalXp: xpEach * count,
    tacticalRole: tacticalRole || group?.role || "",
    encounterRole: monster?.encounterRole || "",
    source,
    sourceId: monster?.id || "",
    isOfficial: true,
    creatureType: monster?.creatureType || "",
    size: monster?.size || "",
    habitat: Array.isArray(monster?.habitat) ? monster.habitat : [],
    treasure: Array.isArray(monster?.treasure) ? monster.treasure : [],
    extractionConfidence: monster?.extractionConfidence || "",
  };

  creature.label = formatCreatureEncounterLabel(creature);
  return creature;
}

export function createTemplateEncounterCreature({
  flavorName = "",
  group,
  tacticalRole = "",
} = {}) {
  const count = normalizeCount(group?.count);
  const xpEach = Number(group?.xpEach) || 0;
  const creature = {
    name: "Creature template",
    flavorName: normalizeFlavorName(flavorName) || getFallbackTemplateName(tacticalRole || group?.role),
    label: "",
    count,
    cr: String(group?.cr || ""),
    crValue: Number(group?.crValue) || 0,
    suggestedCr: String(group?.cr || ""),
    xpEach,
    totalXp: Number(group?.totalXp) || xpEach * count,
    tacticalRole: tacticalRole || group?.role || "",
    encounterRole: "",
    source: "template-narrative",
    sourceId: "",
    isOfficial: false,
    creatureType: "",
    size: "",
    habitat: [],
    treasure: [],
    extractionConfidence: "",
  };

  creature.label = formatCreatureEncounterLabel(creature);
  return creature;
}

export function formatCreatureEncounterLabel(creature = {}) {
  if (creature.isOfficial) {
    return formatOfficialCreatureLabel(creature);
  }

  return formatTemplateCreatureLabel(creature);
}

const inhabitantMonsterProfiles = {
  goblins: {
    creatureType: "Fey o humanoide",
    habitats: ["ruinas ocupadas", "cuevas bajas", "fortines improvisados", "tuneles secundarios"],
    treasureModes: ["personal", "armas", "variado"],
    motives: ["proteger un escondite", "robar recursos", "ganar estatus ante su lider"],
    instincts: ["huir si pierden ventaja", "usar trampas antes del choque directo", "pedir refuerzos rapido"],
  },
  orcos: {
    creatureType: "Humanoide",
    habitats: ["fortalezas tomadas", "campamentos de guerra", "minas disputadas", "salas de entrenamiento"],
    treasureModes: ["armas", "personal", "variado"],
    motives: ["mantener dominio territorial", "probar fuerza", "defender botin de guerra"],
    instincts: ["cerrar distancia", "romper la linea frontal", "retirarse solo si el lider cae"],
  },
  kobolds: {
    creatureType: "Humanoide draconico",
    habitats: ["tuneles estrechos", "minas abandonadas", "guaridas bajo tierra", "salas con mecanismos pequenos"],
    treasureModes: ["personal", "arcano", "armas"],
    motives: ["proteger el nido", "servir a una presencia mayor", "probar trampas nuevas"],
    instincts: ["pelear desde cobertura", "separar al grupo", "atraer intrusos a terreno preparado"],
  },
  "no-muertos": {
    creatureType: "No muerto",
    habitats: ["criptas", "osarios", "templos cerrados", "camposanto subterraneo"],
    treasureModes: ["reliquia", "ritual", "ninguno"],
    motives: ["obedecer una orden antigua", "custodiar restos", "repetir una tragedia"],
    instincts: ["ignorar dolor y miedo", "proteger el foco que los sostiene", "apagar luz o esperanza"],
  },
  bestias: {
    creatureType: "Bestia",
    habitats: ["cuevas naturales", "nidos", "salas invadidas por naturaleza", "canales de agua"],
    treasureModes: ["ninguno", "personal"],
    motives: ["comer", "defender cria o territorio", "buscar salida"],
    instincts: ["atacar al aislado", "huir ante fuego o ruido fuerte", "usar olor y movimiento"],
  },
  cultistas: {
    creatureType: "Humanoide",
    habitats: ["templos ocultos", "laboratorios rituales", "salas de culto", "criptas profanadas"],
    treasureModes: ["ritual", "arcano", "personal"],
    motives: ["completar una ceremonia", "proteger un secreto", "ganar favor de su patron"],
    instincts: ["ganar tiempo", "sacrificar peones", "usar simbolos y promesas para intimidar"],
  },
  constructos: {
    creatureType: "Constructo",
    habitats: ["laboratorios", "bovedas", "pasillos de defensa", "salas de maquinaria"],
    treasureModes: ["arcano", "ninguno", "reliquia"],
    motives: ["cumplir una directiva", "proteger un area", "reparar o activar un mecanismo"],
    instincts: ["seguir prioridad programada", "ignorar distracciones menores", "bloquear rutas"],
  },
  aberraciones: {
    creatureType: "Aberracion",
    habitats: ["laboratorios fallidos", "cuevas profundas", "ruinas deformadas", "salas con geometria rara"],
    treasureModes: ["arcano", "ninguno", "reliquia"],
    motives: ["estudiar intrusos", "alimentarse de mente o miedo", "expandir influencia"],
    instincts: ["romper formaciones", "atacar sentidos o voluntad", "retirarse por rutas incomodas"],
  },
  elementales: {
    creatureType: "Elemental",
    habitats: ["fisuras naturales", "salas volcanicas", "cisternas", "camaras de energia"],
    treasureModes: ["arcano", "ninguno"],
    motives: ["defender un nodo", "responder a una invocacion", "volver a su fuente"],
    instincts: ["aprovechar terreno afin", "castigar intrusos agrupados", "cambiar el campo de batalla"],
  },
  demonios: {
    creatureType: "Fiend",
    habitats: ["templos profanados", "grietas planares", "salas de sacrificio", "fortalezas corruptas"],
    treasureModes: ["ritual", "variado", "ninguno"],
    motives: ["romper sellos", "corromper pactos", "causar dano desmedido"],
    instincts: ["atacar al vulnerable", "desordenar prioridades", "usar miedo y caos"],
  },
  "dragones-menores": {
    creatureType: "Dragon",
    habitats: ["guaridas calientes", "bovedas", "torres altas", "cavernas con tesoro"],
    treasureModes: ["variado", "reliquia", "arcano"],
    motives: ["proteger tesoro", "imponer dominio", "cuidar huevos o tributo"],
    instincts: ["usar movilidad", "amenazar desde posicion ventajosa", "guardar una ruta de escape"],
  },
};

const roomEncounterRoles = {
  entrada: ["vigia", "primer filtro", "alarma viviente"],
  pasillo: ["patrulla", "emboscada corta", "bloqueo movil"],
  combate: ["fuerza principal", "puesto de choque", "defensa activa"],
  trampa: ["cebo", "observador de trampa", "remate despues del mecanismo"],
  puzzle: ["guardian condicionado", "interrupcion", "testigo del ritual"],
  tesoro: ["custodio", "ladron rival", "defensa del botin"],
  descanso: ["presencia distante", "huella reciente", "amenaza que puede volver"],
  vacia: ["rastro", "senal de paso", "encuentro opcional"],
  jefe: ["lider", "campeon", "amenaza central"],
  secreto: ["guardian oculto", "pista viviente", "habitante extraviado"],
};

const combatUseGuides = [
  "Si tiene una opcion limitada fuerte, usala temprano para mostrar peligro.",
  "Si no usa una opcion especial, que mantenga su rutina de ataque principal.",
  "Si tiene reaccion, accion adicional o accion legendaria, dale un disparador visible.",
  "Separa lo que el grupo puede recuperar como equipo de lo que es poder propio del monstruo.",
  "Anota sentidos, idiomas y percepcion pasiva si pueden cambiar exploracion o sorpresa.",
  "Si hay resistencia, inmunidad o vulnerabilidad, senalalo con una pista del entorno.",
];

const statBlockUseChecklist = [
  "CA, PG, velocidad e iniciativa listos",
  "sentidos e idiomas relevantes",
  "resistencias, inmunidades o vulnerabilidades visibles",
  "accion principal y opcion limitada marcadas",
  "equipo recuperable separado de rasgos especiales",
];

const crHintsByTier = {
  novice: ["CR bajo o grupos pequenos", "amenaza simple con una complicacion", "enemigos faciles de leer"],
  heroic: ["CR medio o escuadra mixta", "enemigo principal con apoyo", "una habilidad especial por encuentro"],
  paragon: ["CR alto con terreno importante", "amenaza elite con defensa o movilidad", "varias fases tacticas"],
  legendary: ["CR muy alto o amenaza unica", "acciones fuera de turno si corresponde", "terreno y objetivos secundarios"],
};

export function generateMonsterNotes(config, roomType, enemies, rng, encounterPlan = null, creatures = []) {
  if (!enemies?.length) {
    return "";
  }

  const profile = getMonsterProfile(config.inhabitants);
  const inhabitants = inhabitantTables[config.inhabitants] || inhabitantTables.goblins;
  const levelRange = getLevelRange(config.averageLevel);
  const treasureMode = monsterTreasureModes[pickOne(rng, profile.treasureModes, "personal")] || monsterTreasureModes.personal;
  const checklist = pickMany(rng, statBlockUseChecklist, 3).join("; ");
  const guide = pickMany(rng, combatUseGuides, roomType === "jefe" ? 3 : 2).join(" ");
  const role = pickOne(rng, roomEncounterRoles[roomType] || roomEncounterRoles.vacia, "encuentro");
  const motive = pickOne(rng, profile.motives, "defender su zona");
  const instinct = pickOne(rng, profile.instincts, "buscar ventaja tactica");
  const habitat = pickOne(rng, profile.habitats, "zona apropiada");
  const crHint = pickOne(rng, crHintsByTier[levelRange.id], "CR apropiado al grupo");
  const budgetHint = encounterPlan ? `Presupuesto: ${formatEncounterPlanSummary(encounterPlan)}` : "";
  const officialNames = unique((creatures || [])
    .filter((creature) => creature?.isOfficial && creature.name)
    .map((creature) => creature.name));
  const templateNames = unique((creatures || [])
    .filter((creature) => creature && !creature.isOfficial)
    .map((creature) => creature.flavorName || creature.name)
    .filter(Boolean));

  return [
    `Perfil: ${inhabitants.label} como ${profile.creatureType.toLowerCase()}; rol en sala: ${role}.`,
    officialNames.length ? `Statblocks oficiales sugeridos: ${officialNames.join(", ")}.` : "",
    templateNames.length ? `Plantillas narrativas: ${templateNames.join(", ")}; elige un statblock real o crea uno antes de jugar.` : "",
    `Habitat sugerido: ${habitat}. Motivacion: ${motive}. Instinto: ${instinct}.`,
    `Escala: ${crHint}; ajusta cantidad antes que copiar una ficha fija.`,
    budgetHint,
    `Tesoro de monstruo: ${treasureMode.label}. ${treasureMode.note}`,
    `Uso en mesa: ${guide}`,
    `Checklist: ${checklist}.`,
  ].filter(Boolean).join(" ");
}

export function getMonsterProfile(inhabitantsId) {
  return inhabitantMonsterProfiles[inhabitantsId] || inhabitantMonsterProfiles.goblins;
}

function formatOfficialCreatureLabel(creature) {
  const count = normalizeCount(creature.count);
  const name = count > 1 ? pluralizeCreatureName(creature.name) : creature.name;
  const crText = creature.cr ? `CR ${creature.cr}${count > 1 ? " c/u" : ""}` : "CR sin dato";
  const xpText = Number(creature.totalXp) ? `${creature.totalXp} XP total` : "XP sin dato";
  const flavor = creature.flavorName ? ` - rol narrativo: ${creature.flavorName}` : "";
  return `${count} ${name} (${crText}, ${xpText})${flavor}`;
}

function formatTemplateCreatureLabel(creature) {
  const count = normalizeCount(creature.count);
  const noun = count > 1 ? "Creature templates" : "Creature template";
  const countPrefix = count > 1 ? `${count} ` : "";
  const crText = creature.suggestedCr || creature.cr || "?";
  const xpText = Number(creature.totalXp) ? `, ${creature.totalXp} XP sugerida total` : "";
  return `${countPrefix}${noun}: ${creature.flavorName || "encuentro narrativo"} (CR sugerido ${crText}${count > 1 ? " c/u" : ""}${xpText})`;
}

function pluralizeCreatureName(name) {
  const value = String(name || "Creature").trim();
  if (!value) return "Creatures";
  if (/^swarm of /i.test(value)) return value.replace(/^Swarm of /i, "Swarms of ");
  if (/succubus$/i.test(value)) return value.replace(/succubus$/i, "Succubi");
  if (/incubus$/i.test(value)) return value.replace(/incubus$/i, "Incubi");
  if (/[^aeiou]y$/i.test(value)) return `${value.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(value)) return `${value}es`;
  return `${value}s`;
}

function normalizeCount(value) {
  return Math.max(1, Number(value) || 1);
}

function normalizeFlavorName(flavorName, officialName = "") {
  const flavor = String(flavorName || "").trim();
  if (!flavor) {
    return "";
  }

  return flavor.toLowerCase() === String(officialName || "").trim().toLowerCase() ? "" : flavor;
}

function getFallbackTemplateName(role) {
  const labels = {
    principal: "amenaza principal",
    apoyo: "apoyo tactico",
    extra: "presencia narrativa",
  };
  return labels[role] || "encuentro narrativo";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
