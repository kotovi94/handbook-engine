import {
  DUNGEON_TYPE_OPTIONS,
  getOptionLabel,
  INHABITANT_OPTIONS,
  SECONDARY_INHABITANT_OPTIONS,
  THEME_OPTIONS,
} from "../dungeon/dungeonTypes.js";
import {
  buildCorridorInspectorModel,
  buildDoorInspectorModel,
  buildDungeonViewModel,
  buildMapTargetFromCell,
  buildRoomInspectorModel,
} from "../dungeon/dungeonViewModel.js";
import { DungeonAreaInspector } from "./DungeonAreaInspector.js";
import { DungeonMapView } from "./DungeonMapView.js";
import {
  DungeonAlertList,
  DungeonDoorTable,
  DungeonEcologyPanel,
  DungeonEncounterTable,
  DungeonExportPanel,
  DungeonFlowPanel,
  DungeonNarrativePanel,
  DungeonOverviewCard,
  DungeonSectionCard,
  DungeonTreasureTable,
  DungeonZonePanel,
} from "./DungeonPanels.js";

export function DungeonResultView({
  dungeon,
  onDungeonChange,
  onRoomChange,
  onRegenerateName,
  onRegenerateEnemies,
  onRegenerateTreasure,
  onRegenerateMap,
  onRegenerateRoom,
  onRegenerateRoomEnemies,
  onRegenerateRoomTreasure,
  onMapCellChange,
  onSave,
  onExportJson,
  onExportMarkdown,
  onExportMarkdownCompact,
  onExportFoundry,
  onSendToCampaign,
}) {
  const viewModel = buildDungeonViewModel(dungeon);
  const view = document.createElement("section");
  view.className = "dungeon-result section-stack";

  const summary = DungeonOverviewCard({
    viewModel,
    actions: {
      onRegenerateName,
      onRegenerateEnemies,
      onRegenerateTreasure,
      onRegenerateMap,
      onSave,
    },
  });

  const summaryEditor = document.createElement("details");
  summaryEditor.className = "dungeon-summary-editor";
  const summaryEditorTitle = document.createElement("summary");
  summaryEditorTitle.textContent = "Editar resumen y configuración";
  summaryEditor.append(summaryEditorTitle, renderEditableSummary(dungeon, onDungeonChange));

  const mapInspectorLayout = document.createElement("div");
  mapInspectorLayout.className = "dungeon-map-inspector-layout";
  const inspectorSlot = document.createElement("div");
  inspectorSlot.className = "dungeon-area-inspector-slot";
  let selectedMapTarget = viewModel.flow.entranceId
    ? { kind: "room", roomId: viewModel.flow.entranceId, focusSection: "overview" }
    : { kind: null };
  let hoveredMapTarget = { kind: null };

  const handleRoomChange = (roomId, patch) => {
    const card = viewModel.rooms.find((room) => room.id === roomId);
    if (card?.raw) {
      Object.assign(card.raw, patch);
    }
    onRoomChange?.(roomId, patch);
  };

  const selectRoomInInspector = (roomId, focusSection = "overview") => {
    selectedMapTarget = { kind: "room", roomId, focusSection };
    renderInspector();
  };

  const copyInspectorText = (text) => {
    if (!text) {
      return;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  };

  const buildInspectorModel = () => {
    if (selectedMapTarget?.kind === "room") {
      return buildRoomInspectorModel(dungeon, selectedMapTarget.roomId, selectedMapTarget.focusSection);
    }

    if (selectedMapTarget?.kind === "door") {
      return buildDoorInspectorModel(dungeon, selectedMapTarget.doorId);
    }

    if (selectedMapTarget?.kind === "corridor") {
      return buildCorridorInspectorModel(dungeon, selectedMapTarget.cell);
    }

    if (selectedMapTarget?.kind === "tile") {
      return {
        kind: "empty",
        title: "Tile sin detalle",
        message: "Este tile no tiene contenido especifico asociado.",
      };
    }

    return null;
  };

  const renderInspector = () => {
    inspectorSlot.replaceChildren(DungeonAreaInspector({
      model: buildInspectorModel(),
      onSelectRoom: selectRoomInInspector,
      onRoomChange: handleRoomChange,
      onRegenerateRoom,
      onRegenerateRoomEnemies,
      onRegenerateRoomTreasure,
      onCopy: copyInspectorText,
    }));
  };

  renderInspector();

  const mapView = DungeonMapView({
    dungeon,
    onRegenerateMap,
    onMapCellChange,
    onMapTargetSelect: (cell) => {
      selectedMapTarget = cell ? buildMapTargetFromCell(dungeon, cell) : { kind: null };
      renderInspector();
    },
    onMapTargetHover: (cell) => {
      hoveredMapTarget = cell ? buildMapTargetFromCell(dungeon, cell) : { kind: null };
    },
  });
  mapInspectorLayout.append(mapView, inspectorSlot);

  view.append(
    summary,
    DungeonSectionCard({
      kicker: "Revision",
      title: "Avisos del generador",
      className: "dungeon-warning-card",
      children: [DungeonAlertList(viewModel.warnings)],
    }),
    summaryEditor,
    mapInspectorLayout,
    DungeonNarrativePanel(viewModel.narrative),
    DungeonZonePanel(viewModel.zones),
    DungeonFlowPanel(viewModel.flow),
    DungeonEcologyPanel(viewModel.ecology),
    DungeonEncounterTable(viewModel.encounterRows),
    DungeonTreasureTable(viewModel.treasureRows),
    DungeonDoorTable(viewModel.doorRows),
    DungeonExportPanel({
      actions: {
        onExportJson,
        onExportMarkdown,
        onExportMarkdownCompact,
        onExportFoundry,
        onSendToCampaign,
      },
    }),
  );
  return view;
}

function renderEditableSummary(dungeon, onDungeonChange) {
  const form = document.createElement("form");
  form.className = "dungeon-summary-grid";
  form.addEventListener("submit", (event) => event.preventDefault());

  const finalRoomOptions = (dungeon.rooms || []).map((room) => ({
    id: room.id,
    label: `${room.id} - ${room.name}`,
  }));

  form.append(
    renderInputField("Nombre de la mazmorra", dungeon.name || "", (value) => onDungeonChange?.({ name: value })),
    renderNumberField("Nivel recomendado", dungeon.recommendedLevel || dungeon.config?.averageLevel || 1, 1, 20, (value) => {
      onDungeonChange?.({
        recommendedLevel: value,
        config: { ...dungeon.config, averageLevel: value },
      });
    }),
    renderNumberField("Número de salas", dungeon.roomCount || dungeon.rooms?.length || 0, 1, 99, (value) => {
      onDungeonChange?.({ roomCount: value });
    }),
    renderSelectField("Tipo", DUNGEON_TYPE_OPTIONS, dungeon.type, (value) => {
      onDungeonChange?.({
        type: value,
        config: { ...dungeon.config, dungeonType: value },
      });
    }),
    renderSelectField("Tema", THEME_OPTIONS, dungeon.theme, (value) => {
      onDungeonChange?.({
        theme: value,
        config: { ...dungeon.config, theme: value },
      });
    }),
    renderSelectField("Habitantes", INHABITANT_OPTIONS, dungeon.inhabitants, (value) => {
      onDungeonChange?.({
        inhabitants: value,
        config: { ...dungeon.config, inhabitants: value },
      });
    }),
    renderSelectField("Habitantes secundarios", SECONDARY_INHABITANT_OPTIONS, dungeon.config?.secondaryInhabitants || "automatico", (value) => {
      onDungeonChange?.({
        config: { ...dungeon.config, secondaryInhabitants: value },
      });
    }),
    renderSelectField("Jefe o sala final", finalRoomOptions, dungeon.finalRoomId, (value) => {
      onDungeonChange?.({ finalRoomId: value });
    }),
    renderTextAreaField("Resumen breve", dungeon.summary || "", (value) => onDungeonChange?.({ summary: value })),
    renderTextAreaField("Notas de diseno", dungeon.designNotes || "", (value) => onDungeonChange?.({ designNotes: value })),
  );

  const metadata = document.createElement("div");
  metadata.className = "dungeon-summary-meta";
  metadata.append(
    renderMetaItem("Tipo", getOptionLabel(DUNGEON_TYPE_OPTIONS, dungeon.type)),
    renderMetaItem("Tema", getOptionLabel(THEME_OPTIONS, dungeon.theme)),
    renderMetaItem("Habitantes", getOptionLabel(INHABITANT_OPTIONS, dungeon.inhabitants)),
  );

  const wrap = document.createElement("div");
  wrap.className = "dungeon-summary-content";
  wrap.append(form, metadata);
  return wrap;
}

function renderInputField(labelText, value, onInput) {
  const label = renderFieldShell(labelText);
  const input = document.createElement("input");
  input.value = value;
  input.addEventListener("input", () => onInput(input.value));
  label.append(input);
  return label;
}

function renderNumberField(labelText, value, min, max, onInput) {
  const label = renderFieldShell(labelText);
  const input = document.createElement("input");
  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.addEventListener("input", () => onInput(Number(input.value)));
  label.append(input);
  return label;
}

function renderSelectField(labelText, options, value, onInput) {
  const label = renderFieldShell(labelText);
  const select = document.createElement("select");
  options.forEach((optionData) => {
    const option = document.createElement("option");
    option.value = optionData.id;
    option.textContent = optionData.label;
    select.append(option);
  });
  select.value = value;
  select.addEventListener("change", () => onInput(select.value));
  label.append(select);
  return label;
}

function renderTextAreaField(labelText, value, onInput) {
  const label = renderFieldShell(labelText);
  label.classList.add("dungeon-summary-wide");
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.addEventListener("input", () => onInput(textarea.value));
  label.append(textarea);
  return label;
}

function renderFieldShell(labelText) {
  const label = document.createElement("label");
  label.className = "field";
  const span = document.createElement("span");
  span.textContent = labelText;
  label.append(span);
  return label;
}

function renderMetaItem(label, value) {
  const item = document.createElement("span");
  item.className = "dungeon-meta-pill";
  item.textContent = `${label}: ${value}`;
  return item;
}
