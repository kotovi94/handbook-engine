import { CalculationGrid } from "../components/CalculationBox.js";
import { Icon } from "../components/Icon.js";
import { PendingPanel } from "../components/PendingPanel.js";
import { ProgressionList } from "../components/ProgressionList.js";
import { SheetSectionList } from "../components/SheetField.js";
import { getCharacter } from "../scripts/characterState.js";
import { queueCampaignHandoff } from "../scripts/campaignHandoff.js";
import { displayName } from "../scripts/displayLabels.js";
import { rulesEngine } from "../scripts/rulesEngine.js";
import { mapCharacterToSheetSections } from "../scripts/sheetMapper.js";

const xpByLevel = { 1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500 };
const classColors = {
  artificer: "#6f5aa8",
  barbarian: "#a53e35",
  bard: "#9a4f88",
  cleric: "#8a7a52",
  druid: "#4f7d45",
  fighter: "#8f4c32",
  monk: "#b47b32",
  paladin: "#b8872e",
  ranger: "#4d7b57",
  rogue: "#4f5f66",
  sorcerer: "#a34f62",
  warlock: "#654a86",
  wizard: "#4865a8",
};

export function CharacterSummaryPage() {
  const character = getCharacter();
  const derived = rulesEngine.deriveCharacter(character);
  const page = document.createElement("section");
  page.className = "section-stack";

  page.innerHTML = `
    <div>
      <p class="page-kicker">Resumen</p>
      <h2 class="page-title">Hoja física</h2>
    </div>
  `;

  page.append(PendingPanel({ character }));
  page.append(CharacterCampaignHandoffPanel({ character, derived }));

  page.append(CalculationGrid([
    {
      title: "Armor Class",
      value: derived.armorClass,
      formula: "Armadura equipada o 10 + Dexterity modifier.",
    },
    {
      title: "Hit Point Maximum",
      value: derived.hitPointMaximum,
      formula: derived.hitPointFormula,
    },
    {
      title: "Proficiency Bonus",
      value: `+${derived.proficiencyBonus}`,
      formula: "Nivel 5 usa +3.",
    },
  ]));
  page.append(ProgressionList({ title: `Rasgos de clase hasta nivel ${derived.level}`, entries: derived.classFeaturesByLevel }));
  page.append(ProgressionList({ title: `Rasgos de subclase hasta nivel ${derived.level}`, entries: derived.subclassFeaturesByLevel }));
  page.append(SheetSectionList(mapCharacterToSheetSections(character)));

  return page;
}

function CharacterCampaignHandoffPanel({ character, derived }) {
  const panel = document.createElement("article");
  panel.className = "campaign-handoff-panel";

  const icon = document.createElement("span");
  icon.className = "campaign-handoff-icon";
  icon.append(Icon({ name: "person" }));

  const copy = document.createElement("div");
  copy.className = "campaign-handoff-copy";

  const kicker = document.createElement("span");
  kicker.className = "campaign-handoff-kicker";
  kicker.textContent = "Siguiente paso";

  const title = document.createElement("h3");
  title.textContent = "Llevar este personaje a Campañas";

  const description = document.createElement("p");
  description.textContent = "Prepara una ficha rápida con clase, nivel, color y notas de hoja para agregarla a la campaña activa.";

  const meta = document.createElement("dl");
  meta.className = "campaign-handoff-meta";
  [
    ["Personaje", getCharacterTitle(character, derived)],
    ["Clase", getCharacterRole(derived) || "Pendiente"],
    ["Nivel", String(derived.level || 5)],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    item.append(dt, dd);
    meta.append(item);
  });

  copy.append(kicker, title, description, meta);

  const actionArea = document.createElement("div");
  actionArea.className = "campaign-handoff-actions";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button";
  button.append(Icon({ name: "map" }), document.createTextNode("Enviar a Campañas"));

  const status = document.createElement("p");
  status.className = "campaign-handoff-status";
  status.setAttribute("aria-live", "polite");

  button.addEventListener("click", () => {
    const queued = queueCampaignHandoff(createCharacterHandoff(character, derived));
    status.textContent = queued
      ? "Personaje listo para importar en Campañas."
      : "No se pudo preparar la importación a Campañas.";
    if (queued) {
      window.location.href = "./campaigns/";
    }
  });

  actionArea.append(button, status);
  panel.append(icon, copy, actionArea);
  return panel;
}

function createCharacterHandoff(character, derived) {
  const title = getCharacterTitle(character, derived);
  const role = getCharacterRole(derived);
  const species = displayName(derived.speciesData);
  const background = displayName(derived.backgroundData);
  const summary = [
    species,
    role,
    background ? `trasfondo ${background}` : "",
    `nivel ${derived.level || 5}`,
  ].filter(Boolean).join(" · ");

  return {
    kind: "character",
    source: "character-creator",
    title,
    summary,
    tags: ["personaje", species, displayName(derived.classData), displayName(derived.subclassData)].filter(Boolean),
    character: {
      kind: "player",
      name: title,
      player: "",
      className: role || "Aventurero",
      xp: xpByLevel[derived.level] || 0,
      color: classColors[character.classId] || "#b97a45",
      portrait: "",
      notes: {
        format: "character-handoff-v1",
        plainText: createCharacterNotes(character, derived, { title, summary }),
        blocks: [],
      },
      metadata: {
        source: "character-creator",
        level: derived.level || 5,
        species,
        background,
      },
    },
  };
}

function createCharacterNotes(character, derived, { title, summary }) {
  const sections = mapCharacterToSheetSections(character);
  const lines = [
    `Ficha generada desde Handbook Engine.`,
    `Personaje: ${title}`,
    `Resumen: ${summary || "Sin resumen completo"}`,
    `CA: ${derived.armorClass}`,
    `PG máximos: ${derived.hitPointMaximum}`,
    `Competencia: +${derived.proficiencyBonus}`,
  ];

  sections.forEach((section) => {
    lines.push("", section.title);
    (section.fields || []).forEach((field) => {
      lines.push(`- ${field.field}: ${formatSheetValue(field.value)}`);
    });
  });

  return lines.join("\n");
}

function getCharacterTitle(character, derived) {
  const savedName = String(character.name || "").trim();
  if (savedName) return savedName;

  const species = displayName(derived.speciesData);
  const className = displayName(derived.classData);
  return [species, className].filter(Boolean).join(" ") || "Personaje sin nombre";
}

function getCharacterRole(derived) {
  return [displayName(derived.classData), displayName(derived.subclassData)]
    .filter(Boolean)
    .join(" / ");
}

function formatSheetValue(value) {
  if (Array.isArray(value)) {
    return value.map(formatSheetValue).filter(Boolean).join("; ");
  }
  return String(value ?? "");
}
