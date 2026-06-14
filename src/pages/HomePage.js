import { Icon } from "../components/Icon.js";

const homeActions = [
  {
    title: "Crear personaje",
    description: "Construye tu personaje paso a paso y prepara una hoja lista para jugar.",
    route: "creator",
    icon: "person",
    eyebrow: "Asistente",
  },
  {
    title: "Buscar items",
    description: "Consulta armas, armaduras, herramientas, equipo y sus datos de juego.",
    route: "search:items",
    icon: "sword",
    eyebrow: "Equipo",
  },
  {
    title: "Buscar hechizos",
    description: "Filtra conjuros por nivel, clase, escuela y otras propiedades utiles.",
    route: "search:spells",
    icon: "spark",
    eyebrow: "Magia",
  },
];

export function HomePage() {
  const page = document.createElement("section");
  page.className = "home-page";
  page.innerHTML = `
    <header class="home-hero">
      <p class="page-kicker">D20 Travesias</p>
      <h2 class="home-title">Que quieres preparar?</h2>
      <p class="home-intro">Crea un personaje o encuentra rapidamente la informacion que necesitas para tu proxima sesion.</p>
    </header>
  `;

  const actionGrid = document.createElement("div");
  actionGrid.className = "home-action-grid";

  homeActions.forEach((action) => {
    const link = document.createElement("a");
    link.className = "home-action-card";
    link.href = `#/${action.route}`;
    link.innerHTML = `
      <span class="home-action-eyebrow">${action.eyebrow}</span>
      <span class="home-action-icon"></span>
      <strong>${action.title}</strong>
      <span class="home-action-description">${action.description}</span>
      <span class="home-action-link">Empezar <span aria-hidden="true">&rarr;</span></span>
    `;
    link.querySelector(".home-action-icon").append(Icon({ name: action.icon }));
    actionGrid.append(link);
  });

  page.append(actionGrid);

  return page;
}
