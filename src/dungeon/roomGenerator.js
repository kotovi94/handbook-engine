import { generateEncounterBundle } from "./encounterGenerator.js";
import { chooseRoomInhabitant, getInhabitantTable } from "./dungeonInhabitantMixes.js";
import { getNarrativeRoomText } from "./dungeonNarrativeThreads.js";
import {
  descriptionTable,
  dungeonTypeTables,
  eventTable,
  getLevelRange,
  roomTypeTables,
  trapTable,
  visualThemeTables,
} from "./dungeonTables.js";
import { generateMonsterNotes } from "./monsterRules.js";
import { generateTreasureBundle } from "./treasureGenerator.js";
import { chance, pickOne } from "./dungeonTypes.js";

const puzzlePrompts = [
  "tres símbolos deben alínearse con pistas de salas anteriores",
  "un mecanismo responde a sonido, peso o luz",
  "cuatro piezas móviles muestran el orden correcto si se observan sus daños",
  "una frase incompleta debe completarse con una palabra vista en otra sala",
  "dos palancas abren rutas distintas y una activa una alarma",
  "un patrón de colores o materiales marca el camino seguro",
];

const environmentalHazards = [
  "terreno difícil por escombros, agua o raíces",
  "cobertura parcial que cambia al moverse por la sala",
  "zona inestable que se derrumba si recibe daño fuerte",
  "niebla, humo o polvo que limita visión a distancia",
  "ruido constante que dificulta escuchar patrullas",
  "pasarela estrecha con caída lateral",
];

export function formatRoomId(index) {
  return `R${String(index).padStart(2, "0")}`;
}

export function generateRoom({
  index,
  roomType,
  config,
  connections = [],
  zone = null,
  inhabitantMix = null,
  narrative = null,
  rng,
}) {
  const typeTable = roomTypeTables[roomType] || roomTypeTables.vacia;
  const id = formatRoomId(index);
  const roomInhabitant = chooseRoomInhabitant({ roomType, zone, inhabitantMix, rng });
  const narrativeText = getNarrativeRoomText({ roomType, zone, narrative, inhabitantRole: roomInhabitant, rng });
  const encounter = generateEncounterBundle(config, roomType, rng, {
    zone,
    inhabitantMix,
    roomInhabitant,
    narrative,
  });
  const scene = generateRoomScene(roomType, config, rng, {
    zone,
    roomInhabitant,
    narrativeText,
  });
  const description = formatRoomDescription(scene, narrativeText);
  const hazardDetails = enrichHazardDetails(generateHazardDetails(roomType, config, rng), roomType, zone, narrativeText, rng);
  const treasure = enrichTreasureWithNarrative(generateTreasureBundle(config, roomType, rng), roomType, zone, narrativeText);
  const notes = pickOne(rng, typeTable.notes, "Ajusta esta sala al ritmo de la mesa.");

  return {
    id,
    name: generateRoomName(roomType, config, rng, zone, narrativeText),
    type: roomType,
    zoneId: zone?.id || "",
    zoneName: zone?.name || "",
    zoneRole: zone?.role || "",
    zoneIdentity: zone?.identity || "",
    inhabitantRole: roomInhabitant.role,
    localInhabitants: roomInhabitant.inhabitants,
    narrativeBeat: narrativeText.bridge,
    riskLevel: inferGeneratedRiskLevel(roomType, encounter, hazardDetails),
    functionInSession: inferGeneratedRoomFunction(roomType),
    readAloud: description,
    description,
    sensoryDetail: scene.sensory,
    visibleFeature: scene.anchor,
    inhabitantSign: scene.sign,
    hiddenClue: scene.clue,
    optionalEvent: scene.eventText,
    investigationClues: [scene.clue, narrativeText.clue, narrativeText.finalHook].filter(Boolean),
    visibleSigns: [zone?.identity, scene.anchor, scene.detail, scene.sign, narrativeText.bridge].filter(Boolean),
    connections,
    enemies: encounter.enemies,
    creatures: encounter.creatures,
    encounterExtras: encounter.encounterExtras,
    encounterPlan: encounter.encounterPlan,
    encounterSummary: encounter.encounterSummary,
    monsterNotes: generateMonsterNotes(config, roomType, encounter.enemies, rng, encounter.encounterPlan, encounter.creatures),
    hazard: formatHazardDetails(hazardDetails),
    hazardDetails,
    treasure: treasure.treasure,
    treasureDetails: treasure.treasureDetails,
    dmNotes: [notes, narrativeText.dmNote, roomInhabitant.note].filter(Boolean),
    notes: [notes, narrativeText.dmNote, roomInhabitant.note].filter(Boolean).join(" "),
    tags: [
      roomType,
      config.dungeonType,
      config.theme,
      config.inhabitants,
      zone?.id,
      zone?.role,
      roomInhabitant.role,
      ...roomInhabitant.inhabitants.map((inhabitant) => inhabitant.id),
    ].filter(Boolean),
  };
}

