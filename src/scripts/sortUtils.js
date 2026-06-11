import { spells } from "../data/rules/spells/index.js";
import { displayChoiceOption, displayName, displayValue } from "./displayLabels.js";

const visibleNameCollator = new Intl.Collator("es", {
  sensitivity: "base",
  numeric: true,
});
const spellLookup = Object.fromEntries(spells.flatMap((spell) => [
  [normalizeKey(spell.id), spell],
  [normalizeKey(spell.name), spell],
  [normalizeKey(spell.label), spell],
  [normalizeKey(displayValue(spell.id)), spell],
]));

const mechanicalChoiceTypes = new Set([
  "abilityScore",
  "speciesSize",
]);
const spellChoiceTypes = new Set([
  "cantrip",
  "spell",
  "spellbook",
]);

export function compareVisibleName(a, b) {
  return visibleNameCollator.compare(visibleName(a), visibleName(b));
}

export function sortByVisibleName(items) {
  return [...(items || [])].sort(compareVisibleName);
}

export function sortChoiceOptions(choice) {
  const options = choice?.from || [];

  if (mechanicalChoiceTypes.has(choice?.type)) {
    return options;
  }

  if (spellChoiceTypes.has(choice?.type)) {
    return sortSpellsByLevelThenName(options);
  }

  return [...options].sort((a, b) =>
    visibleNameCollator.compare(displayChoiceOption(choice, a), displayChoiceOption(choice, b)),
  );
}

export function compareDisplayValue(a, b) {
  return visibleNameCollator.compare(displayValue(a), displayValue(b));
}

export function compareSpellLevelThenName(a, b) {
  const spellA = resolveSpell(a);
  const spellB = resolveSpell(b);
  const levelA = Number.isFinite(Number(spellA?.level)) ? Number(spellA.level) : 99;
  const levelB = Number.isFinite(Number(spellB?.level)) ? Number(spellB.level) : 99;

  if (levelA !== levelB) {
    return levelA - levelB;
  }

  return visibleNameCollator.compare(spellVisibleName(a, spellA), spellVisibleName(b, spellB));
}

export function sortSpellsByLevelThenName(items) {
  return [...(items || [])].sort(compareSpellLevelThenName);
}

export function resolveSpell(item) {
  if (!item) {
    return null;
  }

  if (typeof item === "string") {
    return spellLookup[normalizeKey(item)] || null;
  }

  if (item.level !== undefined) {
    return item;
  }

  return spellLookup[normalizeKey(item.id)] || null;
}

function visibleName(item) {
  if (!item) {
    return "";
  }

  if (typeof item === "string") {
    return displayValue(item);
  }

  return item.label || item.name || item.id || "";
}

function spellVisibleName(item, spell) {
  const itemId = typeof item === "string" ? item : item?.id;

  if (itemId) {
    return displayValue(itemId);
  }

  if (spell) {
    return displayName(spell) || spell.id;
  }

  return displayName(item);
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
