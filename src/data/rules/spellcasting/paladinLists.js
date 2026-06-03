export const paladinSpellsLevel1 = [
  "bless",
  "command",
  "compelled-duel",
  "cure-wounds",
  "detect-evil-and-good",
  "detect-magic",
  "detect-poison-and-disease",
  "divine-favor",
  "divine-smite",
  "heroism",
  "protection-from-evil-and-good",
  "purify-food-and-drink",
  "searing-smite",
  "shield-of-faith",
  "thunderous-smite",
  "wrathful-smite",
];

export const paladinSpellsLevel2 = [
  "aid",
  "find-steed",
  "gentle-repose",
  "lesser-restoration",
  "locate-object",
  "magic-weapon",
  "prayer-of-healing",
  "protection-from-poison",
  "shining-smite",
  "warding-bond",
  "zone-of-truth",
];

export const paladinPreparedSpellsLevel5 = [
  ...paladinSpellsLevel1,
  ...paladinSpellsLevel2,
];

export const paladinOathSpellsLevel5 = {
  "devotion-oath": ["protection-from-evil-and-good", "shield-of-faith", "aid", "zone-of-truth"],
  "glory-oath": ["guiding-bolt", "heroism", "enhance-ability", "magic-weapon"],
  "ancients-oath": ["ensnaring-strike", "speak-with-animals", "misty-step", "moonbeam"],
  "vengeance-oath": ["bane", "hunters-mark", "hold-person", "misty-step"],
};
