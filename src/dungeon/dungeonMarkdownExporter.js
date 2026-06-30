import { renderAsciiDungeonMap } from "./dungeonMapGenerator.js";
import { buildDungeonViewModel } from "./dungeonViewModel.js";

export function renderMarkdownDetailed(dungeon) {
  const viewModel = buildDungeonViewModel(dungeon);
  const { overview } = viewModel;
  const lines = [
    `# ${overview.name}`,
    "",
    overview.summary || "Sin resumen.",
    "",
    "## Resumen",
    "",
    ...overview.configRows.map((row) => `- ${row.label}: ${row.value || "Sin dato"}`),
    `- Salas: ${overview.roomCount}`,
    `- Sala final: ${overview.finalRoom.id} ${overview.finalRoom.name ? `- ${overview.finalRoom.name}` : ""}`.trim(),
    "",
    "## Notas de diseno",
    "",
    overview.designNotes || "Sin notas de diseno.",
    "",
    ...renderNarrativeMarkdown(viewModel.narrative),
    "",
    ...renderZonesMarkdown(viewModel.zones),
    "",
    "## Mapa",
    "",
    ...renderMapMarkdown(dungeon, viewModel),
    "",
    ...renderFlowMarkdown(viewModel.flow),
    "",
    ...renderEcologyMarkdown(viewModel.ecology),
    "",
    ...renderWarningsMarkdown(viewModel.warnings),
    "",
    "## Salas",
    "",
  ];

  viewModel.rooms.forEach((room) => {
    lines.push(...renderRoomMarkdown(room), "");
  });

  lines.push(
    ...renderEncounterTableMarkdown(viewModel.encounterRows),
    "",
    ...renderTreasureTableMarkdown(viewModel.treasureRows),
    "",
    ...renderDoorTableMarkdown(viewModel.doorRows),
  );

  return trimBlankLines(lines).join("\n");
}

export function renderMarkdownCompact(dungeon) {
  const viewModel = buildDungeonViewModel(dungeon);
  const lines = [
    `# ${viewModel.overview.name}`,
    "",
    viewModel.overview.summary || "",
    "",
    `Nivel ${viewModel.overview.recommendedLevel}. ${viewModel.overview.roomCount} salas. ${viewModel.overview.labels.type} ${viewModel.overview.labels.theme}. Habitantes: ${viewModel.overview.labels.inhabitants}.`,
    "",
    "```text",
    dungeon?.map?.cells?.length ? renderAsciiDungeonMap(dungeon.map) : "Sin mapa visual.",
    "```",
    "",
    "## Indice de salas",
    "",
    ...viewModel.rooms.map((room) => `- ${room.id} ${room.name} (${room.typeLabel}, riesgo ${room.riskLabel}): ${room.connections.join(", ") || "sin conexiones"}`),
    "",
    ...renderEncounterTableMarkdown(viewModel.encounterRows),
    "",
    ...renderTreasureTableMarkdown(viewModel.treasureRows),
    "",
    ...renderDoorTableMarkdown(viewModel.doorRows),
  ];

  return trimBlankLines(lines).join("\n");
}

