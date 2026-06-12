import { CalculationGrid } from "../components/CalculationBox.js";
import { ChoiceGrid } from "../components/ChoiceCard.js";
import { ProgressionList } from "../components/ProgressionList.js";
import { SheetSectionList } from "../components/SheetField.js";
import { Stepper } from "../components/Stepper.js";
import { SummaryPanel } from "../components/SummaryPanel.js";
import { getChoiceStatus } from "../scripts/choiceEngine.js";
import { creationEngine } from "../scripts/creationEngine.js";
import { getCharacter, resetCharacter, updateCharacter } from "../scripts/characterState.js";
import { displayChoiceOption, displayName, displayValue } from "../scripts/displayLabels.js";
import { getSpellSheetDetail } from "../scripts/spellSheetDetails.js";
import { rulesEngine } from "../scripts/rulesEngine.js";
import { mapCharacterToSheetSections } from "../scripts/sheetMapper.js";
import { resolveSpell, sortByVisibleName, sortChoiceOptions } from "../scripts/sortUtils.js";

export function CreatorPage({ stepId = "class" } = {}) {
  const page = document.createElement("section");
  page.className = "creator-layout";
  let character = getCharacter();
  let activeStepId = creationEngine.getStep(stepId).id;

  render();

  function render() {
    character = getCharacter();
    const step = creationEngine.getStep(activeStepId);
    page.replaceChildren();

    const main = document.createElement("div");
    main.className = "section-stack";
    main.innerHTML = `
      <div>
        <p class="page-kicker">Asistente de personaje</p>
        <h2 class="page-title">${step.title}</h2>
      </div>
      <div class="panel"><p>${step.helper}</p></div>
    `;

    main.append(Stepper({
      steps: creationEngine.getSteps(),
      activeStepId,
      onStepSelect(nextStepId) {
        activeStepId = nextStepId;
        render();
      },
    }));

    main.append(renderStepContent(step.id));
    main.append(renderStepActions(step.id));

    page.append(main, SummaryPanel({ character }));
  }

  function renderStepContent(currentStepId) {
    if (currentStepId === "class") {
      return renderSingleChoice(currentStepId);
    }

    if (currentStepId === "origin") {
      return renderOrigin();
    }

    if (currentStepId === "appearance") {
      return renderAppearance();
    }

    if (currentStepId === "progression") {
      return renderProgression();
    }

    if (currentStepId === "equipment") {
      return renderEquipmentChoice();
    }

    if (currentStepId === "abilities") {
      return renderAbilities();
    }

    if (currentStepId === "choices") {
      return renderRuleChoices();
    }

    if (currentStepId === "sheet") {
      return renderSheetAdjustments();
    }

    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";
    const derived = rulesEngine.deriveCharacter(character);
    wrapper.append(
      ProgressionList({ title: "Rasgos de clase hasta nivel 5", entries: derived.classFeaturesByLevel }),
      ProgressionList({ title: "Rasgos de subclase hasta nivel 5", entries: derived.subclassFeaturesByLevel }),
      SheetSectionList(mapCharacterToSheetSections(character)),
    );
    return wrapper;
  }

  function renderAppearance() {
    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";
    const derived = rulesEngine.deriveCharacter(character);
    const appearance = character.appearance || {};
    const generated = buildAppearanceText(character, derived);

    wrapper.append(
      choiceSection({
        title: "Base automatica",
        helper: "La app mezcla clase, especie, trasfondo y subclase para dar una direccion visual inicial.",
        content: appearanceBasePanel(character, derived),
      }),
      choiceSection({
        title: "Detalles visuales",
        helper: "Ajusta solo lo que te interese. Puedes dejar campos en blanco y la descripcion seguira funcionando.",
        content: appearanceControls(appearance, render),
      }),
      choiceSection({
        title: "Texto generado",
        helper: "Copia una version narrativa para la hoja o un prompt visual para usar fuera de la app.",
        content: appearanceOutput(generated, render),
      }),
    );

    return wrapper;
  }

  function renderSingleChoice(currentStepId) {
    const selectionKey = creationEngine.getSelectionKey(currentStepId);
    const selectedId = character[selectionKey];

    return ChoiceGrid({
      items: creationEngine.getChoices(currentStepId),
      selectedIds: selectedId ? [selectedId] : [],
      onSelect(id) {
        updateCharacter(currentStepId === "class"
          ? { [selectionKey]: id, subclassId: "", classEquipmentOptionId: "" }
          : { [selectionKey]: id });
        render();
      },
    });
  }

  function renderOrigin() {
    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";

    wrapper.append(
      choiceSection({
        title: "Trasfondo",
        helper: "Aporta aumentos de caracteristica, habilidades, dote inicial, equipo y monedas.",
        content: originChoiceGrid({
          type: "background",
          items: creationEngine.getChoices("background"),
          selectedIds: character.backgroundId ? [character.backgroundId] : [],
          onSelect(id) {
            updateCharacter({ backgroundId: id, backgroundEquipmentOptionId: "", backgroundAbilityIncreases: resetAbilityIncreases() });
            render();
          },
        }),
      }),
      choiceSection({
        title: "Especie",
        helper: "Aporta tamano, velocidad, idiomas y rasgos que se copian a la hoja.",
        content: originChoiceGrid({
          type: "species",
          items: creationEngine.getChoices("species"),
          selectedIds: character.speciesId ? [character.speciesId] : [],
          onSelect(id) {
            updateCharacter({ speciesId: id });
            render();
          },
        }),
      }),
    );

    return wrapper;
  }

  function renderSubclassChoice() {
    const choices = creationEngine.getSubclassChoices(character.classId);

    if (!choices.length) {
      const panel = document.createElement("div");
      panel.className = "panel";
      panel.innerHTML = "<p>Elige una clase primero para ver sus subclases disponibles.</p>";
      return panel;
    }

    return ChoiceGrid({
      items: choices,
      selectedIds: character.subclassId ? [character.subclassId] : [],
      onSelect(id) {
        updateCharacter({ subclassId: id });
        render();
      },
    });
  }

  function renderProgression() {
    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";
    const derived = rulesEngine.deriveCharacter(character);

    wrapper.append(
      choiceSection({
        title: "Subclase",
        helper: "A nivel 5 la subclase ya esta activa. Elige una para sumar sus rasgos.",
        content: renderSubclassChoice(),
      }),
      choiceSection({
        title: "Mejora de nivel 4",
        helper: "Elige si el nivel 4 sube caracteristicas o agrega una dote. Esto se refleja en la hoja y en pendientes.",
        content: renderLevel4Improvement(),
      }),
      ProgressionList({ title: "Rasgos de clase hasta nivel 5", entries: derived.classFeaturesByLevel }),
      ProgressionList({ title: "Rasgos de subclase hasta nivel 5", entries: derived.subclassFeaturesByLevel }),
      ...(derived.spellcasting.canCast ? [renderSpellSlotsPanel(derived)] : []),
      CalculationGrid([
        {
          title: "Nivel",
          value: derived.level,
          formula: "La mesa presencial esta fijada en nivel 5.",
        },
        {
          title: "Proficiency Bonus",
          value: `+${derived.proficiencyBonus}`,
          formula: "Nivel 5 usa +3.",
        },
        {
          title: "Hit Point Maximum",
          value: derived.hitPointMaximum,
          formula: derived.hitPointFormula,
        },
        {
          title: "Nivel 4",
          value: level4Summary(character),
          formula: "Mejora de caracteristica: aumento de atributos o una dote elegida.",
        },
      ]),
    );

    return wrapper;
  }

  function renderLevel4Improvement() {
    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";
    const modeGrid = document.createElement("div");
    modeGrid.className = "ability-methods";

    [
      {
        id: "abilities",
        label: "Subir caracteristicas",
        value: "+2",
        summary: "Suma +2 a un atributo o +1 a dos atributos, hasta maximo 20.",
      },
      {
        id: "feat",
        label: "Elegir dote",
        value: "Dote",
        summary: "Elige una dote disponible; si tiene elecciones, apareceran en Pendientes.",
      },
    ].forEach((mode) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = character.level4Mode === mode.id ? "method-card is-selected" : "method-card";
      button.innerHTML = `
        <span>${mode.label}</span>
        <strong>${mode.value}</strong>
        <small>${mode.summary}</small>
      `;
      button.addEventListener("click", () => {
        updateCharacter({
          level4Mode: mode.id,
          ...(mode.id === "abilities" ? { level4FeatId: "" } : { level4AbilityIncreases: resetAbilityIncreases() }),
        });
        render();
      });
      modeGrid.append(button);
    });

    wrapper.append(modeGrid);

    if (character.level4Mode === "abilities") {
      wrapper.append(renderLevel4AbilityBuilder());
    }

    if (character.level4Mode === "feat") {
      wrapper.append(renderLevel4FeatChoice());
    }

    return wrapper;
  }

  function renderLevel4AbilityBuilder() {
    const status = creationEngine.getLevel4AbilityIncreaseStatus(character);
    const panel = document.createElement("div");
    panel.className = "section-stack";
    const statusPanel = document.createElement("div");
    statusPanel.className = status.complete ? "panel ability-status is-complete" : "panel ability-status";
    statusPanel.innerHTML = `<p>Aumentos de nivel 4: ${status.total}/2. Usa +2 en un atributo o +1/+1 en dos atributos.</p>`;
    const grid = document.createElement("div");
    grid.className = "ability-builder";

    creationEngine.getAbilityEntries(character).forEach((ability) => {
      const beforeLevel4 = Number(ability.baseScore) + Number(ability.increase || 0);
      const card = document.createElement("article");
      card.className = "ability-card is-allowed";
      card.innerHTML = `
        <div class="ability-card-header">
          <span>${displayValue(ability.label)}</span>
          <strong>${ability.finalScore}</strong>
        </div>
        <div class="ability-control-row">
          <span>Nivel 4</span>
          <button type="button" class="step-button" data-action="level4-down" aria-label="Bajar aumento nivel 4 de ${displayValue(ability.label)}">-</button>
          <b>+${ability.level4Increase}</b>
          <button type="button" class="step-button" data-action="level4-up" aria-label="Subir aumento nivel 4 de ${displayValue(ability.label)}">+</button>
        </div>
        <small>Antes de nivel 4: ${beforeLevel4}. Maximo final 20.</small>
      `;
      card.querySelector('[data-action="level4-down"]').addEventListener("click", () => {
        updateLevel4Increase(ability.id, -1);
      });
      card.querySelector('[data-action="level4-up"]').addEventListener("click", () => {
        updateLevel4Increase(ability.id, 1);
      });
      grid.append(card);
    });

    panel.append(statusPanel, grid);
    return panel;
  }

  function renderLevel4FeatChoice() {
    const selected = character.level4FeatId ? [character.level4FeatId] : [];
    return ChoiceGrid({
      items: creationEngine.getLevel4FeatChoices(character),
      selectedIds: selected,
      onSelect(id) {
        updateCharacter({ level4FeatId: id });
        render();
      },
    });
  }

  function renderEquipmentChoice() {
    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";
    const classOptions = creationEngine.getClassEquipmentOptions(character.classId);
    const backgroundOptions = creationEngine.getBackgroundEquipmentOptions(character.backgroundId);

    wrapper.append(
      choiceSection({
        title: "Equipo avanzado nivel 5",
        helper: "PHB 2024 recomienda sumar dinero y posibles objetos magicos al equipo inicial normal cuando la mesa empieza en nivel 5.",
        content: renderHigherLevelEquipment(),
      }),
      choiceSection({
        title: "Objetos magicos de nivel 5",
        helper: "Elige 1 comun y 1 poco comun si el DM usa la sugerencia de equipo avanzado.",
        content: renderMagicItemChoices(),
      }),
      choiceSection({
        title: "Equipo de clase",
        helper: "Elige el paquete inicial indicado por la clase. Puede ser A, B o una opcion de monedas.",
        content: classOptions.length
          ? equipmentOptionGrid({
              options: classOptions,
              selectedId: character.classEquipmentOptionId,
              onSelect(id) {
                updateCharacter({ classEquipmentOptionId: id });
                render();
              },
            })
          : emptyPanel("Elige una clase primero para ver sus paquetes de equipo."),
      }),
      choiceSection({
        title: "Equipo de trasfondo",
        helper: "Elige el paquete del trasfondo o la alternativa de monedas.",
        content: backgroundOptions.length
          ? equipmentOptionGrid({
              options: backgroundOptions,
              selectedId: character.backgroundEquipmentOptionId,
              onSelect(id) {
                updateCharacter({ backgroundEquipmentOptionId: id });
                render();
              },
            })
          : emptyPanel("Elige un trasfondo primero para ver su equipo."),
      }),
      choiceSection({
        title: "Equipo adicional",
        helper: "Agrega objetos manuales si la mesa entrega compras, recompensas o ajustes.",
        content: ChoiceGrid({
          items: creationEngine.getChoices("equipment"),
          selectedIds: character.equipmentIds,
          multiple: true,
          onSelect(id) {
            const hasItem = character.equipmentIds.includes(id);
            const nextEquipmentIds = hasItem
              ? character.equipmentIds.filter((equipmentId) => equipmentId !== id)
              : [...character.equipmentIds, id];
            updateCharacter({
              equipmentIds: nextEquipmentIds,
              equippedArmorId: hasItem && character.equippedArmorId === id ? "" : character.equippedArmorId,
              equippedShieldId: hasItem && character.equippedShieldId === id ? "" : character.equippedShieldId,
              equippedWeaponId: hasItem && character.equippedWeaponId === id ? "" : character.equippedWeaponId,
            });
            render();
          },
        }),
      }),
    );

    return wrapper;
  }

  function renderHigherLevelEquipment() {
    const status = creationEngine.getHigherLevelGold(character);
    const panel = document.createElement("div");
    panel.className = "panel section-stack";
    const rollOptions = Array.from({ length: status.rule?.roll?.die || 0 }, (_, index) => index + 1);

    panel.innerHTML = `
      <div>
        <p><strong>${status.rule?.equipmentText || "No aplica"}</strong></p>
        <p>Objetos magicos sugeridos: ${status.rule?.magicItems?.join(", ") || "ninguno"}. Confirma disponibilidad con el DM.</p>
      </div>
      <label class="field">
        <span>Resultado de 1d10 para oro avanzado</span>
        <select>
          <option value="">Pendiente</option>
          ${rollOptions.map((value) => `<option value="${value}">${value}</option>`).join("")}
        </select>
      </label>
      <p>${status.complete ? `Oro avanzado: ${status.formula} = ${status.totalGp} PO.` : `Oro avanzado pendiente: ${status.formula}.`}</p>
    `;

    const select = panel.querySelector("select");
    select.value = character.higherLevelGoldRoll;
    select.addEventListener("change", () => {
      updateCharacter({ higherLevelGoldRoll: select.value });
      render();
    });

    return panel;
  }

  function renderMagicItemChoices() {
    const panel = document.createElement("div");
    panel.className = "sheet-adjustments";
    panel.append(
      magicItemSelect({
        label: "Objeto comun",
        value: character.commonMagicItemId,
        rarity: "Common",
        onChange(value) {
          updateCharacter({ commonMagicItemId: value });
          render();
        },
      }),
      magicItemSelect({
        label: "Objeto poco comun",
        value: character.uncommonMagicItemId,
        rarity: "Uncommon",
        onChange(value) {
          updateCharacter({ uncommonMagicItemId: value });
          render();
        },
      }),
    );
    return panel;
  }

  function renderSheetAdjustments() {
    const derived = rulesEngine.deriveCharacter(character);
    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";
    const controls = document.createElement("div");
    controls.className = "sheet-adjustments";

    const armorOptions = sortByVisibleName(derived.equipmentItems.filter((item) => item.category === "armor"));
    const shieldOptions = sortByVisibleName(derived.equipmentItems.filter((item) => item.category === "shield"));
    const weaponOptions = sortByVisibleName(derived.equipmentItems.filter((item) => item.category === "weapon"));

    controls.append(
      selectField({
        label: "Arma equipada",
        value: character.equippedWeaponId,
        placeholder: "Elige arma",
        items: weaponOptions,
        onChange(value) {
          updateCharacter({ equippedWeaponId: value });
          render();
        },
      }),
      selectField({
        label: "Armadura equipada",
        value: character.equippedArmorId,
        placeholder: "Sin armadura",
        items: armorOptions,
        onChange(value) {
          updateCharacter({ equippedArmorId: value });
          render();
        },
      }),
      selectField({
        label: "Escudo equipado",
        value: character.equippedShieldId,
        placeholder: "Sin escudo",
        items: shieldOptions,
        onChange(value) {
          updateCharacter({ equippedShieldId: value });
          render();
        },
      }),
    );

    wrapper.append(
      controls,
      CalculationGrid([
        {
          title: "Clase de Armadura",
          value: derived.armorClass,
          formula: derived.armorClassFormula,
        },
        {
          title: "Monedas",
          value: derived.higherLevelGold.complete ? derived.coinText : "Pendiente",
          formula: coinCalculationText(derived),
        },
        {
          title: "Objetos magicos",
          value: derived.magicItems.length ? derived.magicItems.map(displayName).join(" / ") : "Pendiente",
          formula: "Nivel 5 sugiere 1 comun y 1 poco comun; el DM decide cuales estan disponibles.",
        },
        {
          title: "Percepcion pasiva",
          value: derived.passivePerception,
          formula: "10 + modificador de Sabiduria, antes de otros bonos.",
        },
      ]),
    );

    return wrapper;
  }

  function renderAbilities() {
    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";

    const status = creationEngine.getAbilityIncreaseStatus(character);
    const pointBuyStatus = creationEngine.getPointBuyStatus(character);
    const abilityBuilder = renderAbilityBuilder({ status, pointBuyStatus });

    const derived = rulesEngine.deriveCharacter(character);
    wrapper.append(
      renderAbilityMethodCards(),
      renderAbilityStatus({ status, pointBuyStatus }),
      abilityBuilder,
      CalculationGrid([
        {
          title: "Proficiency Bonus",
          value: `+${derived.proficiencyBonus}`,
          formula: "Nivel 5 usa +3.",
        },
        {
          title: "Hit Point Maximum",
          value: derived.hitPointMaximum,
          formula: derived.hitPointFormula,
        },
        {
          title: "Armor Class",
          value: derived.armorClass,
          formula: derived.armorClassFormula,
        },
      ]),
    );

    return wrapper;
  }

  function renderAbilityMethodCards() {
    const panel = document.createElement("section");
    panel.className = "ability-methods";

    creationEngine.getAbilityMethodOptions().forEach((method) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = character.abilityMethod === method.id ? "method-card is-selected" : "method-card";
      button.innerHTML = `
        <span>${method.label}</span>
        <strong>${method.id === "point-buy" ? "27 pts" : method.id === "manual" ? "Libre" : "15 14 13"}</strong>
        <small>${method.summary}</small>
      `;
      button.addEventListener("click", () => {
        updateCharacter({
          abilityMethod: method.id,
          ...(method.id === "point-buy" || method.id === "standard-array"
            ? { baseAbilities: clampPointBuyAbilities(character.baseAbilities) }
            : {}),
        });
        render();
      });
      panel.append(button);
    });

    return panel;
  }

  function renderAbilityStatus({ status, pointBuyStatus }) {
    const statusPanel = document.createElement("div");
    const pointBuyOk = character.abilityMethod !== "point-buy" || pointBuyStatus.complete;
    statusPanel.className = status.complete && pointBuyOk ? "panel ability-status is-complete" : "panel ability-status";
    const methodLine = character.abilityMethod === "point-buy"
      ? `Compra por puntos: ${pointBuyStatus.spent}/27 usados, ${Math.max(0, pointBuyStatus.remaining)} restantes.`
      : character.abilityMethod === "manual"
        ? "Manual: ajusta con - y + segun lo que permita la mesa."
        : "Standard array: parte de 15, 14, 13, 12, 10 y 8; ajusta si quieres reasignar.";
    const backgroundLine = character.backgroundId
      ? `Aumentos de trasfondo: ${status.total}/3. Usa +2/+1 o +1/+1/+1.`
      : "Elige un trasfondo en Origen para habilitar aumentos.";
    statusPanel.innerHTML = `<p>${methodLine} ${backgroundLine}</p>`;
    return statusPanel;
  }

  function renderAbilityBuilder({ status, pointBuyStatus }) {
    const grid = document.createElement("div");
    grid.className = "ability-builder";
    const allowedIncreases = new Set(status.allowed);

    creationEngine.getAbilityEntries(character).forEach((ability) => {
      const canIncrease = allowedIncreases.has(ability.id);
      const card = document.createElement("article");
      card.className = canIncrease ? "ability-card is-allowed" : "ability-card";
      card.innerHTML = `
        <div class="ability-card-header">
          <span>${displayValue(ability.label)}</span>
          <strong>${ability.finalScore}</strong>
        </div>
        <div class="ability-control-row">
          <span>Base</span>
          <button type="button" class="step-button" data-action="base-down" aria-label="Bajar ${displayValue(ability.label)}">-</button>
          <b>${ability.baseScore}</b>
          <button type="button" class="step-button" data-action="base-up" aria-label="Subir ${displayValue(ability.label)}">+</button>
        </div>
        <div class="ability-control-row">
          <span>Trasfondo</span>
          <button type="button" class="step-button" data-action="increase-down" ${canIncrease ? "" : "disabled"} aria-label="Bajar aumento de ${displayValue(ability.label)}">-</button>
          <b>+${ability.increase}</b>
          <button type="button" class="step-button" data-action="increase-up" ${canIncrease ? "" : "disabled"} aria-label="Subir aumento de ${displayValue(ability.label)}">+</button>
        </div>
        <small>Nivel 4: +${ability.level4Increase}</small>
        ${character.abilityMethod === "point-buy" ? `<small>Costo base ${pointBuyStatus.costs[Number(ability.baseScore)] ?? "invalido"}</small>` : ""}
      `;

      card.querySelector('[data-action="base-down"]').addEventListener("click", () => {
        updateBaseAbility(ability.id, -1);
      });
      card.querySelector('[data-action="base-up"]').addEventListener("click", () => {
        updateBaseAbility(ability.id, 1);
      });
      card.querySelector('[data-action="increase-down"]').addEventListener("click", () => {
        updateBackgroundIncrease(ability.id, -1);
      });
      card.querySelector('[data-action="increase-up"]').addEventListener("click", () => {
        updateBackgroundIncrease(ability.id, 1);
      });

      grid.append(card);
    });

    return grid;
  }

  function updateBaseAbility(abilityId, delta) {
    const current = Number(character.baseAbilities[abilityId] || 0);
    const min = character.abilityMethod === "manual" ? 1 : 8;
    const max = character.abilityMethod === "manual" ? 30 : 15;
    const next = clamp(current + delta, min, max);

    if (next === current) {
      return;
    }

    if (character.abilityMethod === "point-buy" && delta > 0 && wouldExceedPointBuy(abilityId, next)) {
      return;
    }

    updateCharacter({ baseAbilities: { [abilityId]: next } });
    render();
  }

  function updateBackgroundIncrease(abilityId, delta) {
    const current = Number(character.backgroundAbilityIncreases?.[abilityId] || 0);
    const total = Object.values(character.backgroundAbilityIncreases || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    const next = clamp(current + delta, 0, 2);

    if (next === current) {
      return;
    }

    if (delta > 0 && total >= 3) {
      return;
    }

    updateCharacter({ backgroundAbilityIncreases: { [abilityId]: next } });
    render();
  }

  function updateLevel4Increase(abilityId, delta) {
    const current = Number(character.level4AbilityIncreases?.[abilityId] || 0);
    const total = Object.values(character.level4AbilityIncreases || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    const beforeLevel4 = Number(character.baseAbilities?.[abilityId] || 0) + Number(character.backgroundAbilityIncreases?.[abilityId] || 0);
    const next = clamp(current + delta, 0, 2);

    if (next === current) {
      return;
    }

    if (delta > 0 && total >= 2) {
      return;
    }

    if (beforeLevel4 + next > 20) {
      return;
    }

    updateCharacter({ level4AbilityIncreases: { [abilityId]: next } });
    render();
  }

  function wouldExceedPointBuy(abilityId, nextScore) {
    const nextAbilities = {
      ...character.baseAbilities,
      [abilityId]: nextScore,
    };
    return creationEngine.getPointBuyStatus({ ...character, baseAbilities: nextAbilities }).spent > 27;
  }

  function renderRuleChoices() {
    const wrapper = document.createElement("div");
    wrapper.className = "section-stack";
    const choices = getChoiceStatus(character);

    if (!choices.length) {
      const panel = document.createElement("div");
      panel.className = "panel";
      panel.innerHTML = "<p>No hay elecciones pendientes para las opciones actuales.</p>";
      return panel;
    }

    choices.forEach((choice) => {
      const section = document.createElement("section");
      section.className = "choice-section";
      section.innerHTML = `
        <div>
          <h3>${choice.label || choice.id}</h3>
          <p>${choiceInstruction(choice, character)}</p>
        </div>
      `;

      const grid = document.createElement("div");
      grid.className = "choice-grid";

      const options = sortChoiceOptions(choice);

      if (!options.length) {
        section.append(emptyPanel(`Completa primero: ${choice.requiresChoiceLabel || "la eleccion anterior"}.`));
        wrapper.append(section);
        return;
      }

      options.forEach((option) => {
        const button = document.createElement("button");
        const selected = choice.selected.includes(option);
        const spell = spellChoiceCardData(choice, option);
        button.type = "button";
        button.className = selected ? "choice-card is-selected" : "choice-card";
        button.setAttribute("aria-pressed", selected ? "true" : "false");
        button.innerHTML = `
          <span class="choice-card-mode">${displayValue(choice.type)}</span>
          <strong>${spell?.name || displayChoiceOption(choice, option)}</strong>
          ${spell ? `<small class="choice-card-detail">${spell.detail}</small>` : ""}
          <span>${selected ? selectedChoiceLabel(choice, character) : availableChoiceLabel(choice, character)}</span>
        `;
        button.addEventListener("click", () => toggleRuleChoice(choice, option));
        grid.append(button);
      });

      section.append(grid);
      wrapper.append(section);
    });

    return wrapper;
  }

  function toggleRuleChoice(choice, option) {
    const selections = character.choiceSelections || {};
    const current = selections[choice.id] || [];
    const selected = current.includes(option);
    const next = selected
      ? current.filter((item) => item !== option)
      : current.length < choice.count
        ? [...current, option]
        : [...current.slice(1), option];

    updateCharacter({
      choiceSelections: {
        [choice.id]: next,
      },
    });
    render();
  }

  function renderStepActions(currentStepId) {
    const actions = document.createElement("div");
    actions.className = "creator-actions";
    const previousStep = creationEngine.getPreviousStep(currentStepId);
    const nextStep = creationEngine.getNextStep(currentStepId);

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "button secondary-button";
    resetButton.textContent = "Reiniciar";
    resetButton.addEventListener("click", () => {
      resetCharacter();
      activeStepId = "class";
      render();
    });

    actions.append(resetButton);

    if (previousStep) {
      actions.append(actionButton("Anterior", () => {
        activeStepId = previousStep.id;
        render();
      }));
    }

    if (nextStep) {
      actions.append(actionButton("Siguiente", () => {
        activeStepId = nextStep.id;
        render();
      }));
    }

    return actions;
  }

  return page;
}

function renderSpellSlotsPanel(derived) {
  const panel = document.createElement("section");
  panel.className = "spell-slot-panel";
  const entries = derived.spellcasting.slotEntries || [];
  const slotMarkup = entries.length
    ? entries.map((entry) => `
      <li>
        <span>Nivel ${entry.level}</span>
        <strong>${entry.count} espacio${entry.count === 1 ? "" : "s"}</strong>
      </li>
    `).join("")
    : "<li><span>Espacios</span><strong>Sin espacios propios</strong></li>";

  panel.innerHTML = `
    <div>
      <span>Magia</span>
      <h3>Espacios de conjuro</h3>
    </div>
    <ul class="spell-slot-list">
      ${slotMarkup}
    </ul>
    <p>Cuando lanzas un conjuro de nivel 1 o superior, marca un espacio de conjuro del mismo nivel o superior. Los trucos no consumen espacios.</p>
  `;

  return panel;
}

function choiceSection({ title, helper, content }) {
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
    "alchemist": "frascos, reactivos y manchas de laboratorio como detalles visibles",
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
    "glory-oath": "brillo heroico y simbolos de grandeza publica",
    "gloom-stalker": "capas oscuras, mirada alerta y presencia de emboscada",
    "glamour-college": "belleza feerica y presencia magnetica",
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
    "stars-circle": "constelaciones, mapas celestes y brillo astral",
    "soulknife": "destellos psiquicos alrededor de las manos",
    "shadow-warrior": "sombras cenidas al cuerpo y movimiento silencioso",
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

function originChoiceGrid({ type, items, selectedIds = [], onSelect }) {
  const grid = document.createElement("div");
  grid.className = "choice-grid origin-guide-grid";
  grid.append(...items.map((item) => originChoiceCard({
    type,
    item,
    selected: selectedIds.includes(item.id),
    onSelect,
  })));
  return grid;
}

function originChoiceCard({ type, item, selected, onSelect }) {
  const card = document.createElement("article");
  card.className = selected ? "origin-guide-card is-selected" : "origin-guide-card";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "origin-guide-select";
  button.setAttribute("aria-pressed", selected ? "true" : "false");
  button.innerHTML = `
    <span class="choice-card-mode">${type === "background" ? "Trasfondo" : "Especie"}</span>
    <strong>${displayName(item)}</strong>
    <span>${item.summary || "Preparado para reglas futuras."}</span>
  `;

  const helpButton = document.createElement("button");
  helpButton.type = "button";
  helpButton.className = "origin-guide-help";
  helpButton.setAttribute("aria-label", `Ver detalle de ${displayName(item)}`);
  helpButton.textContent = "?";

  let longPressTimer = 0;
  let ignoreNextSelect = false;

  button.addEventListener("click", () => {
    if (ignoreNextSelect) {
      ignoreNextSelect = false;
      return;
    }

    onSelect(item.id);
  });

  card.addEventListener("mouseenter", () => {
    if (canHover()) {
      showOriginGuidePopover({ anchor: card, type, item });
    }
  });

  card.addEventListener("mouseleave", () => {
    if (canHover()) {
      hideOriginGuidePopover();
    }
  });

  card.addEventListener("pointerdown", () => {
    if (canHover()) {
      return;
    }

    longPressTimer = window.setTimeout(() => {
      ignoreNextSelect = true;
      showOriginGuidePopover({ anchor: card, type, item });
    }, 520);
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    card.addEventListener(eventName, () => {
      window.clearTimeout(longPressTimer);
    });
  });

  helpButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showOriginGuidePopover({ anchor: card, type, item });
  });
  helpButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  card.append(button, helpButton);
  return card;
}

