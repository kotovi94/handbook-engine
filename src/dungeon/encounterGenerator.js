import { getInhabitantTable } from "./dungeonInhabitantMixes.js";
import {
  createEncounterPlan,
  formatEncounterPlanSummary,
} from "./encounterBudget.js";
import { getLevelRange } from "./dungeonTables.js";
import { pickMany, pickOne } from "./dungeonTypes.js";
import { findMonsterManualCandidateForEncounter } from "./monsterManualCatalog.js";
import {
  createOfficialEncounterCreature,
  generateMonsterNotes,
} from "./monsterRules.js";

const densityRoomChance = {
  baja: 0.55,
  media: 0.75,
  alta: 0.92,
};

export function shouldRoomHaveEnemies(roomType, encounterDensity, rng) {
  if (roomType === "jefe") {
    return true;
  }

  if (roomType === "combate") {
    return true;
  }

  if (roomType === "entrada" || roomType === "tesoro" || roomType === "secreto") {
    return rng() < (densityRoomChance[encounterDensity] || densityRoomChance.media) * 0.45;
  }

  if (roomType === "pasillo" || roomType === "vacia") {
    return rng() < (densityRoomChance[encounterDensity] || densityRoomChance.media) * 0.18;
  }

  return false;
}

export function generateEncounterBundle(config, roomType, rng, context = {}) {
  if (!shouldRoomHaveEnemies(roomType, config.encounterDensity, rng)) {
    return {
      enemies: [],
      creatures: [],
      encounterExtras: [],
      encounterPlan: null,
      encounterSummary: "",
    };
  }

  const roomInhabitant = context.roomInhabitant || null;
  const encounterInhabitants = resolveEncounterInhabitants(config, roomType, context, rng);
  const inhabitants = getInhabitantTable(encounterInhabitants.primaryId);
  const levelRange = getLevelRange(config.averageLevel);
  const enemies = inhabitants.enemiesByTier[levelRange.id] || inhabitants.enemiesByTier.novice;
  const picks = pickMany(rng, enemies, 2);
  const encounterPlan = createEncounterPlan(config, roomType, rng);

  if (roomType === "jefe") {
    const leader = pickOne(rng, inhabitants.leaders, "lider de la mazmorra");
    const primaryGroup = encounterPlan.groups[0];
    const supportGroup = encounterPlan.groups[1];
    const supportFlavor = encounterInhabitants.secondaryId
      ? pickEnemyForInhabitant(encounterInhabitants.secondaryId, levelRange.id, rng)
      : picks[0] || "guardias de apoyo";
    const creatures = [
      buildCreatureForGroup({
        group: primaryGroup,
        config,
        roomType,
        inhabitantId: encounterInhabitants.primaryId,
        flavorName: leader,
        rng,
      }),
      supportGroup ? buildCreatureForGroup({
        group: supportGroup,
        config,
        roomType,
        inhabitantId: encounterInhabitants.secondaryId || encounterInhabitants.primaryId,
        flavorName: supportFlavor,
        rng,
      }) : null,
    ].filter(Boolean);
    const missingNotes = buildMissingMonsterNotes([primaryGroup, supportGroup], creatures, [leader, supportFlavor]);
    const encounterExtras = [
      `${Math.max(1, Math.ceil(config.playerCount / 2))} elemento(s) de terreno activo`,
      context.narrative?.finalHooks?.[0] ? `objetivo de escena: ${context.narrative.finalHooks[0]}` : "",
    ].filter(Boolean);
    const finalPlan = finalizeEncounterPlan(encounterPlan, creatures, missingNotes);

    return {
      enemies: formatEncounterLines(creatures, encounterExtras),
      creatures,
      encounterExtras,
      encounterPlan: addEncounterContext(finalPlan, encounterInhabitants, context),
      encounterSummary: formatEncounterPlanSummary(finalPlan),
    };
  }

  const primaryGroup = encounterPlan.groups[0];
  const supportGroup = encounterPlan.groups[1];
  const creatures = [
    buildCreatureForGroup({
      group: primaryGroup,
      config,
      roomType,
      inhabitantId: encounterInhabitants.primaryId,
      flavorName: picks[0] || "oponentes principales",
      rng,
    }),
  ].filter(Boolean);
  const encounterExtras = [];

  if (supportGroup) {
    const supportPick = encounterInhabitants.secondaryId
      ? pickEnemyForInhabitant(encounterInhabitants.secondaryId, levelRange.id, rng)
      : picks[1];
    if (supportPick) {
      const supportCreature = buildCreatureForGroup({
        group: supportGroup,
        config,
        roomType,
        inhabitantId: encounterInhabitants.secondaryId || encounterInhabitants.primaryId,
        flavorName: supportPick,
        rng,
      });
      if (supportCreature) {
        creatures.push(supportCreature);
      }
    }
  }
  const missingNotes = buildMissingMonsterNotes([primaryGroup, supportGroup], creatures, [picks[0], picks[1]]);

  if (encounterInhabitants.isMixed) {
    encounterExtras.push(`tension de facciones: ${roomInhabitant?.note || context.inhabitantMix?.relationship?.summary || "dos grupos se cruzan en esta sala"}`);
  }

  if (roomType === "entrada" || roomType === "pasillo") {
    encounterExtras.push("alarma o ruta de retirada cercana");
  }
  const finalPlan = finalizeEncounterPlan(encounterPlan, creatures, missingNotes);

  return {
    enemies: formatEncounterLines(creatures, encounterExtras),
    creatures,
    encounterExtras,
    encounterPlan: addEncounterContext(finalPlan, encounterInhabitants, context),
    encounterSummary: formatEncounterPlanSummary(finalPlan),
  };
}

