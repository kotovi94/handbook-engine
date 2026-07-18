import { getUniqueDoorConnections } from "../dungeon/dungeonDoorUtils.js";
import { getMapTileLabel, getMapTileSymbol, mapTileTypes } from "../dungeon/dungeonMapGenerator.js";
import { buildMapTooltipModel } from "../dungeon/dungeonViewModel.js";
import { DungeonMapTooltip } from "./DungeonAreaInspector.js";
import { Icon } from "./Icon.js";

export function DungeonMapView({
  dungeon,
  onRegenerateMap,
  onMapCellChange,
  onMapTargetSelect,
  onMapTargetHover,
}) {
  const map = dungeon.map;
  const section = document.createElement("section");
  section.className = "dungeon-map-panel";

  if (!map?.cells?.length) {
    section.append(renderEmptyMap(onRegenerateMap));
    return section;
  }

  let selectedBrush = "room";
  let interactionMode = "inspect";
  let updateModeUi = () => {};
  const getInteractionMode = () => interactionMode;
  const setInteractionMode = (mode) => {
    interactionMode = mode;
    section.dataset.mapMode = mode;
    updateModeUi(mode);
  };
  const header = renderMapHeader(map, onRegenerateMap, setInteractionMode);
  const brushBar = renderBrushBar(map, (brush) => {
    selectedBrush = brush;
    setInteractionMode("edit");
  });
  const doorLookup = new Map((map.doors || []).map((door) => [door.id, door]));
  const mapWrap = renderMapGrid({
    dungeon,
    map,
    doorLookup,
    getSelectedBrush: () => selectedBrush,
    getInteractionMode,
    onMapCellChange,
    onMapTargetSelect,
    onMapTargetHover,
  });
  const legend = renderLegend();
  const doors = renderMapDoors(map);
  const rooms = renderMapRooms(map);

  updateModeUi = createModeUiUpdater(header, brushBar);
  setInteractionMode("inspect");
  section.append(header, brushBar, mapWrap, legend, doors, rooms);
  return section;
}

function renderEmptyMap(onRegenerateMap) {
  const empty = document.createElement("div");
  empty.className = "dungeon-map-empty";
  const text = document.createElement("p");
  text.textContent = "Mapa visual pendiente.";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button";
  button.append(Icon({ name: "map" }), document.createTextNode("Generar mapa visual"));
  button.addEventListener("click", () => onRegenerateMap?.());
  empty.append(text, button);
  return empty;
}

function renderMapHeader(map, onRegenerateMap, onModeChange) {
  const header = document.createElement("header");
  header.className = "dungeon-map-header";

  const titleWrap = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "page-kicker";
  kicker.textContent = "Mapa visual";
  const title = document.createElement("h3");
  title.textContent = `${map.width} x ${map.height} cuadros`;
  const scale = document.createElement("p");
  scale.className = "dungeon-map-scale";
  scale.textContent = `1 cuadro = ${map.tileSizeFeet || 5} pies. Área aproximada: ${map.widthFeet} x ${map.heightFeet} pies.`;
  titleWrap.append(kicker, title, scale);

  const actions = document.createElement("div");
  actions.className = "dungeon-map-actions";

  const modeControl = renderMapModeControl(onModeChange);

  const regenerateButton = document.createElement("button");
  regenerateButton.type = "button";
  regenerateButton.className = "button secondary-button";
  regenerateButton.append(Icon({ name: "map" }), document.createTextNode("Regenerar mapa"));
  regenerateButton.addEventListener("click", () => onRegenerateMap?.());

  const zoomLabel = document.createElement("label");
  zoomLabel.className = "field dungeon-map-zoom";
  const zoomText = document.createElement("span");
  zoomText.textContent = "Zoom";
  const zoom = document.createElement("select");
  [
    { value: "12px", label: "Plano" },
    { value: "16px", label: "Mesa" },
    { value: "22px", label: "Detalle" },
  ].forEach((optionData) => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    zoom.append(option);
  });
  zoom.value = "16px";
  zoom.addEventListener("change", () => {
    const grid = document.querySelector("[data-dungeon-map-grid]");
    if (grid) {
      grid.style.setProperty("--dungeon-map-cell-size", zoom.value);
    }
  });
  zoomLabel.append(zoomText, zoom);

  actions.append(modeControl, zoomLabel, regenerateButton);
  header.append(titleWrap, actions);
  return header;
}

