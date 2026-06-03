import { themes } from "../data/themes.js";

export function applyTheme(className) {
  const themeClasses = themes.map((theme) => theme.className);
  document.documentElement.classList.remove(...themeClasses);
  document.documentElement.classList.add(className);
}

export function applyDisplayMode(isDarkMode) {
  document.documentElement.classList.toggle("mode-dark", isDarkMode);
}