function showOriginGuidePopover({ anchor, type, item }) {
  hideOriginGuidePopover();

  const popover = document.createElement("aside");
  popover.className = "origin-guide-popover";
  popover.setAttribute("role", "tooltip");
  popover.innerHTML = `
    <div class="origin-guide-popover-header">
      <span>${type === "background" ? "Detalle de trasfondo" : "Detalle de especie"}</span>
      <strong>${displayName(item)}</strong>
    </div>
    <dl>
      ${originGuideRows(type, item).map(([label, value]) => `
        <div>
          <dt>${label}</dt>
          <dd>${value}</dd>
        </div>
      `).join("")}
    </dl>
  `;

  document.body.append(popover);
  positionOriginGuidePopover(popover, anchor);

  window.setTimeout(() => {
    document.addEventListener("pointerdown", dismissOriginGuidePopover, true);
    window.addEventListener("scroll", hideOriginGuidePopover, true);
    window.addEventListener("resize", hideOriginGuidePopover);
  }, 0);
}

function positionOriginGuidePopover(popover, anchor) {
  const margin = 16;
  const gap = 12;
  const anchorRect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxWidth = Math.min(360, viewportWidth - margin * 2);

  popover.style.width = `${maxWidth}px`;
  const popoverRect = popover.getBoundingClientRect();
  const placeBelow = anchorRect.bottom + gap + popoverRect.height < viewportHeight - margin;
  const placeRight = anchorRect.right + gap + maxWidth < viewportWidth - margin;
  const placeLeft = anchorRect.left - gap - maxWidth > margin;

  let left = (viewportWidth - maxWidth) / 2;
  let top = placeBelow ? anchorRect.bottom + gap : anchorRect.top - gap - popoverRect.height;

  if (viewportWidth > 760) {
    left = placeRight ? anchorRect.right + gap : placeLeft ? anchorRect.left - gap - maxWidth : anchorRect.left;
    top = anchorRect.top;
  }

  popover.style.left = `${clamp(left, margin, viewportWidth - maxWidth - margin)}px`;
  popover.style.top = `${clamp(top, margin, viewportHeight - popoverRect.height - margin)}px`;
}

