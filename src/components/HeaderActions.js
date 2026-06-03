import { IconButton } from "./Button.js";

export function HeaderActions({ isDarkMode, onDarkModeChange }) {
  const actions = document.createElement("div");
  actions.className = "header-actions";

  const printButton = IconButton({
    label: "Imprimir o guardar PDF",
    icon: "PDF",
    className: "print-button",
    onClick: () => window.print(),
  });

  const darkButton = IconButton({
    label: isDarkMode ? "Usar modo claro" : "Usar modo oscuro",
    icon: isDarkMode ? "SOL" : "LUN",
    className: "mode-button",
    onClick: () => onDarkModeChange(!isDarkMode),
  });

  actions.append(printButton, darkButton);
  return actions;
}
