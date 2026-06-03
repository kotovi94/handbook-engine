import { ContentCard, ContentGrid } from "../components/ContentCard.js";
import { contentEngine } from "../scripts/contentEngine.js";
import { displayName } from "../scripts/displayLabels.js";

export function SubclassPage({ subclassId }) {
  const subclass = contentEngine.getSubclass(subclassId);
  const page = document.createElement("section");
  page.className = "section-stack";

  if (!subclass) {
    page.innerHTML = `
      <div>
        <p class="page-kicker">Subclase no encontrada</p>
        <h2 class="page-title">Ruta sin datos</h2>
      </div>
    `;
    return page;
  }

  const buildCards = contentEngine.getBuildsBySubclass(subclass.id).map((build) =>
    ContentCard({
      title: displayName(build),
      eyebrow: "Build",
      summary: build.summary,
      href: `#/build:${build.id}`,
      tags: build.tags,
    }),
  );

  page.innerHTML = `
    <div>
      <p class="page-kicker">${subclass.classLabel || subclass.className}</p>
      <h2 class="page-title">${displayName(subclass)}</h2>
    </div>
    <div class="panel">
      <p>${subclass.summary}</p>
      <dl class="meta-list">
        <div><dt>Nivel</dt><dd>${subclass.unlockLevel}</dd></div>
        <div><dt>Fuente</dt><dd>${subclass.source}</dd></div>
      </dl>
    </div>
  `;

  if (buildCards.length) {
    page.append(sectionBlock("Builds relacionadas", ContentGrid(buildCards)));
  }

  return page;
}

function sectionBlock(title, content) {
  const section = document.createElement("section");
  section.className = "section-stack";
  section.innerHTML = `<h3 class="section-title">${title}</h3>`;
  section.append(content);
  return section;
}