function dismissOriginGuidePopover(event) {
  if (!event.target.closest(".origin-guide-popover, .origin-guide-card")) {
    hideOriginGuidePopover();
  }
}

function hideOriginGuidePopover() {
  document.querySelectorAll(".origin-guide-popover").forEach((popover) => popover.remove());
  document.removeEventListener("pointerdown", dismissOriginGuidePopover, true);
  window.removeEventListener("scroll", hideOriginGuidePopover, true);
  window.removeEventListener("resize", hideOriginGuidePopover);
}

function canHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function originGuideRows(type, item) {
  if (type === "background") {
    return [
      ["Sube", formatValueList(item.abilityOptions)],
      ["Dote", displayValue(item.grants?.featId)],
      ["Competencias", formatValueList(item.grants?.skills)],
      ["Herramienta", formatBackgroundTool(item)],
      ["Equipo", formatEquipmentList(item.grants?.equipment)],
      ["Ideal para", item.guide?.advice || "personajes que aprovechan sus competencias y equipo inicial."],
    ];
  }

  return [
    ["Tamano", displayValue(item.size)],
    ["Velocidad", `${item.speed} pies`],
    ["Idiomas", formatValueList(item.languages)],
    ["Rasgos", formatTraitList(item.grants?.traits)],
    ["Opciones", formatChoiceList(item.choices)],
    ["Ideal para", item.guide?.advice || "personajes que quieren apoyarse en estos rasgos de especie."],
  ];
}

