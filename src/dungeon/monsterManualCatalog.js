import { monsterManual2024Catalog } from "./generated/monsterManual2024Catalog.js";

const inhabitantCreatureTypeMap = {
  goblins: ["Fey", "Humanoid"],
  orcos: ["Humanoid"],
  kobolds: ["Dragon", "Humanoid"],
  "no-muertos": ["Undead"],
  bestias: ["Beast"],
  cultistas: ["Humanoid"],
  constructos: ["Construct"],
  aberraciones: ["Aberration"],
  elementales: ["Elemental"],
  demonios: ["Fiend"],
  "dragones-menores": ["Dragon"],
};

const dungeonHabitatMap = {
  cueva: ["Cave", "Underdark", "Mountain"],
  cripta: ["Underdark", "Urban"],
  mina: ["Underdark", "Mountain"],
  templo: ["Urban", "Planar", "Underdark"],
  fortaleza: ["Urban", "Mountain"],
  alcantarilla: ["Urban", "Swamp", "Underdark"],
  ruina: ["Urban", "Forest", "Underdark"],
  torre: ["Urban", "Mountain"],
  guarida: ["Any", "Forest", "Underdark"],
  laboratorio: ["Any", "Urban"],
};

const inhabitantKeywordMap = {
  goblins: ["goblin", "hobgoblin", "bugbear"],
  orcos: ["orc", "orog"],
  kobolds: ["kobold"],
  "no-muertos": ["undead", "zombie", "skeleton", "wight", "wraith", "specter", "ghost", "ghoul", "mummy", "vampire", "lich"],
  bestias: ["beast", "wolf", "bear", "spider", "snake", "rat", "bat", "boar", "crocodile", "shark", "swarm"],
  cultistas: ["cultist", "cult", "fanatic", "priest", "warlock", "mage", "acolyte"],
  constructos: ["construct", "golem", "animated", "guardian", "modron"],
  aberraciones: ["aberration", "mind flayer", "beholder", "gibbering", "aboleth", "grell", "slaad", "chuul"],
  elementales: ["elemental", "mephit", "genie", "azer", "galeb", "xorn"],
  demonios: ["demon", "abyss", "balor", "dretch", "hezrou", "marilith", "quasit", "vrock"],
  "dragones-menores": ["dragon", "drake", "kobold", "wyvern", "wyrmling"],
};

const encounterRolePreferences = {
  jefe: ["boss", "leader", "brute", "standard"],
  principal: ["standard", "brute", "leader", "boss"],
  apoyo: ["minion", "standard"],
};

const narrativeFlavorHints = [
  { pattern: /cazadores? de mente|mente/i, hints: ["mind flayer"] },
  { pattern: /oficiantes? de rito|fanatic|fanatico|cult/i, hints: ["cultist"] },
  { pattern: /invocadores?|sacerdotes? oscuros?|hierofantes?|profeta|sumo|mascara/i, hints: ["cultist", "warlock", "priest", "mage"] },
  { pattern: /guardias? fanatizados?|verdugos? ceremoniales?|oradores? profanos?/i, hints: ["cultist", "guard", "mage", "warlock"] },
  { pattern: /horror(?:es)? del vacio|enjambres? del vacio|vacio/i, hints: ["gibbering", "beholder", "slaad"] },
  { pattern: /cadaveres?|zombi|zombie/i, hints: ["zombie"] },
  { pattern: /huesos?|esquelet/i, hints: ["skeleton"] },
  { pattern: /sombras?|espectros?|apariciones?/i, hints: ["shadow", "specter", "wraith", "ghost"] },
  { pattern: /guardianes? mecanicos?|automas?|centinelas?/i, hints: ["golem", "animated", "guardian"] },
  { pattern: /duendes? de piedra|fragmentos? de roca|piedra/i, hints: ["galeb", "xorn", "earth elemental"] },
  { pattern: /desgarradores?|verdugos?|abismo/i, hints: ["demon", "hezrou", "vrock", "dretch"] },
  { pattern: /dracos?|alientos?|escamados?/i, hints: ["dragon", "drake", "wyrmling"] },
];

