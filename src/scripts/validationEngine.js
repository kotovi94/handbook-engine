import { creationEngine } from "./creationEngine.js";
import { classProgression } from "../data/rules/index.js";

export function getMissingCharacterSteps(character) {
  const missing = [];

  if (!character.classId) missing.push("Clase");
  const level = Math.max(1, Math.min(5, Math.trunc(Number(character.level) || 5)));
  if (level >= 3 && !character.subclassId) missing.push("Subclase");
  if (!character.speciesId) missing.push("Especie");
  if (!character.backgroundId) missing.push("Trasfondo");
  if (character.backgroundId && !creationEngine.getAbilityIncreaseStatus(character).complete) {
    missing.push("Aumentos de trasfondo");
  }
  if (character.abilityMethod === "point-buy" && !creationEngine.getPointBuyStatus(character).complete) {
    missing.push("Compra por puntos");
  }
  if (character.hitPointMethod === "rolled") {
    const requiredRolls = Math.max(0, level - 1);
    const hitDie = classProgression[character.classId]?.hitDie || 8;
    const validRolls = (character.hitPointRolls || []).slice(0, requiredRolls)
      .filter((roll) => Number.isInteger(Number(roll)) && Number(roll) >= 1 && Number(roll) <= hitDie);
    if (validRolls.length < requiredRolls) missing.push("Tiradas de puntos de golpe");
  }
  if (level >= 4 && !character.level4Mode) {
    missing.push("Mejora de nivel 4");
  }
  if (level >= 4 && character.level4Mode === "abilities" && !creationEngine.getLevel4AbilityIncreaseStatus(character).complete) {
    missing.push("Aumentos de nivel 4");
  }
  if (level >= 4 && character.level4Mode === "feat" && !character.level4FeatId) {
    missing.push("Dote de nivel 4");
  }
  if (character.classId && creationEngine.getClassEquipmentOptions(character.classId).length && !character.classEquipmentOptionId) {
    missing.push("Equipo de clase");
  }
  if (character.backgroundId && creationEngine.getBackgroundEquipmentOptions(character.backgroundId).length && !character.backgroundEquipmentOptionId) {
    missing.push("Equipo de trasfondo");
  }

  return missing;
}
