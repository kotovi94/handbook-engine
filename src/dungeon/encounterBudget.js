import { pickOne } from "./dungeonTypes.js";

export const challengeXpTable = [
  { cr: "0", value: 0, xp: 10 },
  { cr: "1/8", value: 0.125, xp: 25 },
  { cr: "1/4", value: 0.25, xp: 50 },
  { cr: "1/2", value: 0.5, xp: 100 },
  { cr: "1", value: 1, xp: 200 },
  { cr: "2", value: 2, xp: 450 },
  { cr: "3", value: 3, xp: 700 },
  { cr: "4", value: 4, xp: 1100 },
  { cr: "5", value: 5, xp: 1800 },
  { cr: "6", value: 6, xp: 2300 },
  { cr: "7", value: 7, xp: 2900 },
  { cr: "8", value: 8, xp: 3900 },
  { cr: "9", value: 9, xp: 5000 },
  { cr: "10", value: 10, xp: 5900 },
  { cr: "11", value: 11, xp: 7200 },
  { cr: "12", value: 12, xp: 8400 },
  { cr: "13", value: 13, xp: 10000 },
  { cr: "14", value: 14, xp: 11500 },
  { cr: "15", value: 15, xp: 13000 },
  { cr: "16", value: 16, xp: 15000 },
  { cr: "17", value: 17, xp: 18000 },
  { cr: "18", value: 18, xp: 20000 },
  { cr: "19", value: 19, xp: 22000 },
  { cr: "20", value: 20, xp: 25000 },
  { cr: "21", value: 21, xp: 33000 },
  { cr: "22", value: 22, xp: 41000 },
  { cr: "23", value: 23, xp: 50000 },
  { cr: "24", value: 24, xp: 62000 },
  { cr: "25", value: 25, xp: 75000 },
  { cr: "26", value: 26, xp: 90000 },
  { cr: "27", value: 27, xp: 105000 },
  { cr: "28", value: 28, xp: 120000 },
  { cr: "29", value: 29, xp: 135000 },
  { cr: "30", value: 30, xp: 155000 },
];

const xpBudgetByLevel = {
  1: { low: 50, moderate: 75, high: 100 },
  2: { low: 100, moderate: 150, high: 200 },
  3: { low: 150, moderate: 225, high: 400 },
  4: { low: 250, moderate: 375, high: 500 },
  5: { low: 500, moderate: 750, high: 1100 },
  6: { low: 600, moderate: 1000, high: 1400 },
  7: { low: 750, moderate: 1300, high: 1700 },
  8: { low: 1000, moderate: 1700, high: 2100 },
  9: { low: 1300, moderate: 2000, high: 2600 },
  10: { low: 1600, moderate: 2300, high: 3100 },
  11: { low: 1900, moderate: 2900, high: 4100 },
  12: { low: 2200, moderate: 3700, high: 4700 },
  13: { low: 2600, moderate: 4200, high: 5400 },
  14: { low: 2900, moderate: 4900, high: 6200 },
  15: { low: 3300, moderate: 5400, high: 7800 },
  16: { low: 3800, moderate: 6100, high: 9800 },
  17: { low: 4500, moderate: 7200, high: 11700 },
  18: { low: 5000, moderate: 8700, high: 14200 },
  19: { low: 5500, moderate: 10700, high: 17200 },
  20: { low: 6400, moderate: 13200, high: 22000 },
};

const appDifficultyMap = {
  facil: { id: "low", label: "Baja", scale: 1 },
  normal: { id: "moderate", label: "Moderada", scale: 1 },
  dificil: { id: "high", label: "Alta", scale: 1 },
  mortal: { id: "high", label: "Mortal", scale: 1.25 },
};

const roomBudgetScale = {
  entrada: 0.75,
  pasillo: 0.55,
  combate: 1,
  trampa: 0.75,
  puzzle: 0.65,
  tesoro: 0.9,
  descanso: 0.45,
  vacia: 0.45,
  jefe: 1.35,
  secreto: 0.7,
};

export function createEncounterPlan(config, roomType, rng) {
  const budget = createEncounterBudget(config, roomType);
  const groups = roomType === "jefe"
    ? buildBossGroups(config, budget, rng)
    : buildStandardGroups(config, roomType, budget, rng);
  const spentXp = groups.reduce((sum, group) => sum + group.totalXp, 0);
  const warnings = getEncounterWarnings(config, roomType, budget, groups);

  return {
    ...budget,
    groups,
    spentXp,
    remainingXp: Math.max(0, budget.adjustedBudgetXp - spentXp),
    warnings,
  };
}

export function createEncounterBudget(config, roomType) {
  const level = Math.max(1, Math.min(20, Number(config.averageLevel) || 1));
  const players = Math.max(1, Number(config.playerCount) || 4);
  const difficulty = appDifficultyMap[config.difficulty] || appDifficultyMap.normal;
  const perCharacter = xpBudgetByLevel[level]?.[difficulty.id] || xpBudgetByLevel[1].moderate;
  const baseBudgetXp = perCharacter * players;
  const roomScale = roomBudgetScale[roomType] || 1;
  const adjustedBudgetXp = Math.max(25, Math.round(baseBudgetXp * difficulty.scale * roomScale));

  return {
    level,
    players,
    difficultyId: difficulty.id,
    difficultyLabel: difficulty.label,
    perCharacterXp: perCharacter,
    baseBudgetXp,
    roomScale,
    adjustedBudgetXp,
  };
}

