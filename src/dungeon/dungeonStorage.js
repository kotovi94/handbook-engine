const storageKey = "handbook-engine-dungeons-v1";

export {
  downloadTextFile,
  exportDungeonJson,
  exportDungeonMarkdown,
  exportDungeonMarkdownCompact,
  exportFoundryDraft,
} from "./dungeonExporters.js";

export function listSavedDungeons() {
  return readSavedDungeons()
    .map((dungeon) => ({
      id: dungeon.id,
      name: dungeon.name,
      roomCount: dungeon.rooms?.length || dungeon.roomCount || 0,
      savedAt: dungeon.savedAt || dungeon.updatedAt || dungeon.createdAt,
    }))
    .sort((first, second) => String(second.savedAt).localeCompare(String(first.savedAt)));
}

export function saveDungeon(dungeon) {
  const savedDungeons = readSavedDungeons().filter((item) => item.id !== dungeon.id);
  const savedDungeon = {
    ...structuredCloneSafe(dungeon),
    savedAt: new Date().toISOString(),
  };

  savedDungeons.push(savedDungeon);
  writeSavedDungeons(savedDungeons);
  return savedDungeon;
}

export function loadDungeon(id) {
  return readSavedDungeons().find((dungeon) => dungeon.id === id) || null;
}

export function deleteDungeon(id) {
  const savedDungeons = readSavedDungeons().filter((dungeon) => dungeon.id !== id);
  writeSavedDungeons(savedDungeons);
}

function readSavedDungeons() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "[]");
  } catch (error) {
    console.warn("No se pudieron leer mazmorras guardadas.", error);
    return [];
  }
}

function writeSavedDungeons(dungeons) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(dungeons));
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}
