export function HomePage() {
  const page = document.createElement("section");
  page.className = "section-stack";
  page.innerHTML = `
    <div>
      <p class="page-kicker">Asistente</p>
      <h2 class="page-title">Handbook Engine</h2>
    </div>
    <div class="panel">
      <p>Herramienta para guiar la creacion de personajes y decir que escribir en una hoja fisica.</p>
    </div>
  `;

  return page;
}
