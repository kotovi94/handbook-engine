import {
  wizardCantrips,
  wizardSpellsLevel1,
} from "./wizardLists.js";

export const arcaneTricksterCantripsLevel5 = wizardCantrips.filter((spellId) => spellId !== "mage-hand");

export const arcaneTricksterPreparedSpellsLevel5 = wizardSpellsLevel1;
