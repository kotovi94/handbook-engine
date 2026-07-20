import test from "node:test";
import assert from "node:assert/strict";
import {
  addCharacterDocument,
  activeCharacterIdStorageKey,
  characterRepositoryStorageKey,
  duplicateCharacterDocument,
  initializeCharacterRepository,
  legacyCharacterBackupStorageKey,
  legacyCharacterStorageKey,
  removeCharacterDocument,
  saveCharacterDocument,
  updateStoredCharacterProgression,
} from "../src/scripts/characterRepository.js";

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

const defaults = { name: "", level: 1, classId: "", choiceSelections: {} };

test("migra el borrador heredado sin eliminarlo y conserva campos desconocidos", () => {
  const legacy = JSON.stringify({ name: "Lyra", level: 5, classId: "bard", customField: "conservar" });
  const storage = memoryStorage({ [legacyCharacterStorageKey]: legacy });
  const repository = initializeCharacterRepository(defaults, storage);
  const [document] = repository.characters;

  assert.equal(document.builder.name, "Lyra");
  assert.equal(document.builder.level, 5);
  assert.equal(document.builder.customField, "conservar");
  assert.equal(storage.getItem(legacyCharacterStorageKey), legacy);
  assert.equal(storage.getItem(legacyCharacterBackupStorageKey), legacy);
  assert.equal(storage.getItem(activeCharacterIdStorageKey), document.id);
});

test("la migración es idempotente", () => {
  const storage = memoryStorage({ [legacyCharacterStorageKey]: JSON.stringify({ name: "Iria", level: 3 }) });
  const first = initializeCharacterRepository(defaults, storage);
  const second = initializeCharacterRepository(defaults, storage);

  assert.equal(second.characters.length, 1);
  assert.equal(second.characters[0].id, first.characters[0].id);
});

test("un almacenamiento heredado dañado crea un personaje nuevo de nivel 1 y conserva el original", () => {
  const damaged = "{json-incompleto";
  const storage = memoryStorage({ [legacyCharacterStorageKey]: damaged });
  const repository = initializeCharacterRepository(defaults, storage);

  assert.equal(repository.characters[0].builder.level, 1);
  assert.equal(storage.getItem(legacyCharacterStorageKey), damaged);
  assert.equal(storage.getItem(legacyCharacterBackupStorageKey), damaged);
});

test("guardar mantiene el ID estable e incrementa la revisión", () => {
  const storage = memoryStorage();
  const repository = initializeCharacterRepository(defaults, storage);
  const original = repository.characters[0];
  const saved = saveCharacterDocument(repository, {
    ...original,
    builder: { ...original.builder, name: "Aster" },
  }, storage);
  const persisted = JSON.parse(storage.getItem(characterRepositoryStorageKey));

  assert.equal(saved.id, original.id);
  assert.equal(saved.revision, original.revision + 1);
  assert.equal(persisted.characters[0].builder.name, "Aster");
});

test("crear, duplicar y eliminar conserva una colección utilizable", () => {
  const storage = memoryStorage();
  const repository = initializeCharacterRepository(defaults, storage);
  const created = addCharacterDocument(repository, { ...defaults, name: "Nara" }, {}, storage);
  const duplicated = duplicateCharacterDocument(repository, created.id, storage);

  assert.equal(repository.characters.length, 3);
  assert.notEqual(duplicated.id, created.id);
  assert.equal(duplicated.builder.name, "Nara (copia)");

  removeCharacterDocument(repository, duplicated.id, defaults, storage);
  assert.equal(repository.characters.length, 2);
  assert.ok(storage.getItem(activeCharacterIdStorageKey));
});

test("las recompensas de campaña actualizan XP e historial del documento canónico", () => {
  const storage = memoryStorage();
  const repository = initializeCharacterRepository(defaults, storage);
  const character = repository.characters[0];
  const updated = updateStoredCharacterProgression(character.id, {
    xp: 325,
    historyEntry: { id: "session-1", type: "campaign-session", xp: 325 },
  }, storage);

  assert.equal(updated.progression.xp, 325);
  assert.equal(updated.progression.history.length, 1);
  assert.equal(updated.progression.history[0].id, "session-1");
});
