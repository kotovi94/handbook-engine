import { DungeonRoomCard } from "./DungeonRoomCard.js";
import { DungeonBadge } from "./DungeonPanels.js";
import { Icon } from "./Icon.js";

export function DungeonAreaInspector({
  model,
  onSelectRoom,
  onRoomChange,
  onRegenerateRoom,
  onRegenerateRoomEnemies,
  onRegenerateRoomTreasure,
  onCopy,
} = {}) {
  const section = document.createElement("section");
  section.className = "dungeon-area-inspector";

  if (!model || model.kind === "empty") {
    section.append(renderInspectorHeader("Inspector de Área", model?.title || "Selecciona un área"));
    section.append(renderMutedText(model?.message || "Haz click en una sala, puerta, tesoro, trampa o corredor del mapa."));
    return section;
  }

  if (model.kind === "room") {
    section.append(DungeonRoomSummaryCard({
      model,
      onSelectRoom,
      onRoomChange,
      onRegenerateRoom,
      onRegenerateRoomEnemies,
      onRegenerateRoomTreasure,
      onCopy,
    }));
    return section;
  }

  if (model.kind === "door") {
    section.append(DungeonDoorDetailCard({ model, onSelectRoom, onCopy }));
    return section;
  }

  if (model.kind === "corridor") {
    section.append(DungeonCorridorDetailCard({ model, onSelectRoom }));
    return section;
  }

  section.append(renderInspectorHeader("Inspector de Área", model.title || "Tile de mapa"));
  section.append(renderMutedText(model.message || "Este tile no tiene contenido especifico."));
  return section;
}

export function DungeonMapTooltip({ model }) {
  const tooltip = document.createElement("div");
  tooltip.className = `dungeon-map-tooltip-content target-${model?.kind || "tile"}`;

  if (!model) {
    return tooltip;
  }

  const title = document.createElement("strong");
  title.textContent = model.title || "";
  const subtitle = document.createElement("span");
  subtitle.textContent = model.subtitle || "";
  const hint = document.createElement("small");
  hint.textContent = model.hint || "";
  tooltip.append(title, subtitle, hint);
  return tooltip;
}

export function DungeonRoomSummaryCard({
  model,
  onSelectRoom,
  onRoomChange,
  onRegenerateRoom,
  onRegenerateRoomEnemies,
  onRegenerateRoomTreasure,
  onCopy,
}) {
  const wrap = document.createElement("div");
  wrap.className = "dungeon-inspector-content";
  wrap.append(renderInspectorHeader("Inspector de Área", model.title, model.badges));

  if (model.isPassageRoom) {
    const note = document.createElement("p");
    note.className = "dungeon-inspector-note";
    note.textContent = "Los pasillos también pueden contener encuentros, trampas, ruido o pistas.";
    wrap.append(note);
  }

  const actions = document.createElement("div");
  actions.className = "dungeon-inspector-actions";
  actions.append(
    renderActionButton("Regenerar sala", "spark", () => onRegenerateRoom?.(model.room.id)),
    renderActionButton("Regenerar enemigos", "sword", () => onRegenerateRoomEnemies?.(model.room.id)),
    renderActionButton("Regenerar tesoro", "coins", () => onRegenerateRoomTreasure?.(model.room.id)),
    renderActionButton("Copiar sala", "book", () => onCopy?.(model.copyText)),
  );
  wrap.append(actions);

  wrap.append(DungeonRoomSectionTabs({
    sections: model.sections,
    focusSection: model.focusSection,
    onSelectRoom,
  }));

  const editor = document.createElement("details");
  editor.className = "dungeon-inspector-editor";
  const summary = document.createElement("summary");
  summary.textContent = "Editar campos de esta sala";
  editor.append(summary, DungeonRoomCard({
    room: model.room.raw,
    onChange: onRoomChange,
    onRegenerate: onRegenerateRoom,
  }));
  wrap.append(editor);

  return wrap;
}

