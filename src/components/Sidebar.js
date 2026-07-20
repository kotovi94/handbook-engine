import { navigationSections } from "../data/navigation.js";
import { Icon } from "./Icon.js";

export function Sidebar({ activeRoute, onNavigate }) {
  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  sidebar.id = "app-sidebar";

  sidebar.innerHTML = `
    <div class="sidebar-header" data-tour="app-brand">
      <img class="sidebar-brand-logo" src="./assets/icons/discord-travesias.png?v=20260718b" alt="">
      <span class="sidebar-brand-copy">
        <h1 class="sidebar-title">Compendio D20 Travesías</h1>
        <span class="sidebar-subtitle">D&D 5e 2024</span>
      </span>
    </div>
    <nav class="sidebar-body" aria-label="Navegación principal"></nav>
    <div class="sidebar-footer" data-sidebar-footer>
      <div class="discord-community" aria-label="Comunidad de Discord D20 Travesías">
        <span class="discord-community-copy">
          <strong>Comunidad</strong>
          <small>Discord de D20 Travesías</small>
        </span>
      </div>
    </div>
  `;

  const nav = sidebar.querySelector("nav");
  nav.dataset.tour = "main-navigation";

  navigationSections.forEach((section) => {
    const sectionNode = document.createElement("section");
    sectionNode.className = "nav-section";

    const title = document.createElement("div");
    title.className = "nav-section-title";
    title.textContent = section.title;

    const list = document.createElement("ul");
    list.className = "nav-list";

    section.items.forEach((item) => {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = item.href || `#/${item.route}`;
      const isActive = item.route === activeRoute
        || (item.route === "search" && activeRoute.startsWith("search:"));
      link.className = isActive ? "nav-link is-active" : "nav-link";
      if (item.route) {
        link.dataset.route = item.route;
        link.dataset.tour = `nav-${item.route}`;
      } else if (item.href) {
        link.dataset.tour = "nav-campaigns";
      }
      const label = document.createElement("span");
      label.textContent = item.label;
      link.append(Icon({ name: item.icon, className: "nav-link-icon" }), label);

      link.addEventListener("click", (event) => {
        if (item.href) {
          return;
        }

        event.preventDefault();
        onNavigate(item.route);
      });

      listItem.append(link);
      list.append(listItem);
    });

    sectionNode.append(title, list);
    nav.append(sectionNode);
  });

  return sidebar;
}
