import { mapTileTypes } from "./dungeonMapGenerator.js";
import { renderMarkdownCompact, renderMarkdownDetailed } from "./dungeonMarkdownExporter.js";
import { buildDungeonViewModel } from "./dungeonViewModel.js";

export function exportDungeonJson(dungeon) {
  return JSON.stringify(dungeon, null, 2);
}

export function exportDungeonMarkdown(dungeon, options = {}) {
  return options.mode === "compact"
    ? renderMarkdownCompact(dungeon)
    : renderMarkdownDetailed(dungeon);
}

export function exportDungeonMarkdownCompact(dungeon) {
  return renderMarkdownCompact(dungeon);
}

export function exportFoundryDraft(dungeon) {
  const viewModel = buildDungeonViewModel(dungeon);
  const draft = {
    schema: "handbook-engine-foundry-draft-v1",
    name: viewModel.overview.name,
    type: viewModel.overview.labels.type,
    theme: viewModel.overview.labels.theme,
    inhabitants: viewModel.overview.labels.inhabitants,
    recommendedLevel: viewModel.overview.recommendedLevel,
    notes: viewModel.overview.summary,
    designNotes: viewModel.overview.designNotes,
    narrative: viewModel.narrative,
    zones: viewModel.zones,
    encounters: viewModel.encounterRows.map((row) => ({
      roomId: row.roomId,
      roomName: row.roomName,
      difficultyLabel: row.difficultyLabel,
      budgetXp: row.budgetXp,
      spentXp: row.spentXp,
      highestCr: row.highestCr,
      creatures: row.creatureBlocks.map(normalizeFoundryCreature),
      warnings: row.warnings,
    })),
    validation: viewModel.warnings,
    map: dungeon?.map ? {
      tileSizeFeet: dungeon.map.tileSizeFeet,
      width: dungeon.map.width,
      height: dungeon.map.height,
      widthFeet: dungeon.map.widthFeet,
      heightFeet: dungeon.map.heightFeet,
      rooms: dungeon.map.rooms || [],
      doors: viewModel.doorRows,
      connections: dungeon.connections || [],
      features: dungeon.map.features || [],
      floors: [...new Set((dungeon.map.rooms || []).map((room) => room.floorLevel || 0))].sort((a, b) => a - b),
      cells: dungeon.map.cells || [],
      legend: mapTileTypes,
    } : null,
    rooms: viewModel.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      typeLabel: room.typeLabel,
      zoneId: room.zoneId,
      zoneName: room.zoneName,
      zoneRole: room.zoneRole,
      zoneIdentity: room.zoneIdentity,
      shape: room.shape,
      shapeLabel: room.shapeLabel,
      floorLevel: room.floorLevel,
      elevationHint: room.elevationHint,
      featureTiles: room.featureTiles,
      entrancePoints: room.entrancePoints,
      connectionPoints: room.connectionPoints,
      inhabitantRole: room.inhabitantRole,
      localInhabitants: room.localInhabitants,
      riskLevel: room.riskLevel,
      functionInSession: room.functionInSession,
      readAloud: room.readAloud,
      investigationClues: room.investigationClues,
      visibleSigns: room.visibleSigns,
      connections: room.connections,
      creatures: room.creatures.map(normalizeFoundryCreature),
      encounterPlan: room.raw.encounterPlan || null,
      encounterUi: room.encounterUi,
      hazard: room.hazard,
      treasure: room.treasure,
      gmNotes: room.dmNotes,
      tags: room.tags,
      foundry: {
        sceneHint: `${room.id} - ${room.name}`,
        journalHint: true,
        wallsPending: true,
        actorsPending: true,
        treasurePending: room.treasure.hasTreasure,
        hazardPending: room.hazard.hasHazard,
      },
    })),
  };

  return JSON.stringify(draft, null, 2);
}

function normalizeFoundryCreature(creature = {}) {
  return {
    name: creature.name || "Creature template",
    flavorName: creature.flavorName || "",
    label: creature.label || creature.name || "",
    count: creature.count || "",
    cr: creature.cr || creature.suggestedCr || "",
    suggestedCr: creature.suggestedCr || "",
    xpEach: creature.xpEach || 0,
    totalXp: creature.totalXp || 0,
    tacticalRole: creature.tacticalRole || creature.role || "",
    encounterRole: creature.encounterRole || "",
    source: creature.source || "",
    sourceId: creature.sourceId || "",
    isOfficial: Boolean(creature.isOfficial),
    creatureType: creature.creatureType || "",
    size: creature.size || "",
    habitat: creature.habitat || [],
    treasure: creature.treasure || [],
  };
}

export function downloadTextFile(filename, text, mimeType = "text/plain") {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof Blob === "undefined") {
    return;
  }

  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
