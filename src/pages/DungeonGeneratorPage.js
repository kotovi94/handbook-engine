import { DungeonConfigForm } from "../components/DungeonConfigForm.js";
import { DungeonResultView } from "../components/DungeonResultView.js";
import {
  generateDungeon,
  regenerateDungeonEnemies,
  regenerateDungeonMap,
  regenerateDungeonName,
  regenerateDungeonRoom,
  regenerateDungeonRoomEnemies,
  regenerateDungeonRoomTreasure,
  regenerateDungeonTreasure,
} from "../dungeon/dungeonGenerator.js";
import { updateDungeonMapCell } from "../dungeon/dungeonMapGenerator.js";
import {
  DEFAULT_DUNGEON_CONFIG,
  normalizeDungeonConfig,
} from "../dungeon/dungeonTypes.js";
import {
  deleteDungeon,
  downloadTextFile,
  exportDungeonJson,
  exportDungeonMarkdown,
  exportDungeonMarkdownCompact,
  exportFoundryDraft,
  listSavedDungeons,
  loadDungeon,
  saveDungeon,
} from "../dungeon/dungeonStorage.js";

const pageState = {
  config: { ...DEFAULT_DUNGEON_CONFIG },
  dungeon: null,
  savedDungeons: [],
  selectedSavedId: "",
  status: "",
};

