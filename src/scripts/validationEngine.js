import { creationEngine } from "./creationEngine.js";

export function getMissingCharacterSteps(character) {
  const missing = [];

  if (!character.classId) missing.push("Clase");
  if (!character.subclassId) missing.push("Subclase");
  if (!character.speciesId) missing.push("Especie");
  if (!character.backgroundId) missing.push("Trasfondo");
  if (character.backgroundId && !creationEngine.getAbilityIncreaseStatus(character).complete) {
    missing.push("Aumentos de trasfondo");
  }
  if (character.abilityMethod === "point-buy" && !creationEngine.getPointBuyStatus(character).complete) {
    missing.push("Compra por puntos");
  }
  if (!character.level4Mode) {
    missing.push("Mejora de nivel 4");
  }
  if (character.level4Mode === "abilities" && !creationEngine.getLevel4AbilityIncreaseStatus(character).complete) {
    missing.push("Aumentos de nivel 4");
  }
  if (character.level4Mode === "feat" && !character.level4FeatId) {
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
