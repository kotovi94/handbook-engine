import { abilityScores } from "../data/character/abilityScores.js";

const storageKey = "handbook-engine-character";

const defaultCharacter = {
  name: "",
  level: 5,
  hitPointMethod: "fixed",
  hitPointRolls: [],
  abilityMethod: "standard-array",
  classId: "",
  subclassId: "",
  speciesId: "",
  backgroundId: "",
  classEquipmentOptionId: "",
  backgroundEquipmentOptionId: "",
  higherLevelGoldRoll: "",
  commonMagicItemId: "",
  uncommonMagicItemId: "",
  featIds: [],
  equipmentIds: [],
  equippedArmorId: "",
  equippedShieldId: "",
  equippedWeaponId: "",
  level4Mode: "",
  level4FeatId: "",
  level4AbilityIncreases: {},
  appearance: {},
  choiceSelections: {},
  baseAbilities: { ...abilityScores },
  backgroundAbilityIncreases: {},
  abilities: { ...abilityScores },
};

let character = loadCharacter();

export function getCharacter() {
  return structuredClone(character);
}

export function updateCharacter(patch) {
  const previousClassId = character.classId;
  const nextLevel = normalizeLevel(patch.level ?? character.level);
  patch = {
    ...patch,
    level: nextLevel,
    ...(nextLevel < 3 ? { subclassId: "" } : {}),
    ...(nextLevel < 4 ? {
      level4Mode: "",
      level4FeatId: "",
      level4AbilityIncreases: Object.fromEntries(Object.keys(character.level4AbilityIncreases).map((ability) => [ability, 0])),
    } : {}),
  };
  const baseAbilities = {
    ...character.baseAbilities,
    ...(patch.baseAbilities || {}),
  };
  const backgroundAbilityIncreases = {
    ...character.backgroundAbilityIncreases,
    ...(patch.backgroundAbilityIncreases || {}),
  };
  const level4AbilityIncreases = {
    ...character.level4AbilityIncreases,
    ...(patch.level4AbilityIncreases || {}),
  };
  const appearance = {
    ...character.appearance,
    ...(patch.appearance || {}),
  };
  const shouldRecalculateAbilities = patch.baseAbilities || patch.backgroundAbilityIncreases || patch.level4AbilityIncreases;

  character = {
    ...character,
    ...patch,
    baseAbilities,
    backgroundAbilityIncreases,
    level4AbilityIncreases,
    appearance,
    abilities: {
      ...(shouldRecalculateAbilities
        ? calculateFinalAbilities(baseAbilities, backgroundAbilityIncreases, level4AbilityIncreases)
        : {
          ...character.abilities,
          ...(patch.abilities || {}),
        }),
    },
    choiceSelections: {
      ...character.choiceSelections,
      ...(patch.choiceSelections || {}),
    },
  };
  saveCharacter();
  notifyClassChange(previousClassId, character.classId);
  return getCharacter();
}

export function resetCharacter() {
  const previousClassId = character.classId;
  character = structuredClone(defaultCharacter);
  saveCharacter();
  notifyClassChange(previousClassId, character.classId);
  return getCharacter();
}

function loadCharacter() {
  try {
    const saved = localStorage.getItem(storageKey);
    const loaded = saved ? { ...defaultCharacter, ...JSON.parse(saved) } : structuredClone(defaultCharacter);
    loaded.level = normalizeLevel(loaded.level);
    if (loaded.level < 3) loaded.subclassId = "";
    if (loaded.level < 4) {
      loaded.level4Mode = "";
      loaded.level4FeatId = "";
      loaded.level4AbilityIncreases = {};
    }
    loaded.baseAbilities = { ...defaultCharacter.baseAbilities, ...(loaded.baseAbilities || {}) };
    loaded.backgroundAbilityIncreases = {
      ...defaultCharacter.backgroundAbilityIncreases,
      ...(loaded.backgroundAbilityIncreases || {}),
    };
    loaded.level4AbilityIncreases = {
      ...defaultCharacter.level4AbilityIncreases,
      ...(loaded.level4AbilityIncreases || {}),
    };
    loaded.appearance = {
      ...defaultCharacter.appearance,
      ...(loaded.appearance || {}),
    };
    loaded.abilities = calculateFinalAbilities(loaded.baseAbilities, loaded.backgroundAbilityIncreases, loaded.level4AbilityIncreases);
    return loaded;
  } catch {
    return structuredClone(defaultCharacter);
  }
}

function normalizeLevel(level) {
  return Math.max(1, Math.min(5, Math.trunc(Number(level) || defaultCharacter.level)));
}

function notifyClassChange(previousClassId, nextClassId) {
  if (previousClassId === nextClassId || typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("handbook-character-class-change", {
    detail: { classId: nextClassId },
  }));
}

function saveCharacter() {
  localStorage.setItem(storageKey, JSON.stringify(character));
}

function calculateFinalAbilities(baseAbilities, backgroundIncreases, level4Increases = {}) {
  return Object.fromEntries(Object.entries(baseAbilities).map(([ability, score]) => [
    ability,
    Math.min(20, Number(score || 0) + Number(backgroundIncreases[ability] || 0) + Number(level4Increases[ability] || 0)),
  ]));
}
