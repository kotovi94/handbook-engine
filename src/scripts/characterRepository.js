export const CHARACTER_REPOSITORY_SCHEMA_VERSION = 2;
export const characterRepositoryStorageKey = "handbook-engine-characters-v2";
export const activeCharacterIdStorageKey = "handbook-engine-active-character-id";
export const legacyCharacterStorageKey = "handbook-engine-character";
export const legacyCharacterBackupStorageKey = "handbook-engine-character-backup-v1";
let lastRepositoryWrite = { persisted: false, savedAt: "", error: "" };

export function getLastCharacterRepositoryWrite() {
  return { ...lastRepositoryWrite };
}

export function initializeCharacterRepository(defaultBuilder, storage = getDefaultStorage()) {
  const fallbackBuilder = clone(defaultBuilder || {});
  const existing = readRepository(storage, fallbackBuilder);
  if (existing) {
    ensureActiveCharacter(existing, fallbackBuilder);
    writeRepository(storage, existing);
    return existing;
  }

  const legacyRaw = safeGet(storage, legacyCharacterStorageKey);
  const legacyBuilder = parseObject(legacyRaw);
  if (legacyRaw && safeGet(storage, legacyCharacterBackupStorageKey) === null) {
    safeSet(storage, legacyCharacterBackupStorageKey, legacyRaw);
  }

  const document = createCharacterDocument({
    ...fallbackBuilder,
    ...(legacyBuilder || {}),
  });
  const repository = {
    schemaVersion: CHARACTER_REPOSITORY_SCHEMA_VERSION,
    characters: [document],
  };
  writeRepository(storage, repository);
  safeSet(storage, activeCharacterIdStorageKey, document.id);
  return repository;
}

export function listCharacterDocuments(repository) {
  return clone(repository?.characters || []);
}

export function getActiveCharacterDocument(repository, storage = getDefaultStorage()) {
  const characters = repository?.characters || [];
  const activeId = safeGet(storage, activeCharacterIdStorageKey);
  const active = characters.find((document) => document.id === activeId) || characters[0];
  return active ? clone(active) : null;
}

export function setActiveCharacterDocument(repository, id, storage = getDefaultStorage()) {
  const document = repository?.characters?.find((entry) => entry.id === id);
  if (!document) return null;
  safeSet(storage, activeCharacterIdStorageKey, document.id);
  return clone(document);
}

export function addCharacterDocument(repository, builder = {}, options = {}, storage = getDefaultStorage()) {
  const document = createCharacterDocument(builder, options);
  repository.characters.push(document);
  writeRepository(storage, repository);
  safeSet(storage, activeCharacterIdStorageKey, document.id);
  return clone(document);
}

export function duplicateCharacterDocument(repository, id, storage = getDefaultStorage()) {
  const source = repository?.characters?.find((entry) => entry.id === id);
  if (!source) return null;
  const copy = createCharacterDocument({
    ...source.builder,
    name: source.builder.name ? `${source.builder.name} (copia)` : "Personaje (copia)",
  }, {
    profile: {
      ...source.profile,
      name: source.profile.name ? `${source.profile.name} (copia)` : "Personaje (copia)",
    },
    progression: {
      ...source.progression,
      history: [],
    },
  });
  repository.characters.push(copy);
  writeRepository(storage, repository);
  safeSet(storage, activeCharacterIdStorageKey, copy.id);
  return clone(copy);
}

export function removeCharacterDocument(repository, id, defaultBuilder = {}, storage = getDefaultStorage()) {
  const index = repository?.characters?.findIndex((entry) => entry.id === id) ?? -1;
  if (index < 0) return null;
  const [removed] = repository.characters.splice(index, 1);
  ensureActiveCharacter(repository, defaultBuilder);
  const activeId = safeGet(storage, activeCharacterIdStorageKey);
  if (activeId === id || !repository.characters.some((entry) => entry.id === activeId)) {
    safeSet(storage, activeCharacterIdStorageKey, repository.characters[0].id);
  }
  writeRepository(storage, repository);
  return clone(removed);
}

export function saveCharacterDocument(repository, document, storage = getDefaultStorage()) {
  const normalized = normalizeCharacterDocument(document, {});
  const index = repository.characters.findIndex((entry) => entry.id === normalized.id);
  const previous = index >= 0 ? repository.characters[index] : null;
  const now = new Date().toISOString();
  const saved = {
    ...normalized,
    revision: Math.max(Number(previous?.revision || 0), Number(normalized.revision || 0)) + 1,
    createdAt: previous?.createdAt || normalized.createdAt || now,
    updatedAt: now,
  };

  if (index >= 0) repository.characters[index] = saved;
  else repository.characters.push(saved);
  writeRepository(storage, repository);
  safeSet(storage, activeCharacterIdStorageKey, saved.id);
  return clone(saved);
}

export function linkStoredCharacterToCampaign(characterId, campaign = {}, storage = getDefaultStorage()) {
  const repository = readRepository(storage, {});
  if (!repository) return null;
  const document = repository.characters.find((entry) => entry.id === characterId);
  if (!document) return null;
  const now = new Date().toISOString();
  return saveCharacterDocument(repository, {
    ...document,
    campaign: {
      ...document.campaign,
      campaignId: String(campaign.campaignId || document.campaign?.campaignId || ""),
      storageMode: String(campaign.storageMode || document.campaign?.storageMode || "local"),
      remoteCharacterId: String(campaign.remoteCharacterId || document.campaign?.remoteCharacterId || ""),
      assignedAt: document.campaign?.assignedAt || now,
    },
  }, storage);
}

