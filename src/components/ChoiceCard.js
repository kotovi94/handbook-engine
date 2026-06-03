import { displayName } from "../scripts/displayLabels.js";

export function ChoiceCard({ item, selected = false, multiple = false, onSelect }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = selected ? "choice-card is-selected" : "choice-card";
  button.setAttribute("aria-pressed", selected ? "true" : "false");

  button.innerHTML = `
    <span class="choice-card-mode">${multiple ? "Seleccion multiple" : "Seleccion"}</span>
    <strong>${displayName(item)}</strong>
    <span>${item.summary || "Preparado para reglas futuras."}</span>
  `;

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