const identityRequiredInhabitants = new Set(Object.keys(inhabitantKeywordMap));

export function getMonsterManualCatalog() {
  return monsterManual2024Catalog;
}

export function getMonsterManualEntries(options = {}) {
  const {
    includeReviewRequired = false,
    minConfidence = "medium",
  } = options;

  return monsterManual2024Catalog.monsters.filter((monster) => (
    (includeReviewRequired || !isReviewRequiredMonster(monster))
    && confidenceRank(monster.extractionConfidence) >= confidenceRank(minConfidence)
  ));
}

export function findMonsterManualCandidates({
  config = {},
  maxCr = Number.POSITIVE_INFINITY,
  minCr = 0,
  creatureTypes = [],
  habitats = [],
  roles = [],
  nameHints = [],
  treasure = [],
  limit = 24,
  includeReviewRequired = false,
  minConfidence = "medium",
} = {}) {
  const desiredTypes = creatureTypes.length
    ? creatureTypes
    : getCreatureTypesForInhabitants(config.inhabitants);
  const desiredHabitats = habitats.length
    ? habitats
    : getHabitatsForDungeonType(config.dungeonType);

  return getMonsterManualEntries({ includeReviewRequired, minConfidence })
    .filter((monster) => crToNumber(monster.cr) >= minCr && crToNumber(monster.cr) <= maxCr)
    .filter((monster) => matchesInhabitantFlavor(monster, config.inhabitants))
    .filter((monster) => matchesRequiredInhabitantIdentity(monster, config.inhabitants))
    .map((monster) => ({
      ...monster,
      matchScore: scoreMonsterMatch(monster, desiredTypes, desiredHabitats, roles, treasure, config.inhabitants, nameHints),
    }))
    .filter((monster) => monster.matchScore > 0)
    .sort((first, second) => (
      second.matchScore - first.matchScore
      || crToNumber(second.cr) - crToNumber(first.cr)
      || first.name.localeCompare(second.name)
    ))
    .slice(0, limit);
}

export function findMonsterManualCandidateForEncounter({
  config = {},
  group = null,
  inhabitantId = "",
  roomType = "",
  tacticalRole = "",
  flavorName = "",
  rng = null,
  includeReviewRequired = false,
  minConfidence = "medium",
} = {}) {
  const crValue = Number(group?.crValue) || crToNumber(group?.cr);
  const encounterConfig = {
    ...config,
    inhabitants: inhabitantId || config.inhabitants,
  };
  const roles = getRolePreferences(roomType, tacticalRole);
  const nameHints = getNameHintsForFlavor(flavorName);
  let candidates = findMonsterManualCandidates({
    config: encounterConfig,
    minCr: crValue,
    maxCr: crValue,
    roles,
    nameHints,
    limit: 16,
    includeReviewRequired,
    minConfidence,
  });

  if (nameHints.length) {
    candidates = candidates.filter((monster) => {
      const searchableText = getMonsterSearchText(monster);
      return nameHints.some((hint) => searchableText.includes(hint));
    });
  }

  if (!candidates.length) {
    return null;
  }

  const bestScore = candidates[0].matchScore || 0;
  const strongest = candidates
    .filter((monster) => (monster.matchScore || 0) >= bestScore - 1)
    .slice(0, 6);

  return pickCandidate(strongest, rng);
}

export function getCreatureTypesForInhabitants(inhabitants) {
  return inhabitantCreatureTypeMap[inhabitants] || [];
}

export function getHabitatsForDungeonType(dungeonType) {
  return dungeonHabitatMap[dungeonType] || ["Any"];
}

