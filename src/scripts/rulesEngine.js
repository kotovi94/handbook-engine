import { classProgression, classSheetRules, spellcastingRules, subclassProgression } from "../data/rules/index.js";
import { choiceSelectionsToEffects, getChoiceStatus, getPendingChoices } from "./choiceEngine.js";
import { creationEngine } from "./creationEngine.js";
import { contentEngine } from "./contentEngine.js";
import { displayName } from "./displayLabels.js";
import { collectEffects, resolveEffects } from "./effectEngine.js";
import { compareSpellLevelThenName, compareVisibleName } from "./sortUtils.js";

export const rulesEngine = {
  getAbilityModifier(score) {
    return Math.floor((Number(score) - 10) / 2);
  },

  getProficiencyBonus(level) {
    return Math.ceil(Number(level || 1) / 4) + 1;
  },

  getAverageHitDie(hitDie) {
    return Math.floor(hitDie / 2) + 1;
  },

  deriveCharacter(character) {
    const level = Math.max(1, Math.min(5, Math.trunc(Number(character.level) || 5)));
    const classData = contentEngine.getClass(character.classId);
    const classRules = classSheetRules[character.classId] || {};
    const subclassData = contentEngine.getSubclass(character.subclassId);
    const speciesData = creationEngine.getSpecies(character.speciesId);
    const backgroundData = creationEngine.getBackground(character.backgroundId);
    const abilities = applyAbilityChoiceBonuses(character);
    const abilityModifiers = Object.fromEntries(
      Object.entries(abilities).map(([ability, score]) => [ability, this.getAbilityModifier(score)]),
    );
    const proficiencyBonus = this.getProficiencyBonus(level);
    const progression = classProgression[character.classId];
    const hitDie = progression?.hitDie || 8;
    const averageHitDie = this.getAverageHitDie(hitDie);
    const classFeaturesByLevel = getFeaturesByLevel(progression?.levels || [], level);
    const subclassFeaturesByLevel = getFeaturesByLevel(subclassProgression[character.subclassId]?.levels || [], level);
    const classFeatureObjects = classFeaturesByLevel.flatMap((entry) => entry.features);
    const subclassFeatureObjects = subclassFeaturesByLevel.flatMap((entry) => entry.features);
    const originEffects = collectEffects([classData, backgroundData]).filter((effect) => !["coin.add", "equipment.grant"].includes(effect.type));
    const baseEffects = [
      ...originEffects,
      ...collectEffects([
        speciesData,
        ...classFeatureObjects,
        ...subclassFeatureObjects,
      ]),
      ...creationEngine.getSelectedEquipmentPackageEffects(character),
    ];
    const baseEffectState = resolveEffects(baseEffects);
    const choiceEffects = choiceSelectionsToEffects(character);
    const choiceEffectState = resolveEffects(choiceEffects);
    const equipmentIds = [
      ...baseEffectState.equipment,
      ...choiceEffectState.equipment,
      ...character.equipmentIds,
    ];
    const equipmentItems = [...new Set(equipmentIds)]
      .map((equipmentId) => creationEngine.getEquipment(equipmentId))
      .filter(Boolean)
      .sort(compareVisibleName);
    const purchasedEquipmentItems = [...new Set(character.equipmentIds || [])]
      .map((equipmentId) => creationEngine.getEquipment(equipmentId))
      .filter(Boolean)
      .sort(compareVisibleName);
    const magicItems = creationEngine.getSelectedMagicItems(character);
    const grantedFeatIds = [
      ...baseEffectState.feats,
      ...character.featIds,
      level >= 4 ? character.level4FeatId : "",
      ...choiceEffectState.feats,
    ].filter(Boolean);
    const grantedFeats = [...new Set(grantedFeatIds)]
      .map((featId) => creationEngine.getFeat(featId))
      .filter(Boolean)
      .sort(compareVisibleName);
    const featureEffects = resolveEffects([
      ...baseEffects,
      ...choiceEffects,
      ...collectEffects(grantedFeats),
      ...collectEffects(equipmentItems),
      ...collectEffects(magicItems),
    ]);
    const fixedSpellChoices = resolveEffects([
      ...baseEffects,
      ...collectEffects(grantedFeats),
      ...collectEffects(equipmentItems),
      ...collectEffects(magicItems),
    ]).spellChoices;
    const toughBonus = (featureEffects.hitPointsPerLevel || 0) * level;
    const hitPointMethod = character.hitPointMethod === "rolled" ? "rolled" : "fixed";
    const hitPointRolls = Array.from({ length: Math.max(0, level - 1) }, (_, index) => {
      const roll = Number(character.hitPointRolls?.[index]);
      return Number.isInteger(roll) && roll >= 1 && roll <= hitDie ? roll : null;
    });
    const hitPointGains = hitPointRolls.map((roll) => hitPointMethod === "rolled"
      ? (roll === null ? 0 : Math.max(1, roll + abilityModifiers.constitution))
      : Math.max(1, averageHitDie + abilityModifiers.constitution));
    const hitPointRollsComplete = hitPointMethod !== "rolled" || hitPointRolls.every((roll) => roll !== null);
    const hitPointMaximum = Math.max(1, hitDie + abilityModifiers.constitution)
      + hitPointGains.reduce((sum, value) => sum + value, 0)
      + toughBonus;
    const hitPointFormula = hitPointMethod === "rolled"
      ? `${hitDie} + CON en nivel 1; tiradas ${hitPointRolls.map((roll) => roll ?? "?").join(", ")} + CON por cada nivel posterior${toughBonus ? "; incluye Duro" : ""}.`
      : `${hitDie} + CON en nivel 1; ${level - 1} x (${averageHitDie} fijo + CON)${toughBonus ? "; incluye Duro" : ""}.`;
    const classFeatures = classFeatureObjects.map(displayName);
    const subclassFeatures = subclassFeatureObjects.map(displayName);
    const equippedArmor = equipmentItems.find((item) => item.id === character.equippedArmorId && item.category === "armor");
    const equippedShield = equipmentItems.find((item) => item.id === character.equippedShieldId && item.category === "shield");
    const equippedWeapon = equipmentItems.find((item) => item.id === character.equippedWeaponId && item.category === "weapon");
    const hasBarbarianUnarmoredDefense = character.classId === "barbarian" && !equippedArmor;
    const hasDanceUnarmoredDefense = character.subclassId === "dance-college" && !equippedArmor && !equippedShield;
    const hasDraconicUnarmoredDefense = character.subclassId === "draconic-sorcery" && !equippedArmor;
    const hasMonkUnarmoredDefense = character.classId === "monk" && !equippedArmor && !equippedShield;
    const armorClassResult = getArmorClass({
      armor: equippedArmor,
      shield: equippedShield,
      dexterityModifier: abilityModifiers.dexterity,
      constitutionModifier: abilityModifiers.constitution,
      wisdomModifier: abilityModifiers.wisdom,
      charismaModifier: abilityModifiers.charisma,
      bonus: featureEffects.armorClassBonuses.reduce((sum, value) => sum + Number(value || 0), 0),
      unarmoredDefense: hasBarbarianUnarmoredDefense ? "barbarian" : hasDanceUnarmoredDefense ? "dance" : hasDraconicUnarmoredDefense ? "draconic" : hasMonkUnarmoredDefense ? "monk" : null,
    });
    const speed = getCharacterSpeed({
      baseSpeed: featureEffects.speed || speciesData?.speed || "Pendiente",
      classId: character.classId,
      armor: equippedArmor,
      shield: equippedShield,
    });
    const higherLevelGold = creationEngine.getHigherLevelGold({ ...character, level });
    const startingCoins = addCoins(featureEffects.coins, higherLevelGold.complete ? { gp: higherLevelGold.totalGp } : {});
    const equipmentPurchase = getEquipmentPurchaseSummary(startingCoins, purchasedEquipmentItems);
    const coins = equipmentPurchase.remainingCoins;
    const passivePerception = 10 + abilityModifiers.wisdom;
    const spellcasting = deriveSpellcasting({
      character,
      classData,
      subclassData,
      featureEffects,
      fixedSpellChoices,
      abilityModifiers,
      proficiencyBonus,
      level,
    });

    return {
      level,
      classData,
      classRules,
      subclassData,
      speciesData,
      backgroundData,
      equipmentItems,
      magicItems,
      grantedFeats,
      abilityModifiers,
      abilities,
      proficiencyBonus,
      hitDie,
      averageHitDie,
      hitPointMaximum,
      hitPointFormula,
      hitPointMethod,
      hitPointRolls,
      hitPointRollsComplete,
      equippedArmor,
      equippedShield,
      equippedWeapon,
      armorClass: armorClassResult.value,
      armorClassFormula: armorClassResult.formula,
      coins,
      coinText: formatCoins(coins),
      startingCoins,
      startingCoinText: formatCoins(startingCoins),
      equipmentPurchase,
      higherLevelGold,
      passivePerception,
      savingThrows: featureEffects.savingThrows.length ? featureEffects.savingThrows : classRules.savingThrows || [],
      armorTraining: featureEffects.armorTraining.length ? featureEffects.armorTraining : classRules.armorTraining || [],
      weaponTraining: featureEffects.weaponTraining.length ? featureEffects.weaponTraining : classRules.weaponTraining || [],
      tools: featureEffects.tools.length ? featureEffects.tools : classRules.tools || [],
      expertise: featureEffects.expertise || [],
      languages: featureEffects.languages.length ? featureEffects.languages : speciesData?.languages || [],
      size: featureEffects.size || speciesData?.size || "Pendiente",
      speed,
      classFeaturesByLevel,
      subclassFeaturesByLevel,
      classFeatureObjects,
      subclassFeatureObjects,
      featureEffects,
      spellcasting,
      pendingChoices: getPendingChoices(character),
      classFeatures,
      subclassFeatures,
      traits: [
        ...(speciesData?.grants?.traits || []),
        ...(grantedFeats.map((feat) => toSheetItem(feat))),
        ...(classFeatureObjects.map((feature) => toSheetItem(feature))),
        ...(subclassFeatureObjects.map((feature) => toSheetItem(feature))),
      ],
      skills: featureEffects.skills.length ? featureEffects.skills : backgroundData?.grants?.skills || [],
    };
  },
};

