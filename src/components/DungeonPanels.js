import { DungeonRoomCard } from "./DungeonRoomCard.js";
import { Icon } from "./Icon.js";

export function DungeonSectionCard({ kicker = "", title = "", children = [], className = "" } = {}) {
  const section = document.createElement("section");
  section.className = `dungeon-section-card ${className}`.trim();

  if (kicker || title) {
    const header = document.createElement("header");
    header.className = "dungeon-section-header";

    if (kicker) {
      const kickerNode = document.createElement("p");
      kickerNode.className = "page-kicker";
      kickerNode.textContent = kicker;
      header.append(kickerNode);
    }

    if (title) {
      const titleNode = document.createElement("h3");
      titleNode.textContent = title;
      header.append(titleNode);
    }

    section.append(header);
  }

  asArray(children).forEach((child) => {
    if (child) {
      section.append(child);
    }
  });

  return section;
}

export function DungeonBadge(label, tone = "neutral") {
  const badge = document.createElement("span");
  badge.className = `dungeon-badge tone-${tone}`;
  badge.textContent = label;
  return badge;
}

export function DungeonOverviewCard({ viewModel, actions = {} }) {
  const overview = viewModel.overview;
  const header = document.createElement("div");
  header.className = "dungeon-overview-main";

  const copy = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "page-kicker";
  kicker.textContent = "Resultado generado";
  const title = document.createElement("h2");
  title.className = "page-title";
  title.textContent = overview.name;
  const summary = document.createElement("p");
  summary.className = "dungeon-overview-summary";
  summary.textContent = overview.summary || "Sin resumen.";
  copy.append(kicker, title, summary);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "dungeon-result-toolbar";
  actionsWrap.append(
    renderActionButton("Regenerar nombre", "spark", actions.onRegenerateName),
    renderActionButton("Regenerar enemigos", "sword", actions.onRegenerateEnemies),
    renderActionButton("Regenerar tesoro", "coins", actions.onRegenerateTreasure),
    renderActionButton("Regenerar mapa", "map", actions.onRegenerateMap),
    renderActionButton("Guardar", "book", actions.onSave),
  );

  header.append(copy, actionsWrap);

  const meta = document.createElement("div");
  meta.className = "dungeon-overview-meta";
  overview.configRows.forEach((row) => {
    const item = document.createElement("span");
    item.className = "dungeon-overview-meta-item";
    const label = document.createElement("small");
    label.textContent = row.label;
    const value = document.createElement("strong");
    value.textContent = String(row.value || "Sin dato");
    item.append(label, value);
    meta.append(item);
  });

  return DungeonSectionCard({
    className: "dungeon-overview-card",
    children: [header, meta],
  });
}

export function DungeonAlertList(warnings = []) {
  const wrap = document.createElement("div");
  wrap.className = "dungeon-alert-list";

  if (!warnings.length) {
    const item = document.createElement("p");
    item.className = "dungeon-alert-item tone-ok";
    item.textContent = "Sin alertas de validación.";
    wrap.append(item);
    return wrap;
  }

  warnings.forEach((warning) => {
    const item = document.createElement("p");
    item.className = `dungeon-alert-item tone-${warning.severity}`;
    item.textContent = warning.message;
    wrap.append(item);
  });

  return wrap;
}

export function DungeonRoomIndex({ rooms, selectedRoomId, onSelect }) {
  const list = document.createElement("div");
  list.className = "dungeon-room-index-list";

  rooms.forEach((room) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = room.id === selectedRoomId ? "dungeon-room-index-item is-active" : "dungeon-room-index-item";
    button.addEventListener("click", () => onSelect?.(room.id));

    const id = document.createElement("strong");
    id.textContent = room.id;
    const name = document.createElement("span");
    name.textContent = room.name;
    const meta = document.createElement("small");
    meta.textContent = `${room.typeLabel} - riesgo ${room.riskLabel}`;
    button.append(id, name, meta);
    list.append(button);
  });

  return DungeonSectionCard({
    kicker: "Índice",
    title: `${rooms.length} salas`,
    className: "dungeon-room-index",
    children: [list],
  });
}

