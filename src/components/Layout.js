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

  const menuButton = IconButton({
    label: "Abrir menú",
    icon: "",
    className: "mobile-menu-button",
    onClick: () => setSidebarState(true),
  });

  const headerTitle = document.createElement("strong");
  headerTitle.textContent = "Compendio D20 Travesías";

  mainHeader.append(
    menuButton,
    headerTitle,
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
