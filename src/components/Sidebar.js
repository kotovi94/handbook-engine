import { navigationSections } from "../data/navigation.js";

export function Sidebar({ activeRoute, onNavigate }) {
  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  sidebar.id = "app-sidebar";

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h1 class="sidebar-title">Handbook Engine</h1>
      <span class="sidebar-subtitle">D&D 5e 2024</span>
    </div>
    <nav class="sidebar-body" aria-label="Navegacion principal"></nav>
    <div class="sidebar-footer" data-sidebar-footer></div>
  `;

  const nav = sidebar.querySelector("nav");

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
      link.href = `#/${item.route}`;
      link.className = item.route === activeRoute ? "nav-link is-active" : "nav-link";
      link.dataset.route = item.route;
      link.innerHTML = `
        <span class="nav-link-icon" aria-hidden="true">${item.icon}</span>
        <span>${item.label}</span>
      `;

      link.addEventListener("click", (event) => {
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