function formatValueList(values) {
  return (values || []).map(displayValue).join(", ") || "No aplica";
}

function formatTraitList(traits) {
  return (traits || []).map((trait) => trait.label || trait.name).join(", ") || "No aplica";
}

function formatChoiceList(choices) {
  const visibleChoices = (choices || []).filter((choice) => !choice.id.endsWith("-languages"));
  return visibleChoices.map((choice) => choice.label || choice.id).join(", ") || "Idiomas de origen";
}

function formatBackgroundTool(background) {
  const fixedTool = background.grants?.tool;

  if (fixedTool && !fixedTool.endsWith("-choice")) {
    return displayValue(fixedTool);
  }

  const choice = background.choices?.find((item) => item.type?.toLowerCase().includes("tool")
    || item.type === "gamingSet"
    || item.type === "musicalInstrument");
  return choice?.label || "Herramienta a eleccion";
}

function formatEquipmentList(itemIds) {
  const labels = (itemIds || []).map((itemId) => displayName(creationEngine.getEquipment(itemId) || itemId));
  return labels.length ? labels.join(", ") : "No aplica";
}

function equipmentOptionGrid({ options, selectedId, onSelect }) {
  const grid = document.createElement("div");
  grid.className = "choice-grid";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = selectedId === option.id ? "choice-card is-selected" : "choice-card";
    button.setAttribute("aria-pressed", selectedId === option.id ? "true" : "false");
    button.innerHTML = `
      <span class="choice-card-mode">Paquete</span>
      <strong>${option.label || option.name}</strong>
      <span>${option.summary || "Elige este paquete inicial."}</span>
    `;
    button.addEventListener("click", () => onSelect(option.id));
    grid.append(button);
  });

  return grid;
}

