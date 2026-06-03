import { Layout } from "../components/Layout.js";
import { applyDisplayMode, applyTheme } from "./theme.js";
import { getInitialRoute, getRouteTheme, parseHashRoute, renderRoute } from "./router.js";

const appRoot = document.querySelector("#app");

const state = {
  route: getInitialRoute(),
  theme: "theme-default",
  isDarkMode: false,
};

function navigate(route) {
  if (state.route === route) {
    return;
  }

  window.location.hash = `/${route}`;
}

function setTheme(theme) {
  state.theme = theme;
  renderApp();
}

function setDarkMode(isDarkMode) {
  state.isDarkMode = isDarkMode;
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
      onThemeChange: setTheme,
      onDarkModeChange: setDarkMode,
    });

    layout.pageRoot.replaceChildren(renderRoute(state.route));
    appRoot.append(layout.element);
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
      <h1>Handbook Engine no pudo pintar la interfaz</h1>
      <p>${message}</p>
      <pre>${stack}</pre>
    </section>
  `;
  appRoot.append(panel);
}

window.addEventListener("hashchange", () => {
  const route = parseHashRoute(window.location.hash) || "creator";
  state.route = route;
  state.theme = getRouteTheme(route);
  renderApp();
});

state.theme = getRouteTheme(state.route);
renderApp();
