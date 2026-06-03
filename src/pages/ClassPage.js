import { ContentCard, ContentGrid } from "../components/ContentCard.js";
import { contentEngine } from "../scripts/contentEngine.js";
import { displayName, displayValue } from "../scripts/displayLabels.js";

export function ClassPage({ classId }) {
  const classData = contentEngine.getClass(classId);
  const page = document.createElement("section");
  page.className = "section-stack";

  if (!classData) {
    page.innerHTML = `
      <div>
        <p class="page-kicker">Clase no encontrada</p>
        <h2 class="page-title">Ruta sin datos</h2>
      </div>
    `;
    return page;
  }

  page.innerHTML = `
    <div>
      <p class="page-kicker">Clase</p>
      <h2 class="page-title">${displayName(classData)}</h2>
    </div>
    <div class="panel">
      <p>${classData.summary}</p>
      <dl class="meta-list">
        <div><dt>Rol</dt><dd>${displayValue(classData.role)}</dd></div>
        <div><dt>Atributo</dt><dd>${displayValue(classData.primaryAbility)}</dd></div>
        <div><dt>Fuente</dt><dd>${classData.source}</dd></div>
      </dl>
    </div>
  `;

  const subclassCards = contentEngine.getSubclassesByClass(classId).map((subclass) =>
    ContentCard({
      title: displayName(subclass),
      eyebrow: "Subclase",
      summary: subclass.summary,
      href: `#/subclass:${subclass.id}`,
      meta: [{ label: "Nivel", value: subclass.unlockLevel }],
    }),
  );

  const buildCards = contentEngine.getBuildsByClass(classId).map((build) =>
    ContentCard({
      title: displayName(build),
      eyebrow: "Build",
      summary: build.summary,
      href: `#/build:${build.id}`,
      tags: build.tags,
      meta: [{ label: "Subclase", value: build.subclassName }],
    }),
  );

  if (subclassCards.length) {
    page.append(sectionBlock("Subclases", ContentGrid(subclassCards)));
  }

  if (buildCards.length) {
    page.append(sectionBlock("Builds", ContentGrid(buildCards)));
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
