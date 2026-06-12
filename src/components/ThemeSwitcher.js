import { themes } from "../data/themes.js";

export function ThemeSwitcher({ activeTheme }) {
  const wrapper = document.createElement("div");
  wrapper.className = "section-stack";
  wrapper.innerHTML = `<span class="nav-section-title">Tema automatico</span>`;

  const currentTheme = themes.find((theme) => theme.className === activeTheme) || themes[0];
  const indicator = document.createElement("div");
  indicator.className = "theme-indicator";
  indicator.innerHTML = `
    <span data-theme-indicator-label>${currentTheme.label}</span>
    <small>Sigue la clase elegida.</small>
  `;

  wrapper.append(indicator);
  return wrapper;
}
