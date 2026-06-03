import { contentEngine } from "../scripts/contentEngine.js";
import { displayName } from "../scripts/displayLabels.js";

export function BuildPage({ buildId }) {
  const build = contentEngine.getBuild(buildId);
  const page = document.createElement("section");
  page.className = "section-stack";

  if (!build) {
    page.innerHTML = `
      <div>
        <p class="page-kicker">Build no encontrada</p>
        <h2 class="page-title">Ruta sin datos</h2>
      </div>
    `;
    return page;
  }

  page.innerHTML = `
    <div>
      <p class="page-kicker">${build.classLabel || build.className} / ${build.subclassLabel || build.subclassName}</p>
      <h2 class="page-title">${displayName(build)}</h2>
    </div>
    <div class="panel">
      <p>${build.summary}</p>
      <div class="tag-list">${build.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <dl class="meta-list">
        <div><dt>Clase</dt><dd>${build.classLabel || build.className}</dd></div>
        <div><dt>Subclase</dt><dd>${build.subclassLabel || build.subclassName}</dd></div>
        <div><dt>Fuente</dt><dd>${build.source}</dd></div>
      </dl>
    </div>
  `;

  return page;
}
