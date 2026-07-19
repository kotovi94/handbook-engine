import { Icon } from "../components/Icon.js";

const homeActions = [
  {
    title: "Crear personaje",
    description: "Construye una ficha de nivel 1 a 5 con pendientes claros y salida lista para hoja física.",
    route: "creator",
    icon: "person",
    eyebrow: "Jugador",
    intent: "Empieza aquí",
    featured: true,
  },
  {
    title: "Preparar sesión DM",
    description: "Genera una mazmorra editable con mapa, salas, encuentros, tesoro y exportación.",
    route: "dungeon-generator",
    icon: "map",
    eyebrow: "DM",
    intent: "Antes de dirigir",
  },
  {
    title: "Buscar en mesa",
    description: "Encuentra ítems, hechizos y datos de reglas sin abrir todo el compendio.",
    route: "search",
    icon: "spark",
    eyebrow: "Consulta",
    intent: "Durante la sesión",
  },
  {
    title: "Campañas",
    description: "Administra personajes, sesiones, notas, recompensas y bitácora de aventuras.",
    href: "./campaigns/",
    icon: "map",
    eyebrow: "Archivo",
    intent: "Mesa persistente",
    actionLabel: "Abrir",
  },
];

export function HomePage() {
  const page = document.createElement("section");
  page.className = "home-page";
  page.innerHTML = `
    <header class="home-hero" data-tour="home-hero">
      <div class="home-brand-lockup">
        <img src="./assets/icons/discord-travesias.png?v=20260718b" alt="Logo de D20 Travesías">
        <p class="page-kicker">D20 Travesías</p>
      </div>
      <h2 class="home-title">¿Qué quieres preparar?</h2>
      <p class="home-intro">Elige el momento de mesa: crear un personaje, preparar como DM, consultar reglas o continuar una campaña.</p>
    </header>
  `;

  const actionGrid = document.createElement("div");
  actionGrid.className = "home-action-grid";
  actionGrid.dataset.tour = "home-modules";

  homeActions.forEach((action) => {
    const link = document.createElement("a");
    link.className = action.featured ? "home-action-card is-featured" : "home-action-card";
    link.href = action.href || `#/${action.route}`;
    link.dataset.tour = action.route ? `module-${action.route}` : "module-campaigns";
    link.innerHTML = `
      <span class="home-action-eyebrow">${action.eyebrow}</span>
      <span class="home-action-icon"></span>
      <span class="home-action-intent">${action.intent}</span>
      <strong>${action.title}</strong>
      <span class="home-action-description">${action.description}</span>
      <span class="home-action-link">${action.actionLabel || "Empezar"} <span aria-hidden="true">&rarr;</span></span>
    `;
    link.querySelector(".home-action-icon").append(Icon({ name: action.icon }));
    actionGrid.append(link);
  });

  page.append(actionGrid);

  return page;
}
