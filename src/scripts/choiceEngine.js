import { classProgression, subclassProgression } from "../data/rules/index.js";
import { bardCollegeSpellsLevel5 } from "../data/rules/spellcasting/bardLists.js";
import { clericDomainSpellsLevel5 } from "../data/rules/spellcasting/clericLists.js";
import { druidCircleSpellsLevel5 } from "../data/rules/spellcasting/druidLists.js";
import { paladinOathSpellsLevel5 } from "../data/rules/spellcasting/paladinLists.js";
import { rangerSubclassSpellsLevel5 } from "../data/rules/spellcasting/rangerLists.js";
import { sorcererSubclassSpellsLevel5 } from "../data/rules/spellcasting/sorcererLists.js";
import { warlockPatronCantripsLevel5, warlockPatronSpellsLevel5 } from "../data/rules/spellcasting/warlockLists.js";
import { artificerSubclassSpellsLevel5 } from "../data/rules/spellcasting/artificerLists.js";
import { creationEngine } from "./creationEngine.js";
import { contentEngine } from "./contentEngine.js";
import { resolveSpell } from "./sortUtils.js";

const spellChoiceTypes = new Set(["cantrip", "spell", "spellbook"]);

export function getActiveChoices(character) {
  const level = 5;
  const classData = contentEngine.getClass(character.classId);
  const subclassData = contentEngine.getSubclass(character.subclassId);
  const speciesData = creationEngine.getSpecies(character.speciesId);
  const backgroundData = creationEngine.getBackground(character.backgroundId);
  const feats = creationEngine.getGrantedFeats(character)
    .map((featId) => creationEngine.getFeat(featId))
    .filter(Boolean);
  const classFeatures = getFeatureChoices(classProgression[character.classId]?.levels || [], level);
  const subclassFeatures = getFeatureChoices(subclassProgression[character.subclassId]?.levels || [], level);

  return [
    ...choicesFrom(classData, "class"),
    ...choicesFrom(subclassData, "subclass"),
    ...choicesFrom(speciesData, "species"),
    ...choicesFrom(backgroundData, "background"),
    ...feats.flatMap((feat) => choicesFrom(feat, "feat")),
    ...classFeatures,
    ...subclassFeatures,
  ];
}

export function getChoiceStatus(character) {
  const choices = getActiveChoices(character);
  const selections = character.choiceSelections || {};

  return choices.map((choice) => {
    const resolvedChoice = resolveChoiceForCharacter(choice, selections, character);
    const hasSourceList = Array.isArray(resolvedChoice.from);
    const available = new Set(resolvedChoice.from || []);
    const selected = (selections[resolvedChoice.id] || [])
      .map((option) => normalizeChoiceSelection(option, resolvedChoice))
      .filter((option) => !hasSourceList || available.has(option));

    return {
      ...resolvedChoice,
      selected,
      remaining: Math.max(0, resolvedChoice.count - selected.length),
      complete: selected.length === resolvedChoice.count,
    };
  });
}

function normalizeChoiceSelection(option, choice) {
  if (!spellChoiceTypes.has(choice.type)) {
    return option;
  }

  return resolveSpell(option)?.id || option;
}

export function getPendingChoices(character) {
  return getChoiceStatus(character).filter((choice) => !choice.complete);
}