export function DungeonDoorDetailCard({ model, onSelectRoom, onCopy }) {
  const wrap = document.createElement("div");
  wrap.className = "dungeon-inspector-content";
  wrap.append(renderInspectorHeader("Inspector de Área", model.title, [
    { label: model.connection.kindLabel || "Puerta", tone: "type" },
    { label: model.connection.connectionLabel, tone: "neutral" },
  ]));

  const actions = document.createElement("div");
  actions.className = "dungeon-inspector-actions";
  actions.append(renderActionButton("Copiar puerta", "book", () => onCopy?.(model.copyText)));
  model.roomLinks.forEach((room) => {
    actions.append(renderActionButton(`${room.id}`, "map", () => onSelectRoom?.(room.id, "overview")));
  });
  wrap.append(actions);

  const stats = document.createElement("div");
  stats.className = "dungeon-door-stat-grid";
  model.fields.forEach(([label, value]) => {
    stats.append(renderMetric(label, value));
  });
  wrap.append(stats);

  wrap.append(DungeonInspectorSection({
    id: "notes",
    title: "Notas",
    items: model.notes,
    open: true,
  }));
  return wrap;
}

export function DungeonCorridorDetailCard({ model, onSelectRoom }) {
  const wrap = document.createElement("div");
  wrap.className = "dungeon-inspector-content";
  wrap.append(renderInspectorHeader("Inspector de Área", model.title, [
    { label: model.typeLabel, tone: "type" },
    { label: `${model.cell?.x},${model.cell?.y}`, tone: "neutral" },
  ]));

  const summary = document.createElement("p");
  summary.className = "dungeon-inspector-note";
  summary.textContent = model.connectionText;
  wrap.append(summary);

  if (model.nearbyRooms.length) {
    const rooms = document.createElement("div");
    rooms.className = "dungeon-inspector-actions";
    model.nearbyRooms.forEach((room) => {
      rooms.append(renderActionButton(`${room.id} ${room.name}`, "map", () => onSelectRoom?.(room.id, "overview")));
    });
    wrap.append(rooms);
  }

  wrap.append(DungeonInspectorSection({
    id: "overview",
    title: "Uso en mesa",
    items: model.usage,
    open: true,
  }));

  if (model.message) {
    wrap.append(renderMutedText(model.message));
  }

  return wrap;
}

export function DungeonRoomSectionTabs({ sections, focusSection, onSelectRoom }) {
  const wrap = document.createElement("div");
  wrap.className = "dungeon-inspector-sections";

  sections
    .filter((section) => section.items?.length || section.doors?.length || section.id === focusSection || section.id === "overview")
    .forEach((section) => {
      wrap.append(DungeonInspectorSection({
        ...section,
        open: section.id === focusSection || section.id === "overview",
        highlighted: section.id === focusSection,
        onSelectRoom,
      }));
    });

  return wrap;
}

export function DungeonInspectorSection({
  id,
  title,
  items = [],
  doors = [],
  open = false,
  highlighted = false,
  onSelectRoom,
}) {
  const details = document.createElement("details");
  details.className = highlighted ? "dungeon-inspector-section is-focused" : "dungeon-inspector-section";
  details.dataset.section = id;
  details.open = open;

  const summary = document.createElement("summary");
  summary.textContent = title;
  details.append(summary);

  if (items.length) {
    const list = document.createElement("ul");
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
    details.append(list);
  } else {
    details.append(renderMutedText("Sin contenido."));
  }

  if (doors.length) {
    const links = document.createElement("div");
    links.className = "dungeon-inspector-door-links";
    doors.forEach((door) => {
      door.roomIds.forEach((roomId) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "dungeon-link-button";
        button.textContent = roomId;
        button.addEventListener("click", () => onSelectRoom?.(roomId, "overview"));
        links.append(button);
      });
    });
    details.append(links);
  }

  return details;
}

function renderInspectorHeader(kickerText, titleText, badges = []) {
  const header = document.createElement("header");
  header.className = "dungeon-inspector-header";

  const kicker = document.createElement("p");
  kicker.className = "page-kicker";
  kicker.textContent = kickerText;
  const title = document.createElement("h3");
  title.textContent = titleText;
  header.append(kicker, title);

  if (badges.length) {
    const badgeRow = document.createElement("div");
    badgeRow.className = "dungeon-badge-row";
    badges.forEach((badge) => {
      badgeRow.append(DungeonBadge(badge.label, badge.tone));
    });
    header.append(badgeRow);
  }

  return header;
}

function renderMetric(label, value) {
  const item = document.createElement("span");
  item.className = "dungeon-metric";
  const labelNode = document.createElement("small");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = String(value || "Sin dato");
  item.append(labelNode, valueNode);
  return item;
}

function renderActionButton(label, iconName, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button secondary-button";
  button.append(Icon({ name: iconName }), document.createTextNode(label));
  button.addEventListener("click", () => onClick?.());
  return button;
}

function renderMutedText(text) {
  const node = document.createElement("p");
  node.className = "dungeon-muted";
  node.textContent = text;
  return node;
}
