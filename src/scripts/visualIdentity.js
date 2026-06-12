const entityIcons = {
  fighter: "sword",
  wizard: "book",
  cleric: "sun",
  barbarian: "axe",
  bard: "music",
  druid: "leaf",
  monk: "sun",
  paladin: "shield",
  ranger: "bow",
  rogue: "dagger",
  sorcerer: "spark",
  warlock: "eye",
  artificer: "cog",
  aasimar: "spark",
  dragonborn: "dragon",
  dwarf: "hammer",
  elf: "leaf",
  gnome: "gem",
  goliath: "mountain",
  halfling: "clover",
  human: "person",
  orc: "axe",
  tiefling: "flame",
  acolyte: "sun",
  artisan: "tools",
  charlatan: "cards",
  criminal: "dagger",
  entertainer: "music",
  farmer: "wheat",
  guard: "shield",
  guide: "compass",
  hermit: "candle",
  merchant: "coins",
  noble: "crown",
  sage: "book",
  sailor: "anchor",
  scribe: "quill",
  soldier: "sword",
  wayfarer: "map",
};

const classIcons = new Set([
  "fighter", "wizard", "cleric", "barbarian", "bard", "druid", "monk",
  "paladin", "ranger", "rogue", "sorcerer", "warlock", "artificer",
]);

export function getVisualIcon(item = {}) {
  if (item.icon) {
    return item.icon;
  }

  if (entityIcons[item.id]) {
    return entityIcons[item.id];
  }

  if (item.classId && classIcons.has(item.classId)) {
    return entityIcons[item.classId];
  }

  if (item.category === "weapon") {
    return "sword";
  }

  if (item.category === "armor" || item.category === "shield") {
    return item.category === "shield" ? "shield" : "armor";
  }

  if (item.category === "gear") {
    return "tools";
  }

  if (item.category === "Origin") {
    return "spark";
  }

  if (item.category === "Fighting Style") {
    return "sword";
  }

  if (item.category || item.prerequisite !== undefined) {
    return "book";
  }

  return "";
}

export function getClassIcon(classId) {
  return entityIcons[classId] || "shield";
}
