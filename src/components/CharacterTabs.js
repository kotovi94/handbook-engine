import { getCharacter, getCharacterSaveInfo } from "../scripts/characterState.js";

const tabs = [
  { id: "creator", label: "Crear y editar", route: "creator" },
  { id: "summary", label: "Resumen", route: "summary" },
  { id: "appearance", label: "Apariencia", route: "appearance" },
  { id: "print", label: "Imprimir", route: "print-sheet" },
];

export function CharacterTabs({ active = "creator" } = {}) {
  const character = getCharacter();
  const saveInfo = getCharacterSaveInfo();
  const shell = document.createElement("section");
  shell.className = "character-context-bar";
  shell.innerHTML = `
    <div class="character-context-identity">
      <span>Personaje abierto</span>
      <strong>${escapeHtml(character.name || "Personaje sin nombre")}</strong>
    </div>
  `;

  const navigation = document.createElement("nav");
  navigation.className = "character-tabs";
  navigation.setAttribute("aria-label", "Secciones del personaje abierto");
  tabs.forEach((tab) => {
    const link = document.createElement("a");
    link.href = `#/${tab.route}`;
    link.className = tab.id === active ? "character-tab is-active" : "character-tab";
    if (tab.id === active) link.setAttribute("aria-current", "page");
    link.textContent = tab.label;
    navigation.append(link);
  });

  const status = document.createElement("div");
  status.className = `character-save-status is-${saveInfo.state}`;
  status.setAttribute("role", "status");
  status.innerHTML = `<strong>${escapeHtml(saveInfo.label)}</strong><small>${escapeHtml(saveInfo.detail)}</small>`;
  shell.append(navigation, status);
  return shell;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}