export function choiceSelectionsToEffects(character) {
  const status = getChoiceStatus(character);

  return status.flatMap((choice) => {
    if (!choice.selected.length) {
      return [];
    }

    if (choice.type === "skill") {
      return [{ type: "proficiency.skill", items: choice.selected }];
    }

    if (choice.type === "expertise") {
      return [{ type: "proficiency.expertise", items: choice.selected }];
    }

    if (choice.type === "language") {
      return [{ type: "language.grant", languages: choice.selected }];
    }

    if (choice.type === "equipment") {
      return [{ type: "equipment.grant", items: choice.selected }];
    }

    if (choice.type === "tool") {
      return [{ type: "proficiency.tool", items: choice.selected }];
    }

    if (["artisanTool", "gamingSet", "musicalInstrument"].includes(choice.type)) {
      return [{ type: "proficiency.tool", items: choice.selected }];
    }

    if (choice.type === "feat") {
      return choice.selected.map((featId) => ({ type: "feat.grant", featId }));
    }

    if (choice.type === "speciesSize") {
      return [{ type: "size.set", value: choice.selected[0] }];
    }

    if (choice.type === "beastCompanion") {
      return [{ type: "trait.grant", items: choice.selected.map((option) => `Companero primal: ${option}`) }];
    }

    if (choice.type === "metamagic") {
      return [{ type: "trait.grant", items: choice.selected.map((option) => `Metamagia: ${choice.optionLabels?.[option] || option}`) }];
    }

    if (choice.type === "magicItemPlan") {
      return [{ type: "trait.grant", items: choice.selected.map((option) => `Plan de objeto magico: ${choice.optionLabels?.[option] || option}`) }];
    }

    if (choice.type === "magicItemCreated") {
      return [{ type: "trait.grant", items: choice.selected.map((option) => `Objeto replicado: ${choice.optionLabels?.[option] || option}`) }];
    }

    if (choice.type === "armorModel") {
      return artificerArmorModelEffects(choice.selected[0]);
    }

    if (choice.type === "invocation") {
      return warlockInvocationEffects(choice.selected, choice.optionLabels || {});
    }

    if (choice.type === "hunterPrey") {
      return [{ type: "trait.grant", items: choice.selected.map((option) => `Presa del cazador: ${option}`) }];
    }

    if (choice.type === "landType") {
      const spells = druidCircleSpellsLevel5[`land-${choice.selected[0]}`] || [];
      return spells.length ? [{ type: "spell.choice", spells, spellKind: "alwaysPrepared" }] : [];
    }

    if (choice.id === "warlock-pact-tome-ritual-choice") {
      return [{ type: "spell.choice", spells: choice.selected, spellKind: "alwaysPrepared" }];
    }

    if (choice.type === "spell" || choice.type === "cantrip" || choice.type === "spellbook") {
      return [{ type: "spell.choice", spells: choice.selected, spellKind: choice.type }];
    }

    if (choice.type === "divineOrder") {
      if (choice.selected[0] === "protector") {
        return [
          { type: "proficiency.armor", items: ["Heavy"] },
          { type: "proficiency.weapon", items: ["Martial weapons"] },
        ];
      }

      if (choice.selected[0] === "thaumaturge") {
        return [{ type: "trait.grant", items: ["Taumaturgo: bono a Arcanos o Religion igual a Sabiduria, minimo +1."] }];
      }
    }

    if (choice.type === "primalOrder") {
      if (choice.selected[0] === "warden") {
        return [
          { type: "proficiency.armor", items: ["Medium"] },
          { type: "proficiency.weapon", items: ["Martial weapons"] },
        ];
      }

      if (choice.selected[0] === "magician") {
        return [{ type: "trait.grant", items: ["Magico: bono a Arcanos o Naturaleza igual a Sabiduria, minimo +1."] }];
      }
    }

    return [];
  });
}

function choicesFrom(source, sourceType) {
  return (source?.choices || []).map((choice) => ({
    ...choice,
    sourceType,
  }));
}