export function generateEncounter(config, roomType, rng) {
  return generateEncounterBundle(config, roomType, rng).enemies;
}

export function regenerateEnemiesForRooms(rooms, config, rng, dungeon = {}) {
  return rooms.map((room) => regenerateEnemiesForRoom(room, config, rng, {
    zone: getZoneForRoom(dungeon, room),
    inhabitantMix: dungeon.inhabitantMix,
    narrative: dungeon.narrative,
  }));
}

export function regenerateEnemiesForRoom(room, config, rng, context = {}) {
  const roomInhabitant = context.roomInhabitant || inferRoomInhabitant(room, context);
  const encounter = generateEncounterBundle(config, room.type, rng, {
    ...context,
    roomInhabitant,
  });
  return {
    ...room,
    enemies: encounter.enemies,
    creatures: encounter.creatures,
    encounterExtras: encounter.encounterExtras,
    encounterPlan: encounter.encounterPlan,
    encounterSummary: encounter.encounterSummary,
    monsterNotes: generateMonsterNotes(config, room.type, encounter.enemies, rng, encounter.encounterPlan, encounter.creatures),
    inhabitantRole: roomInhabitant.role || room.inhabitantRole || "",
    localInhabitants: roomInhabitant.inhabitants || room.localInhabitants || [],
  };
}

function buildCreatureForGroup({
  group,
  config,
  roomType,
  inhabitantId,
  flavorName,
  rng,
}) {
  const monster = findMonsterManualCandidateForEncounter({
    config,
    group,
    inhabitantId,
    roomType,
    tacticalRole: group?.role || "",
    flavorName,
    rng,
  });

  if (monster) {
    return createOfficialEncounterCreature({
      monster,
      group,
      flavorName,
      tacticalRole: group?.role || "",
    });
  }

  return null;
}

function formatEncounterLines(creatures = [], extras = []) {
  return [
    ...creatures.map((creature) => creature.label),
    ...extras,
  ].filter(Boolean);
}

