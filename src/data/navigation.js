import { classes } from "./rules/index.js";
import { sortByVisibleName } from "../scripts/sortUtils.js";

const classNavigationItems = sortByVisibleName(classes).map((classData) => ({
  label: classData.label || classData.name || classData.id,
  route: `class:${classData.id}`,
  icon: (classData.label || classData.name || classData.id).slice(0, 1).toUpperCase(),
  theme: classData.theme || "theme-default",
}));

export const navigationSections = [
  {
    title: "Asistente",
    items: [
      {
        label: "Crear personaje",
        route: "creator",
        icon: "P",
        theme: "theme-default",
      },
      {
        label: "Resumen",
        route: "summary",
        icon: "R",
        theme: "theme-default",
      },
      {
        label: "Imprimir hoja",
        route: "print-sheet",
        icon: "I",
        theme: "theme-default",
      },
    ],
  },
  {
    title: "Referencia",
    items: [
      {
        label: "Clases",
        route: "classes",
        icon: "C",
        theme: "theme-default",
      },
      {
        label: "Busqueda",
        route: "search",
        icon: "Q",
        theme: "theme-default",
      },
    ],
  },
  {
    title: "Clases",
    items: classNavigationItems,
  },
];