export function regenerateRoom(room, config, rng, context = {}) {
  const index = Number.parseInt(String(room.id).replace(/\D/g, ""), 10) || 1;
  const generated = generateRoom({
    index,
    roomType: room.type || "vacia",
    config,
    connections: room.connections || [],
    zone: context.zone || null,
    inhabitantMix: context.inhabitantMix || null,
    narrative: context.narrative || null,
    rng,
  });

  return {
    ...generated,
    id: room.id,
    connections: room.connections || [],
  };
}

export function generateRoomName(roomType, config, rng, zone = null, narrativeText = null) {
  const typeTable = roomTypeTables[roomType] || roomTypeTables.vacia;
  const dungeonType = dungeonTypeTables[config.dungeonType] || dungeonTypeTables.cripta;

  if (roomType === "jefe") {
    const base = pickOne(rng, dungeonType.finalRooms, pickOne(rng, typeTable.names));
    return titleCase(`${base} ${zone?.role === "final" ? "del foco" : ""}`.trim());
  }

  if (roomType === "secreto" && zone?.name) {
    return `Acceso a ${zone.name}`;
  }

  const name = pickOne(rng, typeTable.names, "Sala sin nombre");
  return narrativeText?.finalHook && roomType === "puzzle" ? `${name} del Sello` : name;
}

export function generateHazard(roomType, config, rng) {
  return formatHazardDetails(generateHazardDetails(roomType, config, rng));
}

export function generateHazardDetails(roomType, config, rng) {
  const levelRange = getLevelRange(config.averageLevel);

  if (roomType === "trampa") {
    const summary = pickOne(rng, trapTable[levelRange.id], "trampa simple con pista visible");
    return createHazardDetails({
      type: "trampa",
      summary,
      trigger: "Cruzar, tocar o manipular el punto marcado.",
      countermeasure: "Detectar la pista, desactivar con herramientas o rodear el área.",
      visibility: "Debe tener una señal perceptible antes de activarse.",
    });
  }

  if (roomType === "puzzle") {
    const summary = `Puzzle: ${pickOne(rng, puzzlePrompts)}`;
    return createHazardDetails({
      type: "puzzle",
      summary,
      trigger: "Activar piezas en orden incorrecto o forzar el mecanismo.",
      countermeasure: "Usar pistas de salas anteriores antes de manipularlo.",
      visibility: "El mecanismo es visible; la solucion requiere contexto.",
    });
  }

  if (roomType === "jefe") {
    const summary = `Terreno final: ${pickOne(rng, environmentalHazards)}`;
    return createHazardDetails({
      type: "terreno",
      summary,
      trigger: "Moverse sin considerar el terreno o empujar la pelea hacia esa zona.",
      countermeasure: "Usar posicionamiento, cobertura o acciones para estabilizar el área.",
      visibility: "Se aprecia al entrar en la sala.",
    });
  }

  if ((roomType === "combate" || roomType === "pasillo") && chance(rng, 0.35)) {
    const summary = pickOne(rng, environmentalHazards);
    return createHazardDetails({
      type: "ambiental",
      summary,
      trigger: "Movimiento rápido, empujones o combate sin cuidado.",
      countermeasure: "Avanzar con cautela o usar el terreno como ventaja.",
      visibility: "Se nota con una mirada atenta.",
    });
  }

  if (roomType === "secreto" && chance(rng, 0.3)) {
    return createHazardDetails({
      type: "secreto",
      summary: "entrada oculta difícil de notar si el grupo avanza rápido",
      trigger: "Pasar sin investigar.",
      countermeasure: "Buscar señales, corrientes de aire o marcas repetidas.",
      visibility: "Solo se insinúa con detalles pequeños.",
    });
  }

  return createHazardDetails();
}

function generateRoomScene(roomType, config, rng, context = {}) {
  const typeTable = roomTypeTables[roomType] || roomTypeTables.vacia;
  const dungeonType = dungeonTypeTables[config.dungeonType] || dungeonTypeTables.cripta;
  const theme = visualThemeTables[config.theme] || visualThemeTables.oscuro;
  const signSource = context.roomInhabitant?.signSource || config.inhabitants;
  const inhabitants = getInhabitantTable(signSource);
  const base = pickOne(rng, typeTable.descriptions);
  const anchor = context.zone?.name
    ? `${pickOne(rng, dungeonType.anchors)} cerca de ${context.zone.name}`
    : pickOne(rng, dungeonType.anchors);
  const detail = context.zone?.identity || pickOne(rng, theme.details);
  const sign = context.roomInhabitant?.role === "mixed"
    ? `${pickOne(rng, inhabitants.signs)} mezcladas con señales ajenas`
    : pickOne(rng, inhabitants.signs);
  const clue = context.narrativeText?.clue || pickOne(rng, descriptionTable.clues);
  const sensory = pickOne(rng, descriptionTable.sensory);
  const event = chance(rng, 0.38) ? pickOne(rng, eventTable) : "";

  return {
    base,
    anchor,
    detail,
    sign,
    clue,
    sensory,
    event,
    eventText: event ? `También hay ${event}.` : "",
  };
}

