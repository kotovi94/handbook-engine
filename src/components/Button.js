import { Icon } from "./Icon.js";

export function IconButton({ label, icon, className = "", onClick }) {
  const button = document.createElement("button");
  button.className = `icon-button ${className}`.trim();
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;

  if (icon) {
    button.append(Icon({ name: icon }));
  }

  if (onClick) {
    button.addEventListener("click", onClick);
  }

  return button;
}
