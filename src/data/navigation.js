import { classes } from "./rules/index.js";
import { sortByVisibleName } from "../scripts/sortUtils.js";
import { getClassIcon } from "../scripts/visualIdentity.js";

const classNavigationItems = sortByVisibleName(classes).map((classData) => ({
  label: classData.label || classData.name || classData.id,
  route: `class:${classData.id}`,
  icon: getClassIcon(classData.id),
  theme: classData.theme || "theme-default",
}));

export const navigationSections = [
  {
    title: "Asistente",
    items: [
      {
        label: "Crear personaje",
        route: "creator",
        icon: "book",
        theme: "theme-default",
      },
      {
        label: "Resumen",
        route: "summary",
        icon: "shield",
        theme: "theme-default",
      },
      {
        label: "Apariencia",
        route: "appearance",
        icon: "spark",
        theme: "theme-default",
      },
      {
        label: "Imprimir hoja",
        route: "print-sheet",
        icon: "quill",
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
        icon: "helm",
        theme: "theme-default",
      },
      {
        label: "Busqueda",
        route: "search",
        icon: "search",
        theme: "theme-default",
      },
    ],
  },
  {
    title: "Clases",
    items: classNavigationItems,
  },
];
