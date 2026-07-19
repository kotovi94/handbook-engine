const tourStorageKey = "handbook-engine-first-visit-tour-seen";
const mobileQuery = "(max-width: 860px)";

const tourSteps = [
  {
    selector: "[data-tour='home-hero']",
    eyebrow: "Inicio",
    title: "Tu punto de partida",
    body: "Esta portada resume la pregunta principal: qué quieres preparar ahora mismo en la mesa.",
  },
  {
    selector: "[data-tour='home-modules']",
    eyebrow: "Módulos",
    title: "Todas las herramientas principales",
    body: "Cada tarjeta abre un módulo distinto. Piensalo como un acceso rápido según lo que necesites: jugador, DM, consulta o campaña.",
  },
  {
    selector: "[data-tour='module-creator']",
    eyebrow: "Jugador",
    title: "Crear personaje",
    body: "Este asistente te guía paso a paso para armar una ficha de nivel 1 a 5 y dejar claras las elecciónes pendientes.",
  },
  {
    selector: "[data-tour='module-dungeon-generator']",
    eyebrow: "DM",
    title: "Preparar sesión",
    body: "Aqué generas una mazmorra editable con mapa, salas, encuentros, tesoro y notas listas para dirigir.",
  },
  {
    selector: "[data-tour='module-search']",
    eyebrow: "Consulta",
    title: "Buscar en mesa",
    body: "Usa este módulo cuando necesites encontrar reglas, hechizos o equipo sin navegar por todo el compendio.",
  },
  {
    selector: "[data-tour='module-campaigns']",
    eyebrow: "Archivo",
    title: "Campañas y bitácora",
    body: "Este acceso abre el registro persistente de campañas, sesiones, personajes y recompensas.",
  },
  {
    selector: "[data-tour='main-navigation']",
    mobileSelector: "[data-tour='mobile-menu']",
    eyebrow: "Navegación",
    title: "Menu de la app",
    body: "Desde el menu puedes saltar entre módulos, volver al inicio o entrar a las páginas de referencia. En celular, este boton abre ese menu.",
  },
  {
    selector: "[data-tour='header-actions']",
    eyebrow: "Acciones",
    title: "Botones rápidos",
    body: "Arriba tienes la guía, imprimir o guardar en PDF, y el cambio entre modo claro y oscuro.",
  },
  {
    selector: "[data-tour='theme-indicator']",
    mobileSelector: "[data-tour='header-actions']",
    eyebrow: "Tema",
    title: "Color automatico",
    body: "El tema visual sigue la clase elegida cuando estás creando personaje. Si aún no hay clase, se usa el tema base.",
  },
];

export function shouldShowFirstVisitTour() {
  try {
    return window.localStorage.getItem(tourStorageKey) !== "true";
  } catch {
    return true;
  }
}

export function markFirstVisitTourSeen() {
  try {
    window.localStorage.setItem(tourStorageKey, "true");
  } catch {
    // The tour can still finish when local storage is unavailable.
  }
}

