import { SheetSectionList } from "../components/SheetField.js";
import { getCharacter } from "../scripts/characterState.js";
import { mapCharacterToSheetSections } from "../scripts/sheetMapper.js";

export function PrintSheetPage() {
  const page = document.createElement("section");
  page.className = "section-stack print-sheet";
  page.innerHTML = `
    <div>
      <p class="page-kicker">PDF</p>
      <h2 class="page-title">Instrucciones para la hoja</h2>
    </div>
    <div class="panel print-help-panel">
      <p>Usa el boton PDF del encabezado o la opcion de imprimir del navegador para guardar estas instrucciones.</p>
    </div>
  `;
  page.append(SheetSectionList(mapCharacterToSheetSections(getCharacter())));

  return page;
}
