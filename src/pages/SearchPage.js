import { equipment, spells } from "../data/rules/index.js";
import { contentEngine } from "../scripts/contentEngine.js";
import { displayName, displayValue } from "../scripts/displayLabels.js";
import { getSpellSheetDetail } from "../scripts/spellSheetDetails.js";
import { compareDisplayValue, compareSpellLevelThenName, compareVisibleName } from "../scripts/sortUtils.js";
import { quickReferenceRules } from "../data/rules/quickReference.js";

const FAVORITES_STORAGE_KEY = "d20-travesias-reference-favorites-v1";

const tabs = [
  { id: "all", label: "Todo" },
  { id: "rule", label: "Reglas rápidas" },
  { id: "equipment", label: "Ítems" },
  { id: "spell", label: "Hechizos" },
  { id: "favorites", label: "Favoritos" },
];

export function SearchPage({ initialTab = "all" } = {}) {
  const page = document.createElement("section");
  page.className = "section-stack";
  const resultsSlot = document.createElement("div");
  resultsSlot.className = "section-stack";
  const favorites = loadFavorites();
  const filters = {
    query: "",
    tab: tabs.some((tab) => tab.id === initialTab) ? initialTab : "all",
    equipmentCategory: "all",
    spellLevel: "all",
    spellClass: "all",
    spellSchool: "all",
    spellTag: "all",
  };

  page.innerHTML = `
    <div>
      <p class="page-kicker">Referencia rápida</p>
      <h2 class="page-title">Búsqueda de mesa</h2>
    </div>
    <div class="panel">
      <p>Busca por nombre, letras sueltas, clase, escuela, daño, precio, tirada o palabra clave. Pensado para encontrar rápido qué copiar o revisar en sesión.</p>
    </div>
  `;

  page.append(renderQuickQueries(filters, render), renderTabs(filters, render), renderSearchControls(filters, render), renderActiveFilterChips(filters, render), resultsSlot);
  render();

  function render() {
    renderResults(filters, resultsSlot, favorites, (key) => {
      favorites.has(key) ? favorites.delete(key) : favorites.add(key);
      saveFavorites(favorites);
      render();
    });
  }

  return page;
}

function renderQuickQueries(filters, onChange) {
  const wrap = document.createElement("section");
  wrap.className = "quick-query-panel panel";
  wrap.setAttribute("aria-labelledby", "quick-query-title");
  wrap.innerHTML = '<div><p class="page-kicker">Un toque</p><h3 id="quick-query-title">Consultas frecuentes</h3></div>';
  const list = document.createElement("div");
  list.className = "quick-query-list";
  ["Concentración", "Cobertura", "Agarrar", "Muerte", "Descansos", "CD"].forEach((query) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-query-button";
    button.textContent = query;
    button.addEventListener("click", () => {
      const input = wrap.closest(".section-stack")?.querySelector('input[name="query"]');
      if (input) {
        input.value = query;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      } else {
        filters.query = query;
        onChange();
      }
    });
    list.append(button);
  });
  wrap.append(list);
  return wrap;
}

function renderTabs(filters, onChange) {
  const nav = document.createElement("div");
  nav.className = "search-tabs";
  tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = filters.tab === tab.id ? "search-tab is-active" : "search-tab";
    button.textContent = tab.label;
    button.setAttribute("aria-pressed", String(filters.tab === tab.id));
    button.addEventListener("click", () => {
      filters.tab = tab.id;
      onChange();
      nav.replaceWith(renderTabs(filters, onChange));
    });
    nav.append(button);
  });
  return nav;
}

