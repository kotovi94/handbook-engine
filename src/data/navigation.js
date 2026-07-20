export const navigationSections = [
  {
    title: "D20 Travesías",
    items: [
      { label: "Inicio", route: "home", icon: "compass", theme: "theme-default" },
      { label: "Mis personajes", route: "characters", icon: "book", theme: "theme-default" },
      { label: "Mis campañas", href: "./campaigns/", icon: "map", theme: "theme-default" },
      { label: "Herramientas DM", route: "dungeon-generator", icon: "map", theme: "theme-default" },
      { label: "Buscar en mesa", route: "search", icon: "search", theme: "theme-default" },
    ],
  },
  {
    title: "Referencia",
    items: [
      { label: "Clases", route: "classes", icon: "helm", theme: "theme-default" },
    ],
  },
];