function resolveChoiceForCharacter(choice, selections, character) {
  if (character.classId === "wizard" && choice.id === "wizard-prepared-spell-choice") {
    const spellbook = selections["wizard-spellbook-choice"] || [];

    return {
      ...choice,
      from: spellbook,
      requiresChoiceLabel: "Grimorio de Mago",
    };
  }

  if (character.classId === "cleric" && choice.id === "cleric-cantrip-choice") {
    const divineOrder = selections["cleric-divine-order-choice"] || [];

    return {
      ...choice,
      count: divineOrder.includes("thaumaturge") ? 5 : 4,
    };
  }

  if (character.classId === "cleric" && choice.id === "cleric-prepared-spell-choice") {
    const alwaysPrepared = new Set(clericDomainSpellsLevel5[character.subclassId] || []);

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysPrepared.has(spellId)),
    };
  }

  if (character.classId === "bard" && choice.id === "bard-prepared-spell-choice") {
    const alwaysPrepared = new Set(bardCollegeSpellsLevel5[character.subclassId] || []);

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysPrepared.has(spellId)),
    };
  }

  if (character.classId === "druid" && choice.id === "druid-cantrip-choice") {
    const primalOrder = selections["druid-primal-order-choice"] || [];

    return {
      ...choice,
      count: primalOrder.includes("magician") ? 4 : 3,
    };
  }

  if (character.classId === "druid" && choice.id === "druid-prepared-spell-choice") {
    const alwaysPrepared = new Set(getDruidAlwaysPreparedSpells(character, selections));

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysPrepared.has(spellId)),
    };
  }

  if (character.classId === "paladin" && choice.id === "paladin-prepared-spell-choice") {
    const alwaysPrepared = new Set(getPaladinAlwaysPreparedSpells(character));

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysPrepared.has(spellId)),
    };
  }

  if (character.classId === "paladin" && choice.id === "paladin-blessed-warrior-cantrip-choice") {
    const fightingStyle = selections["paladin-fighting-style-choice"] || [];
    const enabled = fightingStyle.includes("blessed-warrior");

    return {
      ...choice,
      count: enabled ? 2 : 0,
      from: enabled ? choice.from : [],
    };
  }

  if (character.classId === "ranger" && choice.id === "ranger-prepared-spell-choice") {
    const alwaysPrepared = new Set(getRangerAlwaysPreparedSpells(character));

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysPrepared.has(spellId)),
    };
  }

  if (character.classId === "ranger" && choice.id === "ranger-druidic-warrior-cantrip-choice") {
    const fightingStyle = selections["ranger-fighting-style-choice"] || [];
    const enabled = fightingStyle.includes("druidic-warrior");

    return {
      ...choice,
      count: enabled ? 2 : 0,
      from: enabled ? choice.from : [],
    };
  }

  if (character.classId === "sorcerer" && choice.id === "sorcerer-prepared-spell-choice") {
    const alwaysPrepared = new Set(getSorcererAlwaysPreparedSpells(character));

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysPrepared.has(spellId)),
    };
  }

  if (character.classId === "sorcerer" && choice.id === "sorcerer-cantrip-choice") {
    const alwaysCantrips = new Set(getSorcererAlwaysCantrips(character));

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysCantrips.has(spellId)),
    };
  }

  if (character.classId === "warlock" && choice.id === "warlock-prepared-spell-choice") {
    const alwaysPrepared = new Set(getWarlockAlwaysPreparedSpells(character));

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysPrepared.has(spellId)),
    };
  }

  if (character.classId === "warlock" && choice.id === "warlock-cantrip-choice") {
    const alwaysCantrips = new Set(getWarlockAlwaysCantrips(character));

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysCantrips.has(spellId)),
    };
  }

  if (character.classId === "warlock" && choice.id === "warlock-pact-tome-cantrip-choice") {
    const invocations = selections["warlock-invocation-choice"] || [];
    const enabled = invocations.includes("pact-of-the-tome");
    const knownCantrips = new Set([
      ...(selections["warlock-cantrip-choice"] || []),
      ...getWarlockAlwaysCantrips(character),
    ]);

    return {
      ...choice,
      count: enabled ? 3 : 0,
      from: enabled ? (choice.from || []).filter((spellId) => !knownCantrips.has(spellId)) : [],
    };
  }

  if (character.classId === "warlock" && choice.id === "warlock-pact-tome-ritual-choice") {
    const invocations = selections["warlock-invocation-choice"] || [];
    const enabled = invocations.includes("pact-of-the-tome");

    return {
      ...choice,
      count: enabled ? 2 : 0,
      from: enabled ? choice.from : [],
    };
  }

  if (character.classId === "artificer" && choice.id === "artificer-prepared-spell-choice") {
    const alwaysPrepared = new Set(getArtificerAlwaysPreparedSpells(character));

    return {
      ...choice,
      from: (choice.from || []).filter((spellId) => !alwaysPrepared.has(spellId)),
    };
  }

  if (character.classId === "artificer" && choice.id === "artificer-created-magic-item-choice") {
    const knownPlans = selections["artificer-magic-item-plan-choice"] || [];

    return {
      ...choice,
      count: knownPlans.length ? Math.min(2, knownPlans.length) : 0,
      from: knownPlans,
    };
  }

  return choice;
}

function getDruidAlwaysPreparedSpells(character, selections) {
  if (character.subclassId === "land-circle") {
    const landType = selections["land-circle-type-choice"]?.[0];
    return landType ? druidCircleSpellsLevel5[`land-${landType}`] || [] : [];
  }

  return druidCircleSpellsLevel5[character.subclassId] || [];
}

