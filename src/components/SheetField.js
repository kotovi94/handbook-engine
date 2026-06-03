export function SheetField({ field, value, explanation }) {
  const article = document.createElement("article");
  const values = (Array.isArray(value) ? value : [value]).map((item) => String(item));
  article.className = getSheetFieldClass(field, values);

  const valueMarkup = values.length > 1
    ? `<ul class="sheet-value-list">${values.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<strong>${values[0]}</strong>`;

  article.innerHTML = `
    <div>
      <span>Escribe en</span>
      <h3>${field}</h3>
    </div>
    ${valueMarkup}
    <p>${explanation}</p>
  `;
  return article;
}

function getSheetFieldClass(field, values) {
  const fullWidthFields = new Set([
    "ATRIBUTOS DE ESPECIE",
    "RASGOS DE CLASE",
    "Rasgos de subclase",
    "ARMAS Y TRUCOS DE DANO",
    "EQUIPO",
    "TRUCOS Y MAGIA PREPARADA",
    "TRUCOS Y CONJUROS PREPARADOS",
    "GRIMORIO",
    "REGLAS DE LANZAMIENTO",
    "OBJETOS MAGICOS",
  ]);
  const textLength = values.join(" ").length;
  const isList = values.length > 1;
  const isFull = fullWidthFields.has(field) || values.length > 5 || textLength > 460;
  const isLong = isList || textLength > 52;

  return [
    "sheet-field",
    isList ? "is-list" : "is-single",
    isLong ? "is-long" : "is-compact",
    isFull ? "is-full" : "",
  ].filter(Boolean).join(" ");
}

export function SheetFieldList(instructions) {
  const list = document.createElement("div");
  list.className = "sheet-field-list";
  list.append(...instructions.map((instruction) => SheetField(instruction)));
  return list;
}

export function SheetSection({ title, fields }) {
  const section = document.createElement("section");
  section.className = "sheet-section";
  section.innerHTML = `<h3>${title}</h3>`;
  section.append(SheetFieldList(fields));
  return section;
}

export function SheetSectionList(sections) {
  const list = document.createElement("div");
  list.className = "sheet-section-list";
  list.append(...sections.map((section) => SheetSection(section)));
  return list;
}