function renderSearchControls(filters, onChange) {
  const details = document.createElement("details");
  details.className = "reference-filter-shell";
  details.open = window.innerWidth > 760;

  const summary = document.createElement("summary");
  summary.innerHTML = `
    <span>Filtros de búsqueda</span>
    <small>Nombre, tipo, nivel, clase, escuela y marca</small>
  `;

  const form = document.createElement("form");
  form.className = "filter-bar reference-filter";
  form.setAttribute("role", "search");
  form.innerHTML = `
    <label class="field">
      <span>Buscar</span>
      <input name="query" type="search" placeholder="Ej: espada, fire, 2d8, ritual..." />
    </label>
    <label class="field">
      <span>Tipo ítem</span>
      <select name="equipmentCategory">
        <option value="all">Todos</option>
        <option value="weapon">Armas</option>
        <option value="armor">Armaduras</option>
        <option value="shield">Escudos</option>
        <option value="tool">Herramientas</option>
        <option value="focus">Focos</option>
        <option value="pack">Paquetes</option>
        <option value="gear">Equipo</option>
      </select>
    </label>
    <label class="field">
      <span>Nivel hechizo</span>
      <select name="spellLevel">
        <option value="all">Todos</option>
        <option value="0">Trucos</option>
        <option value="1">Nivel 1</option>
        <option value="2">Nivel 2</option>
        <option value="3">Nivel 3</option>
        <option value="4">Nivel 4</option>
        <option value="5">Nivel 5</option>
        <option value="6">Nivel 6</option>
        <option value="7">Nivel 7</option>
        <option value="8">Nivel 8</option>
        <option value="9">Nivel 9</option>
      </select>
    </label>
    <label class="field">
      <span>Clase hechizo</span>
      <select name="spellClass">
        <option value="all">Todas</option>
      </select>
    </label>
    <label class="field">
      <span>Escuela</span>
      <select name="spellSchool">
        <option value="all">Todas</option>
      </select>
    </label>
    <label class="field">
      <span>Marca</span>
      <select name="spellTag">
        <option value="all">Todas</option>
        <option value="concentration">Concentración</option>
        <option value="ritual">Ritual</option>
        <option value="damage">Hace daño</option>
        <option value="save">Tiene salvación</option>
        <option value="attack">Ataque de conjuro</option>
      </select>
    </label>
  `;

  const spellClassSelect = form.elements.spellClass;
  contentEngine.getClasses()
    .filter((classData) => classData.id !== "barbarian" && classData.id !== "fighter" && classData.id !== "monk")
    .forEach((classData) => {
      const option = document.createElement("option");
      option.value = classData.name;
      option.textContent = displayName(classData);
      spellClassSelect.append(option);
    });

  getSpellSchools().forEach((school) => {
    const option = document.createElement("option");
    option.value = school;
    option.textContent = displayValue(school);
    form.elements.spellSchool.append(option);
  });

  form.elements.query.value = filters.query;
  form.elements.equipmentCategory.value = filters.equipmentCategory;
  form.elements.spellLevel.value = filters.spellLevel;
  form.elements.spellClass.value = filters.spellClass;
  form.elements.spellSchool.value = filters.spellSchool;
  form.elements.spellTag.value = filters.spellTag;

  form.addEventListener("input", () => {
    Object.assign(filters, readReferenceFilters(form));
    onChange();
    replaceActiveFilterChips(form, filters, onChange);
  });
  form.addEventListener("change", () => {
    Object.assign(filters, readReferenceFilters(form));
    onChange();
    replaceActiveFilterChips(form, filters, onChange);
  });
  form.addEventListener("submit", (event) => event.preventDefault());

  details.append(summary, form);
  return details;
}

function renderActiveFilterChips(filters, onChange) {
  const chips = document.createElement("div");
  chips.className = "active-filter-chips";
  const activeFilters = getActiveFilterLabels(filters);

  if (!activeFilters.length) {
    chips.classList.add("is-empty");
    chips.textContent = "Sin filtros activos";
    return chips;
  }

  activeFilters.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.innerHTML = `<span>${filter.label}</span><strong>${filter.value}</strong>`;
    button.addEventListener("click", () => {
      filters[filter.key] = filter.resetValue;
      syncReferenceForm(button.closest(".section-stack")?.querySelector(".reference-filter"), filters);
      onChange();
      chips.replaceWith(renderActiveFilterChips(filters, onChange));
    });
    chips.append(button);
  });

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "filter-chip clear-filter-chip";
  clearButton.textContent = "Limpiar filtros";
  clearButton.addEventListener("click", () => {
    Object.assign(filters, {
      query: "",
      equipmentCategory: "all",
      spellLevel: "all",
      spellClass: "all",
      spellSchool: "all",
      spellTag: "all",
    });
    syncReferenceForm(clearButton.closest(".section-stack")?.querySelector(".reference-filter"), filters);
    onChange();
    chips.replaceWith(renderActiveFilterChips(filters, onChange));
  });
  chips.append(clearButton);

  return chips;
}

function getActiveFilterLabels(filters) {
  const labels = [];

  if (filters.query) {
    labels.push({ key: "query", label: "Buscar", value: filters.query, resetValue: "" });
  }
  if (filters.equipmentCategory !== "all") {
    labels.push({ key: "equipmentCategory", label: "Ítem", value: displayValue(filters.equipmentCategory), resetValue: "all" });
  }
  if (filters.spellLevel !== "all") {
    labels.push({ key: "spellLevel", label: "Nivel", value: filters.spellLevel === "0" ? "Truco" : `Nivel ${filters.spellLevel}`, resetValue: "all" });
  }
  if (filters.spellClass !== "all") {
    labels.push({ key: "spellClass", label: "Clase", value: displayValue(filters.spellClass), resetValue: "all" });
  }
  if (filters.spellSchool !== "all") {
    labels.push({ key: "spellSchool", label: "Escuela", value: displayValue(filters.spellSchool), resetValue: "all" });
  }
  if (filters.spellTag !== "all") {
    labels.push({ key: "spellTag", label: "Marca", value: spellTagLabel(filters.spellTag), resetValue: "all" });
  }

  return labels;
}

