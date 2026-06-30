import { dungeonTypeTables, visualThemeTables } from "./dungeonTables.js";
import { pickOne, weightedPick } from "./dungeonTypes.js";

const causeTable = [
  {
    id: "infernal-breach",
    label: "Grieta infernal",
    themes: ["infernal", "corrupto"],
    inhabitants: ["demonios", "cultistas", "bestias"],
    weight: 4,
    summary: "una grieta de energia hostil abrio una zona contaminada dentro de un sitio anterior",
    situation: [
      "la grieta avanza por puertas, agua y marcas de calor",
      "los habitantes originales evitan la zona final o la cruzan solo por necesidad",
      "algo del fondo intenta convertir defensas antiguas en sellos rotos",
    ],
    clues: [
      "marcas de quemadura aparecen solo en el lado interior de las puertas",
      "huellas normales cambian de forma al acercarse a la zona contaminada",
      "un olor metalico se vuelve mas fuerte hacia la ruta final",
    ],
    trapHooks: [
      "runas calientes reaccionan a sangre, ruido o luz abierta",
      "cadenas tensas cruzan el paso como si sujetaran algo invisible",
    ],
    treasureHooks: [
      "un sello frio que aun repele la corrupcion",
      "un mapa marcado con una zona tachada despues del accidente",
    ],
    doorHooks: [
      "la puerta tiene bronce caliente solo en el borde inferior",
      "el marco esta marcado con garras desde ambos lados",
    ],
    finalHooks: [
      "la sala final contiene el borde activo de la grieta",
      "el jefe protege, explota o intenta cerrar la contaminacion",
    ],
  },
  {
    id: "failed-ritual",
    label: "Ritual fallido",
    themes: ["oscuro", "corrupto", "infernal", "feerico"],
    inhabitants: ["cultistas", "no-muertos", "demonios", "aberraciones"],
    weight: 3,
    summary: "un rito incompleto dejo el lugar dividido entre uso antiguo y consecuencias nuevas",
    situation: [
      "los simbolos incompletos siguen activando defensas por error",
      "alguien esta reuniendo piezas para repetir o terminar el rito",
      "la zona central responde a palabras, llaves o sangre derramada",
    ],
    clues: [
      "el mismo simbolo aparece incompleto en tres materiales distintos",
      "una nota advierte que el orden de salas importa mas que la fuerza",
      "las patrullas evitan pisar ciertos patrones del suelo",
    ],
    trapHooks: [
      "placas rituales castigan a quien rompe el orden correcto",
      "un sello separa a intrusos si ignoran las pistas previas",
    ],
    treasureHooks: [
      "componentes valiosos quedaron ordenados para una segunda ceremonia",
      "una llave ritual abre una puerta, pero tambien revela una alarma",
    ],
    doorHooks: [
      "la puerta muestra ranuras para piezas que no estan aqui",
      "los cierres siguen una secuencia repetida en murales anteriores",
    ],
    finalHooks: [
      "el jefe esta junto al circulo incompleto",
      "la sala final permite romper, completar o robar el foco del rito",
    ],
  },
  {
    id: "territorial-shift",
    label: "Territorio invadido",
    themes: ["natural", "subterraneo", "abandonado"],
    inhabitants: ["bestias", "goblins", "orcos", "kobolds", "aberraciones"],
    weight: 3,
    summary: "un territorio antiguo fue ocupado por una presencia nueva que empuja a los habitantes originales",
    situation: [
      "las zonas externas aun funcionan como nido, campamento o ruta de caza",
      "el borde entre grupos esta lleno de marcas recientes y rutas cerradas",
      "la zona final contiene la razon por la que nadie abandona el lugar",
    ],
    clues: [
      "dos tipos de huellas se superponen sin seguir el mismo patron",
      "las barricadas miran hacia dentro, no hacia la entrada",
      "restos de alimento o botin aparecen lejos de donde deberian estar",
    ],
    trapHooks: [
      "trampas improvisadas bloquean el avance de una faccion rival",
      "un derrumbe fue provocado para aislar el territorio interno",
    ],
    treasureHooks: [
      "un alijo movido deprisa durante la retirada",
      "trofeos mezclados con objetos que pertenecen a otra faccion",
    ],
    doorHooks: [
      "la puerta fue reforzada desde un solo lado",
      "marcas recientes indican que alguien usa este paso como frontera",
    ],
    finalHooks: [
      "la sala final explica que empuja a ambos grupos",
      "el jefe controla el punto que obliga a las facciones a convivir",
    ],
  },
  {
    id: "old-defense",
    label: "Defensa reactivada",
    themes: ["abandonado", "subterraneo", "helado"],
    inhabitants: ["constructos", "elementales", "kobolds", "cultistas"],
    weight: 2,
    summary: "una defensa dormida desperto y reorganizo partes del sitio como si la guerra siguiera activa",
    situation: [
      "mecanismos antiguos abren rutas utiles y cierran rutas seguras",
      "los ocupantes vivos usan atajos que las defensas no reconocen",
      "el nucleo final mantiene una orden vieja sin entender el presente",
    ],
    clues: [
      "marcas de patrulla perfectas cortan rastros mas recientes",
      "puertas distintas repiten el mismo patron de desgaste mecanico",
      "una alarma se activa tarde, como si el sitio despertara por partes",
    ],
    trapHooks: [
      "mecanismos defensivos distinguen insignias, peso o materiales",
      "una puerta cerrada libera un bloqueo secundario si se fuerza",
    ],
    treasureHooks: [
      "un identificador antiguo que reduce la hostilidad de una defensa",
      "herramientas calibradas para reparar o sabotear el nucleo",
    ],
    doorHooks: [
      "la puerta tiene cierres redundantes y marcas de mantenimiento antiguo",
      "un visor estrecho permite comprobar quien se acerca antes de abrir",
    ],
    finalHooks: [
      "la sala final contiene el nucleo de mando o su imitacion rota",
      "el jefe defiende una orden que ya no tiene sentido",
    ],
  },
  {
    id: "buried-secret",
    label: "Secreto enterrado",
    themes: ["oscuro", "helado", "subterraneo", "abandonado"],
    inhabitants: ["no-muertos", "constructos", "dragones-menores", "aberraciones"],
    weight: 2,
    summary: "el lugar fue construido para ocultar algo que ahora atrae ocupantes y peligros",
    situation: [
      "la ruta principal rodea el secreto, pero los atajos apuntan hacia el",
      "quien vive aqui conoce parte de la verdad y protege la version que le conviene",
      "los tesoros pequenos son senales de algo mas valioso, no la recompensa final",
    ],
    clues: [
      "nombres raspados se repiten cerca de accesos importantes",
      "una medida arquitectonica no coincide con el tamano visible de las salas",
      "el polvo revela que una pared se abre mas veces de lo esperado",
    ],
    trapHooks: [
      "una trampa protege informacion, no solo dano",
      "un mecanismo castiga a quien toma tesoro sin leer las marcas",
    ],
    treasureHooks: [
      "una llave sin etiqueta que corresponde a una puerta de otra zona",
      "un objeto valioso escondido junto a una advertencia util",
    ],
    doorHooks: [
      "la puerta encaja demasiado bien para una pared tan vieja",
      "el marco tiene polvo roto solo en un borde",
    ],
    finalHooks: [
      "la sala final revela por que el sitio fue ocultado",
      "el jefe es guardian, ladron o consecuencia del secreto enterrado",
    ],
  },
];