export function DungeonGeneratorPage() {
  pageState.savedDungeons = listSavedDungeons();

  const page = document.createElement("section");
  page.className = "dungeon-generator-page section-stack";

  const header = document.createElement("header");
  header.className = "dungeon-page-header";
  const kicker = document.createElement("p");
  kicker.className = "page-kicker";
  kicker.textContent = "Herramientas de DM";
  const title = document.createElement("h2");
  title.className = "page-title";
  title.textContent = "Dungeon Generator";
  header.append(kicker, title);

  const statusSlot = document.createElement("p");
  statusSlot.className = "dungeon-status";
  statusSlot.setAttribute("role", "status");
  statusSlot.setAttribute("aria-live", "polite");

  const configSlot = document.createElement("div");
  const resultSlot = document.createElement("div");
  resultSlot.className = "section-stack";

  page.append(header, statusSlot, configSlot, resultSlot);

  renderForm();
  renderResult();
  setStatus(pageState.status);

  return page;

  function renderForm() {
    configSlot.replaceChildren(DungeonConfigForm({
      config: pageState.config,
      savedDungeons: pageState.savedDungeons,
      selectedSavedId: pageState.selectedSavedId,
      onConfigChange: (nextConfig) => {
        pageState.config = normalizeDungeonConfig(nextConfig);
      },
      onGenerate: (nextConfig) => {
        pageState.config = normalizeDungeonConfig(nextConfig);
        pageState.dungeon = generateDungeon(pageState.config);
        pageState.selectedSavedId = "";
        renderResult();
        setStatus("Mazmorra generada.");
      },
      onSelectSaved: (id) => {
        pageState.selectedSavedId = id;
      },
      onLoad: (id) => {
        const loaded = loadDungeon(id);
        if (!loaded) {
          setStatus("No se encontro esa mazmorra guardada.");
          return;
        }

        pageState.dungeon = loaded;
        pageState.config = normalizeDungeonConfig(loaded.config);
        pageState.selectedSavedId = id;
        renderForm();
        renderResult();
        setStatus("Mazmorra cargada.");
      },
      onDeleteSaved: (id) => {
        if (!id) {
          return;
        }

        deleteDungeon(id);
        pageState.savedDungeons = listSavedDungeons();
        if (pageState.selectedSavedId === id) {
          pageState.selectedSavedId = "";
        }
        renderForm();
        setStatus("Mazmorra guardada eliminada.");
      },
    }));
  }

  function renderResult() {
    if (!pageState.dungeon) {
      resultSlot.replaceChildren(renderEmptyState());
      return;
    }

    resultSlot.replaceChildren(DungeonResultView({
      dungeon: pageState.dungeon,
      onDungeonChange: updateDungeon,
      onRoomChange: updateRoom,
      onRegenerateName: () => {
        pageState.dungeon = regenerateDungeonName(pageState.dungeon);
        renderResult();
        setStatus("Nombre regenerado.");
      },
      onRegenerateEnemies: () => {
        pageState.dungeon = regenerateDungeonEnemies(pageState.dungeon);
        renderResult();
        setStatus("Enemigos regenerados.");
      },
      onRegenerateTreasure: () => {
        pageState.dungeon = regenerateDungeonTreasure(pageState.dungeon);
        renderResult();
        setStatus("Tesoro regenerado.");
      },
      onRegenerateMap: () => {
        pageState.dungeon = regenerateDungeonMap(pageState.dungeon);
        renderResult();
        setStatus("Mapa visual regenerado.");
      },
      onRegenerateRoom: (roomId) => {
        pageState.dungeon = regenerateDungeonRoom(pageState.dungeon, roomId);
        renderResult();
        setStatus(`Sala ${roomId} regenerada.`);
      },
      onRegenerateRoomEnemies: (roomId) => {
        pageState.dungeon = regenerateDungeonRoomEnemies(pageState.dungeon, roomId);
        renderResult();
        setStatus(`Enemigos de ${roomId} regenerados.`);
      },
      onRegenerateRoomTreasure: (roomId) => {
        pageState.dungeon = regenerateDungeonRoomTreasure(pageState.dungeon, roomId);
        renderResult();
        setStatus(`Tesoro de ${roomId} regenerado.`);
      },
      onMapCellChange: (x, y, patch) => {
        updateMapCell(x, y, patch);
      },
      onSave: () => {
        pageState.dungeon = saveDungeon(pageState.dungeon);
        pageState.savedDungeons = listSavedDungeons();
        pageState.selectedSavedId = pageState.dungeon.id;
        renderForm();
        setStatus("Mazmorra guardada.");
      },
      onExportJson: () => {
        downloadTextFile(`${safeFilename(pageState.dungeon.name)}.json`, exportDungeonJson(pageState.dungeon), "application/json");
        setStatus("JSON exportado.");
      },
      onExportMarkdown: () => {
        downloadTextFile(`${safeFilename(pageState.dungeon.name)}.md`, exportDungeonMarkdown(pageState.dungeon), "text/markdown");
        setStatus("Markdown exportado.");
      },
      onExportMarkdownCompact: () => {
        downloadTextFile(`${safeFilename(pageState.dungeon.name)}-compact.md`, exportDungeonMarkdownCompact(pageState.dungeon), "text/markdown");
        setStatus("Markdown compacto exportado.");
      },
      onExportFoundry: () => {
        downloadTextFile(`${safeFilename(pageState.dungeon.name)}-foundry-draft.json`, exportFoundryDraft(pageState.dungeon), "application/json");
        setStatus("Foundry draft exportado.");
      },
    }));
  }

  function updateDungeon(patch) {
    pageState.dungeon = {
      ...pageState.dungeon,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    if (patch.config) {
      pageState.config = normalizeDungeonConfig(patch.config);
    }

    pageState.status = "Cambios sin guardar.";
    setStatus(pageState.status);
  }

  function updateRoom(roomId, patch) {
    pageState.dungeon = {
      ...pageState.dungeon,
      rooms: (pageState.dungeon.rooms || []).map((room) => (
        room.id === roomId ? { ...room, ...patch } : room
      )),
      updatedAt: new Date().toISOString(),
    };
    pageState.status = "Cambios sin guardar.";
    setStatus(pageState.status);
  }

  function updateMapCell(x, y, patch) {
    pageState.dungeon = {
      ...pageState.dungeon,
      map: updateDungeonMapCell(pageState.dungeon.map, x, y, patch),
      updatedAt: new Date().toISOString(),
    };
    pageState.status = "Cambios sin guardar.";
    setStatus(pageState.status);
  }

  function setStatus(message) {
    pageState.status = message || "";
    statusSlot.textContent = pageState.status;
    statusSlot.classList.toggle("is-visible", Boolean(pageState.status));
  }
}

function renderEmptyState() {
  const empty = document.createElement("div");
  empty.className = "panel dungeon-empty-state";
  const text = document.createElement("p");
  text.textContent = "Sin mazmorra generada.";
  empty.append(text);
  return empty;
}

function safeFilename(value) {
  return String(value || "dungeon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "dungeon";
}