export function renderRoomMarkdown(room) {
  const lines = [
    `### ${room.id}. ${room.name}`,
    "",
    `- Tipo: ${room.typeLabel}`,
    `- Riesgo: ${room.riskLabel}`,
    `- Funcion en mesa: ${room.functionInSession}`,
    `- Conexiones: ${room.connections.join(", ") || "Sin conexiones"}`,
    room.zoneName ? `- Zona: ${room.zoneName}` : "",
    room.shapeLabel ? `- Forma: ${room.shapeLabel}` : "",
    Number.isFinite(room.floorLevel) ? `- Nivel: ${room.floorLevel}` : "",
    room.elevationHint ? `- Elevacion: ${room.elevationHint}` : "",
    room.featureTiles?.length ? `- Tiles especiales: ${summarizeFeatureTiles(room.featureTiles)}` : "",
    "",
    room.readAloud || "Sin descripcion.",
  ];

  if (room.visibleSigns.length) {
    lines.push("", `**Senales visibles:** ${room.visibleSigns.join("; ")}`);
  }

  if (room.investigationClues.length) {
    lines.push("", `**Pistas al investigar:** ${room.investigationClues.join("; ")}`);
  }

  if (room.encounterUi.creatureBlocks.length) {
    lines.push("", "**Encuentro:**");
    room.encounterUi.creatureBlocks.forEach((block) => {
      lines.push(`- ${formatEncounterBlockLabel(block)}`);
    });
    lines.push(`- Presupuesto: ${room.encounterUi.spentXp}/${room.encounterUi.budgetXp} XP (${room.encounterUi.difficultyLabel})`);
  }

  if (room.hazard.hasHazard) {
    lines.push("", `**Peligro:** ${room.hazard.summary}`);
    if (room.hazard.countermeasure) {
      lines.push(`**Contramedida:** ${room.hazard.countermeasure}`);
    }
  }

  if (room.treasure.hasTreasure) {
    lines.push("", `**Tesoro:** ${room.treasure.summary}`);
  }

  if (room.dmNotes.length) {
    lines.push("", `**Notas DM:** ${room.dmNotes.join("; ")}`);
  }

  return lines;
}

export function renderEncounterTableMarkdown(rows) {
  if (!rows.length) {
    return ["## Encuentros", "", "Sin encuentros sugeridos."];
  }

  return [
    "## Encuentros",
    "",
    "| Sala | Dificultad | XP | CR mayor | Criaturas | Alertas |",
    "| --- | --- | ---: | ---: | --- | --- |",
    ...rows.map((row) => [
      `${row.roomId} ${row.roomName}`,
      row.difficultyLabel,
      `${row.spentXp}/${row.budgetXp}`,
      row.highestCr || "",
      row.creatureBlocks.map(formatEncounterBlockLabel).join("; "),
      row.warnings.join(" "),
    ].map(escapeTableCell).join(" | ")).map((line) => `| ${line} |`),
  ];
}

export function renderTreasureTableMarkdown(rows) {
  if (!rows.length) {
    return ["## Tesoro", "", "Sin tesoro sugerido."];
  }

  return [
    "## Tesoro",
    "",
    "| Sala | Valor | Monedas | Objetos | Pistas o llaves |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => [
      `${row.roomId} ${row.roomName}`,
      row.valueHint,
      row.coins || "",
      row.items.join("; "),
      [...row.clues, ...row.keys].join("; "),
    ].map(escapeTableCell).join(" | ")).map((line) => `| ${line} |`),
  ];
}

export function renderDoorTableMarkdown(rows) {
  if (!rows.length) {
    return ["## Puertas y accesos", "", "Sin puertas detalladas."];
  }

  return [
    "## Puertas y accesos",
    "",
    "| Conexion | Tipo | Piezas | Resumen |",
    "| --- | --- | ---: | --- |",
    ...rows.map((row) => [
      row.roomsText || row.connectionLabel,
      row.kindText || row.kindLabel,
      row.cellCount || row.doorCount || 1,
      row.summary,
    ].map(escapeTableCell).join(" | ")).map((line) => `| ${line} |`),
  ];
}

function renderMapMarkdown(dungeon, viewModel) {
  if (!dungeon?.map?.cells?.length) {
    return ["Sin mapa visual generado."];
  }

  return [
    `- Escala: 1 cuadro = ${dungeon.map.tileSizeFeet || 5} pies`,
    `- Tamano: ${dungeon.map.width} x ${dungeon.map.height} cuadros (${dungeon.map.widthFeet} x ${dungeon.map.heightFeet} pies)`,
    `- Leyenda: ${viewModel.mapLegend.map((tile) => `${tile.symbol} ${tile.label}`).join(", ")}`,
    `- Pisos: ${summarizeFloors(dungeon.map.rooms || [])}`,
    "",
    "```text",
    renderAsciiDungeonMap(dungeon.map),
    "```",
  ];
}

