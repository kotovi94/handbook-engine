import { rulesEngine } from "../scripts/rulesEngine.js";
import { displayName } from "../scripts/displayLabels.js";
import { PendingPanel } from "./PendingPanel.js";

export function SummaryPanel({ character }) {
  const derived = rulesEngine.deriveCharacter(character);
  const panel = document.createElement("aside");
  panel.className = "summary-panel";
  const proficiencyBonus = `+${derived.proficiencyBonus}`;
  const coins = derived.higherLevelGold.complete ? derived.coinText : "Pendiente oro nivel 5";
  const coinNote = derived.higherLevelGold.complete && derived.equipmentPurchase?.spentCopper
    ? `${coins} tras compras`
    : coins;
  const slotText = derived.spellcasting?.slotText;
  const spellSlots = Array.isArray(slotText)
    ? slotText.join(" / ")
    : slotText
      ? String(slotText)
    : "Sin espacios";
  const spellSummary = derived.spellcasting?.canCast
    ? `${spellSlots}; ${derived.spellcasting.preparation?.selectionLabel || "Preparados"}: ${derived.spellcasting.preparedSpells.length}`
    : spellSlots;
  const magicItems = derived.magicItems?.length
    ? derived.magicItems.map((item) => displayName(item)).join(" / ")
    : "Pendiente";

  panel.innerHTML = `
    <div class="summary-header">
      <h3>Personaje actual</h3>
      <span>LV ${derived.level}</span>
    </div>
    <div class="summary-stat-grid">
      <div><span>CA</span><strong>${derived.armorClass}</strong></div>
      <div><span>PG</span><strong>${derived.hitPointMaximum}</strong></div>
      <div><span>PB</span><strong>${proficiencyBonus}</strong></div>
    </div>
    <dl class="summary-identity">
      <div><dt>Clase</dt><dd>${displayName(derived.classData) || "Pendiente"}</dd></div>
      <div><dt>Subclase</dt><dd>${displayName(derived.subclassData) || "Pendiente"}</dd></div>
      <div><dt>Especie</dt><dd>${displayName(derived.speciesData) || "Pendiente"}</dd></div>
      <div><dt>Trasfondo</dt><dd>${displayName(derived.backgroundData) || "Pendiente"}</dd></div>
    </dl>
    <dl class="summary-detail-grid">
      <div><dt>Monedas</dt><dd>${coinNote}</dd></div>
      <div><dt>Conjuros</dt><dd>${spellSummary}</dd></div>
      <div><dt>Objetos magicos</dt><dd>${magicItems}</dd></div>
    </dl>
  `;

  panel.append(PendingPanel({ character, compact: true }));

  return panel;
}
