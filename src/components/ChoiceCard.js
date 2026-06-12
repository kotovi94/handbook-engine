import { displayName } from "../scripts/displayLabels.js";
import { getVisualIcon } from "../scripts/visualIdentity.js";
import { Icon } from "./Icon.js";

export function ChoiceCard({ item, selected = false, multiple = false, onSelect }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = selected ? "choice-card is-selected" : "choice-card";
  button.setAttribute("aria-pressed", selected ? "true" : "false");

  const iconName = getVisualIcon(item);
  if (iconName) {
    button.append(Icon({ name: iconName, className: "choice-card-icon" }));
  }

  const mode = document.createElement("span");
  mode.className = "choice-card-mode";
  mode.textContent = multiple ? "Selección múltiple" : "Selección";

  const name = document.createElement("strong");
  name.textContent = displayName(item);

  const summary = document.createElement("span");
  summary.className = "choice-card-summary";
  summary.textContent = item.summary || "Preparado para reglas futuras.";

  button.append(mode, name, summary);

  const sourceText = [item.visualTag, item.source].filter(Boolean).join(" / ");
  if (sourceText) {
    const source = document.createElement("small");
    source.className = "choice-card-source";
    source.textContent = sourceText;
    button.append(source);
  }

  button.addEventListener("click", () => onSelect(item.id));
  return button;
}

export function ChoiceGrid({ items, selectedIds = [], multiple = false, onSelect }) {
  const grid = document.createElement("div");
  grid.className = "choice-grid";
  grid.append(...items.map((item) =>
    ChoiceCard({
      item,
      selected: selectedIds.includes(item.id),
      multiple,
      onSelect,
    }),
  ));
  return grid;
}
