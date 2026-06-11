import { rulesEngine } from "../scripts/rulesEngine.js";
import { creationEngine } from "../scripts/creationEngine.js";
import { getMissingCharacterSteps } from "../scripts/validationEngine.js";
import { compareVisibleName } from "../scripts/sortUtils.js";

const choiceLabels = {
  skill: ["habilidad", "habilidades"],
  language: ["idioma", "idiomas"],
  landType: ["tipo de tierra", "tipos de tierra"],
  cantrip: ["truco", "trucos"],
  spell: ["conjuro", "conjuros"],
  spellbook: ["conjuro del grimorio", "conjuros del grimorio"],
  equipment: ["equipo", "equipos"],
  feat: ["dote", "dotes"],
  fightingStyle: ["estilo de combate", "estilos de combate"],
  weaponMastery: ["arma con maestria", "armas con maestria"],
  maneuver: ["maniobra", "maniobras"],
  tool: ["herramienta", "herramientas"],
  rune: ["runa", "runas"],
  speciesSize: ["tamano", "tamanos"],
  beastCompanion: ["bestia primal", "bestias primales"],
  hunterPrey: ["presa del cazador", "presas del cazador"],
  draconicAncestry: ["ascendencia draconica", "ascendencias draconicas"],
  elvenLineage: ["linaje elfico", "linajes elficos"],
  gnomeLineage: ["linaje gnomo", "linajes gnomos"],
  giantAncestry: ["ascendencia gigante", "ascendencias gigantes"],
  fiendishLegacy: ["legado infernal", "legados infernales"],
  spellcastingAbility: ["atributo de magia", "atributos de magia"],
  artisanTool: ["herramienta de artesano", "herramientas de artesano"],
  gamingSet: ["juego", "juegos"],
  musicalInstrument: ["instrumento", "instrumentos"],
  abilityScore: ["atributo", "atributos"],
  expertise: ["pericia", "pericias"],
  invocation: ["invocacion", "invocaciones"],
  metamagic: ["metamagia", "metamagias"],
  damageType: ["tipo de dano", "tipos de dano"],
  magicItemPlan: ["plan de objeto magico", "planes de objeto magico"],
  magicItemCreated: ["objeto replicado", "objetos replicados"],
  armorModel: ["modelo de armadura", "modelos de armadura"],
  divineOrder: ["orden divina", "ordenes divinas"],
  primalOrder: ["orden primal", "ordenes primales"],
};

export function PendingPanel({ character, compact = false } = {}) {
  const derived = rulesEngine.deriveCharacter(character);
  const pending = getPendingItems(character, derived);
  const notices = getTableNoticeItems(character, derived);
  const panel = document.createElement("section");
  panel.className = compact ? "pending-panel is-compact" : "pending-panel";

  if (!pending.length && !notices.length) {
    panel.innerHTML = `
      <h3>Elecciones pendientes</h3>
      <p class="pending-ok">Sin elecciones obligatorias pendientes.</p>
    `;
    return panel;
  }

  panel.innerHTML = `
    <h3>Elecciones pendientes</h3>
    ${pending.length
      ? `<ul class="pending-list">${pending.map((item) => `<li>${item}</li>`).join("")}</ul>`
      : `<p class="pending-ok">Sin elecciones obligatorias pendientes.</p>`}
    ${notices.length
      ? `
        <h3>Avisos de mesa</h3>
        <ul class="pending-list pending-notice-list">
          ${notices.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      `
      : ""}
  `;

  return panel;
}

export function getPendingItems(character, derived = rulesEngine.deriveCharacter(character)) {
  return [
    ...getMissingCharacterSteps(character).map((step) => `Falta elegir ${step.toLowerCase()}.`),
    ...[...derived.pendingChoices].sort(compareVisibleName).map(formatPendingChoice),
    ...getSheetPendingItems(character, derived),
  ];
}

function formatPendingChoice(choice) {
  if (choice.requiresChoiceLabel && !choice.from?.length) {
    return `Completa primero ${choice.requiresChoiceLabel} para elegir ${choice.label || choice.id}.`;
  }

  const labels = choiceLabels[choice.type] || ["opcion", "opciones"];
  const plural = choice.remaining === 1 ? labels[0] : labels[1];
  const name = choice.label || choice.id;
  return `Falta elegir ${choice.remaining} ${plural}: ${name}.`;
}

function getSheetPendingItems(character, derived) {
  const pending = [];
  const weapons = derived.equipmentItems.filter((item) => item.category === "weapon");

  if (weapons.length && !character.equippedWeaponId) {
    pending.push("Falta elegir arma equipada.");
  }

  if (derived.equipmentPurchase?.hasOverspent) {
    pending.push(`El equipo adicional excede el oro disponible por ${derived.equipmentPurchase.overspentText}.`);
  }

  return pending;
}

function getTableNoticeItems(character, derived) {
  const notices = [];
  const higherLevelEquipment = creationEngine.getHigherLevelStartingEquipment(character.level || 5);

  if (higherLevelEquipment && !derived.higherLevelGold.complete) {
    notices.push("Mesa: define si usan oro avanzado de nivel 5; si aplica, falta tirar 1d10.");
  }

  if (higherLevelEquipment?.magicItems?.length) {
    if (!character.commonMagicItemId) {
      notices.push("DM: objeto magico comun opcional sin confirmar.");
    }

    if (!character.uncommonMagicItemId) {
      notices.push("DM: objeto magico poco comun opcional sin confirmar.");
    }
  }

  return notices;
}
