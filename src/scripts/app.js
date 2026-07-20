import { FirstVisitTour, shouldShowFirstVisitTour } from "../components/FirstVisitTour.js";
import { Layout } from "../components/Layout.js";
import { classRegistry } from "../data/classes.js";
import { themes } from "../data/themes.js";
import { getCharacter } from "./characterState.js";
import { applyDisplayMode, applyTheme } from "./theme.js";
import { setupPageBridge } from "./pageBridge.js";
import { getInitialRoute, getRouteTheme, parseHashRoute, renderRoute } from "./router.js";

const appRoot = document.querySelector("#app");
const displayModeStorageKey = "handbook-engine-display-mode";
const themeIntroStorageKey = "handbook-engine-theme-intro-seen";
const welcomeStorageKey = "d20-travesias-welcome-seen-v1";
let firstVisitTourTimer = 0;
let pendingManualTour = false;

const state = {
  route: getInitialRoute(),
  theme: "theme-default",
  isDarkMode: loadDisplayMode() === "dark",
};

setupPageBridge("compendium", (link) => {
  const href = link.getAttribute("href") || "";
  return href.includes("campaigns") ? "campaigns" : "";
});

function navigate(route) {
  if (state.route === route) {
    return;
  }

  window.location.hash = `/${route}`;
}

function setDarkMode(isDarkMode) {
  state.isDarkMode = isDarkMode;
  saveDisplayMode(isDarkMode);
  renderApp();
}

function renderApp() {
  try {
    applyTheme(state.theme);
    applyDisplayMode(state.isDarkMode);
    appRoot.replaceChildren();

    const layout = Layout({
      activeRoute: state.route,
      activeTheme: state.theme,
      isDarkMode: state.isDarkMode,
      onNavigate: (route) => {
        navigate(route);
        layout.closeSidebar();
      },
      onDarkModeChange: setDarkMode,
    });

    layout.pageRoot.replaceChildren(renderRoute(state.route));
    appRoot.append(layout.element);
    if (pendingManualTour && state.route === "home") {
      pendingManualTour = false;
      startFirstVisitTour({ force: true, delay: 120 });
    }
    showWelcomeNotice();
  } catch (error) {
    showStartupError(error);
  }
}

function showStartupError(error) {
  appRoot.replaceChildren();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : "";
  const panel = document.createElement("main");
  panel.className = "startup-error";
  panel.innerHTML = `
    <section>
      <p class="page-kicker">Error de arranque</p>
      <h1>Compendio D20 Travesías no pudo pintar la interfaz</h1>
      <p>${message}</p>
      <pre>${stack}</pre>
    </section>
  `;
  appRoot.append(panel);
}

window.addEventListener("hashchange", () => {
  const route = parseHashRoute(window.location.hash) || "home";
  state.route = route;
  state.theme = getActiveTheme(route);
  renderApp();
});

window.addEventListener("handbook-character-class-change", () => {
  if (!usesCharacterTheme(state.route)) {
    return;
  }

  state.theme = getCharacterTheme();
  applyTheme(state.theme);
  updateThemeIndicator(state.theme);
});

window.addEventListener("handbook-start-tour", () => {
  pendingManualTour = true;

  if (state.route !== "home") {
    navigate("home");
    return;
  }

  pendingManualTour = false;
  startFirstVisitTour({ force: true, delay: 80 });
});

function getActiveTheme(route) {
  return usesCharacterTheme(route) ? getCharacterTheme() : getRouteTheme(route);
}

function usesCharacterTheme(route) {
  return route === "creator"
    || route.startsWith("creator:")
    || route === "summary"
    || route === "appearance"
    || route === "print-sheet";
}

function getCharacterTheme() {
  const classId = getCharacter().classId;
  return classRegistry[classId]?.theme || "theme-default";
}