export function updateStoredCharacterProgression(characterId, patch = {}, storage = getDefaultStorage()) {
  const repository = readRepository(storage, {});
  if (!repository) return null;
  const document = repository.characters.find((entry) => entry.id === characterId);
  if (!document) return null;
  const historyEntry = patch.historyEntry && typeof patch.historyEntry === "object"
    ? [{ ...patch.historyEntry }]
    : [];
  return saveCharacterDocument(repository, {
    ...document,
    builder: patch.level === undefined
      ? document.builder
      : { ...document.builder, level: normalizeLevel(patch.level, document.builder?.level || 1) },
    progression: {
      ...document.progression,
      ...(patch.xp === undefined ? {} : { xp: Math.max(0, Number(patch.xp || 0)) }),
      ...(patch.level === undefined ? {} : { level: normalizeLevel(patch.level, document.progression?.level || 1) }),
      history: [...(document.progression?.history || []), ...historyEntry],
    },
  }, storage);
}

export function createCharacterDocument(builder = {}, options = {}) {
  const now = new Date().toISOString();
  const normalizedBuilder = clone(builder);
  const level = normalizeLevel(normalizedBuilder.level, 1);
  normalizedBuilder.level = level;
  return normalizeCharacterDocument({
    schemaVersion: CHARACTER_REPOSITORY_SCHEMA_VERSION,
    id: options.id || createId(),
    systemId: options.systemId || "dnd5e2024",
    kind: options.kind || "player",
    revision: 0,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
    profile: options.profile || { name: normalizedBuilder.name || "", player: "", portrait: "", color: "#b97a45" },
    builder: normalizedBuilder,
    progression: options.progression || { level, xp: 0, persistentConditions: [], rewards: [], history: [] },
    campaign: options.campaign || { campaignId: "", storageMode: "local", remoteCharacterId: "", assignedAt: "" },
  }, {});
}

function readRepository(storage, defaultBuilder) {
  const parsed = parseObject(safeGet(storage, characterRepositoryStorageKey));
  if (!parsed || !Array.isArray(parsed.characters)) return null;
  return {
    schemaVersion: CHARACTER_REPOSITORY_SCHEMA_VERSION,
    characters: parsed.characters.map((document) => normalizeCharacterDocument(document, defaultBuilder)),
  };
}

function ensureActiveCharacter(repository, defaultBuilder) {
  if (!repository.characters.length) {
    repository.characters.push(createCharacterDocument(defaultBuilder));
  }
}

function normalizeCharacterDocument(document = {}, defaultBuilder = {}) {
  const builder = {
    ...clone(defaultBuilder),
    ...clone(document.builder || {}),
  };
  const level = normalizeLevel(builder.level ?? document.progression?.level, 1);
  builder.level = level;
  return {
    ...clone(document),
    schemaVersion: CHARACTER_REPOSITORY_SCHEMA_VERSION,
    id: String(document.id || createId()),
    systemId: String(document.systemId || "dnd5e2024"),
    kind: String(document.kind || "player"),
    revision: Math.max(0, Number(document.revision || 0)),
    createdAt: String(document.createdAt || new Date().toISOString()),
    updatedAt: String(document.updatedAt || document.createdAt || new Date().toISOString()),
    profile: {
      name: String(document.profile?.name ?? builder.name ?? ""),
      player: String(document.profile?.player || ""),
      portrait: String(document.profile?.portrait || ""),
      color: String(document.profile?.color || "#b97a45"),
    },
    builder,
    progression: {
      level,
      xp: Math.max(0, Number(document.progression?.xp || 0)),
      persistentConditions: asArray(document.progression?.persistentConditions),
      rewards: asArray(document.progression?.rewards),
      history: asArray(document.progression?.history),
    },
    campaign: {
      campaignId: String(document.campaign?.campaignId || ""),
      storageMode: String(document.campaign?.storageMode || "local"),
      remoteCharacterId: String(document.campaign?.remoteCharacterId || ""),
      assignedAt: String(document.campaign?.assignedAt || ""),
    },
  };
}

function writeRepository(storage, repository) {
  const persisted = safeSet(storage, characterRepositoryStorageKey, JSON.stringify(repository));
  lastRepositoryWrite = {
    persisted,
    savedAt: persisted ? new Date().toISOString() : "",
    error: persisted ? "" : "No se pudo escribir en el almacenamiento del navegador.",
  };
  return persisted;
}

function parseObject(value) {
  try {
    const parsed = value ? JSON.parse(value) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `character-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeLevel(value, fallback) {
  return Math.max(1, Math.min(5, Math.trunc(Number(value) || fallback)));
}

function asArray(value) {
  return Array.isArray(value) ? clone(value) : [];
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function getDefaultStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function safeGet(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage?.setItem(key, value);
    return Boolean(storage);
  } catch {
    // The in-memory document remains usable when browser storage is unavailable.
    return false;
  }
}
