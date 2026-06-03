import { abilityLabels } from "../data/character/abilityScores.js";
import { creationSteps } from "../data/character/creationSteps.js";
import { backgrounds, equipment, feats, higherLevelStartingEquipment, magicItems, species } from "../data/rules/index.js";
import { contentEngine } from "./contentEngine.js";

const speciesIndex = byId(species);
const backgroundIndex = byId(backgrounds);
const featIndex = byId(feats);
const equipmentIndex = byId(equipment);
const magicItemIndex = byId(magicItems);
const abilityMethodOptions = [
  {
    id: "standard-array",
    label: "Standard array",
    summary: "Usa 15, 14, 13, 12, 10 y 8 asignados a las caracteristicas.",
  },
  {
    id: "point-buy",
    label: "Compra por puntos",
    summary: "Usa 27 puntos. Las puntuaciones base van de 8 a 15 antes del trasfondo.",
  },
  {
    id: "manual",
    label: "Manual",
    summary: "Permite ajustar las puntuaciones si la mesa usa tiradas o compra por puntos.",
  },
];
const pointBuyCosts = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const creationEngine = {
  getSteps() {
    return creationSteps;
  },

  getStep(stepId) {
    return creationSteps.find((step) => step.id === stepId) || creationSteps[0];
  },

  getStepIndex(stepId) {
    return Math.max(0, creationSteps.findIndex((step) => step.id === stepId));
  },

  getNextStep(stepId) {
    return creationSteps[this.getStepIndex(stepId) + 1] || null;
  },

  getPreviousStep(stepId) {
    return creationSteps[this.getStepIndex(stepId) - 1] || null;
  },

  getChoices(stepId) {
    if (stepId === "class") {
      return contentEngine.getClasses();
    }

    if (stepId === "subclass") {
      return [];
    }

    if (stepId === "species") {
      return species;
    }

    if (stepId === "background") {
      return backgrounds;
    }

    if (stepId === "equipment") {
      return equipment.map(enrichEquipmentChoice);
    }

    return [];
  },

  getSelectionKey(stepId) {
    const keys = {
      class: "classId",
      subclass: "subclassId",
      species: "speciesId",
      background: "backgroundId",
      equipment: "equipmentIds",
    };

    return keys[stepId] || "";
  },

  getSpecies(speciesId) {
    return speciesIndex[speciesId] || null;
  },

  getSubclassChoices(classId) {
    return classId ? contentEngine.getSubclassesByClass(classId) : [];
  },

  getBackground(backgroundId) {
    return backgroundIndex[backgroundId] || null;
  },

  getAbilityMethodOptions() {
    return abilityMethodOptions;
  },

  getBackgroundAbilityOptions(backgroundId) {
    return (backgroundIndex[backgroundId]?.abilityOptions || []).map((ability) => ({
      id: ability.toLowerCase(),
      source: ability,
      label: abilityLabels[ability.toLowerCase()] || ability,
    }));
  },

  getAbilityIncreaseStatus(character) {
    const background = this.getBackground(character.backgroundId);
    const allowed = new Set((background?.abilityOptions || []).map((ability) => ability.toLowerCase()));
    const entries = Object.entries(character.backgroundAbilityIncreases || {});
    const used = entries.filter(([, value]) => Number(value) > 0);
    const total = used.reduce((sum, [, value]) => sum + Number(value || 0), 0);
    const hasInvalidAbility = used.some(([ability]) => !allowed.has(ability));
    const hasInvalidValue = used.some(([, value]) => ![0, 1, 2].includes(Number(value)));
    const values = used.map(([, value]) => Number(value));
    const isPlusTwoPlusOne = values.length === 2 && values.includes(2) && values.includes(1);
    const isThreePlusOne = values.length === 3 && values.every((value) => value === 1);

    return {
      total,
      complete: Boolean(background) && !hasInvalidAbility && !hasInvalidValue && total === 3 && (isPlusTwoPlusOne || isThreePlusOne),
      allowed: [...allowed],
    };
  },

  getPointBuyStatus(character) {
    const scores = Object.values(character.baseAbilities || {});
    const spent = scores.reduce((sum, score) => sum + (pointBuyCosts[Number(score)] ?? 99), 0);
    const invalidScores = scores.filter((score) => !Object.hasOwn(pointBuyCosts, Number(score)));

    return {
      spent,
      remaining: 27 - spent,
      complete: invalidScores.length === 0 && spent === 27,
      valid: invalidScores.length === 0 && spent <= 27,
      invalidScores,
      costs: pointBuyCosts,
    };
  },

  getFeat(featId) {
    return featIndex[featId] || null;
  },

  getLevel4FeatChoices(character) {
    const granted = new Set(this.getGrantedFeats({ ...character, level4FeatId: "" }));
    return feats
      .filter((feat) => !granted.has(feat.id))
      .map((feat) => ({
        ...feat,
        summary: [feat.summary, feat.prerequisite ? `Requisito: ${feat.prerequisite}` : ""].filter(Boolean).join(" "),
      }));
  },

  getClassEquipmentOptions(classId) {
    const classData = contentEngine.getClass(classId);
    return normalizeEquipmentOptions(classData?.equipmentOptions || []);
  },

  getBackgroundEquipmentOptions(backgroundId) {
    const background = this.getBackground(backgroundId);
    return normalizeEquipmentOptions(background?.equipmentOptions || []);
  },

  getEquipmentOptionSummary(option) {
    const itemLabels = (option.items || [])
      .map((itemId) => this.getEquipment(itemId)?.label || itemId)
      .join(", ");
    const coinText = formatCoins(option.coins || {});
    return [itemLabels, coinText].filter(Boolean).join("; ") || "Sin equipo adicional.";
  },

  getSelectedEquipmentPackageEffects(character) {
    const classOption = this.getClassEquipmentOptions(character.classId)
      .find((option) => option.id === character.classEquipmentOptionId);
    const backgroundOption = this.getBackgroundEquipmentOptions(character.backgroundId)
      .find((option) => option.id === character.backgroundEquipmentOptionId);

    return [classOption, backgroundOption].filter(Boolean).flatMap((option) => [
      ...(option.items?.length ? [{ type: "equipment.grant", items: option.items }] : []),
      ...(Object.keys(option.coins || {}).length ? [{ type: "coin.add", coins: option.coins }] : []),
    ]);
  },

  getHigherLevelStartingEquipment(level = 5) {
    return higherLevelStartingEquipment.find((entry) => level >= entry.minLevel && level <= entry.maxLevel) || null;
  },

  getHigherLevelGold(character) {
    const rule = this.getHigherLevelStartingEquipment(character.level || 5);
    const rollValue = Number(character.higherLevelGoldRoll || 0);
    const rollBonus = rule?.roll && rollValue ? rollValue * rule.roll.multiplier : 0;
    const baseGp = rule?.baseCoins?.gp || 0;

    return {
      rule,
      rollValue,
      baseGp,
      rollBonus,
      totalGp: baseGp + rollBonus,
      complete: !rule?.roll || rollValue >= 1,
      formula: rule?.roll
        ? `${baseGp} PO + ${rollValue || "1d10"} x ${rule.roll.multiplier} PO`
        : formatCoins(rule?.baseCoins || {}),
    };
  },

  getLevel4AbilityIncreaseStatus(character) {
    const entries = Object.entries(character.level4AbilityIncreases || {});
    const used = entries.filter(([, value]) => Number(value) > 0);
    const total = used.reduce((sum, [, value]) => sum + Number(value || 0), 0);
    const hasInvalidValue = used.some(([, value]) => ![0, 1, 2].includes(Number(value)));
    const exceedsCap = used.some(([ability, value]) => {
      const beforeLevel4 = Number(character.baseAbilities?.[ability] || 0) + Number(character.backgroundAbilityIncreases?.[ability] || 0);
      return beforeLevel4 + Number(value || 0) > 20;
    });
    const values = used.map(([, value]) => Number(value));
    const isPlusTwo = values.length === 1 && values[0] === 2;
    const isTwoPlusOne = values.length === 2 && values.every((value) => value === 1);

    return {
      total,
      complete: !hasInvalidValue && !exceedsCap && total === 2 && (isPlusTwo || isTwoPlusOne),
      allowed: Object.keys(abilityLabels),
    };
  },

  getEquipment(equipmentId) {
    return equipmentIndex[equipmentId] || null;
  },

  getMagicItem(magicItemId) {
    return magicItemIndex[magicItemId] || null;
  },

  getMagicItemsByRarity(rarity) {
    return magicItems.filter((item) => item.rarity === rarity);
  },

  getSelectedMagicItems(character) {
    return [character.commonMagicItemId, character.uncommonMagicItemId]
      .map((magicItemId) => this.getMagicItem(magicItemId))
      .filter(Boolean);
  },

  getGrantedFeats(character) {
    const background = this.getBackground(character.backgroundId);
    const selectedFeatIds = Object.values(character.choiceSelections || {})
      .flat()
      .filter((value) => featIndex[value]);
    return [...new Set([background?.grants?.featId, ...character.featIds, character.level4FeatId, ...selectedFeatIds].filter(Boolean))];
  },

  getAbilityEntries(character) {
    return Object.entries(character.baseAbilities).map(([id, score]) => ({
      id,
      label: abilityLabels[id],
      baseScore: score,
      increase: character.backgroundAbilityIncreases?.[id] || 0,
      level4Increase: character.level4AbilityIncreases?.[id] || 0,
      finalScore: character.abilities[id],
    }));
  },
};

