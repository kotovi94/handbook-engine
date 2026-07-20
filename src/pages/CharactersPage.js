import { Icon } from "../components/Icon.js";
import { getPendingItems } from "../components/PendingPanel.js";
import { createCharacterHandoff } from "./CharacterSummaryPage.js";
import {
  createCharacter,
  deleteCharacter,
  duplicateCharacter,
  getCharacterDocuments,
  selectCharacter,
} from "../scripts/characterState.js";
import { displayName } from "../scripts/displayLabels.js";
import { rulesEngine } from "../scripts/rulesEngine.js";
import { queueCampaignHandoff } from "../scripts/campaignHandoff.js";

export function CharactersPage() {
  const page = document.createElement("section");
  page.className = "section-stack character-library-page";
  render();
  return page;

  function render() {
    const documents = getCharacterDocuments();
    page.replaceChildren();

    const header = document.createElement("header");
    header.className = "character-library-header";
    header.innerHTML = `
      <div>
        <p class="page-kicker">Personajes guardados</p>
        <h2 class="page-title">Mis personajes</h2>
        <p>Continúa un personaje incompleto o abre uno listo para llevar a la mesa.</p>
      </div>
    `;
    const createButton = actionButton("Crear personaje", "book", () => {
      createCharacter();
      navigate("creator");
    });
    header.append(createButton);
    page.append(header);

    if (!documents.length) {
      const empty = document.createElement("div");
      empty.className = "panel character-library-empty";
      empty.innerHTML = "<h3>Aún no tienes personajes</h3><p>Crea el primero y el progreso se guardará en este dispositivo.</p>";
      page.append(empty);
      return;
    }

    const storageNotice = document.createElement("p");
    storageNotice.className = "character-storage-notice";
    storageNotice.textContent = "Guardado en este dispositivo.";
    const grid = document.createElement("div");
    grid.className = "character-library-grid";
    documents
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .forEach((record) => grid.append(renderCharacterCard(record)));
    page.append(storageNotice, grid);
  }

  function renderCharacterCard(record) {
    const character = record.builder;
    const derived = rulesEngine.deriveCharacter(character);
    const pending = getPendingItems(character, derived);
    const ready = pending.length === 0;
    const card = document.createElement("article");
    card.className = "character-library-card";
    card.innerHTML = `
      <div class="character-library-card-heading">
        <div>
          <span class="character-status ${ready ? "is-ready" : "is-incomplete"}">${ready ? "Listo para mesa" : "Incompleto"}</span>
          <h3>${escapeHtml(character.name || "Personaje sin nombre")}</h3>
        </div>
        <span class="character-level">Nivel ${derived.level || character.level || 1}</span>
      </div>
      <p class="character-role">${escapeHtml(characterDescription(derived))}</p>
      <dl class="character-library-meta">
        <div><dt>Campaña</dt><dd>${escapeHtml(record.campaign?.campaignId ? "Asignada" : "Sin asignar")}</dd></div>
        <div><dt>Último guardado</dt><dd>${escapeHtml(formatDate(record.updatedAt))}</dd></div>
      </dl>
      <div class="character-next-choice">
        <strong>Próxima decisión</strong>
        <span>${escapeHtml(pending[0] || "No hay decisiones obligatorias pendientes.")}</span>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "character-library-actions";
    actions.append(
      actionButton(ready ? "Abrir" : "Continuar", ready ? "shield" : "book", () => {
        selectCharacter(record.id);
        navigate(ready ? "summary" : "creator");
      }),
      smallButton("Editar", () => {
        selectCharacter(record.id);
        navigate("creator");
      }),
      smallButton("Duplicar", () => {
        duplicateCharacter(record.id);
        render();
      }),
      smallButton("Imprimir", () => {
        selectCharacter(record.id);
        navigate("print-sheet");
      }),
      smallButton("Asignar", () => {
        selectCharacter(record.id);
        const queued = queueCampaignHandoff(createCharacterHandoff(character, derived, record));
        if (queued) window.location.href = "./campaigns/";
      }),
      smallButton("Eliminar", () => {
        const name = character.name || "este personaje";
        if (!window.confirm(`¿Eliminar ${name}? Esta acción no se puede deshacer desde la aplicación.`)) return;
        deleteCharacter(record.id);
        render();
      }, "danger-button"),
    );
    card.append(actions);
    return card;
  }
}

function actionButton(label, icon, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button";
  button.append(Icon({ name: icon }), document.createTextNode(label));
  button.addEventListener("click", onClick);
  return button;
}

function smallButton(label, onClick, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button secondary-button ${className}`.trim();
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function navigate(route) {
  window.location.hash = `/${route}`;
}

function characterDescription(derived) {
  const species = displayName(derived.speciesData);
  const role = [displayName(derived.classData), displayName(derived.subclassData)].filter(Boolean).join(" / ");
  return [species, role].filter(Boolean).join(" · ") || "Clase y especie pendientes";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}
