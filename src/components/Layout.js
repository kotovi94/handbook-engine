import { IconButton } from "./Button.js";
import { HeaderActions } from "./HeaderActions.js";
import { Sidebar } from "./Sidebar.js";
import { ThemeSwitcher } from "./ThemeSwitcher.js";

export function Layout({ activeRoute, activeTheme, isDarkMode, onNavigate, onDarkModeChange }) {
  const shell = document.createElement("div");
  shell.className = "app-shell";

  const overlay = document.createElement("button");
  overlay.className = "sidebar-overlay";
  overlay.type = "button";
  overlay.setAttribute("aria-label", "Cerrar menú");

  const sidebar = Sidebar({ activeRoute, onNavigate });
  const themeSlot = sidebar.querySelector("[data-sidebar-footer]");
  themeSlot.append(ThemeSwitcher({ activeTheme }));

  const mainLayout = document.createElement("div");
  mainLayout.className = "main-layout";

  const mainHeader = document.createElement("header");
  mainHeader.className = "main-header";
  mainHeader.dataset.tour = "top-bar";

  const menuButton = IconButton({
    label: "Abrir menú",
    icon: "menu",
    className: "mobile-menu-button",
    onClick: () => setSidebarState(true),
  });

  menuButton.dataset.tour = "mobile-menu";

  const headerBrand = document.createElement("div");
  headerBrand.className = "header-brand";
  headerBrand.innerHTML = `
    <img class="header-brand-mark" src="./assets/icons/discord-travesias.png?v=20260718b" alt="">
    <span class="header-brand-copy">
      <strong>Compendio D20 Travesías</strong>
      <small>Mesa, reglas y preparación</small>
    </span>
  `;

  mainHeader.append(
    menuButton,
    headerBrand,
    HeaderActions({ isDarkMode, onDarkModeChange }),
  );

  const main = document.createElement("main");
  main.className = "main-content";
  main.id = "page-root";

  mainLayout.append(mainHeader, main);
  shell.append(overlay, sidebar, mainLayout);

  overlay.addEventListener("click", () => setSidebarState(false));

  function setSidebarState(isOpen) {
    sidebar.classList.toggle("is-open", isOpen);
    overlay.classList.toggle("is-visible", isOpen);
  }

  return {
    element: shell,
    pageRoot: main,
    closeSidebar: () => setSidebarState(false),
  };
}
