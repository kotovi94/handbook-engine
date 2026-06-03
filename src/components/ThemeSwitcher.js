import { themes } from "../data/themes.js";

export function ThemeSwitcher({ activeTheme, onThemeChange }) {
  const label = document.createElement("label");
  label.className = "section-stack";
  label.innerHTML = `<span class="nav-section-title">Tema</span>`;

  const select = document.createElement("select");
  select.className = "theme-select";
  select.setAttribute("aria-label", "Seleccionar tema");

  themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.className;
    option.textContent = theme.label;
    option.selected = theme.className === activeTheme;
    select.append(option);
  });

  select.addEventListener("change", () => {
    onThemeChange(select.value);
  });

  label.append(select);
  return label;
}
