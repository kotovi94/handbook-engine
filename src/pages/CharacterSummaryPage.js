import { CalculationGrid } from "../components/CalculationBox.js";
import { PendingPanel } from "../components/PendingPanel.js";
import { ProgressionList } from "../components/ProgressionList.js";
import { SheetSectionList } from "../components/SheetField.js";
import { getCharacter } from "../scripts/characterState.js";
import { rulesEngine } from "../scripts/rulesEngine.js";
import { mapCharacterToSheetSections } from "../scripts/sheetMapper.js";

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
  page.append(ProgressionList({ title: "Rasgos de clase hasta nivel 5", entries: derived.classFeaturesByLevel }));
  page.append(ProgressionList({ title: "Rasgos de subclase hasta nivel 5", entries: derived.subclassFeaturesByLevel }));
  page.append(SheetSectionList(mapCharacterToSheetSections(character)));

  return page;
}