export function formatEncounterPlanSummary(plan) {
  if (!plan) {
    return "";
  }

  const primary = plan.groups?.[0];
  const crText = primary ? `CR principal ${primary.cr}` : "sin CR asignado";
  const warnings = plan.warnings?.length ? ` Alertas: ${plan.warnings.join(" ")}` : "";

  return `Dificultad ${plan.difficultyLabel}; presupuesto ${plan.adjustedBudgetXp} XP; usado ${plan.spentXp} XP; ${crText}; ${plan.groups.length} bloque(s) de criatura.${warnings}`;
}

export function formatEncounterGroup(group, name) {
  const countText = group.count === 1 ? "1" : String(group.count);
  return `${countText} ${name} (CR ${group.cr} c/u, ${group.totalXp} XP total)`;
}

function buildBossGroups(config, budget, rng) {
  const primaryBudget = Math.max(25, Math.floor(budget.adjustedBudgetXp * 0.75));
  const primary = pickCrForBudget(primaryBudget, getMaxCr(config, "jefe"), rng, 2);
  const groups = [createGroup("principal", 1, primary)];
  const remaining = budget.adjustedBudgetXp - primary.xp;

  if (remaining >= 50) {
    const supportBudget = Math.floor(remaining / Math.max(1, Math.ceil((config.playerCount || 4) / 2)));
    const support = pickCrForBudget(supportBudget, Math.max(0.25, primary.value - 1), rng, 2);
    const supportCount = Math.min(config.playerCount || 4, Math.max(1, Math.floor(remaining / support.xp)));

    if (supportCount > 0 && support.xp > 0) {
      groups.push(createGroup("apoyo", supportCount, support));
    }
  }

  return groups;
}

function buildStandardGroups(config, roomType, budget, rng) {
  const maxCr = getMaxCr(config, roomType);
  const desiredBlocks = shouldUseSecondBlock(roomType, config, rng) ? 2 : 1;
  const primaryShare = desiredBlocks === 2 ? 0.62 : 0.9;
  const primaryRange = config.difficulty === "mortal" ? 1 : 3;
  const primary = pickCrForBudget(Math.floor(budget.adjustedBudgetXp * primaryShare), maxCr, rng, primaryRange);
  const primaryCount = getCreatureCount(budget.adjustedBudgetXp, primary, roomType, config);
  const groups = [createGroup("principal", primaryCount, primary)];
  const remaining = budget.adjustedBudgetXp - groups[0].totalXp;

  if (desiredBlocks === 2 && remaining >= 50) {
    const secondaryMaxCr = Math.min(primary.value, Math.max(0.25, maxCr - 1));
    const secondary = pickCrForBudget(remaining, secondaryMaxCr, rng, 3);
    const secondaryCount = Math.min(config.playerCount || 4, Math.max(1, Math.floor(remaining / secondary.xp)));

    if (secondaryCount > 0 && secondary.xp > 0) {
      groups.push(createGroup("apoyo", secondaryCount, secondary));
    }
  }

  return groups;
}

function shouldUseSecondBlock(roomType, config, rng) {
  if (roomType === "pasillo" || roomType === "vacia" || roomType === "descanso") {
    return false;
  }

  if (config.difficulty === "mortal") {
    return true;
  }

  if (config.encounterDensity === "alta") {
    return rng() < 0.5;
  }

  return rng() < 0.28;
}

function getCreatureCount(budgetXp, crEntry, roomType, config) {
  if (roomType === "jefe" || crEntry.value >= Math.max(2, config.averageLevel)) {
    return 1;
  }

  const maxByBudget = Math.max(1, Math.floor(budgetXp / Math.max(1, crEntry.xp)));

  if (crEntry.value >= Math.max(1, config.averageLevel - 1)) {
    return Math.max(1, Math.min(2, maxByBudget));
  }

  const maxByParty = Math.max(1, (config.playerCount || 4) * 2);
  const roomMax = roomType === "pasillo" || roomType === "entrada" ? config.playerCount || 4 : maxByParty;

  return Math.max(1, Math.min(maxByBudget, roomMax));
}

function pickCrForBudget(xpBudget, maxCr, rng, rangeSize = 3) {
  const affordable = challengeXpTable.filter((entry) => (
    entry.xp > 0
    && entry.xp <= xpBudget
    && entry.value <= maxCr
  ));

  if (!affordable.length) {
    return challengeXpTable[1];
  }

  const top = affordable.slice(-rangeSize);
  return pickOne(rng, top, affordable[affordable.length - 1]);
}

function createGroup(role, count, crEntry) {
  return {
    role,
    count,
    cr: crEntry.cr,
    crValue: crEntry.value,
    xpEach: crEntry.xp,
    totalXp: crEntry.xp * count,
  };
}

function getMaxCr(config, roomType) {
  const level = Math.max(1, Number(config.averageLevel) || 1);

  if (roomType === "jefe") {
    return config.difficulty === "mortal" ? level + 2 : level + 1;
  }

  if (config.difficulty === "mortal") {
    return level + 1;
  }

  return level;
}

function getEncounterWarnings(config, roomType, budget, groups) {
  const warnings = [];
  const creatureCount = groups.reduce((sum, group) => sum + group.count, 0);
  const highestCr = Math.max(...groups.map((group) => group.crValue));

  if (creatureCount > budget.players * 2) {
    warnings.push("Muchas criaturas; usa minions fragiles o reduce cantidad.");
  }

  if (highestCr > budget.level && roomType !== "jefe") {
    warnings.push("Hay CR sobre el nivel del grupo; revisa dano explosivo.");
  }

  if (budget.level <= 2 && creatureCount > budget.players) {
    warnings.push("En niveles 1-2, evita saturar la accion enemiga.");
  }

  if (groups.reduce((sum, group) => sum + group.totalXp, 0) < budget.adjustedBudgetXp * 0.55) {
    warnings.push("Queda mucho presupuesto libre; sube CR o anade apoyo si quieres mas presion.");
  }

  return warnings;
}
