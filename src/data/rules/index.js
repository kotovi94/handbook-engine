import { classes } from "./classes/index.js";

export { classes } from "./classes/index.js";
export { subclasses } from "./subclasses/index.js";
export { species } from "./species/index.js";
export { backgrounds } from "./backgrounds/index.js";
export { feats } from "./feats/index.js";
export { equipment } from "./equipment/index.js";
export { magicItems } from "./magic-items/index.js";
export { spells } from "./spells/index.js";
export { spellcastingRules } from "./spellcasting/index.js";
export { proficiencies } from "./proficiencies/index.js";
export { classProgression, higherLevelStartingEquipment, subclassProgression } from "./advancement/index.js";
export const classSheetRules = Object.fromEntries(classes.map((classData) => [
  classData.id,
  {
    startingCoins: classData.startingCoins,
    savingThrows: classData.savingThrows,
    armorTraining: classData.armorTraining,
    weaponTraining: classData.weaponTraining,
    tools: classData.tools,
  },
]));