export function FirstVisitTour({ onFinish } = {}) {
  const tour = document.createElement("section");
  tour.className = "first-visit-tour";
  tour.setAttribute("role", "dialog");
  tour.setAttribute("aria-modal", "true");
  tour.setAttribute("aria-label", "Guía de primera visita");

  const highlight = document.createElement("div");
  highlight.className = "first-visit-highlight";
  highlight.setAttribute("aria-hidden", "true");

  const pointer = document.createElement("div");
  pointer.className = "first-visit-pointer";
  pointer.setAttribute("aria-hidden", "true");

  const card = document.createElement("article");
  card.className = "first-visit-card";
  card.tabIndex = -1;

  const counter = document.createElement("span");
  counter.className = "first-visit-counter";

  const eyebrow = document.createElement("p");
  eyebrow.className = "first-visit-eyebrow";

  const title = document.createElement("h2");
  title.className = "first-visit-title";

  const body = document.createElement("p");
  body.className = "first-visit-body";

  const actions = document.createElement("div");
  actions.className = "first-visit-actions";

  const skipButton = makeButton("Saltar", "button secondary-button first-visit-skip");
  const previousButton = makeButton("Anterior", "button secondary-button");
  const nextButton = makeButton("Siguiente", "button");

  actions.append(skipButton, previousButton, nextButton);
  card.append(counter, eyebrow, title, body, actions);
  tour.append(highlight, pointer, card);

  let currentStepIndex = 0;
  let activeTarget = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const previousFocus = document.activeElement;

  function renderStep() {
    const step = tourSteps[currentStepIndex];
    const target = getTarget(step);
    activeTarget = target;

    eyebrow.textContent = step.eyebrow;
    title.textContent = step.title;
    body.textContent = step.body;
    counter.textContent = `${currentStepIndex + 1} de ${tourSteps.length}`;
    previousButton.disabled = currentStepIndex === 0;
    nextButton.textContent = currentStepIndex === tourSteps.length - 1 ? "Terminar" : "Siguiente";

    if (target) {
      target.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }

    const delay = target && !reducedMotion ? 180 : 0;
    window.setTimeout(positionTour, delay);
  }

  function positionTour() {
    const rect = getTargetRect(activeTarget);
    const paddedRect = padRect(rect, 10);

    highlight.style.left = `${paddedRect.left}px`;
    highlight.style.top = `${paddedRect.top}px`;
    highlight.style.width = `${paddedRect.width}px`;
    highlight.style.height = `${paddedRect.height}px`;

    placeCard(paddedRect);
    placePointer(paddedRect);
  }

  function placeCard(targetRect) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 22;
    const margin = 16;
    const cardWidth = Math.min(390, viewportWidth - margin * 2);
    card.style.width = `${cardWidth}px`;

    const measuredHeight = card.getBoundingClientRect().height || 260;
    let left = targetRect.right + gap;

    if (left + cardWidth > viewportWidth - margin) {
      left = targetRect.left - cardWidth - gap;
    }

    if (left < margin || left + cardWidth > viewportWidth - margin) {
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    }

    let top = targetRect.top + targetRect.height / 2 - measuredHeight / 2;

    if (viewportWidth < 720) {
      left = margin;
      top = targetRect.bottom + gap;

      if (top + measuredHeight > viewportHeight - margin) {
        top = targetRect.top - measuredHeight - gap;
      }
    }

    card.style.left = `${clamp(left, margin, viewportWidth - cardWidth - margin)}px`;
    card.style.top = `${clamp(top, margin, viewportHeight - measuredHeight - margin)}px`;
  }

  function placePointer(targetRect) {
    const cardRect = card.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    const startX = clamp(targetX, cardRect.left, cardRect.right);
    const startY = clamp(targetY, cardRect.top, cardRect.bottom);
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const distance = Math.hypot(deltaX, deltaY);

    pointer.style.left = `${startX}px`;
    pointer.style.top = `${startY}px`;
    pointer.style.width = `${Math.max(distance, 0)}px`;
    pointer.style.transform = `rotate(${Math.atan2(deltaY, deltaX)}rad)`;
    pointer.classList.toggle("is-hidden", distance < 28);
  }

  function goToStep(nextIndex) {
    currentStepIndex = clamp(nextIndex, 0, tourSteps.length - 1);
    renderStep();
  }

  function completeTour() {
    markFirstVisitTourSeen();
    cleanup();
    if (typeof onFinish === "function") {
      onFinish();
    }
  }

  function cleanup() {
    window.removeEventListener("resize", positionTour);
    window.removeEventListener("scroll", positionTour, true);
    window.removeEventListener("keydown", handleKeyDown);
    document.documentElement.classList.remove("is-first-visit-tour-active");
    tour.remove();

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      completeTour();
    }
  }

  skipButton.addEventListener("click", completeTour);
  previousButton.addEventListener("click", () => goToStep(currentStepIndex - 1));
  nextButton.addEventListener("click", () => {
    if (currentStepIndex === tourSteps.length - 1) {
      completeTour();
      return;
    }

    goToStep(currentStepIndex + 1);
  });

  window.addEventListener("resize", positionTour);
  window.addEventListener("scroll", positionTour, true);
  window.addEventListener("keydown", handleKeyDown);
  document.documentElement.classList.add("is-first-visit-tour-active");

  window.requestAnimationFrame(() => {
    renderStep();
    nextButton.focus();
  });

  return tour;
}

function makeButton(label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

function getTarget(step) {
  const selector = window.matchMedia(mobileQuery).matches && step.mobileSelector
    ? step.mobileSelector
    : step.selector;
  const target = document.querySelector(selector);

  if (!target) {
    return null;
  }

  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  return target;
}

function getTargetRect(target) {
  if (!target) {
    return {
      left: window.innerWidth / 2 - 140,
      top: window.innerHeight / 2 - 70,
      width: 280,
      height: 140,
      right: window.innerWidth / 2 + 140,
      bottom: window.innerHeight / 2 + 70,
    };
  }

  const rect = target.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
}

function padRect(rect, padding) {
  const left = clamp(rect.left - padding, 8, window.innerWidth - 24);
  const top = clamp(rect.top - padding, 8, window.innerHeight - 24);
  const right = clamp(rect.right + padding, 24, window.innerWidth - 8);
  const bottom = clamp(rect.bottom + padding, 24, window.innerHeight - 8);

  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(right - left, 24),
    height: Math.max(bottom - top, 24),
  };
}

function clamp(value, min, max) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