function loadDisplayMode() {
  const saved = window.localStorage.getItem(displayModeStorageKey);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function saveDisplayMode(isDarkMode) {
  window.localStorage.setItem(displayModeStorageKey, isDarkMode ? "dark" : "light");
}

function startFirstVisitTour({ force = false, delay = 0 } = {}) {
  window.clearTimeout(firstVisitTourTimer);

  if (state.route !== "home" || document.querySelector(".first-visit-tour")) {
    return;
  }

  if (!force && !shouldShowFirstVisitTour()) {
    return;
  }

  firstVisitTourTimer = window.setTimeout(() => {
    if (state.route !== "home" || document.querySelector(".first-visit-tour")) {
      return;
    }

    if (!force && !shouldShowFirstVisitTour()) {
      return;
    }

    document.querySelectorAll(".theme-intro-notice").forEach((notice) => notice.remove());
    document.body.append(FirstVisitTour({ onFinish: showThemeIntroNotice }));
  }, delay);
}

function showThemeIntroNotice() {
  if ((state.route === "home" && shouldShowFirstVisitTour()) || document.querySelector(".first-visit-tour")) {
    return;
  }

  if (window.localStorage.getItem(themeIntroStorageKey)) {
    return;
  }

  document.querySelectorAll(".theme-intro-notice").forEach((notice) => notice.remove());

  const notice = document.createElement("aside");
  notice.className = "theme-intro-notice";
  notice.setAttribute("role", "dialog");
  notice.setAttribute("aria-label", "Preferencia de tema");
  notice.innerHTML = `
    <div>
      <span>Antes de empezar</span>
      <h2>Elige cómo quieres ver la app</h2>
      <p>El modo claro u oscuro cambia la lectura general. El color del tema se ajusta automáticamente a la clase elegida; si aún no hay clase, se usa el tema predeterminado.</p>
    </div>
    <div class="theme-intro-actions">
      <button type="button" class="button" data-mode="light">Modo claro</button>
      <button type="button" class="button" data-mode="dark">Modo oscuro</button>
      <button type="button" class="button secondary-button" data-dismiss>Mantener por ahora</button>
    </div>
  `;

  notice.querySelector('[data-mode="light"]').addEventListener("click", () => {
    dismissThemeIntroNotice(notice);
    setDarkMode(false);
  });
  notice.querySelector('[data-mode="dark"]').addEventListener("click", () => {
    dismissThemeIntroNotice(notice);
    setDarkMode(true);
  });
  notice.querySelector("[data-dismiss]").addEventListener("click", () => {
    dismissThemeIntroNotice(notice);
  });

  document.body.append(notice);
}

function dismissThemeIntroNotice(notice) {
  window.localStorage.setItem(themeIntroStorageKey, "true");
  notice.remove();
}

function showWelcomeNotice() {
  if (state.route !== "home" || window.localStorage.getItem(welcomeStorageKey) || document.querySelector(".welcome-notice")) return;
  const notice = document.createElement("aside");
  notice.className = "theme-intro-notice welcome-notice";
  notice.setAttribute("role", "dialog");
  notice.setAttribute("aria-label", "Bienvenida a D20 Travesías");
  notice.innerHTML = `
    <div>
      <span>Bienvenido a D20 Travesías</span>
      <h2>¿Qué quieres preparar?</h2>
      <p>Puedes comenzar de inmediato. La guía completa permanece disponible en el botón de ayuda.</p>
    </div>
    <div class="theme-intro-actions">
      <button type="button" class="button" data-route="characters">Soy jugador</button>
      <button type="button" class="button" data-route="dungeon-generator">Soy DM</button>
      <button type="button" class="button secondary-button" data-dismiss>Explorar</button>
    </div>
  `;
  const dismiss = () => {
    window.localStorage.setItem(welcomeStorageKey, "true");
    notice.remove();
  };
  notice.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => {
    const route = button.dataset.route;
    dismiss();
    navigate(route);
  }));
  notice.querySelector("[data-dismiss]").addEventListener("click", dismiss);
  document.body.append(notice);
}

function updateThemeIndicator(themeClassName) {
  const label = document.querySelector("[data-theme-indicator-label]");
  const theme = themes.find((item) => item.className === themeClassName) || themes[0];

  if (label) {
    label.textContent = theme.label;
  }
}

state.theme = getActiveTheme(state.route);
renderApp();