function renderMapModeControl(onModeChange) {
  const wrap = document.createElement("div");
  wrap.className = "dungeon-map-mode";
  const label = document.createElement("span");
  label.textContent = "Modo";
  wrap.append(label);

  [
    { id: "inspect", label: "Mesa" },
    { id: "edit", label: "Editor" },
  ].forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dungeon-map-mode-button";
    button.dataset.mapModeButton = mode.id;
    button.textContent = mode.label;
    button.addEventListener("click", () => onModeChange?.(mode.id));
    wrap.append(button);
  });

  return wrap;
}

function renderBrushBar(map, onBrushChange) {
  const wrap = document.createElement("div");
  wrap.className = "dungeon-map-brushbar";

  const label = document.createElement("span");
  label.className = "dungeon-map-brush-label";
  label.textContent = "Brocha";
  wrap.append(label);

  const brushTypes = map.brushTypes?.length ? map.brushTypes : mapTileTypes.map((tile) => tile.id);

  brushTypes.forEach((tileType) => {
    const tile = mapTileTypes.find((item) => item.id === tileType);
    if (!tile) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = tile.id === "room" ? "dungeon-map-brush is-active" : "dungeon-map-brush";
    button.dataset.brush = tile.id;
    button.title = tile.description;
    button.textContent = `${tile.symbol} ${tile.label}`;
    button.addEventListener("click", () => {
      wrap.querySelectorAll(".dungeon-map-brush").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      onBrushChange(tile.id);
    });
    wrap.append(button);
  });

  return wrap;
}

function renderMapGrid({
  dungeon,
  map,
  doorLookup,
  getSelectedBrush,
  getInteractionMode,
  onMapCellChange,
  onMapTargetSelect,
  onMapTargetHover,
}) {
  const viewport = document.createElement("div");
  viewport.className = "dungeon-map-viewport";
  const tooltip = document.createElement("div");
  tooltip.className = "dungeon-map-tooltip";

  const grid = document.createElement("div");
  grid.className = "dungeon-map-grid";
  grid.dataset.dungeonMapGrid = "true";
  grid.style.setProperty("--dungeon-map-columns", map.width);
  grid.style.setProperty("--dungeon-map-cell-size", "16px");

  map.cells.forEach((cell) => {
    grid.append(renderMapCell({
      dungeon,
      cell,
      doorLookup,
      getSelectedBrush,
      getInteractionMode,
      onMapCellChange,
      onMapTargetSelect,
      onMapTargetHover,
      tooltip,
      viewport,
      grid,
    }));
  });

  viewport.append(grid, tooltip);
  return viewport;
}

function renderMapCell({
  dungeon,
  cell,
  doorLookup,
  getSelectedBrush,
  getInteractionMode,
  onMapCellChange,
  onMapTargetSelect,
  onMapTargetHover,
  tooltip,
  viewport,
  grid,
}) {
  const button = document.createElement("button");
  button.type = "button";
  setCellPresentation(button, cell, doorLookup, dungeon);

  button.addEventListener("click", () => {
    if (getInteractionMode() === "inspect") {
      grid.querySelectorAll(".dungeon-map-cell.is-selected").forEach((item) => item.classList.remove("is-selected"));

      if (cell.type === "wall") {
        onMapTargetSelect?.(null);
        return;
      }

      button.classList.add("is-selected");
      onMapTargetSelect?.({ ...cell });
      return;
    }

    const nextType = getSelectedBrush();
    const patch = {
      type: nextType,
      roomId: nextType === "wall" ? "" : cell.roomId,
      label: nextType === "room" ? cell.label : "",
      doorId: nextType === "door" ? cell.doorId : "",
    };
    Object.assign(cell, patch);
    setCellPresentation(button, cell, doorLookup, dungeon);
    onMapCellChange?.(cell.x, cell.y, patch);
  });

  button.addEventListener("mouseenter", () => {
    const model = buildMapTooltipModel(dungeon, cell);
    onMapTargetHover?.(model ? { ...cell } : null);
    showTooltip(tooltip, viewport, button, model);
  });

  button.addEventListener("mouseleave", () => {
    onMapTargetHover?.(null);
    hideTooltip(tooltip);
  });

  return button;
}