function spellTagLabel(tag) {
  const labels = {
    concentration: "Concentración",
    ritual: "Ritual",
    damage: "Hace daño",
    save: "Tiene salvación",
    attack: "Ataque de conjuro",
  };
  return labels[tag] || displayValue(tag);
}

function replaceActiveFilterChips(form, filters, onChange) {
  const currentChips = form.closest(".section-stack")?.querySelector(".active-filter-chips");
  currentChips?.replaceWith(renderActiveFilterChips(filters, onChange));
}

function syncReferenceForm(form, filters) {
  if (!form) {
    return;
  }

  form.elements.query.value = filters.query;
  form.elements.equipmentCategory.value = filters.equipmentCategory;
  form.elements.spellLevel.value = filters.spellLevel;
  form.elements.spellClass.value = filters.spellClass;
  form.elements.spellSchool.value = filters.spellSchool;
  form.elements.spellTag.value = filters.spellTag;
}

function renderResults(filters, resultsSlot, favorites, onToggleFavorite) {
  const results = getReferenceResults(filters, favorites);
  const count = document.createElement("p");
  count.className = "result-count";
  count.textContent = `${results.length} resultado${results.length === 1 ? "" : "s"}`;

  resultsSlot.replaceChildren(count);

  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "panel";
    empty.innerHTML = "<p>No hay coincidencias. Prueba con parte del nombre, tipo de daño, clase, nivel o precio.</p>";
    resultsSlot.append(empty);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "reference-grid";
  results.slice(0, 80).forEach((result) => grid.append(renderReferenceCard(result, favorites, onToggleFavorite)));
  resultsSlot.append(grid);
}

function getReferenceResults(filters, favorites = new Set()) {
  const includeEquipment = filters.tab === "all" || filters.tab === "equipment";
  const includeSpells = filters.tab === "all" || filters.tab === "spell";
  const includeRules = filters.tab === "all" || filters.tab === "rule";
  const results = [
    ...(includeEquipment ? equipment.map((item) => ({ type: "equipment", item })) : []),
    ...(includeSpells ? spells.map((spell) => ({ type: "spell", item: spell })) : []),
    ...(includeRules ? quickReferenceRules.map((rule) => ({ type: "rule", item: rule })) : []),
  ];

  if (filters.tab === "favorites") {
    return [
      ...quickReferenceRules.map((item) => ({ type: "rule", item })),
      ...equipment.map((item) => ({ type: "equipment", item })),
      ...spells.map((item) => ({ type: "spell", item })),
    ].filter((result) => favorites.has(referenceKey(result))).filter((result) => matchesQuery(result, filters.query)).sort(sortReference);
  }

  return results
    .filter((result) => matchesFilters(result, filters))
    .sort((a, b) => sortReference(a, b));
}

function matchesFilters(result, filters) {
  const item = result.item;

  if (result.type === "equipment" && filters.equipmentCategory !== "all" && item.category !== filters.equipmentCategory) {
    return false;
  }

  if (result.type === "spell") {
    if (!matchesSpellLevel(item, filters.spellLevel)) return false;
    if (filters.spellClass !== "all" && !(item.classes || []).includes(filters.spellClass)) return false;
    if (filters.spellSchool !== "all" && item.school !== filters.spellSchool) return false;
    if (!matchesSpellTag(item, filters.spellTag)) return false;
  }

  return matchesQuery(result, filters.query);
}

function matchesQuery(result, query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  const item = result.item;
  const detail = result.type === "spell" ? getSpellSheetDetail(item.id) : null;
  const haystack = normalize([
    item.id,
    item.name,
    item.label,
    item.summary,
    item.description,
    item.sheetText,
    item.category,
    item.armorType,
    item.damage,
    item.damageLabel,
    item.damageType,
    item.save,
    item.attack,
    item.range,
    item.castingTime,
    item.duration,
    item.school,
    item.weight,
    formatCoins(item.cost),
    detail?.label,
    detail?.detail,
    item.title,
    item.quickAnswer,
    item.details,
    item.source,
    ...(item.keywords || []),
    ...(item.classes || []),
    ...(item.properties || []),
    ...(item.components || []),
  ].filter(Boolean).join(" "));

  return normalizedQuery.split(/\s+/).every((part) => haystack.includes(part));
}

