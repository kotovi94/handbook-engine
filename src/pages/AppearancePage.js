import { SummaryPanel } from "../components/SummaryPanel.js";
import { getChoiceStatus } from "../scripts/choiceEngine.js";
import { getCharacter, updateCharacter } from "../scripts/characterState.js";
import { displayName, displayValue } from "../scripts/displayLabels.js";
import { rulesEngine } from "../scripts/rulesEngine.js";

export function AppearancePage() {
  const page = document.createElement("section");
  page.className = "creator-layout";
  render();

  function render() {
    const character = getCharacter();
    const derived = rulesEngine.deriveCharacter(character);
    const appearance = character.appearance || {};
    const generated = buildAppearanceText(character, derived);
    const main = document.createElement("div");
    main.className = "section-stack";
    main.innerHTML = `
      <div>
        <p class="page-kicker">Retrato del personaje</p>
        <h2 class="page-title">Apariencia</h2>
      </div>
      <div class="panel"><p>Herramienta opcional que toma lo elegido en la creacion y lo convierte en una descripcion visual y un prompt copiables.</p></div>
    `;

    main.append(
      appearanceSection({
        title: "Base automatica",
        helper: "La app mezcla clase, especie, trasfondo, subclase, equipo y objetos magicos para dar una direccion visual inicial.",
        content: appearanceBasePanel(character, derived),
      }),
      appearanceSection({
        title: "Detalles visuales",
        helper: "Ajusta solo lo que te interese. Puedes dejar campos en blanco y la descripcion seguira funcionando.",
        content: appearanceControls(appearance, render),
      }),
      appearanceSection({
        title: "Texto generado",
        helper: "Copia una version narrativa para la hoja o un prompt visual para usar fuera de la app.",
        content: appearanceOutput(generated, render),
      }),
    );

    page.replaceChildren(main, SummaryPanel({ character }));
  }

  return page;
}

const appearanceFields = [
  {
    id: "gender",
    label: "Genero / identidad",
    options: ["", "hombre", "mujer", "no binario", "androgino", "fluido", "sin definir"],
  },
  {
    id: "presentation",
    label: "Presentacion",
    options: ["", "sobria", "imponente", "misteriosa", "amable", "salvaje", "elegante"],
  },
  {
    id: "apparentAge",
    label: "Edad aparente",
    options: ["", "joven", "adulta", "madura", "anciana"],
  },
  {
    id: "height",
    label: "Altura",
    options: ["", "baja", "media", "alta", "muy alta"],
  },
  {
    id: "build",
    label: "Complexion",
    options: ["", "delgada", "atletica", "robusta", "compacta", "imponente"],
  },
  {
    id: "face",
    label: "Rostro",
    options: ["", "sereno", "duro", "afilado", "cansado", "noble", "curioso"],
  },
  {
    id: "eyes",
    label: "Ojos",
    options: ["", "claros", "oscuros", "dorados", "verdes", "azules", "intensos"],
  },
  {
    id: "hair",
    label: "Cabello",
    options: ["", "corto", "largo", "trenzado", "rapado", "desordenado", "canoso"],
  },
  {
    id: "skin",
    label: "Piel / escamas",
    options: ["", "clara", "morena", "oscura", "marcada por viajes", "escamada", "sobrenatural"],
  },
  {
    id: "marks",
    label: "Marcas distintivas",
    options: ["", "cicatrices", "tatuajes", "amuletos", "manchas de tinta", "marcas rituales", "joyeria simple"],
  },
  {
    id: "expression",
    label: "Expresion",
    options: ["", "calma", "alerta", "desafiante", "melancolica", "confiada", "reservada"],
  },
  {
    id: "posture",
    label: "Postura",
    options: ["", "marcial", "relajada", "erguida", "furtiva", "ceremonial", "preparada para actuar"],
  },
  {
    id: "clothing",
    label: "Ropa",
    options: ["", "ropa de viaje", "armadura gastada", "tunica ritual", "cuero oscuro", "ropas finas", "atuendo practico"],
  },
  {
    id: "palette",
    label: "Paleta de colores",
    options: ["", "rojos y hierro", "azules y plata", "verdes naturales", "dorado y blanco", "negro y gris", "cobre y teal"],
  },
  {
    id: "style",
    label: "Estilo general",
    options: ["", "fantasia heroica", "retrato realista", "ilustracion de manual", "concept art", "pintura digital"],
  },
];

