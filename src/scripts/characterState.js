import { abilityScores } from "../data/character/abilityScores.js";

const storageKey = "handbook-engine-character";

const defaultCharacter = {
  name: "",
  level: 5,
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
  const shouldRecalculateAbilities = patch.baseAbilities || patch.backgroundAbilityIncreases || patch.level4AbilityIncreases;

  character = {
    ...character,
    ...patch,
    baseAbilities,
    backgroundAbilityIncreases,
    level4AbilityIncreases,
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
  return getCharacter();
}

export function resetCharacter() {
  character = structuredClone(defaultCharacter);
  saveCharacter();
  return getCharacter();
}

function loadCharacter() {
  try {
    const saved = localStorage.getItem(storageKey);
    const loaded = saved ? { ...defaultCharacter, ...JSON.parse(saved), level: 5 } : structuredClone(defaultCharacter);
    loaded.baseAbilities = { ...defaultCharacter.baseAbilities, ...(loaded.baseAbilities || {}) };
    loaded.backgroundAbilityIncreases = {
      ...defaultCharacter.backgroundAbilityIncreases,
      ...(loaded.backgroundAbilityIncreases || {}),
    };
    loaded.level4AbilityIncreases = {
      ...defaultCharacter.level4AbilityIncreases,
      ...(loaded.level4AbilityIncreases || {}),
    };
    loaded.abilities = calculateFinalAbilities(loaded.baseAbilities, loaded.backgroundAbilityIncreases, loaded.level4AbilityIncreases);
    return loaded;
  } catch {
    return structuredClone(defaultCharacter);
  }
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