function getPaladinAlwaysPreparedSpells(character) {
  return [
    "divine-smite",
    "find-steed",
    ...(paladinOathSpellsLevel5[character.subclassId] || []),
  ];
}

function getRangerAlwaysPreparedSpells(character) {
  return [
    "hunters-mark",
    ...(rangerSubclassSpellsLevel5[character.subclassId] || []),
  ];
}

function getSorcererAlwaysPreparedSpells(character) {
  return [
    ...(sorcererSubclassSpellsLevel5[character.subclassId]?.spells || []),
  ];
}

function getSorcererAlwaysCantrips(character) {
  return [
    ...(sorcererSubclassSpellsLevel5[character.subclassId]?.cantrips || []),
  ];
}

function getWarlockAlwaysPreparedSpells(character) {
  return [
    ...(warlockPatronSpellsLevel5[character.subclassId] || []),
  ];
}

function getWarlockAlwaysCantrips(character) {
  return [
    ...(warlockPatronCantripsLevel5[character.subclassId] || []),
  ];
}

function getArtificerAlwaysPreparedSpells(character) {
  return [
    ...(artificerSubclassSpellsLevel5[character.subclassId] || []),
  ];
}

function artificerArmorModelEffects(model) {
  if (model === "dreadnaught") {
    return [
      { type: "equipment.grant", items: ["armor-flail"] },
      { type: "trait.grant", items: ["Modelo Acorazado: mangual de armadura, estatura gigante y empujar/atraer criaturas con el golpe."] },
    ];
  }

  if (model === "guardian") {
    return [
      { type: "equipment.grant", items: ["thunder-gauntlets"] },
      { type: "trait.grant", items: ["Modelo Guardian: guanteletes atronadores y campo defensivo con PG temporales mientras estas maltrecho."] },
    ];
  }

  if (model === "infiltrator") {
    return [
      { type: "equipment.grant", items: ["lightning-launcher"] },
      { type: "trait.grant", items: ["Modelo Infiltrador: lanzador relampago, +5 pies velocidad y ventaja en Sigilo; cancela desventaja de armadura."] },
    ];
  }

  return [];
}

function warlockInvocationEffects(selected, optionLabels) {
  const effects = [];
  const traits = selected.map((option) => `Invocacion: ${optionLabels[option] || option}`);

  if (selected.includes("pact-of-the-chain")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["find-familiar"] });
    traits.push("Pacto de la cadena: Encontrar familiar sin espacio como accion de Magia; familiar puede usar formas especiales.");
  }

  if (selected.includes("pact-of-the-blade")) {
    traits.push("Pacto de la hoja: accion adicional para conjurar o vincular arma; eres competente, sirve como foco y puedes atacar/danar con Carisma.");
  }

  if (selected.includes("pact-of-the-tome")) {
    traits.push("Pacto del tomo: Libro de sombras; elige 3 trucos y 2 rituales de nivel 1, preparados mientras lleves el libro.");
  }

  if (selected.includes("armor-of-shadows")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["mage-armor"] });
  }

  if (selected.includes("fiendish-vigor")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["false-life"] });
  }

  if (selected.includes("mask-of-many-faces")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["disguise-self"] });
  }

  if (selected.includes("misty-visions")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["silent-image"] });
  }

  if (selected.includes("otherworldly-leap")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["jump"] });
  }

  if (selected.includes("ascendant-step")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["levitate"] });
  }

  if (selected.includes("master-of-myriad-forms")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["alter-self"] });
  }

  if (selected.includes("one-with-shadows")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["invisibility"] });
  }

  if (selected.includes("gift-of-the-depths")) {
    effects.push({ type: "spell.choice", spellKind: "alwaysPrepared", spells: ["water-breathing"] });
    traits.push("Don de las profundidades: respiras bajo el agua y ganas velocidad de nado igual a tu Velocidad.");
  }

  effects.push({ type: "trait.grant", items: traits });
  return effects;
}

function getFeatureChoices(levels, characterLevel) {
  return levels
    .filter((entry) => entry.level <= characterLevel)
    .flatMap((entry) => entry.features || [])
    .flatMap((feature) => choicesFrom(feature, "feature"));
}

