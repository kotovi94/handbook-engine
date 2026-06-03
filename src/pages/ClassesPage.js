import { ContentCard, ContentGrid } from "../components/ContentCard.js";
import { FilterBar } from "../components/FilterBar.js";
import { contentEngine } from "../scripts/contentEngine.js";
import { displayName, displayValue } from "../scripts/displayLabels.js";

export function ClassesPage() {
  const page = document.createElement("section");
  page.className = "section-stack";
  const resultsSlot = document.createElement("div");
  const filters = { query: "", type: "class", classId: "all" };

  const filterBar = FilterBar({
    ...filters,
    showType: false,
    onChange(nextFilters) {
      Object.assign(filters, nextFilters, { type: "class" });
      renderResults();
    },
  });

  page.innerHTML = `
    <div>
      <p class="page-kicker">Contenido</p>
      <h2 class="page-title">Clases</h2>
    </div>
  `;
  page.append(filterBar, resultsSlot);
  renderResults();

  function renderResults() {
    const cards = contentEngine.searchContent(filters).map((classData) =>
      ContentCard({
        title: displayName(classData),
        eyebrow: "Clase",
        summary: classData.summary,
        href: `#/class:${classData.id}`,
        meta: [
          { label: "Rol", value: displayValue(classData.role) },
          { label: "Atributo", value: displayValue(classData.primaryAbility) },
        ],
      }),
    );

    resultsSlot.replaceChildren(ContentGrid(cards));
  }

  return page;
}