function appearanceSection({ title, helper, content }) {
  const section = document.createElement("section");
  section.className = "choice-section";
  section.innerHTML = `
    <div>
      <h3>${title}</h3>
      <p>${helper}</p>
    </div>
  `;
  section.append(content);
  return section;
}

function appearanceBasePanel(character, derived) {
  const panel = document.createElement("div");
  panel.className = "appearance-base panel";
  const automaticDetails = automaticAppearanceDetails(character, derived);
  panel.innerHTML = `
    <dl class="appearance-base-grid">
      <div><dt>Clase</dt><dd>${displayName(derived.classData) || "Pendiente"}</dd></div>
      <div><dt>Especie</dt><dd>${displayName(derived.speciesData) || "Pendiente"}</dd></div>
      <div><dt>Trasfondo</dt><dd>${displayName(derived.backgroundData) || "Pendiente"}</dd></div>
      <div><dt>Subclase</dt><dd>${displayName(derived.subclassData) || "Opcional"}</dd></div>
      <div><dt>Armadura</dt><dd>${displayName(derived.equippedArmor) || "Sin definir"}</dd></div>
      <div><dt>Arma</dt><dd>${displayName(derived.equippedWeapon) || "Sin definir"}</dd></div>
    </dl>
    <p>${appearanceBaseSentence(derived)}</p>
    ${automaticDetails.length ? `
      <ul class="appearance-auto-list">
        ${automaticDetails.map((detail) => `<li>${detail}</li>`).join("")}
      </ul>
    ` : ""}
  `;
  return panel;
}

function appearanceControls(appearance, onChange) {
  const form = document.createElement("div");
  form.className = "appearance-controls";

  appearanceFields.forEach((fieldData) => {
    const field = document.createElement("label");
    field.className = "field";
    field.innerHTML = `
      <span>${fieldData.label}</span>
      <select>
        ${fieldData.options.map((option) => `
          <option value="${option}">${option || "Sin definir"}</option>
        `).join("")}
      </select>
    `;

    const select = field.querySelector("select");
    select.value = appearance[fieldData.id] || "";
    select.addEventListener("change", () => {
      updateCharacter({
        appearance: {
          [fieldData.id]: select.value,
        },
      });
      onChange();
    });
    form.append(field);
  });

  const customField = document.createElement("label");
  customField.className = "field appearance-notes";
  customField.innerHTML = `
    <span>Detalle libre</span>
    <textarea rows="3" placeholder="Ej: lleva un relicario familiar, una capa quemada o una mirada siempre cansada."></textarea>
  `;
  const textarea = customField.querySelector("textarea");
  textarea.value = appearance.notes || "";
  textarea.addEventListener("input", () => {
    updateCharacter({
      appearance: {
        notes: textarea.value,
      },
    });
  });
  textarea.addEventListener("change", () => {
    onChange();
  });
  form.append(customField);

  return form;
}

function appearanceOutput({ description, prompt }, onChange) {
  const panel = document.createElement("div");
  panel.className = "appearance-output";

  panel.append(
    appearanceTextCard({
      label: "Descripcion narrativa",
      text: description,
      buttonLabel: "Copiar descripcion",
    }),
    appearanceTextCard({
      label: "Prompt visual",
      text: prompt,
      buttonLabel: "Copiar prompt visual",
    }),
  );

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "button";
  clearButton.textContent = "Limpiar apariencia";
  clearButton.addEventListener("click", () => {
    updateCharacter({ appearance: emptyAppearance() });
    onChange();
  });
  panel.append(clearButton);

  return panel;
}

function appearanceTextCard({ label, text, buttonLabel }) {
  const card = document.createElement("article");
  const heading = document.createElement("span");
  const paragraph = document.createElement("p");
  const button = document.createElement("button");

  heading.textContent = label;
  paragraph.textContent = text;
  button.type = "button";
  button.className = "button secondary-button";
  button.textContent = buttonLabel;
  button.addEventListener("click", () => copyText(text, button));

  card.append(heading, paragraph, button);
  return card;
}

function emptyAppearance() {
  return Object.fromEntries([
    ...appearanceFields.map((field) => [field.id, ""]),
    ["notes", ""],
  ]);
}