function getFeaturesByLevel(levels, characterLevel) {
  return levels
    .filter((entry) => entry.level <= characterLevel)
    .map((entry) => ({
      ...entry,
      features: entry.features.map((feature) => normalizeFeature(feature, entry.level)),
    }));
}

function applyAbilityChoiceBonuses(character) {
  const abilities = { ...character.abilities };

  getChoiceStatus(character)
    .filter((choice) => choice.type === "abilityScore")
    .flatMap((choice) => choice.selected || [])
    .forEach((ability) => {
      const key = String(ability).toLowerCase();
      abilities[key] = Math.min(20, Number(abilities[key] || 0) + 1);
    });

  return abilities;
}

function deriveSpellcasting({ character, classData, subclassData, featureEffects, fixedSpellChoices, abilityModifiers, proficiencyBonus, level }) {
  const ability = getSelectedSpellcastingAbility(character) || featureEffects.spellcasting?.ability || null;
  const canCast = Boolean(ability || featureEffects.spellcastingInitiate || featureEffects.spellChoices.length);
  const slots = getSpellSlots(classData?.id, subclassData?.id, level);
  const selectedFromChoices = getChoiceStatus(character)
    .filter((choice) => choice.type === "spell" || choice.type === "cantrip" || choice.type === "spellbook")
    .flatMap((choice) => {
      const kind = choice.id === "warlock-pact-tome-ritual-choice" ? "alwaysPrepared" : choice.type;
      return (choice.selected || []).map((spellId) => ({ id: spellId, kind, source: choice.label || choice.id }));
    });
  const selectedFromEffects = [
    ...(fixedSpellChoices || []),
    ...(featureEffects.spellChoices || []),
  ]
    .flatMap((choice) => (choice.spells || []).map((spellId) => ({ id: spellId, kind: choice.kind, source: "Rasgo" })));
  const selected = dedupeSpellSelections([...selectedFromChoices, ...selectedFromEffects]);
  const cantrips = selected.filter((spell) => spell.kind === "cantrip").sort(compareSpellLevelThenName);
  const preparedSpells = selected.filter((spell) => spell.kind === "spell").sort(compareSpellLevelThenName);
  const alwaysPreparedSpells = selected.filter((spell) => spell.kind === "alwaysPrepared").sort(compareSpellLevelThenName);
  const spellbook = selected.filter((spell) => spell.kind === "spellbook").sort(compareSpellLevelThenName);
  const modifier = ability ? abilityModifiers[ability] : null;

  return {
    canCast,
    ability,
    abilityLabel: ability ? displaySpellAbility(ability) : canCast ? "Pendiente" : "No aplica",
    modifier,
    saveDc: modifier === null ? null : 8 + proficiencyBonus + modifier,
    attackBonus: modifier === null ? null : proficiencyBonus + modifier,
    slots,
    slotEntries: getSpellSlotEntries(slots),
    slotText: formatSpellSlots(slots),
    cantrips,
    preparedSpells,
    alwaysPreparedSpells,
    spellbook,
    preparation: spellcastingRules.preparationByClass[classData?.id] || spellcastingRules.preparationByClass[subclassData?.id] || null,
    rules: spellcastingRules.universalRules,
    formulas: spellcastingRules.formulas,
  };
}

