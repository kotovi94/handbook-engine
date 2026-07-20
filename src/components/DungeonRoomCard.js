import { ROOM_TYPE_OPTIONS } from "../dungeon/dungeonTypes.js";
import { Icon } from "./Icon.js";

export function DungeonRoomCard({ room, onChange, onRegenerate }) {
  const card = document.createElement("article");
  card.className = `dungeon-room-card room-type-${room.type}`;

  const header = document.createElement("header");
  header.className = "dungeon-room-header";

  const roomId = document.createElement("span");
  roomId.className = "dungeon-room-id";
  roomId.textContent = room.id;

  const nameLabel = document.createElement("label");
  nameLabel.className = "field dungeon-room-name-field";
  const nameText = document.createElement("span");
  nameText.textContent = "Nombre";
  const nameInput = document.createElement("input");
  nameInput.value = room.name || "";
  nameInput.addEventListener("input", () => onChange?.(room.id, { name: nameInput.value }));
  nameLabel.append(nameText, nameInput);

  const typeLabel = renderSelectField("Tipo", ROOM_TYPE_OPTIONS, room.type || "vacia", (value) => {
    card.className = `dungeon-room-card room-type-${value}`;
    onChange?.(room.id, { type: value });
  });
  typeLabel.classList.add("dungeon-room-type-field");

  const regenerateButton = document.createElement("button");
  regenerateButton.type = "button";
  regenerateButton.className = "button secondary-button dungeon-room-regenerate";
  regenerateButton.append(Icon({ name: "spark" }), document.createTextNode("Regenerar sala"));
  regenerateButton.addEventListener("click", () => onRegenerate?.(room.id));

  header.append(roomId, nameLabel, typeLabel, regenerateButton);

  const body = document.createElement("div");
  body.className = "dungeon-room-body";
  body.append(
    renderTextAreaField("Descripción corta", room.description || "", (value) => onChange?.(room.id, { description: value })),
    renderTextAreaField("Ambiente", room.ambience || room.readAloud || "", (value) => onChange?.(room.id, { ambience: value })),
    renderTextAreaField("Texto para leer a los jugadores", room.readAloud || "", (value) => onChange?.(room.id, { readAloud: value })),
    renderInputField("Zona", room.zoneName || "", (value) => onChange?.(room.id, { zoneName: value })),
    renderTextAreaField("Identidad de zona", room.zoneIdentity || "", (value) => onChange?.(room.id, { zoneIdentity: value })),
    renderInputField("Conexiones", (room.connections || []).join(", "), (value) => {
      onChange?.(room.id, { connections: splitCommaList(value) });
    }),
    renderInputField("Rol de habitantes", room.inhabitantRole || "", (value) => onChange?.(room.id, { inhabitantRole: value })),
    renderTextAreaField("Enemigos sugeridos", (room.enemies || []).join("\n"), (value) => {
      onChange?.(room.id, {
        enemies: splitLineList(value),
        creatures: [],
        encounterExtras: [],
      });
    }),
    renderTextAreaField("Presupuesto CR/XP", room.encounterSummary || "", (value) => onChange?.(room.id, { encounterSummary: value })),
    renderTextAreaField("Notas de monstruos", room.monsterNotes || "", (value) => onChange?.(room.id, { monsterNotes: value })),
    renderTextAreaField("Peligro o trampa", room.hazard || "", (value) => onChange?.(room.id, { hazard: value })),
    renderTextAreaField("Tesoro", room.treasure || "", (value) => onChange?.(room.id, { treasure: value })),
    renderTextAreaField("Secretos", room.secrets || "", (value) => onChange?.(room.id, { secrets: value })),
    renderSelectField("Estado de exploración", [
      { id: "unexplored", label: "Sin explorar" },
      { id: "active", label: "En exploración" },
      { id: "cleared", label: "Explorada" },
      { id: "blocked", label: "Bloqueada" },
    ], room.explorationStatus || "unexplored", (value) => onChange?.(room.id, { explorationStatus: value })),
    renderTextAreaField("Notas para el DM", room.notes || "", (value) => onChange?.(room.id, { notes: value })),
  );

  card.append(header, body);
  return card;
}

function renderSelectField(labelText, options, value, onInput) {
  const label = document.createElement("label");
  label.className = "field";

  const span = document.createElement("span");
  span.textContent = labelText;

  const select = document.createElement("select");
  options.forEach((optionData) => {
    const option = document.createElement("option");
    option.value = optionData.id;
    option.textContent = optionData.label;
    select.append(option);
  });
  select.value = value;
  select.addEventListener("change", () => onInput(select.value));

  label.append(span, select);
  return label;
}

function renderInputField(labelText, value, onInput) {
  const label = document.createElement("label");
  label.className = "field";

  const span = document.createElement("span");
  span.textContent = labelText;

  const input = document.createElement("input");
  input.value = value;
  input.addEventListener("input", () => onInput(input.value));

  label.append(span, input);
  return label;
}

function renderTextAreaField(labelText, value, onInput) {
  const label = document.createElement("label");
  label.className = "field";

  const span = document.createElement("span");
  span.textContent = labelText;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.addEventListener("input", () => onInput(textarea.value));

  label.append(span, textarea);
  return label;
}

function splitLineList(value) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitCommaList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