function buildAppearanceText(character, derived) {
  const appearance = character.appearance || {};
  const base = appearanceBaseSentence(derived);
  const automaticDetails = automaticAppearanceDetails(character, derived);
  const details = appearanceFields
    .map((field) => appearance[field.id])
    .filter(Boolean);
  const detailSentence = details.length ? `Detalles visibles: ${details.join(", ")}.` : "Detalles visibles sin definir.";
  const automaticSentence = automaticDetails.length ? `Influencia visual automatica: ${automaticDetails.join("; ")}.` : "";
  const notes = appearance.notes ? `Detalle especial: ${appearance.notes.trim()}.` : "";
  const description = [base, automaticSentence, detailSentence, notes].filter(Boolean).join(" ");
  const prompt = [
    trimPromptSegment(base),
    automaticDetails.join(", "),
    details.join(", "),
    appearance.notes || "",
    "fantasy character portrait, full body, clear readable design, tabletop roleplaying character, no text, no watermark",
  ].filter(Boolean).join(", ");

  return { description, prompt };
}

function trimPromptSegment(text) {
  return text.replace(/[.]+$/, "");
}

function appearanceBaseSentence(derived) {
  const species = displayName(derived.speciesData) || "Personaje";
  const className = displayName(derived.classData) || "aventurero";
  const background = displayName(derived.backgroundData);
  const subclass = displayName(derived.subclassData);
  const parts = [
    `${species} ${className}`.trim(),
    background ? `con pasado de ${background}` : "",
    subclass ? `marcado por la subclase ${subclass}` : "",
    classVisualCue(derived.classData?.id),
  ].filter(Boolean);

  return `${parts.join(", ")}.`;
}

function automaticAppearanceDetails(character, derived) {
  return [
    subclassVisualCue(derived.subclassData?.id),
    armorModelVisualCue(character),
    armorVisualCue(derived.equippedArmor, derived.equippedShield),
    weaponVisualCue(derived.equippedWeapon),
    magicItemVisualCue(derived.magicItems),
  ].filter(Boolean);
}

function armorVisualCue(armor, shield) {
  const parts = [];

  if (armor) {
    parts.push(`viste ${displayName(armor)}`);
  }

  if (shield) {
    parts.push(`lleva ${displayName(shield)}`);
  }

  return parts.length ? parts.join(" y ") : "";
}

function weaponVisualCue(weapon) {
  return weapon ? `porta ${displayName(weapon)} como arma principal` : "";
}

function magicItemVisualCue(magicItems) {
  const names = (magicItems || []).map(displayName).filter(Boolean);

  if (!names.length) {
    return "";
  }

  return `destaca por ${formatNaturalList(names)}`;
}

function armorModelVisualCue(character) {
  const armorModelChoice = getChoiceStatus(character).find((choice) => choice.id === "armorer-armor-model-choice");
  const selectedModel = armorModelChoice?.selected?.[0];

  if (!selectedModel) {
    return "";
  }

  const modelLabels = {
    dreadnaught: "armadura arcana acorazada, pesada y dominante",
    guardian: "armadura arcana defensiva, robusta y protectora",
    infiltrator: "armadura arcana ligera, silenciosa y precisa",
  };

  return modelLabels[selectedModel] || `modelo de armadura ${armorModelChoice.optionLabels?.[selectedModel] || displayValue(selectedModel)}`;
}

function formatNaturalList(values) {
  if (values.length <= 1) {
    return values[0] || "";
  }

  return `${values.slice(0, -1).join(", ")} y ${values.at(-1)}`;
}

function classVisualCue(classId) {
  const cues = {
    artificer: "presencia tecnica y mirada analitica",
    barbarian: "presencia intensa y postura feroz",
    bard: "porte expresivo y energia escenica",
    cleric: "aura devota y simbolos sagrados",
    druid: "vinculo natural y detalles organicos",
    fighter: "postura marcial y equipo preparado",
    monk: "calma disciplinada y movimiento preciso",
    paladin: "porte luminoso y conviccion solemne",
    ranger: "actitud alerta y equipo de viaje",
    rogue: "gesto reservado y presencia furtiva",
    sorcerer: "magia innata visible en gestos o mirada",
    warlock: "presencia extrana y poder pactado",
    wizard: "aire estudioso y marcas arcanas",
  };

  return cues[classId] || "presencia aventurera";
}

