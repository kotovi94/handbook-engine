import { validateRules } from "../src/data/rules/schema/validateRules.js";
import { generateDungeon } from "../src/dungeon/dungeonGenerator.js";
import { buildDungeonViewModel } from "../src/dungeon/dungeonViewModel.js";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

await assertNoAccentedTextareaIdentifiers(path.resolve("src"));

const report = validateRules();
if (!report.ok) {
  throw new Error(`Rule validation failed:\n${report.errors.join("\n")}`);
}

const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    removeItem(key) {
      storage.delete(key);
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
  },
};

const { initializeCharacterRepository } = await import("../src/scripts/characterRepository.js");
const characterRepository = initializeCharacterRepository({ name: "", level: 1 });
if (characterRepository.characters.length !== 1 || characterRepository.characters[0].builder.level !== 1) {
  throw new Error("Character repository did not initialize a level 1 character.");
}

const {
  clearCampaignHandoff,
  queueCampaignHandoff,
  readCampaignHandoff,
} = await import("../src/scripts/campaignHandoff.js");
const queued = queueCampaignHandoff({ kind: "character", source: "smoke-test", title: "Test Hero" });
const handoff = readCampaignHandoff();
if (!queued || handoff?.kind !== "character" || handoff?.title !== "Test Hero") {
  throw new Error("Campaign handoff queue did not round-trip.");
}
clearCampaignHandoff();
if (readCampaignHandoff()) {
  throw new Error("Campaign handoff queue did not clear.");
}

const dungeon = generateDungeon({ averageLevel: 5, playerCount: 4 });
if (!dungeon?.rooms?.length || !dungeon?.map?.cells?.length) {
  throw new Error("Dungeon generator did not produce rooms and a map.");
}

const viewModel = buildDungeonViewModel(dungeon);
if (!viewModel?.rooms?.length || !viewModel?.overview?.name) {
  throw new Error("Dungeon view model is incomplete.");
}

function createFakeDocument() {
  return {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
  };
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.className = "";
    this.textContent = "";
    this.innerHTML = "";
    this.value = "";
    this.type = "";
    this.classList = {
      add: (...names) => {
        const current = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((name) => current.add(name));
        this.className = [...current].join(" ");
      },
      remove: (...names) => {
        const remove = new Set(names);
        this.className = this.className
          .split(/\s+/)
          .filter((name) => name && !remove.has(name))
          .join(" ");
      },
      toggle: (name, force) => {
        const current = new Set(this.className.split(/\s+/).filter(Boolean));
        const shouldAdd = force ?? !current.has(name);
        if (shouldAdd) current.add(name);
        else current.delete(name);
        this.className = [...current].join(" ");
      },
    };
  }

  append(...children) {
    this.children.push(...children);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener() {}
}

globalThis.document = createFakeDocument();
const { DungeonRoomCard } = await import("../src/components/DungeonRoomCard.js");
const card = DungeonRoomCard({
  room: {
    id: "R1",
    name: "Sala de prueba",
    type: "vacia",
    connections: ["R2"],
    description: "Una sala sencilla.",
  },
});

if (!card || card.tagName !== "article") {
  throw new Error("Dungeon room editor did not render.");
}

console.log("Smoke test passed.");

async function assertNoAccentedTextareaIdentifiers(root) {
  const offenders = [];
  const files = await listFiles(root);

  await Promise.all(files
    .filter((file) => file.endsWith(".js"))
    .map(async (file) => {
      const source = await readFile(file, "utf8");
      if (/text(?:á|Ã¡)rea/.test(source)) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }));

  if (offenders.length) {
    throw new Error(`Found accented textarea identifiers:\n${offenders.join("\n")}`);
  }
}

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : fullPath;
  }));
  return nested.flat();
}