export function isReviewRequiredMonster(monster) {
  if (monster.extractionConfidence === "verified") {
    return false;
  }

  return (
    monster.extractionConfidence === "low"
    || /[0-9\\^<>]|[^\x00-\x7F]/.test(monster.name)
    || /[<>]/.test(monster.name)
    || /^(?:Tiny|Small|Medium|Large|Huge|Gargantuan)(?:\s+or)?$/i.test(monster.name)
    || /\b(?:MOD|SAVE|Acr|Tnn|Cxr|Lrr|ED|AP)\b/i.test(monster.name)
    || /\b(?:Scour|Clprnrru)\b/i.test(monster.name)
    || /\b(?:Blocrn|Bnr|Bonn|Cnns|Deen|Eacle|Hoor|Grlr|Grlur|Grarur|Granr|Gntr|Gonr|Mln|Mlce|Wttt)\b/i.test(monster.name)
    || /\b(?:Clolren|Deuou|GnncoYle|Goleu|Lnoru|LrirroR|Qurs|Sxloow|Vampi\s+Re|Vnocr|Xonru|Yocx)\b/i.test(monster.name)
    || /[a-z][A-Z]{2,}/.test(monster.name)
    || /\b[A-Z]{2,}\b/.test(monster.name)
  );
}

export function crToNumber(cr) {
  if (!cr) {
    return 0;
  }

  if (String(cr).includes("/")) {
    const [top, bottom] = String(cr).split("/").map(Number);
    return bottom ? top / bottom : 0;
  }

  return Number(cr) || 0;
}

function scoreMonsterMatch(monster, creatureTypes, habitats, roles, treasure, inhabitants, nameHints = []) {
  let score = 1;
  const searchableText = getMonsterSearchText(monster);
  const keywords = inhabitantKeywordMap[inhabitants] || [];

  if (creatureTypes.length) {
    if (!creatureTypes.includes(monster.creatureType)) {
      return 0;
    }
    score += 5;
  }

  if (habitats.length && monster.habitat?.length) {
    const habitatMatch = monster.habitat.some((item) => (
      item === "Any"
      || habitats.some((habitat) => item.toLowerCase().includes(habitat.toLowerCase()))
    ));
    score += habitatMatch ? 3 : 0;
  }

  if (roles.length && roles.includes(monster.encounterRole)) {
    score += 2;
  }

  if (treasure.length && monster.treasure?.some((item) => treasure.includes(item))) {
    score += 1;
  }

  if (keywords.length && keywords.some((keyword) => searchableText.includes(keyword))) {
    score += 8;
  }

  if (nameHints.length && nameHints.some((hint) => searchableText.includes(hint))) {
    score += 12;
  }

  if (confidenceRank(monster.extractionConfidence) >= confidenceRank("high")) {
    score += 1;
  }

  if (monster.extractionConfidence === "verified") {
    score += 1;
  }

  return score;
}

function matchesInhabitantFlavor(monster, inhabitants) {
  if (inhabitants !== "demonios") {
    return true;
  }

  const searchableText = getMonsterSearchText(monster);

  return searchableText.includes("abyss") || searchableText.includes("demon");
}

function matchesRequiredInhabitantIdentity(monster, inhabitants) {
  if (!identityRequiredInhabitants.has(inhabitants)) {
    return true;
  }

  const keywords = inhabitantKeywordMap[inhabitants] || [];
  if (!keywords.length) {
    return true;
  }

  const searchableText = getMonsterSearchText(monster);
  return keywords.some((keyword) => searchableText.includes(keyword));
}

function getRolePreferences(roomType, tacticalRole) {
  if (roomType === "jefe") {
    return encounterRolePreferences.jefe;
  }

  return encounterRolePreferences[tacticalRole] || [];
}

function getNameHintsForFlavor(flavorName) {
  const value = String(flavorName || "");
  if (!value) {
    return [];
  }

  return narrativeFlavorHints
    .filter((entry) => entry.pattern.test(value))
    .flatMap((entry) => entry.hints);
}

function pickCandidate(candidates, rng) {
  if (!candidates.length) {
    return null;
  }

  if (typeof rng !== "function") {
    return candidates[0];
  }

  return candidates[Math.floor(rng() * candidates.length)] || candidates[0];
}

function getMonsterSearchText(monster) {
  return [
    monster.name,
    monster.creatureType,
    ...(monster.habitat || []),
    ...(monster.tags || []),
  ].join(" ").toLowerCase();
}

function confidenceRank(value) {
  return { low: 0, medium: 1, high: 2, verified: 3 }[value] ?? 0;
}