export function generateDungeonNarrative(config, inhabitantMix, rng) {
  const cause = selectCause(config, inhabitantMix, rng);
  const situation = {
    id: `${cause.id}-situation`,
    label: "Situacion actual",
    summary: pickOne(rng, cause.situation, "la tension interna sigue cambiando el sitio"),
  };
  const relation = inhabitantMix?.relationship || { label: "Relacion simple", summary: "Un grupo domina el lugar." };
  const premise = buildPremise(config, cause, situation, relation);

  return {
    cause: {
      id: cause.id,
      label: cause.label,
      summary: cause.summary,
    },
    situation,
    relationship: relation,
    premise,
    globalClues: pickManyStable(rng, cause.clues, 3),
    trapHooks: cause.trapHooks,
    treasureHooks: cause.treasureHooks,
    doorHooks: cause.doorHooks,
    finalHooks: cause.finalHooks,
  };
}

export function getNarrativeRoomText({ roomType, zone, narrative, inhabitantRole, rng }) {
  const clue = pickOne(rng, [
    ...(zone?.clues || []),
    ...(narrative?.globalClues || []),
  ], "");
  const zoneIdentity = zone?.identity || "la identidad de esta zona";
  const factionText = inhabitantRole?.label
    ? `Rastros de ${inhabitantRole.label.toLowerCase()} explican quien usa esta parte.`
    : "Los rastros locales explican quien usa esta parte.";
  const bridge = `Esta zona responde a ${zoneIdentity}; ${factionText}`;
  const dmNote = buildRoomDmNote(roomType, zone, narrative, inhabitantRole);

  return {
    bridge,
    clue,
    hazardHook: pickOne(rng, narrative?.trapHooks || [], ""),
    treasureHook: pickOne(rng, narrative?.treasureHooks || [], ""),
    doorHook: pickOne(rng, narrative?.doorHooks || [], ""),
    finalHook: roomType === "jefe" ? pickOne(rng, narrative?.finalHooks || [], "") : "",
    dmNote,
  };
}