function renderReferenceCard(result, favorites, onToggleFavorite) {
  const card = result.type === "spell"
    ? renderSpellCard(result.item)
    : result.type === "rule"
      ? renderRuleCard(result.item)
      : renderEquipmentCard(result.item);
  const key = referenceKey(result);
  const isFavorite = favorites.has(key);
  const button = document.createElement("button");
  button.type = "button";
  button.className = isFavorite ? "reference-favorite is-active" : "reference-favorite";
  button.setAttribute("aria-pressed", String(isFavorite));
  button.setAttribute("aria-label", `${isFavorite ? "Quitar de" : "Añadir a"} favoritos: ${referenceTitle(result)}`);
  button.textContent = isFavorite ? "★ Favorito" : "☆ Guardar";
  button.addEventListener("click", () => onToggleFavorite(key));
  card.prepend(button);
  return card;
}

function renderRuleCard(rule) {
  const card = document.createElement("article");
  card.className = "reference-card quick-rule-card";
  card.innerHTML = `
    <div class="reference-card-header"><span>${rule.category}</span><strong>${rule.title}</strong></div>
    <p class="quick-answer">${rule.quickAnswer}</p>
    <details class="reference-details"><summary>Ver detalles</summary><p>${rule.details}</p></details>
    <small class="reference-source">Fuente: ${rule.source}</small>
  `;
  return card;
}

function renderSpellCard(spell) {
  const detail = getSpellSheetDetail(spell.id);
  const higherLevel = detail?.higherLevel || spell.higherLevel || "";
  const quickAnswer = detail?.detail || spell.sheetText || spell.summary;
  const card = document.createElement("article");
  card.className = "reference-card";
  card.innerHTML = `
    <div class="reference-card-header">
      <span>${spellReferenceLine(spell)}</span>
      <strong>${detail?.label || displayName(spell)}</strong>
    </div>
    <p class="quick-answer">${quickAnswer}</p>
    <details class="reference-details"><summary>Ver detalles</summary>
      ${higherLevel ? `<p><strong>A mayor nivel:</strong> ${cleanText(higherLevel)}</p>` : ""}
      <dl class="meta-list">
        <div><dt>Escuela</dt><dd>${displayValue(spell.school)}</dd></div>
        <div><dt>Lanzamiento</dt><dd>${cleanText(spell.castingTime)}</dd></div>
        <div><dt>Alcance</dt><dd>${cleanText(spell.range)}</dd></div>
        <div><dt>Duración</dt><dd>${cleanText(spell.duration)}</dd></div>
        ${spell.damage ? `<div><dt>Daño</dt><dd>${cleanText(spell.damage)}${spell.damageType ? ` ${displayValue(spell.damageType)}` : ""}</dd></div>` : ""}
        ${spell.save ? `<div><dt>Salvación</dt><dd>${displayValue(spell.save)}</dd></div>` : ""}
        ${spell.attack ? `<div><dt>Ataque</dt><dd>${cleanText(spell.attack)}</dd></div>` : ""}
      </dl>
      <div class="tag-list">
        ${(spell.classes || []).map((className) => `<span class="tag">${displayValue(className)}</span>`).join("")}
        ${spell.concentration ? '<span class="tag">Concentración</span>' : ""}
        ${spell.ritual ? '<span class="tag">Ritual</span>' : ""}
        ${(spell.components || []).map((component) => `<span class="tag">${component}</span>`).join("")}
      </div>
    </details>
    <small class="reference-source">Fuente: ${spell.source || "Compendio interno D20 Travesías"}</small>
  `;
  return card;
}

function spellReferenceLine(spell) {
  return [
    spell.level === 0 ? "Truco" : `Nivel ${spell.level}`,
    spellSchoolLabel(spell.school),
    cleanText(spell.castingTime).toLowerCase(),
    cleanText(spell.range).toLowerCase(),
  ].filter(Boolean).join(" | ");
}

function spellSchoolLabel(school) {
  const labels = {
    Abjuration: "Abjuracion",
    Conjuration: "Conjuracion",
    Divination: "Adivinacion",
    Enchantment: "Encantamiento",
    Evocation: "Evocación",
    Illusion: "Ilusión",
    Necromancy: "Nigromancia",
    Transmutation: "Transmutacion",
  };

  return labels[school] || displayValue(school);
}