function byId(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function normalizeEquipmentOptions(options) {
  return options.map((option) => ({
    ...option,
    name: option.name || option.label,
    summary: option.summary || formatOptionSummary(option),
    items: option.items || option.equipment || [],
  }));
}

function formatOptionSummary(option) {
  const items = option.items || option.equipment || [];
  const itemText = items.length ? `${items.length} objetos` : "sin objetos";
  const coinText = formatCoins(option.coins || {});
  return [itemText, coinText].filter(Boolean).join("; ");
}

function formatCoins(coins) {
  const labels = { cp: "PC", sp: "PP", ep: "PE", gp: "PO", pp: "PPT" };
  const entries = Object.entries(coins).filter(([, amount]) => amount);
  return entries.map(([coin, amount]) => `${amount} ${labels[coin] || coin.toUpperCase()}`).join(", ");
}

function enrichEquipmentChoice(item) {
  const details = [
    item.damageLabel ? `Dano ${item.damageLabel}` : "",
    item.range ? `Alcance ${item.range}` : "",
    item.ac ? `CA ${item.ac}` : "",
    item.acBase ? `CA ${item.acBase}${item.dexterity === "max2" ? " + DES max 2" : item.dexterity === "full" ? " + DES" : ""}` : "",
    item.mastery ? `Maestria ${item.mastery}` : "",
    item.cost ? `Precio ${formatCoins(item.cost)}` : "",
    item.weight ? `Peso ${item.weight}` : "",
  ].filter(Boolean);

  return {
    ...item,
    summary: details.length ? details.join("; ") : item.summary,
  };
}
