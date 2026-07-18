export const DUNGEON_VERSION = 3;

export const DIFFICULTY_OPTIONS = [
  { id: "facil", label: "Fácil" },
  { id: "normal", label: "Normal" },
  { id: "dificil", label: "Difícil" },
  { id: "mortal", label: "Mortal" },
];

export const SIZE_OPTIONS = [
  { id: "pequena", label: "Pequeña" },
  { id: "mediana", label: "Mediana" },
  { id: "grande", label: "Grande" },
  { id: "megamazmorra", label: "Megamazmorra" },
];

export const DUNGEON_TYPE_OPTIONS = [
  { id: "cueva", label: "Cueva" },
  { id: "cripta", label: "Cripta" },
  { id: "mina", label: "Mina" },
  { id: "templo", label: "Templo" },
  { id: "fortaleza", label: "Fortaleza" },
  { id: "alcantarilla", label: "Alcantarilla" },
  { id: "ruina", label: "Ruina" },
  { id: "torre", label: "Torre" },
  { id: "guarida", label: "Guarida" },
  { id: "laboratorio", label: "Laboratorio" },
];

export const THEME_OPTIONS = [
  { id: "oscuro", label: "Oscuro" },
  { id: "helado", label: "Helado" },
  { id: "volcanico", label: "Volcanico" },
  { id: "feerico", label: "Feérico" },
  { id: "corrupto", label: "Corrupto" },
  { id: "infernal", label: "Infernal" },
  { id: "natural", label: "Natural" },
  { id: "subterraneo", label: "Subterraneo" },
  { id: "abandonado", label: "Abandonado" },
];

export const INHABITANT_OPTIONS = [
  { id: "goblins", label: "Goblins" },
  { id: "orcos", label: "Orcos" },
  { id: "kobolds", label: "Kobolds" },
  { id: "no-muertos", label: "No muertos" },
  { id: "bestias", label: "Bestias" },
  { id: "cultistas", label: "Cultistas" },
  { id: "constructos", label: "Constructos" },
  { id: "aberraciones", label: "Aberraciones" },
  { id: "elementales", label: "Elementales" },
  { id: "demonios", label: "Demonios" },
  { id: "dragones-menores", label: "Dragones menores" },
];

export const SECONDARY_INHABITANT_OPTIONS = [
  { id: "automatico", label: "Automático" },
  { id: "ninguno", label: "Sin secundarios" },
  ...INHABITANT_OPTIONS,
];

export const ENCOUNTER_DENSITY_OPTIONS = [
  { id: "baja", label: "Baja" },
  { id: "media", label: "Media" },
  { id: "alta", label: "Alta" },
];

export const TREASURE_AMOUNT_OPTIONS = [
  { id: "bajo", label: "Bajo" },
  { id: "normal", label: "Normal" },
  { id: "alto", label: "Alto" },
];

export const ROOM_TYPE_OPTIONS = [
  { id: "entrada", label: "Entrada" },
  { id: "pasillo", label: "Pasillo" },
  { id: "combate", label: "Combate" },
  { id: "trampa", label: "Trampa" },
  { id: "puzzle", label: "Puzzle" },
  { id: "tesoro", label: "Tesoro" },
  { id: "descanso", label: "Descanso" },
  { id: "vacia", label: "Sala vacía" },
  { id: "jefe", label: "Jefe" },
  { id: "secreto", label: "Secreto" },
];

export const DEFAULT_DUNGEON_CONFIG = {
  averageLevel: 3,
  playerCount: 4,
  difficulty: "normal",
  size: "mediana",
  dungeonType: "cripta",
  theme: "oscuro",
  inhabitants: "no-muertos",
  secondaryInhabitants: "automatico",
  encounterDensity: "media",
  treasureAmount: "normal",
};

export function normalizeDungeonConfig(config = {}) {
  return {
    averageLevel: clampNumber(config.averageLevel, 1, 20, DEFAULT_DUNGEON_CONFIG.averageLevel),
    playerCount: clampNumber(config.playerCount, 1, 8, DEFAULT_DUNGEON_CONFIG.playerCount),
    difficulty: normalizeOption(config.difficulty, DIFFICULTY_OPTIONS, DEFAULT_DUNGEON_CONFIG.difficulty),
    size: normalizeOption(config.size, SIZE_OPTIONS, DEFAULT_DUNGEON_CONFIG.size),
    dungeonType: normalizeOption(config.dungeonType, DUNGEON_TYPE_OPTIONS, DEFAULT_DUNGEON_CONFIG.dungeonType),
    theme: normalizeOption(config.theme, THEME_OPTIONS, DEFAULT_DUNGEON_CONFIG.theme),
    inhabitants: normalizeOption(config.inhabitants, INHABITANT_OPTIONS, DEFAULT_DUNGEON_CONFIG.inhabitants),
    secondaryInhabitants: normalizeOption(config.secondaryInhabitants, SECONDARY_INHABITANT_OPTIONS, DEFAULT_DUNGEON_CONFIG.secondaryInhabitants),
    encounterDensity: normalizeOption(config.encounterDensity, ENCOUNTER_DENSITY_OPTIONS, DEFAULT_DUNGEON_CONFIG.encounterDensity),
    treasureAmount: normalizeOption(config.treasureAmount, TREASURE_AMOUNT_OPTIONS, DEFAULT_DUNGEON_CONFIG.treasureAmount),
  };
}

export function getOptionLabel(options, value) {
  return options.find((option) => option.id === value)?.label || value || "";
}

export function createSeed() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createRng(seed = createSeed()) {
  let state = hashSeed(String(seed));
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function chance(rng, probability) {
  return rng() < probability;
}

export function pickOne(rng, items, fallback = "") {
  if (!items?.length) {
    return fallback;
  }

  return items[randomInt(rng, 0, items.length - 1)];
}

export function pickMany(rng, items, count) {
  const pool = [...(items || [])];
  const picks = [];

  while (pool.length && picks.length < count) {
    const index = randomInt(rng, 0, pool.length - 1);
    picks.push(pool.splice(index, 1)[0]);
  }

  return picks;
}

export function weightedPick(rng, items, fallback = null) {
  if (!items?.length) {
    return fallback;
  }

  const total = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let roll = rng() * total;

  for (const item of items) {
    roll -= item.weight || 1;
    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

export function clampNumber(value, min, max, fallback = min) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function normalizeOption(value, options, fallback) {
  return options.some((option) => option.id === value) ? value : fallback;
}

function hashSeed(seed) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