function emptyPanel(text) {
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `<p>${text}</p>`;
  return panel;
}

function resetAbilityIncreases() {
  return {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  };
}

function level4Summary(character) {
  if (character.level4Mode === "abilities") {
    const entries = Object.entries(character.level4AbilityIncreases || {})
      .filter(([, value]) => Number(value) > 0)
      .map(([ability, value]) => `${displayValue(ability)} +${value}`);
    return entries.length ? entries.join(", ") : "Pendiente";
  }

  if (character.level4Mode === "feat") {
    return character.level4FeatId ? displayValue(character.level4FeatId) : "Pendiente";
  }

  return "Pendiente";
}

function choiceInstruction(choice, character) {
  const base = `Elige ${choice.count}. Faltan ${choice.remaining}.`;

  if (choice.type !== "spell") {
    return base;
  }

  if (["cleric", "druid"].includes(character.classId)) {
    return `${base} Estos son los conjuros preparados para hoy; puedes cambiarlos al terminar un descanso largo. Los siempre preparados no cuentan contra este limite.`;
  }

  if (character.classId === "wizard") {
    return `${base} El Mago prepara desde su grimorio; al cambiar el grimorio cambia esta lista.`;
  }

  return base;
}

function selectedChoiceLabel(choice, character) {
  if (choice.type === "spell" && ["cleric", "druid"].includes(character.classId)) {
    return "Preparado hoy";
  }

  if (choice.type === "spell" && character.classId === "wizard") {
    return "Preparado desde grimorio";
  }

  return "Seleccionado";
}

