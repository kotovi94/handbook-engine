import { ContentCard, ContentGrid } from "../components/ContentCard.js";
import { FilterBar } from "../components/FilterBar.js";
import { contentEngine } from "../scripts/contentEngine.js";
import { displayName } from "../scripts/displayLabels.js";

export function BuildsPage() {
  const page = document.createElement("section");
  page.className = "section-stack";
  const resultsSlot = document.createElement("div");
  const filters = { query: "", type: "build", classId: "all" };

  const filterBar = FilterBar({
    ...filters,
    showType: false,
    onChange(nextFilters) {
      Object.assign(filters, nextFilters, { type: "build" });
      renderResults();
    },
  });

  page.innerHTML = `
    <div>
      <p class="page-kicker">Contenido</p>
      <h2 class="page-title">Builds</h2>
    </div>
  `;
  page.append(filterBar, resultsSlot);
  renderResults();

  function renderResults() {
    const cards = contentEngine.searchContent(filters).map((build) =>
      ContentCard({
        title: displayName(build),
        eyebrow: `${build.classLabel || build.className} / ${build.subclassLabel || build.subclassName}`,
        summary: build.summary,
        href: `#/build:${build.id}`,
        tags: build.tags,
        meta: [{ label: "Fuente", value: build.source }],
      }),
    );

    resultsSlot.replaceChildren(ContentGrid(cards));
  }

  return page;
}
