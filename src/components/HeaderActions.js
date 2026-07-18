import { IconButton } from "./Button.js";

export function HeaderActions({ isDarkMode, onDarkModeChange }) {
  const actions = document.createElement("div");
  actions.className = "header-actions";
  actions.dataset.tour = "header-actions";

  const guideButton = IconButton({
    label: "Ver guía de la app",
    icon: "Guía",
    className: "tour-button",
    onClick: () => window.dispatchEvent(new CustomEvent("handbook-start-tour")),
  });

  const printButton = IconButton({
    label: "Imprimir o guardar PDF",
    icon: "Imprimir",
    className: "print-button",
    onClick: () => window.print(),
  });

  const darkButton = IconButton({
    label: isDarkMode ? "Usar modo claro" : "Usar modo oscuro",
    icon: isDarkMode ? "Claro" : "Oscuro",
    className: "mode-button",
    onClick: () => onDarkModeChange(!isDarkMode),
  });

  actions.append(guideButton, printButton, darkButton);
  return actions;
}
