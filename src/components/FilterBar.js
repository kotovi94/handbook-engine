import { contentEngine } from "../scripts/contentEngine.js";
import { displayName } from "../scripts/displayLabels.js";

export function FilterBar({ query = "", type = "all", classId = "all", showType = true, onChange }) {
  const form = document.createElement("form");
  form.className = "filter-bar";
  form.setAttribute("role", "search");

  form.innerHTML = `
    <label class="field">
      <span>Buscar</span>
      <input name="query" type="search" placeholder="Nombre, rol, etiqueta..." />
    </label>
    ${showType ? `
      <label class="field">
        <span>Tipo</span>
        <select name="type">
          <option value="all">Todo</option>
          <option value="class">Clases</option>
          <option value="subclass">Subclases</option>
          <option value="build">Builds</option>
        </select>
      </label>
    ` : ""}
    <label class="field">
      <span>Clase</span>
      <select name="classId">
        <option value="all">Todas</option>
      </select>
    </label>
  `;

  const typeSelect = form.elements.type;
  const classSelect = form.elements.classId;
  const queryInput = form.elements.query;

  contentEngine.getClasses().forEach((classData) => {
    const option = document.createElement("option");
    option.value = classData.id;
    option.textContent = displayName(classData);
    classSelect.append(option);
  });

  if (typeSelect) {
    typeSelect.value = type;
  }
  classSelect.value = classId;
  queryInput.value = query;

  form.addEventListener("input", () => onChange(readFilters(form)));
  form.addEventListener("change", () => onChange(readFilters(form)));
  form.addEventListener("submit", (event) => event.preventDefault());

  return form;
}

export function readFilters(form) {
  return {
    query: form.elements.query.value,
    type: form.elements.type?.value || "all",
    classId: form.elements.classId.value,
  };
}