function availableChoiceLabel(choice, character) {
  if (choice.type === "spell" && ["cleric", "druid"].includes(character.classId)) {
    return "Disponible para preparar";
  }

  if (choice.type === "spell" && character.classId === "wizard") {
    return "En fuente permitida";
  }

  return "Disponible";
}

function spellChoiceCardData(choice, option) {
  if (!["cantrip", "spell", "spellbook"].includes(choice.type)) {
    return null;
  }

  const spell = resolveSpell(option);
  const detail = getSpellSheetDetail(spell?.id || option);

  if (!spell) {
    return {
      name: detail?.label || displayChoiceOption(choice, option),
      detail: "Nivel por confirmar",
    };
  }

  return {
    name: detail?.label || displayValue(spell.id) || displayName(spell),
    detail: [
      spell.level === 0 ? "Truco" : `Nivel ${spell.level}`,
      spellSchoolLabel(spell.school),
      formatSpellTiming(spell.castingTime),
      formatSpellTiming(spell.range),
    ].filter(Boolean).join(" | "),
  };
}

function spellSchoolLabel(school) {
  const labels = {
    Abjuration: "Abjuracion",
    Conjuration: "Conjuracion",
    Divination: "Adivinacion",
    Enchantment: "Encantamiento",
    Evocation: "Evocacion",
    Illusion: "Ilusion",
    Necromancy: "Nigromancia",
    Transmutation: "Transmutacion",
  };

  return labels[school] || displayValue(school);
}

