import { displayName } from "../scripts/displayLabels.js";

export function ProgressionList({ title, entries }) {
  const section = document.createElement("section");
  section.className = "progression-list";
  section.innerHTML = `<h3>${title}</h3>`;

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.textContent = "Pendiente";
    section.append(empty);
    return section;
  }

  const list = document.createElement("ol");
  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>Nivel ${entry.level}</strong>
      <span>${entry.features.map(displayName).join(", ")}</span>
    `;
    list.append(item);
  });

  section.append(list);
  return section;
}