function finalizeEncounterPlan(plan, creatures = [], missingNotes = []) {
  const groups = creatures.map((creature) => ({
    role: creature.tacticalRole || "principal",
    count: creature.count || 1,
    cr: creature.cr || "",
    crValue: Number(creature.crValue) || 0,
    xpEach: Number(creature.xpEach) || 0,
    totalXp: Number(creature.totalXp) || 0,
  }));
  const spentXp = groups.reduce((sum, group) => sum + group.totalXp, 0);

  return {
    ...plan,
    groups,
    spentXp,
    remainingXp: Math.max(0, (plan?.adjustedBudgetXp || 0) - spentXp),
    warnings: [
      ...(plan?.warnings || []),
      ...missingNotes,
    ],
  };
}

function buildMissingMonsterNotes(groups = [], creatures = [], flavorNames = []) {
  const creatureRoles = new Set(creatures.filter(Boolean).map((creature) => creature.tacticalRole || ""));
  return groups
    .filter(Boolean)
    .filter((group) => !creatureRoles.has(group.role || ""))
    .map((group, index) => {
      const flavor = flavorNames[index] ? ` para "${flavorNames[index]}"` : "";
      return `Sin monstruo verificado del compendio${flavor} en CR objetivo ${group.cr}. Regenera enemigos o elige manualmente una criatura oficial.`;
    });
}

function resolveEncounterInhabitants(config, roomType, context, rng) {
  const mix = context.inhabitantMix || {};
  const roomInhabitant = context.roomInhabitant || {};
  const primaryId = roomInhabitant.inhabitants?.[0]?.id || mix.primary?.id || config.inhabitants;
  const secondaryId = roomInhabitant.inhabitants?.[1]?.id || (roomInhabitant.role === "secondary" ? "" : mix.secondary?.id || "");
  const forceMixed = roomInhabitant.role === "mixed"
    || context.zone?.role === "border"
    || (roomType === "jefe" && Boolean(mix.secondary));

  if (forceMixed && secondaryId && rng() < 0.85) {
    return {
      primaryId,
      secondaryId,
      isMixed: true,
    };
  }

  return {
    primaryId: roomInhabitant.role === "secondary" && mix.secondary?.id ? mix.secondary.id : primaryId,
    secondaryId: "",
    isMixed: false,
  };
}

function pickEnemyForInhabitant(inhabitantId, rangeId, rng) {
  const table = getInhabitantTable(inhabitantId);
  const enemies = table.enemiesByTier?.[rangeId] || table.enemiesByTier?.novice || [];
  return pickOne(rng, enemies, table.label || inhabitantId);
}

function addEncounterContext(plan, encounterInhabitants, context) {
  return {
    ...plan,
    factions: {
      primary: encounterInhabitants.primaryId,
      secondary: encounterInhabitants.secondaryId,
      isMixed: encounterInhabitants.isMixed,
      relationship: context.inhabitantMix?.relationship?.label || "",
      zoneId: context.zone?.id || "",
      zoneRole: context.zone?.role || "",
    },
  };
}

function inferRoomInhabitant(room, context) {
  const local = Array.isArray(room.localInhabitants) ? room.localInhabitants : [];
  if (local.length) {
    return {
      role: room.inhabitantRole || "primary",
      inhabitants: local,
      signSource: local[0]?.id || context.inhabitantMix?.primary?.id || "",
      label: local.map((item) => item.label).join(" + "),
      note: room.narrativeBeat || "",
    };
  }

  const zone = context.zone;
  const mix = context.inhabitantMix || {};
  if (zone?.role === "final" && mix.secondary) {
    return {
      role: "secondary",
      inhabitants: [mix.secondary],
      signSource: mix.secondary.id,
      label: mix.secondary.label,
      note: "La zona final esta dominada por la presencia secundaria.",
    };
  }

  return {
    role: room.inhabitantRole || "primary",
    inhabitants: [mix.primary || { id: context.config?.inhabitants || "", label: "" }].filter((item) => item.id),
    signSource: mix.primary?.id || "",
    label: mix.primary?.label || "",
    note: room.narrativeBeat || "",
  };
}

function getZoneForRoom(dungeon, room) {
  return (dungeon.zones || []).find((zone) => zone.roomIds?.includes(room.id)) || null;
}