function formatSpellTiming(value) {
  return String(value || "")
    .replace(/1 bonus action|bonus action/gi, "accion adicional")
    .replace(/1 reaction|reaction/gi, "reaccion")
    .replace(/1 action|action/gi, "accion")
    .replace(/self/gi, "personal")
    .replace(/touch/gi, "toque")
    .replace(/feet/gi, "pies")
    .replace(/foot/gi, "pie")
    .toLowerCase();
}

function clampPointBuyAbilities(abilities) {
  return Object.fromEntries(Object.entries(abilities).map(([ability, score]) => [
    ability,
    clamp(Number(score), 8, 15),
  ]));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function actionButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function selectField({ label, value, placeholder, items, onChange }) {
  const field = document.createElement("label");
  field.className = "field";
  field.innerHTML = `
    <span>${label}</span>
    <select>
      <option value="">${placeholder}</option>
    </select>
  `;

  const select = field.querySelector("select");
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = displayName(item);
    select.append(option);
  });
  select.value = value;
  select.addEventListener("change", () => onChange(select.value));

  return field;
}

function magicItemSelect({ label, value, rarity, onChange }) {
  const field = document.createElement("label");
  field.className = "field";
  field.innerHTML = `
    <span>${label}</span>
    <select>
      <option value="">Confirmar con DM</option>
    </select>
    <small>Rareza: ${rarity === "Common" ? "comun" : "poco comun"}.</small>
  `;

  const select = field.querySelector("select");
  creationEngine.getMagicItemsByRarity(rarity).forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${displayName(item)}${item.requiresAttunement ? " (sintonia)" : ""}`;
    select.append(option);
  });
  select.value = value;
  select.addEventListener("change", () => onChange(select.value));

  return field;
}

function coinCalculationText(derived) {
  if (!derived.higherLevelGold.complete) {
    return `Suma paquetes iniciales y equipo avanzado: ${derived.higherLevelGold.formula}.`;
  }

  const purchase = derived.equipmentPurchase;
  const spent = purchase?.spentCopper ? purchase.costText : "0 PO";
  const overspent = purchase?.hasOverspent ? ` Gasto excedido por ${purchase.overspentText}.` : "";
  return `Oro inicial ${derived.startingCoinText}; equipo adicional -${spent}.${overspent}`;
}
