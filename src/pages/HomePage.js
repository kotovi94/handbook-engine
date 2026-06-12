export function HomePage() {
  const page = document.createElement("section");
  page.className = "section-stack";
  page.innerHTML = `
    <div>
      <p class="page-kicker">D20 Travesias</p>
      <h2 class="page-title">Compendio D20 Travesias</h2>
    </div>
    <div class="panel">
      <p>Compendio oficial del servidor para crear personajes y preparar sus hojas de D&D 5e 2024.</p>
    </div>
  `;

  return page;
}