export function formatNarrativeNotes(narrative, zones = []) {
  const zoneText = zones.length
    ? `Zonas: ${zones.map((zone) => `${zone.name} (${zone.identity})`).join(" | ")}.`
    : "";

  return [
    `Causa interna: ${narrative.cause.label} - ${narrative.cause.summary}.`,
    `Situacion actual: ${narrative.situation.summary}.`,
    `Relacion: ${narrative.relationship.label} - ${narrative.relationship.summary}.`,
    zoneText,
  ].filter(Boolean).join(" ");
}

function selectCause(config, inhabitantMix, rng) {
  const inhabitants = [
    config.inhabitants,
    inhabitantMix?.secondary?.id,
  ].filter(Boolean);
  const weights = causeTable.map((cause) => {
    let weight = cause.weight || 1;
    if (cause.themes.includes(config.theme)) weight += 3;
    if (inhabitants.some((id) => cause.inhabitants.includes(id))) weight += 3;
    if (config.dungeonType === "laboratorio" && cause.id === "old-defense") weight += 2;
    if (config.dungeonType === "cripta" && cause.id === "buried-secret") weight += 2;
    if (config.dungeonType === "cueva" && cause.id === "territorial-shift") weight += 2;
    return { ...cause, weight };
  });

  return weightedPick(rng, weights, causeTable[0]);
}

function buildPremise(config, cause, situation, relation) {
  const typeLabel = dungeonTypeTables[config.dungeonType]?.label || "Mazmorra";
  const themeLabel = visualThemeTables[config.theme]?.label || config.theme;
  return `${typeLabel} ${themeLabel.toLowerCase()}: ${cause.summary}. Ahora ${situation.summary}. ${relation.summary}`;
}

function buildRoomDmNote(roomType, zone, narrative, inhabitantRole) {
  if (roomType === "jefe") {
    return `Conecta la sala final con ${pickFirst(narrative?.finalHooks) || narrative?.cause?.summary || "la causa interna"}.`;
  }

  if (roomType === "secreto") {
    return "Usa este secreto como atajo, prueba de la causa interna o pista opcional.";
  }

  if (roomType === "trampa") {
    return `La trampa debe sentirse propia de ${zone?.name || "esta zona"}, no una pieza aislada.`;
  }

  if (inhabitantRole?.role === "mixed") {
    return "Muestra la tension entre facciones antes de convertirla automaticamente en combate.";
  }

  return `Refuerza ${zone?.name || "la zona"} con una pista, olor, objeto o reparacion reconocible.`;
}

function pickManyStable(rng, items, count) {
  const pool = [...(items || [])];
  const result = [];

  while (pool.length && result.length < count) {
    const index = Math.floor(rng() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
}

function pickFirst(items) {
  return Array.isArray(items) ? items[0] : "";
}