function subclassVisualCue(subclassId) {
  const cues = {
    abjurer: "protecciones arcanas visibles como sigilos o barreras sutiles",
    "aberrant-sorcery": "presencia mental inquietante y rasgos sutilmente anormales",
    alchemist: "frascos, reactivos y manchas de laboratorio como detalles visibles",
    "ancients-oath": "motivos verdes, luz antigua y simbolos de juramento natural",
    "arcane-archer": "flechas grabadas con runas y precision sobrenatural",
    "arcane-trickster": "detalles ilusorios y herramientas escondidas",
    "archfey-patron": "encanto feerico, colores vivos y mirada extrana",
    armorer: "armadura convertida en foco arcano y pieza central del diseno",
    artillerist: "artefactos belicos y componentes arcanos expuestos",
    assassin: "silueta discreta y equipo preparado para infiltracion",
    "battle-master": "postura tactica y equipo marcado por entrenamiento marcial",
    "battle-smith": "ingenieria marcial y companion mecanico como motivo visual",
    "beast-master": "vinculo primal con una bestia companera",
    berserker: "furia fisica, cicatrices y movimiento brutal",
    bladesinging: "elegancia marcial mezclada con magia de danza",
    cavalier: "porte de jinete entrenado y equipo pensado para defender aliados",
    "celestial-patron": "calidez sobrenatural y senales de luz sanadora",
    champion: "porte atletico y seguridad de combatiente experto",
    "clockwork-sorcery": "simetria precisa y pequenos motivos mecanicos o inevitables",
    "dance-college": "movimiento escenico y vestimenta flexible",
    diviner: "simbolos de presagio y mirada que parece adelantarse al momento",
    "devotion-oath": "simbolos sagrados limpios y luz de juramento honorable",
    "draconic-sorcery": "rasgos draconicos sutiles en piel, ojos o postura",
    "eldritch-knight": "armamento marcado por magia arcana",
    "elements-warrior": "gestos fluidos y senales de fuerza elemental contenida",
    evoker: "energia elemental contenida alrededor de manos o foco",
    "fey-wanderer": "encanto feerico de viajero y detalles extranos de camino",
    "fiend-patron": "senal infernal, sombras calidas o detalles amenazantes",
    "glamour-college": "belleza feerica y presencia magnetica",
    "glory-oath": "brillo heroico y simbolos de grandeza publica",
    "gloom-stalker": "capas oscuras, mirada alerta y presencia de emboscada",
    "great-old-one-patron": "presencia inquietante y motivos cosmicos o incomprensibles",
    hunter: "trofeos discretos y equipo de rastreador experto",
    illusionist: "contornos cambiantes y pequenos efectos ilusorios",
    "land-circle": "marca natural del circulo elegido",
    "life-domain": "simbolos de curacion y luz protectora",
    "light-domain": "resplandor solar y motivos radiantes",
    "lore-college": "libros, relatos y detalles de erudicion viajera",
    "mercy-warrior": "mascara o simbolos de sanacion y juicio",
    "moon-circle": "rasgos salvajes y simbolos lunares",
    "open-hand-warrior": "postura limpia, manos libres y disciplina fisica",
    "order-of-scribes": "pluma arcana, grimorio activo y escritura viva",
    "psi-warrior": "tension psiquica visible en gestos o arma",
    "rune-knight": "runas grabadas en equipo, piel o metal",
    samurai: "porte sereno, disciplina ceremonial y equipo cuidado",
    "sea-circle": "motivos marinos, salitre y movimiento de marea",
    "shadow-warrior": "sombras cenidas al cuerpo y movimiento silencioso",
    "soulknife": "destellos psiquicos alrededor de las manos",
    "stars-circle": "constelaciones, mapas celestes y brillo astral",
    thief: "bolsillos, herramientas y equipo practico de saqueo",
    "trickery-domain": "simbolos ambiguos, duplicidad y gracia enganosa",
    "valor-college": "ornamentos de batalla y presencia de heraldo",
    "vengeance-oath": "porte severo y simbolos de juramento implacable",
    "war-domain": "iconografia belica y equipo consagrado para combate",
    "war-magic": "disciplina tactica y defensas arcanas tensas",
    "wild-heart": "rasgos animales o espirituales ligados a la furia",
    "wild-magic-sorcery": "chispas caoticas y detalles imposibles",
    "world-tree": "motivos de raices, ramas y vitalidad cosmica",
    zealot: "fervor divino y marcas de poder radiante o necrotico",
  };

  return cues[subclassId] || "";
}

function copyText(text, button) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  }

  if (button) {
    const originalText = button.textContent;
    button.textContent = "Copiado";
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  }
}
