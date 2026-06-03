import { ContentCard, ContentGrid } from "../components/ContentCard.js";
import { FilterBar } from "../components/FilterBar.js";
import { contentEngine } from "../scripts/contentEngine.js";
import { displayName } from "../scripts/displayLabels.js";

export function SubclassesPage() {
  const page = document.createElement("section");
  page.className = "section-stack";
  const resultsSlot = document.createElement("div");
  const filters = { query: "", type: "subclass", classId: "all" };

  const filterBar = FilterBar({
    ...filters,
    showType: false,
    onChange(nextFilters) {
      Object.assign(filters, nextFilters, { type: "subclass" });
      renderResults();
    },
  });

  page.innerHTML = `
    <div>
      <p class="page-kicker">Contenido</p>
      <h2 class="page-title">Subclases</h2>
    </div>
  `;
  page.append(filterBar, resultsSlot);
  renderResults();

  function renderResults() {
    const cards = contentEngine.searchContent(filters).map((subclass) =>
      ContentCard({
        title: displayName(subclass),
        eyebrow: subclass.classLabel || subclass.className,
        summary: subclass.summary,
        href: `#/subclass:${subclass.id}`,
        meta: [
          { label: "Nivel", value: subclass.unlockLevel },
          { label: "Fuente", value: subclass.source },
        ],
      }),
    );

    resultsSlot.replaceChildren(ContentGrid(cards));
  }

  return page;
}
