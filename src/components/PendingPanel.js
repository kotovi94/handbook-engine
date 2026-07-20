import { rulesEngine } from "../scripts/rulesEngine.js";
import { creationEngine } from "../scripts/creationEngine.js";
import { getMissingCharacterSteps } from "../scripts/validationEngine.js";
import { compareVisibleName } from "../scripts/sortUtils.js";

const choiceLabels = {
  skill: ["habilidad", "habilidades"], language: ["idioma", "idiomas"], landType: ["tipo de tierra", "tipos de tierra"],
  cantrip: ["truco", "trucos"], spell: ["conjuro", "conjuros"], spellbook: ["conjuro del grimorio", "conjuros del grimorio"],
  equipment: ["equipo", "equipos"], feat: ["dote", "dotes"], fightingStyle: ["estilo de combate", "estilos de combate"],
  weaponMastery: ["arma con maestría", "armas con maestría"], maneuver: ["maniobra", "maniobras"], tool: ["herramienta", "herramientas"],
  rune: ["runa", "runas"], speciesSize: ["tamaño", "tamaños"], beastCompanion: ["bestia primal", "bestias primales"],
  hunterPrey: ["presa del cazador", "presas del cazador"], draconicAncestry: ["ascendencia dracónica", "ascendencias dracónicas"],
  elvenLineage: ["linaje élfico", "linajes élficos"], gnomeLineage: ["linaje gnomo", "linajes gnomos"],
  giantAncestry: ["ascendencia gigante", "ascendencias gigantes"], fiendishLegacy: ["legado infernal", "legados infernales"],
  spellcastingAbility: ["atributo de magia", "atributos de magia"], artisanTool: ["herramienta de artesano", "herramientas de artesano"],
  gamingSet: ["juego", "juegos"], musicalInstrument: ["instrumento", "instrumentos"], abilityScore: ["atributo", "atributos"],
  expertise: ["pericia", "pericias"], invocation: ["invocación", "invocaciones"], metamagic: ["metamagia", "metamagias"],
  damageType: ["tipo de daño", "tipos de daño"], magicItemPlan: ["plan de objeto mágico", "planes de objeto mágico"],
  magicItemCreated: ["objeto replicado", "objetos replicados"], armorModel: ["modelo de armadura", "modelos de armadura"],
  divineOrder: ["orden divina", "órdenes divinas"], primalOrder: ["orden primal", "órdenes primales"],
};

export function PendingPanel({ character, compact = false, onNavigate } = {}) {
  const derived = rulesEngine.deriveCharacter(character);
  const pending = getPendingEntries(character, derived);
  const notices = getTableNoticeItems(character, derived);
  const panel = document.createElement("section");
  panel.className = compact ? "pending-panel is-compact" : "pending-panel";

  const title = document.createElement("h3");
  title.textContent = "Elecciones pendientes";
  panel.append(title);

  if (pending.length) {
    const list = document.createElement("ul");
    list.className = "pending-list";
    pending.forEach((item) => {
      const row = document.createElement("li");
      if (typeof onNavigate === "function") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pending-action";
        button.textContent = item.label;
        button.addEventListener("click", () => onNavigate(item.stepId));
        row.append(button);
      } else row.textContent = item.label;
      list.append(row);
    });
    panel.append(list);
  } else {
    const complete = document.createElement("p");
    complete.className = "pending-ok";
    complete.textContent = "Sin elecciones obligatorias pendientes.";
    panel.append(complete);
  }

  if (notices.length) {
    const noticeTitle = document.createElement("h3");
    noticeTitle.textContent = "Avisos de mesa";
    const noticeList = document.createElement("ul");
    noticeList.className = "pending-list pending-notice-list";
    notices.forEach((notice) => {
      const row = document.createElement("li");
      row.textContent = notice;
      noticeList.append(row);
    });
    panel.append(noticeTitle, noticeList);
  }
  return panel;
}

export function getPendingItems(character, derived = rulesEngine.deriveCharacter(character)) {
  return getPendingEntries(character, derived).map((item) => item.label);
}

export function getPendingEntries(character, derived = rulesEngine.deriveCharacter(character)) {
  return [
    ...getMissingCharacterSteps(character).map((step) => ({ label: `Falta elegir ${step.toLowerCase()}.`, stepId: stepForMissingChoice(step) })),
    ...[...derived.pendingChoices].sort(compareVisibleName).map((choice) => ({ label: formatPendingChoice(choice), stepId: "choices" })),
    ...getSheetPendingItems(character, derived),
  ];
}

function formatPendingChoice(choice) {
  if (choice.requiresChoiceLabel && !choice.from?.length) return `Completa primero ${choice.requiresChoiceLabel} para elegir ${choice.label || choice.id}.`;
  const labels = choiceLabels[choice.type] || ["opción", "opciones"];
  const plural = choice.remaining === 1 ? labels[0] : labels[1];
  return `Falta elegir ${choice.remaining} ${plural}: ${choice.label || choice.id}.`;
}

function getSheetPendingItems(character, derived) {
  const pending = [];
  const weapons = derived.equipmentItems.filter((item) => item.category === "weapon");
  if (weapons.length && !character.equippedWeaponId) pending.push({ label: "Falta elegir arma equipada.", stepId: "sheet" });
  if (derived.equipmentPurchase?.hasOverspent) {
    pending.push({ label: `El equipo adicional excede el oro disponible por ${derived.equipmentPurchase.overspentText}.`, stepId: "equipment" });
  }
  return pending;
}

function stepForMissingChoice(label) {
  if (label === "Clase") return "class";
  if (["Especie", "Trasfondo"].includes(label)) return "origin";
  if (["Aumentos de trasfondo", "Compra por puntos"].includes(label)) return "abilities";
  if (["Subclase", "Mejora de nivel 4", "Aumentos de nivel 4", "Dote de nivel 4", "Tiradas de puntos de golpe"].includes(label)) return "progression";
  if (["Equipo de clase", "Equipo de trasfondo"].includes(label)) return "equipment";
  return "choices";
}

function getTableNoticeItems(character, derived) {
  const notices = [];
  const higherLevelEquipment = creationEngine.getHigherLevelStartingEquipment(character.level || 1);
  if (higherLevelEquipment && !derived.higherLevelGold.complete) notices.push("Mesa: define si usan oro avanzado de nivel 5; si aplica, falta tirar 1d10.");
  if (higherLevelEquipment?.magicItems?.length) {
    if (!character.commonMagicItemId) notices.push("DM: objeto mágico común opcional sin confirmar.");
    if (!character.uncommonMagicItemId) notices.push("DM: objeto mágico poco común opcional sin confirmar.");
  }
  return notices;
}