export function DungeonRoomDetail({ room, onChange, onRegenerate }) {
  if (!room) {
    return DungeonSectionCard({
      kicker: "Detalle",
      title: "Sin sala selecciónada",
      children: [renderMutedText("Selecciona una sala del índice.")],
    });
  }

  const summary = document.createElement("div");
  summary.className = "dungeon-room-detail-summary";

  const badges = document.createElement("div");
  badges.className = "dungeon-badge-row";
  badges.append(
    DungeonBadge(room.typeLabel, "type"),
    DungeonBadge(`Riesgo ${room.riskLabel}`, room.riskLevel),
    room.zoneName ? DungeonBadge(room.zoneName, "neutral") : document.createDocumentFragment(),
    DungeonBadge(`${room.connections.length} conexiones`, "neutral"),
  );

  const readAloud = document.createElement("p");
  readAloud.className = "dungeon-readaloud";
  readAloud.textContent = room.readAloud;

  const functionText = document.createElement("p");
  functionText.className = "dungeon-room-function";
  functionText.textContent = room.functionInSession;

  summary.append(badges, readAloud, functionText);

  const detailGrid = document.createElement("div");
  detailGrid.className = "dungeon-room-detail-grid";
  detailGrid.append(
    renderInfoBlock("Señales visibles", room.visibleSigns),
    renderInfoBlock("Pistas", room.investigationClues),
    renderInfoBlock("Zona", [room.zoneIdentity, room.inhabitantRole ? `Faccion local: ${room.inhabitantRole}` : ""].filter(Boolean)),
    renderInfoBlock("Criaturas", room.encounterUi.creatureBlocks.map((block) => block.label)),
    renderInfoBlock("Peligro", room.hazard.hasHazard ? [room.hazard.summary, room.hazard.countermeasure].filter(Boolean) : []),
    renderInfoBlock("Tesoro", room.treasure.hasTreasure ? [room.treasure.summary] : []),
    renderInfoBlock("Notas DM", room.dmNotes),
  );

  const editDetails = document.createElement("details");
  editDetails.className = "dungeon-room-edit-details";
  const editSummary = document.createElement("summary");
  editSummary.textContent = "Editar campos de la sala";
  editDetails.append(editSummary, DungeonRoomCard({
    room: room.raw,
    onChange,
    onRegenerate,
  }));

  return DungeonSectionCard({
    kicker: "Detalle de sala",
    title: `${room.id}. ${room.name}`,
    className: "dungeon-room-detail",
    children: [summary, detailGrid, editDetails],
  });
}

export function DungeonEncounterTable(rows = []) {
  return DungeonSectionCard({
    kicker: "Combate",
    title: "Encuentros",
    className: "dungeon-table-card",
    children: [rows.length ? renderTable({
      columns: ["Sala", "Dificultad", "XP", "CR mayor", "Criaturas", "Alertas"],
      rows: rows.map((row) => [
        `${row.roomId} ${row.roomName}`,
        row.difficultyLabel,
        `${row.spentXp}/${row.budgetXp}`,
        row.highestCr || "",
        row.creatureBlocks.map((block) => block.label).join("; "),
        row.warnings.join(" "),
      ]),
    }) : renderMutedText("Sin encuentros sugeridos.")],
  });
}

export function DungeonTreasureTable(rows = []) {
  return DungeonSectionCard({
    kicker: "Recompensas",
    title: "Tesoro",
    className: "dungeon-table-card",
    children: [rows.length ? renderTable({
      columns: ["Sala", "Valor", "Monedas", "Objetos", "Pistas o llaves"],
      rows: rows.map((row) => [
        `${row.roomId} ${row.roomName}`,
        row.valueHint,
        row.coins || "",
        row.items.join("; "),
        [...row.clues, ...row.keys].join("; "),
      ]),
    }) : renderMutedText("Sin tesoro sugerido.")],
  });
}

export function DungeonDoorTable(rows = []) {
  return DungeonSectionCard({
    kicker: "Mapa",
    title: "Puertas y accesos",
    className: "dungeon-table-card",
    children: [rows.length ? renderTable({
      columns: ["Conexión", "Tipo", "Piezas", "Resumen"],
      rows: rows.map((row) => [
        row.roomsText || row.connectionLabel,
        row.kindText || row.kindLabel,
        row.cellCount || row.doorCount || 1,
        row.summary,
      ]),
    }) : renderMutedText("Sin puertas detalladas.")],
  });
}

export function DungeonExportPanel({ actions = {} }) {
  const actionsWrap = document.createElement("div");
  actionsWrap.className = "dungeon-export-actions";
  actionsWrap.append(
    renderActionButton("JSON", "tools", actions.onExportJson),
    renderActionButton("Markdown completo", "quill", actions.onExportMarkdown),
    renderActionButton("Markdown compacto", "book", actions.onExportMarkdownCompact),
    renderActionButton("Foundry draft", "map", actions.onExportFoundry),
  );

  if (actions.onSendToCampaign) {
    actionsWrap.append(renderActionButton("Enviar a Campañas", "map", actions.onSendToCampaign));
  }

  return DungeonSectionCard({
    kicker: "Salida",
    title: "Exportar",
    className: "dungeon-export-panel",
    children: [actionsWrap],
  });
}