function dedupeSpellSelections(selections) {
  const seen = new Set();
  return selections.filter((selection) => {
    const key = `${selection.kind}:${selection.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getSelectedSpellcastingAbility(character) {
  const selected = getChoiceStatus(character)
    .filter((choice) => choice.type === "spellcastingAbility")
    .flatMap((choice) => choice.selected || []);
  const ability = selected[0];
  return ability ? String(ability).toLowerCase() : null;
}

function getSpellSlots(classId, subclassId, level) {
  return spellcastingRules.slotProgression[classId]?.[level]
    || spellcastingRules.slotProgression[subclassId]?.[level]
    || {};
}

function formatSpellSlots(slots) {
  const entries = getSpellSlotEntries(slots);
  return entries.length ? entries.map((entry) => `Nivel ${entry.level}: ${entry.count}`) : "No aplica";
}

function getSpellSlotEntries(slots) {
  return Object.entries(slots)
    .map(([spellLevel, count]) => ({
      level: Number(spellLevel),
      count: Number(count),
    }))
    .sort((a, b) => a.level - b.level);
}

function displaySpellAbility(ability) {
  const labels = {
    intelligence: "Inteligencia",
    wisdom: "Sabiduría",
    charisma: "Carisma",
  };

  return labels[ability] || ability;
}

function normalizeFeature(feature, fallbackLevel) {
  if (typeof feature === "string") {
    return {
      id: slugify(feature),
      name: feature,
      level: fallbackLevel,
      sheetSection: "classFeatures",
      effects: [],
    };
  }

  return {
    sheetSection: "classFeatures",
    effects: [],
    level: fallbackLevel,
    ...feature,
  };
}

function getArmorClass({ armor, shield, dexterityModifier, constitutionModifier = 0, wisdomModifier = 0, charismaModifier = 0, bonus = 0, unarmoredDefense = null }) {
  const shieldBonus = shield?.acBonus || 0;
  const bonusText = bonus ? ` + bono mágico ${bonus}` : "";

  if (!armor) {
    if (unarmoredDefense === "barbarian") {
      return {
        value: 10 + dexterityModifier + constitutionModifier + shieldBonus + bonus,
        formula: `Defensa sin armadura: 10 + Destreza ${signed(dexterityModifier)} + Constitucion ${signed(constitutionModifier)}${shieldBonus ? ` + escudo ${shieldBonus}` : ""}${bonusText}.`,
      };
    }

    if (unarmoredDefense === "dance") {
      return {
        value: 10 + dexterityModifier + charismaModifier + bonus,
        formula: `Juego de pies deslumbrante: 10 + Destreza ${signed(dexterityModifier)} + Carisma ${signed(charismaModifier)}${bonusText}. No aplica con armadura o escudo.`,
      };
    }

    if (unarmoredDefense === "draconic") {
      return {
        value: 10 + dexterityModifier + charismaModifier + shieldBonus + bonus,
        formula: `Resiliencia dracónica: 10 + Destreza ${signed(dexterityModifier)} + Carisma ${signed(charismaModifier)}${shieldBonus ? ` + escudo ${shieldBonus}` : ""}${bonusText}. No aplica con armadura.`,
      };
    }

    if (unarmoredDefense === "monk") {
      return {
        value: 10 + dexterityModifier + wisdomModifier + bonus,
        formula: `Defensa sin armadura: 10 + Destreza ${signed(dexterityModifier)} + Sabiduría ${signed(wisdomModifier)}${bonusText}. No aplica con armadura o escudo.`,
      };
    }

    return {
      value: 10 + dexterityModifier + shieldBonus + bonus,
      formula: `10 + Destreza ${signed(dexterityModifier)}${shieldBonus ? ` + escudo ${shieldBonus}` : ""}${bonusText}.`,
    };
  }

  if (armor.ac) {
    return {
      value: armor.ac + shieldBonus + bonus,
      formula: `${displayName(armor)}: ${armor.ac}${shieldBonus ? ` + escudo ${shieldBonus}` : ""}${bonusText}.`,
    };
  }

  const dexterityBonus = armor.dexterity === "full"
    ? dexterityModifier
    : armor.dexterity === "max2"
      ? Math.min(2, dexterityModifier)
      : 0;

  return {
    value: armor.acBase + dexterityBonus + shieldBonus + bonus,
    formula: `${displayName(armor)}: ${armor.acBase} + Destreza ${signed(dexterityBonus)}${shieldBonus ? ` + escudo ${shieldBonus}` : ""}${bonusText}.`,
  };
}

function getCharacterSpeed({ baseSpeed, classId, armor, shield }) {
  if (typeof baseSpeed !== "number") {
    return baseSpeed;
  }

  if (classId === "barbarian" && armor?.armorType !== "Heavy") {
    return baseSpeed + 10;
  }

  if (classId === "monk" && !armor && !shield) {
    return baseSpeed + 10;
  }

  return baseSpeed;
}

function addCoins(base = {}, extra = {}) {
  const total = { ...base };
  Object.entries(extra).forEach(([coin, amount]) => {
    total[coin] = (total[coin] || 0) + amount;
  });
  return total;
}

function getEquipmentPurchaseSummary(startingCoins, items) {
  const cost = items.reduce((total, item) => addCoins(total, item.cost || {}), {});
  const startingCopper = coinsToCopper(startingCoins);
  const spentCopper = coinsToCopper(cost);
  const remainingCopper = startingCopper - spentCopper;
  const overspentCopper = Math.max(0, -remainingCopper);

  return {
    items,
    cost,
    costText: formatCoins(cost),
    spentCopper,
    startingCopper,
    remainingCopper,
    remainingCoins: copperToCoins(Math.max(0, remainingCopper)),
    remainingText: formatCoins(copperToCoins(Math.max(0, remainingCopper))),
    overspentCopper,
    overspentText: formatCoins(copperToCoins(overspentCopper)),
    hasOverspent: overspentCopper > 0,
  };
}

function coinsToCopper(coins = {}) {
  const values = {
    cp: 1,
    sp: 10,
    ep: 50,
    gp: 100,
    pp: 1000,
  };

  return Object.entries(coins).reduce((sum, [coin, amount]) => sum + (values[coin] || 0) * Number(amount || 0), 0);
}

function copperToCoins(copperAmount) {
  let remaining = Math.max(0, Math.floor(Number(copperAmount || 0)));
  const entries = [
    ["gp", 100],
    ["sp", 10],
    ["cp", 1],
  ];
  const coins = {};

  entries.forEach(([coin, value]) => {
    const amount = Math.floor(remaining / value);
    if (amount) {
      coins[coin] = amount;
      remaining -= amount * value;
    }
  });

  return coins;
}

function formatCoins(coins) {
  const labels = {
    cp: "PC",
    sp: "PP",
    ep: "PE",
    gp: "PO",
    pp: "PPT",
  };

  const entries = Object.entries(coins).filter(([, amount]) => amount);

  if (!entries.length) {
    return "0 PO";
  }

  return entries.map(([coin, amount]) => `${amount} ${labels[coin] || coin.toUpperCase()}`).join(", ");
}

function signed(value) {
  return value >= 0 ? `+${value}` : String(value);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toSheetItem(item) {
  return {
    id: item.id,
    name: item.name,
    label: item.label,
    description: item.description || item.summary || "",
    sheetText: item.sheetText || item.name,
    effects: item.effects || [],
  };
}