function renderFlowMarkdown(flow) {
  if (!flow?.nodes?.length) {
    return [];
  }

  return [
    "## Flujo",
    "",
    `- Entrada: ${flow.entranceId || "Sin dato"}`,
    `- Final: ${flow.finalRoomId || "Sin dato"}`,
    `- Ruta principal sugerida: ${flow.mainPath.join(" -> ") || "No encontrada"}`,
    `- Bifurcaciones: ${flow.branchRooms.map((room) => room.id).join(", ") || "Ninguna"}`,
    `- Atajos: ${flow.shortcuts?.map((item) => `${item.from}-${item.to}`).join(", ") || "Ninguno"}`,
    `- Puertas entre zonas: ${flow.zoneGates?.map((item) => `${item.from}-${item.to}`).join(", ") || "Ninguna"}`,
    `- Secretos: ${flow.secretRooms.map((room) => room.id).join(", ") || "Ninguno"}`,
  ];
}

function renderNarrativeMarkdown(narrative) {
  if (!narrative) {
    return [];
  }

  return [
    "## Hilo interno",
    "",
    `- Causa: ${narrative.cause} - ${narrative.causeSummary}`,
    `- Situacion actual: ${narrative.situation}`,
    `- Relacion: ${narrative.relationship} - ${narrative.relationshipSummary}`,
    `- Mezcla: ${narrative.mixSummary || "Sin mezcla"}`,
    `- Pistas: ${narrative.clues.join("; ") || "Sin pistas"}`,
  ];
}

function renderZonesMarkdown(zones = []) {
  if (!zones.length) {
    return [];
  }

  return [
    "## Zonas",
    "",
    ...zones.map((zone) => `- ${zone.id} ${zone.name}: ${zone.identity}. Salas: ${zone.roomIds.join(", ") || "sin salas"}`),
  ];
}

function renderEcologyMarkdown(ecology) {
  if (!ecology) {
    return [];
  }

  return [
    "## Ecologia de bestias",
    "",
    `- Motivo: ${ecology.reasonTheyAreHere}`,
    `- Comida: ${ecology.foodSource}`,
    `- Nido: ${ecology.nestingArea}`,
    `- Caza: ${ecology.huntingArea}`,
    `- Agua: ${ecology.waterSource}`,
    `- Dominante: ${ecology.dominantCreature}`,
    `- Respuesta al ruido: ${ecology.noiseReaction}`,
    `- Soluciones no violentas: ${ecology.nonCombatSolutions.join("; ")}`,
  ];
}

function renderWarningsMarkdown(warnings) {
  if (!warnings.length) {
    return ["## Revision", "", "Sin alertas de validacion."];
  }

  return [
    "## Revision",
    "",
    ...warnings.map((warning) => `- ${warning.severity.toUpperCase()}: ${warning.message}`),
  ];
}

function escapeTableCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function summarizeFeatureTiles(features = []) {
  const counts = features.reduce((acc, feature) => {
    acc[feature.type] = (acc[feature.type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([type, count]) => `${type} x${count}`).join(", ");
}

function summarizeFloors(rooms = []) {
  const values = [...new Set(rooms.map((room) => room.floorLevel || 0))].sort((a, b) => a - b);
  return values.length ? values.join(", ") : "0";
}

function formatEncounterBlockLabel(block = {}) {
  if (block.label) {
    return block.label;
  }

  if (block.isOfficial && block.name) {
    const count = Number(block.count) || 1;
    const cr = block.cr ? `CR ${block.cr}${count > 1 ? " c/u" : ""}` : "CR sin dato";
    const xp = Number(block.totalXp) ? `${block.totalXp} XP total` : "XP sin dato";
    const flavor = block.flavorName ? ` - rol narrativo: ${block.flavorName}` : "";
    return `${count} ${block.name} (${cr}, ${xp})${flavor}`;
  }

  if (block.source === "template-narrative" || block.flavorName) {
    return `Creature template: ${block.flavorName || block.name || "encuentro narrativo"} (CR sugerido ${block.suggestedCr || block.cr || "?"})`;
  }

  return block.name || "Encuentro sin criatura definida";
}

function trimBlankLines(lines) {
  const result = [...lines];
  while (result.length && result[result.length - 1] === "") {
    result.pop();
  }
  return result;
}
