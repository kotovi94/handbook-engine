import {
  DEFAULT_DUNGEON_CONFIG,
  DIFFICULTY_OPTIONS,
  DUNGEON_TYPE_OPTIONS,
  ENCOUNTER_DENSITY_OPTIONS,
  INHABITANT_OPTIONS,
  SECONDARY_INHABITANT_OPTIONS,
  SIZE_OPTIONS,
  THEME_OPTIONS,
  TREASURE_AMOUNT_OPTIONS,
} from "../dungeon/dungeonTypes.js";
import { Icon } from "./Icon.js";

export function DungeonConfigForm({
  config = DEFAULT_DUNGEON_CONFIG,
  savedDungeons = [],
  selectedSavedId = "",
  onConfigChange,
  onGenerate,
  onLoad,
  onSelectSaved,
  onDeleteSaved,
}) {
  const wrap = document.createElement("section");
  wrap.className = "dungeon-config-panel";

  const form = document.createElement("form");
  form.className = "dungeon-config-form";

  const grid = document.createElement("div");
  grid.className = "dungeon-config-grid";
  grid.append(
    renderNumberField("averageLevel", "Nivel promedio", config.averageLevel, 1, 20),
    renderNumberField("playerCount", "Jugadores", config.playerCount, 1, 8),
    renderSelectField("difficulty", "Dificultad", DIFFICULTY_OPTIONS, config.difficulty),
    renderSelectField("size", "Tamaño", SIZE_OPTIONS, config.size),
    renderSelectField("dungeonType", "Tipo de mazmorra", DUNGEON_TYPE_OPTIONS, config.dungeonType),
    renderSelectField("theme", "Tema visual", THEME_OPTIONS, config.theme),
    renderSelectField("inhabitants", "Habitantes principales", INHABITANT_OPTIONS, config.inhabitants),
    renderSelectField("secondaryInhabitants", "Habitantes secundarios", SECONDARY_INHABITANT_OPTIONS, config.secondaryInhabitants || "automatico"),
    renderSelectField("encounterDensity", "Densidad de encuentros", ENCOUNTER_DENSITY_OPTIONS, config.encounterDensity),
    renderSelectField("treasureAmount", "Cantidad de tesoro", TREASURE_AMOUNT_OPTIONS, config.treasureAmount),
  );

  const actions = document.createElement("div");
  actions.className = "dungeon-config-actions";
  const generateButton = renderActionButton("Generar mazmorra", "spark", "button");
  generateButton.type = "submit";
  actions.append(generateButton);

  form.append(grid, actions);
  form.addEventListener("input", () => onConfigChange?.(readConfig(form)));
  form.addEventListener("change", () => onConfigChange?.(readConfig(form)));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onGenerate?.(readConfig(form));
  });

  wrap.append(form, renderSavedControls({
    savedDungeons,
    selectedSavedId,
    onLoad,
    onSelectSaved,
    onDeleteSaved,
  }));

  return wrap;
}

function renderSavedControls({ savedDungeons, selectedSavedId, onLoad, onSelectSaved, onDeleteSaved }) {
  const controls = document.createElement("div");
  controls.className = "dungeon-saved-controls";

  const label = document.createElement("label");
  label.className = "field";

  const span = document.createElement("span");
  span.textContent = "Mazmorras guardadas";

  const select = document.createElement("select");
  select.name = "savedDungeon";
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = savedDungeons.length ? "Seleccionar" : "Sin guardadas";
  select.append(emptyOption);

  savedDungeons.forEach((dungeon) => {
    const option = document.createElement("option");
    option.value = dungeon.id;
    option.textContent = `${dungeon.name} (${dungeon.roomCount} salas)`;
    select.append(option);
  });

  select.value = selectedSavedId || "";
  label.append(span, select);

  const loadButton = renderActionButton("Cargar", "book", "button secondary-button");
  const deleteButton = renderActionButton("Eliminar", "tools", "button secondary-button");
  loadButton.disabled = !select.value;
  deleteButton.disabled = !select.value;

  select.addEventListener("change", () => {
    loadButton.disabled = !select.value;
    deleteButton.disabled = !select.value;
    onSelectSaved?.(select.value);
  });

  loadButton.addEventListener("click", () => onLoad?.(select.value));
  deleteButton.addEventListener("click", () => onDeleteSaved?.(select.value));

  const buttons = document.createElement("div");
  buttons.className = "dungeon-saved-actions";
  buttons.append(loadButton, deleteButton);
  controls.append(label, buttons);

  return controls;
}

function renderNumberField(name, labelText, value, min, max) {
  const label = document.createElement("label");
  label.className = "field";

  const span = document.createElement("span");
  span.textContent = labelText;

  const input = document.createElement("input");
  input.name = name;
  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);

  label.append(span, input);
  return label;
}

function renderSelectField(name, labelText, options, value) {
  const label = document.createElement("label");
  label.className = "field";

  const span = document.createElement("span");
  span.textContent = labelText;

  const select = document.createElement("select");
  select.name = name;
  options.forEach((optionData) => {
    const option = document.createElement("option");
    option.value = optionData.id;
    option.textContent = optionData.label;
    select.append(option);
  });
  select.value = value;

  label.append(span, select);
  return label;
}

function renderActionButton(label, iconName, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.append(Icon({ name: iconName }), document.createTextNode(label));
  return button;
}

function readConfig(form) {
  return {
    averageLevel: Number(form.elements.averageLevel.value),
    playerCount: Number(form.elements.playerCount.value),
    difficulty: form.elements.difficulty.value,
    size: form.elements.size.value,
    dungeonType: form.elements.dungeonType.value,
    theme: form.elements.theme.value,
    inhabitants: form.elements.inhabitants.value,
    secondaryInhabitants: form.elements.secondaryInhabitants.value,
    encounterDensity: form.elements.encounterDensity.value,
    treasureAmount: form.elements.treasureAmount.value,
  };
}