function setCellPresentation(button, cell, doorLookup, dungeon) {
  const label = cell.label || getDisplaySymbol(cell.type);
  const door = cell.doorId ? doorLookup.get(cell.doorId) : null;
  const doorText = door ? ` - ${door.id}: ${door.kindLabel || "Acceso"} ${door.stateLabel || ""}` : "";
  const tooltip = buildMapTooltipModel(dungeon, cell);
  button.className = `dungeon-map-cell tile-${cell.type}`;
  button.textContent = label;
  button.dataset.tileType = cell.type || "";
  button.dataset.roomId = cell.roomId || "";
  button.dataset.doorId = cell.doorId || "";
  button.dataset.connection = cell.connection || "";
  button.dataset.x = String(cell.x);
  button.dataset.y = String(cell.y);
  button.title = tooltip
    ? [tooltip.title, tooltip.subtitle, tooltip.hint].filter(Boolean).join("\n")
    : `${cell.x},${cell.y} - ${getMapTileLabel(cell.type)}${cell.roomId ? ` - ${cell.roomId}` : ""}${doorText}`;
  button.setAttribute("aria-label", button.title);
}

function getDisplaySymbol(type) {
  if (type === "wall" || type === "room" || type === "corridor") {
    return "";
  }

  return getMapTileSymbol(type);
}

function createModeUiUpdater(header, brushBar) {
  return (mode) => {
    header.querySelectorAll("[data-map-mode-button]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mapModeButton === mode);
    });
    brushBar.classList.toggle("is-editor-active", mode === "edit");
  };
}

function showTooltip(tooltip, viewport, button, model) {
  if (!model) {
    hideTooltip(tooltip);
    return;
  }

  tooltip.replaceChildren(DungeonMapTooltip({ model }));
  tooltip.classList.add("is-visible");

  const viewportRect = viewport.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const left = Math.max(8, buttonRect.left - viewportRect.left + buttonRect.width + 8 + viewport.scrollLeft);
  const top = Math.max(8, buttonRect.top - viewportRect.top + viewport.scrollTop);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip(tooltip) {
  tooltip.classList.remove("is-visible");
  tooltip.replaceChildren();
}

function renderLegend() {
  const legend = document.createElement("div");
  legend.className = "dungeon-map-legend";

  mapTileTypes.forEach((tile) => {
    const item = document.createElement("span");
    item.className = `dungeon-map-legend-item tile-${tile.id}`;
    item.innerHTML = `<span>${tile.symbol}</span>${tile.label}`;
    legend.append(item);
  });

  return legend;
}

function renderMapDoors(map) {
  const doors = getUniqueDoorConnections(map);

  if (!doors.length) {
    return document.createDocumentFragment();
  }

  const details = document.createElement("details");
  details.className = "dungeon-map-door-index";
  const summary = document.createElement("summary");
  summary.textContent = `Puertas y accesos (${doors.length} conexiones)`;
  const list = document.createElement("div");
  list.className = "dungeon-map-door-list";

  doors.forEach((door) => {
    const item = document.createElement("article");
    const title = document.createElement("strong");
    title.textContent = `${door.displayId}: ${door.kindLabel || "Acceso"} ${door.connectionLabel}`;
    const body = document.createElement("p");
    body.textContent = door.summary;
    const meta = document.createElement("small");
    meta.textContent = `${door.cellCount || 1} pieza(s) en mapa${door.positionsText ? ` - ${door.positionsText}` : ""}`;
    item.append(title, body, meta);
    list.append(item);
  });

  details.append(summary, list);
  return details;
}

function renderMapRooms(map) {
  const details = document.createElement("details");
  details.className = "dungeon-map-room-index";
  const summary = document.createElement("summary");
  summary.textContent = "Índice visual de salas";
  const list = document.createElement("div");
  list.className = "dungeon-map-room-list";

  (map.rooms || []).forEach((room) => {
    const item = document.createElement("span");
    const shape = room.shapeLabel || room.shape || "forma";
    const floor = Number.isFinite(room.floorLevel) ? `, nivel ${room.floorLevel}` : "";
    item.textContent = `${room.roomId}: ${room.name} (${shape}${floor})`;
    list.append(item);
  });

  details.append(summary, list);
  return details;
}