function formatRoomDescription(scene, narrativeText = {}) {
  const event = scene.event ? ` También hay ${scene.event}.` : "";
  const bridge = narrativeText.bridge ? ` ${narrativeText.bridge}.` : "";
  const finalHook = narrativeText.finalHook ? ` ${narrativeText.finalHook}.` : "";
  return `${scene.base} Se ven ${scene.anchor}, ${scene.detail} y ${scene.sign}; ${scene.sensory}. ${scene.clue}.${bridge}${finalHook}${event}`;
}

function enrichHazardDetails(details, roomType, zone, narrativeText, rng) {
  const shouldCreateZoneHazard = !details?.hasHazard
    && zone
    && (zone.role === "border" || zone.role === "final")
    && ["pasillo", "vacia", "combate"].includes(roomType)
    && chance(rng, zone.role === "final" ? 0.35 : 0.22);

  if (!details?.hasHazard && !shouldCreateZoneHazard) {
    return details;
  }

  const hook = narrativeText?.hazardHook || zone?.trapBias || "";

  if (!details?.hasHazard) {
    return createHazardDetails({
      type: "zona",
      summary: `Peligro de zona: ${hook || "el terreno reacciona al avance descuidado"}`,
      trigger: "Cruzar deprisa, hacer ruido o ignorar las marcas de frontera.",
      countermeasure: "Reconocer el patrón de la zona y avanzar por una ruta alternativa.",
      visibility: "Las señales se repiten en puertas, suelo o paredes cercanas.",
    });
  }

  if (!hook) {
    return details;
  }

  return {
    ...details,
    summary: `${details.summary}; ${hook}`,
    effect: `${details.effect || details.summary}; ${hook}`,
    countermeasure: details.countermeasure || "Usar pistas de la zona antes de forzar el paso.",
  };
}

function enrichTreasureWithNarrative(treasureBundle, roomType, zone, narrativeText) {
  const details = treasureBundle.treasureDetails;
  const hook = narrativeText?.treasureHook || "";
  const shouldCarryClue = ["tesoro", "jefe", "secreto", "puzzle"].includes(roomType);

  if (!details?.hasTreasure && !shouldCarryClue) {
    return treasureBundle;
  }

  const enriched = details?.hasTreasure
    ? {
      ...details,
      clues: [...(details.clues || []), hook].filter(Boolean),
    }
    : {
      hasTreasure: true,
      coins: "",
      items: [],
      clues: [hook || `pista sobre ${zone?.name || "la causa interna"}`],
      keys: [],
      valueHint: "Información",
    };

  return {
    treasureDetails: {
      ...enriched,
      summary: formatTreasureSummary(enriched),
    },
    treasure: formatTreasureSummary(enriched),
  };
}

function formatTreasureSummary(details) {
  return [
    details.coins,
    ...(details.items || []),
    ...(details.clues || []),
    ...(details.keys || []),
  ].filter(Boolean).join("; ");
}

function titleCase(value) {
  return String(value)
    .split(" ")
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(" ");
}

function createHazardDetails({
  type = "",
  summary = "",
  trigger = "",
  countermeasure = "",
  visibility = "",
} = {}) {
  return {
    hasHazard: Boolean(summary),
    type,
    summary,
    trigger,
    effect: summary,
    countermeasure,
    visibility,
  };
}

function formatHazardDetails(details) {
  return details?.summary || "";
}

function inferGeneratedRiskLevel(roomType, encounter, hazardDetails) {
  if (roomType === "jefe") return "extreme";
  if (roomType === "combate" || roomType === "trampa") return "high";
  if (hazardDetails?.hasHazard || encounter.enemies?.length) return "medium";
  if (roomType === "tesoro" || roomType === "secreto") return "low";
  return "none";
}

function inferGeneratedRoomFunction(roomType) {
  const functionsByType = {
    entrada: "Presentar tono, primer rastro y una decisión de ruta.",
    pasillo: "Conectar zonas y controlar ritmo de exploración.",
    combate: "Probar tácticas, recursos y reacción de los habitantes.",
    trampa: "Premiar observacion y cobrar descuido.",
    puzzle: "Crear una pausa de deducción o manipulación.",
    tesoro: "Entregar recompensa, pista o llave Útil.",
    descanso: "Bajar tensión y permitir recuperación breve.",
    vacia: "Dar aire y sembrar información sin combate inmediato.",
    jefe: "Cerrar la mazmorra con amenaza, objetivo o revelacion.",
    secreto: "Premiar curiosidad con información, atajo o botín.",
  };

  return functionsByType[roomType] || "Resolver una escena breve de exploración.";
}