export function DungeonFlowPanel(flow) {
  if (!flow?.nodes?.length) {
    return document.createDocumentFragment();
  }

  const grid = document.createElement("div");
  grid.className = "dungeon-flow-grid";
  grid.append(
    renderMetric("Entrada", flow.entranceId || "Sin dato"),
    renderMetric("Final", flow.finalRoomId || "Sin dato"),
    renderMetric("Ruta", flow.mainPath.join(" -> ") || "Sin ruta"),
    renderMetric("Bifurcaciones", flow.branchRooms.map((room) => room.id).join(", ") || "Ninguna"),
    renderMetric("Atajos", flow.shortcuts?.map((item) => `${item.from}-${item.to}`).join(", ") || "Ninguno"),
    renderMetric("Puertas de zona", flow.zoneGates?.map((item) => `${item.from}-${item.to}`).join(", ") || "Ninguna"),
    renderMetric("Secretos", flow.secretRooms.map((room) => room.id).join(", ") || "Ninguno"),
  );

  return DungeonSectionCard({
    kicker: "Estructura",
    title: "Flujo de mazmorra",
    className: "dungeon-flow-card",
    children: [grid],
  });
}

export function DungeonNarrativePanel(narrative) {
  if (!narrative) {
    return document.createDocumentFragment();
  }

  const grid = document.createElement("div");
  grid.className = "dungeon-flow-grid";
  [
    ["Causa", `${narrative.cause}: ${narrative.causeSummary}`],
    ["Situación", narrative.situation],
    ["Relación", `${narrative.relationship}: ${narrative.relationshipSummary}`],
    ["Mezcla", narrative.mixSummary],
    ["Pistas", narrative.clues.join("; ")],
    ["Final", narrative.finalHooks.join("; ")],
  ].forEach(([label, value]) => {
    grid.append(renderMetric(label, value));
  });

  return DungeonSectionCard({
    kicker: "Cohesion",
    title: "Hilo interno",
    className: "dungeon-narrative-card",
    children: [grid],
  });
}

export function DungeonZonePanel(zones = []) {
  if (!zones.length) {
    return document.createDocumentFragment();
  }

  const grid = document.createElement("div");
  grid.className = "dungeon-zone-grid";
  zones.forEach((zone) => {
    const article = document.createElement("article");
    article.className = "dungeon-zone-item";
    const title = document.createElement("h4");
    title.textContent = `${zone.id}. ${zone.name}`;
    const identity = document.createElement("p");
    identity.textContent = zone.identity;
    const rooms = document.createElement("small");
    rooms.textContent = `Salas: ${zone.roomIds.join(", ") || "Sin salas"}`;
    article.append(title, identity, rooms);
    grid.append(article);
  });

  return DungeonSectionCard({
    kicker: "Estructura",
    title: "Zonas internas",
    className: "dungeon-zone-card",
    children: [grid],
  });
}

export function DungeonEcologyPanel(ecology) {
  if (!ecology) {
    return document.createDocumentFragment();
  }

  const grid = document.createElement("div");
  grid.className = "dungeon-ecology-grid";
  [
    ["Motivo", ecology.reasonTheyAreHere],
    ["Comida", ecology.foodSource],
    ["Nido", ecology.nestingArea],
    ["Caza", ecology.huntingArea],
    ["Agua", ecology.waterSource],
    ["Dominante", ecology.dominantCreature],
    ["Ruido", ecology.noiseReaction],
    ["Rastros", ecology.tracksAndSigns],
    ["No combate", ecology.nonCombatSolutions.join("; ")],
  ].forEach(([label, value]) => {
    grid.append(renderMetric(label, value));
  });

  return DungeonSectionCard({
    kicker: "Bestias",
    title: "Ecologia",
    className: "dungeon-ecology-card",
    children: [grid],
  });
}

function renderInfoBlock(title, values) {
  const block = document.createElement("article");
  block.className = "dungeon-info-block";
  const heading = document.createElement("h4");
  heading.textContent = title;
  block.append(heading);

  if (!values?.length) {
    block.append(renderMutedText("Sin dato."));
    return block;
  }

  const list = document.createElement("ul");
  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  });
  block.append(list);
  return block;
}

function renderTable({ columns, rows }) {
  const wrap = document.createElement("div");
  wrap.className = "dungeon-table-wrap";
  const table = document.createElement("table");
  table.className = "dungeon-data-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = column;
    headRow.append(th);
  });
  thead.append(headRow);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = String(value || "");
      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
  wrap.append(table);
  return wrap;
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

function renderMutedText(text) {
  const node = document.createElement("p");
  node.className = "dungeon-muted";
  node.textContent = text;
  return node;
}

function renderActionButton(label, iconName, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button secondary-button";
  button.append(Icon({ name: iconName }), document.createTextNode(label));
  button.addEventListener("click", () => onClick?.());
  return button;
}

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}