function renderEquipmentCard(item) {
  const card = document.createElement("article");
  card.className = "reference-card";
  card.innerHTML = `
    <div class="reference-card-header">
      <span>${equipmentTypeLabel(item)}</span>
      <strong>${displayName(item)}</strong>
    </div>
    <p class="quick-answer">${item.sheetText || item.description || item.summary}</p>
    <details class="reference-details"><summary>Ver detalles</summary>
      <dl class="meta-list">
        ${item.damageLabel ? `<div><dt>Daño</dt><dd>${item.damageLabel}</dd></div>` : ""}
        ${item.range ? `<div><dt>Alcance</dt><dd>${item.range}</dd></div>` : ""}
        ${item.ac ? `<div><dt>CA</dt><dd>${item.ac}</dd></div>` : ""}
        ${item.acBase ? `<div><dt>CA</dt><dd>${item.acBase}${dexterityText(item.dexterity)}</dd></div>` : ""}
        ${item.mastery ? `<div><dt>Maestría</dt><dd>${item.mastery}</dd></div>` : ""}
        ${item.cost ? `<div><dt>Precio</dt><dd>${formatCoins(item.cost)}</dd></div>` : ""}
        ${item.weight ? `<div><dt>Peso</dt><dd>${item.weight}</dd></div>` : ""}
      </dl>
      <div class="tag-list">
        <span class="tag">${equipmentTypeLabel(item)}</span>
        ${item.ability ? `<span class="tag">${displayValue(item.ability)}</span>` : ""}
        ${(item.properties || []).map((property) => `<span class="tag">${property}</span>`).join("")}
      </div>
    </details>
    <small class="reference-source">Fuente: ${item.source || "Compendio interno D20 Travesías"}</small>
  `;
  return card;
}

function readReferenceFilters(form) {
  return {
    query: form.elements.query.value,
    equipmentCategory: form.elements.equipmentCategory.value,
    spellLevel: form.elements.spellLevel.value,
    spellClass: form.elements.spellClass.value,
    spellSchool: form.elements.spellSchool.value,
    spellTag: form.elements.spellTag.value,
  };
}

function matchesSpellLevel(spell, filter) {
  if (filter === "all") return true;
  return Number(spell.level) === Number(filter);
}

function matchesSpellTag(spell, tag) {
  if (tag === "all") return true;
  if (tag === "concentration") return Boolean(spell.concentration);
  if (tag === "ritual") return Boolean(spell.ritual);
  if (tag === "damage") return Boolean(spell.damage || spell.damageType);
  if (tag === "save") return Boolean(spell.save);
  if (tag === "attack") return Boolean(spell.attack);
  return true;
}

function getSpellSchools() {
  return [...new Set(spells.map((spell) => spell.school).filter(Boolean))].sort(compareDisplayValue);
}

function sortReference(a, b) {
  if (a.type === "rule" || b.type === "rule") return referenceTitle(a).localeCompare(referenceTitle(b), "es");
  if (a.type === "spell" && b.type === "spell" && a.item.level !== b.item.level) {
    return compareSpellLevelThenName(a.item, b.item);
  }

  if (a.type === "spell" && b.type === "spell") {
    return compareSpellLevelThenName(a.item, b.item);
  }

  return compareVisibleName(a.item, b.item);
}

function referenceKey(result) {
  return `${result.type}:${result.item.id}`;
}

function referenceTitle(result) {
  return result.type === "rule" ? result.item.title : displayName(result.item);
}

function loadFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // La consulta sigue funcionando aunque el navegador bloquee el almacenamiento.
  }
}

function equipmentTypeLabel(item) {
  const labels = {
    armor: item.armorType ? `Armadura ${item.armorType}` : "Armadura",
    shield: "Escudo",
    weapon: "Arma",
    gear: "Equipo",
    tool: "Herramienta",
    focus: "Foco",
    pack: "Paquete",
  };
  return labels[item.category] || displayValue(item.category);
}

function dexterityText(value) {
  if (value === "full") return " + DES";
  if (value === "max2") return " + DES max 2";
  return "";
}

function formatCoins(coins = {}) {
  const labels = { cp: "PC", sp: "PP", ep: "PE", gp: "PO", pp: "PPT" };
  return Object.entries(coins)
    .filter(([, amount]) => amount)
    .map(([coin, amount]) => `${amount} ${labels[coin] || coin.toUpperCase()}`)
    .join(", ");
}

function cleanText(value) {
  return String(value || "")
    .replace(/1 bonus action|bonus action/gi, "acción adicional")
    .replace(/1 reaction|reaction/gi, "reacción")
    .replace(/1 action|action/gi, "acción")
    .replace(/self/gi, "personal")
    .replace(/touch/gi, "toque")
    .replace(/feet/gi, "pies")
    .replace(/foot/gi, "pie");
}

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
