import { abilityLabels } from "../data/character/abilityScores.js";
import { spells } from "../data/rules/index.js";
import { displayList, displayName, displayValue } from "./displayLabels.js";
import { rulesEngine } from "./rulesEngine.js";
import { getSpellSheetDetail } from "./spellSheetDetails.js";
import { compareSpellLevelThenName, resolveSpell } from "./sortUtils.js";

const spellIndex = Object.fromEntries(spells.map((spell) => [spell.id, spell]));

export function mapCharacterToSheet(character) {
  return mapCharacterToSheetSections(character).flatMap((section) => section.fields);
}

export function mapCharacterToSheetSections(character) {
  const derived = rulesEngine.deriveCharacter(character);

  return [
    sheetSection("Página 1 - Identidad", [
      sheetField("clase nivel", `${displayName(derived.classData) || "Pendiente"} ${derived.level}`, "La creación está fijada para nivel 5."),
      sheetField("subclase", displayName(derived.subclassData) || "Pendiente", "Copia la subclase elegida."),
      sheetField("especie", displayName(derived.speciesData) || "Pendiente", "Copia la especie elegida."),
      sheetField("trasfondo", displayName(derived.backgroundData) || "Pendiente", "Copia el trasfondo elegido."),
      sheetField("px", "0 o lo que indique la mesa", "Si la mesa usa avance por hitos, puedes dejarlo en blanco o anotar 0."),
    ]),
    sheetSection("Página 1 - Combate y supervivencia", [
      sheetField("BONIFICADOR POR COMPETENCIA", signed(derived.proficiencyBonus), "Nivel 5 usa +3."),
      sheetField("CLASE DE ARMADURA", derived.armorClass, derived.armorClassFormula),
      sheetField("PUNTOS DE GOLPE max.", derived.hitPointMaximum, derived.hitPointFormula),
      sheetField("PUNTOS DE GOLPE actuales", derived.hitPointMaximum, "Al comenzar la sesión normalmente coincide con el máximo."),
      sheetField("PUNTOS DE GOLPE temp.", 0, "Empieza en 0 salvo que un rasgo o conjuro indique otra cosa."),
      sheetField("DADOS DE GOLPE", `${derived.level}d${derived.hitDie}`, "Anota un dado de golpe por nivel."),
      sheetField("INICIATIVA", signed(derived.abilityModifiers.dexterity), "Usa el modificador de Destreza."),
      sheetField("TAMAÑO", derived.size, "Proviene de la especie."),
      sheetField("VELOCIDAD", `${derived.speed} pies`, "Proviene de la especie, antes de bonos situacionales."),
      sheetField("INSPIRACION HEROICA", "Sin marcar", "Se marca solo si la mesa te la concede."),
      sheetField("SALVACIONES CONTRA MUERTE", "Sin marcar", "Se llenan durante la sesión si el personaje cae a 0 PG."),
    ]),
    sheetSection("Página 1 - Atributos", Object.entries(derived.abilities).map(([ability, score]) =>
      sheetField(
        displayValue(abilityLabels[ability]),
        `${score} (${signed(derived.abilityModifiers[ability])})`,
        "Escribe la puntuacion y el modificador.",
      ),
    )),
    sheetSection("Página 1 - Salvaciones y habilidades", [
      sheetField("Tiradas de salvación", derived.savingThrows.length ? displayList(derived.savingThrows) : "Pendiente", "Marca estas salvaciones como competentes."),
      sheetField("Habilidades", derived.skills.length ? displayList(derived.skills) : "Pendiente", "Marca o anota las habilidades otorgadas por el trasfondo."),
      sheetField("Pericias", derived.expertise.length ? displayList(derived.expertise) : "Ninguna por ahora", "Marca doble competencia en las habilidades elegidas como pericia."),
      sheetField("PERCEPCION PASIVA", derived.passivePerception, "Base 10 + modificador de Sabiduría, antes de competencias o bonos."),
    ]),
    sheetSection("Página 1 - Entrenamiento y competencias", [
      sheetField("herramientas", derived.tools.length ? derived.tools : "Ninguna por ahora", "Copia las competencias con herramientas disponibles."),
      sheetField("armas", derived.weaponTraining.length ? displayList(derived.weaponTraining) : "Pendiente", "Copia el entrenamiento con armas de la clase."),
      sheetField("entrenamiento con armaduras", derived.armorTraining.length ? displayList(derived.armorTraining) : "Ninguno", "Marca ligeras, medias, pesadas y escudos según corresponda."),
    ]),
    sheetSection("Página 1 - Dotes", [
      sheetField("DOTES", derived.grantedFeats.length ? derived.grantedFeats.map(sheetText) : "Pendiente", "Copia aquí las dotes obtenidas por trasfondo u otras elecciónes."),
      sheetField("MEJORA DE NIVEL 4", level4SheetText(character, derived), "Si elegiste atributos, ya estan sumados en las puntuaciones. Si elegiste dote, copiala también en Dotes."),
    ]),
    sheetSection("Página 1 - Rasgos de clase", [
      sheetField("RASGOS DE CLASE", formatProgression(derived.classFeaturesByLevel), "Copia los rasgos acumulados de clase hasta nivel 5."),
      sheetField("Rasgos de subclase", formatProgression(derived.subclassFeaturesByLevel), "Copia también los rasgos de subclase disponibles."),
    ]),
    sheetSection("Página 1 - Atributos de especie", [
      sheetField("ATRIBUTOS DE ESPECIE", derived.speciesData?.grants?.traits?.length ? derived.speciesData.grants.traits.map(sheetText) : "Pendiente", "Copia los rasgos otorgados por la especie."),
    ]),
    sheetSection("Página 1 - Armas y trucos de daño", [
      sheetField("ARMAS Y TRUCOS DE DAÑO", attackOptions(derived), "Formato de la tabla: nombre | bonif. ataque/CD | daño y tipo | notas."),
    ]),
    sheetSection("Página 2 - Magia", [
      sheetField("Aptitud mágica", spellcastingAbility(derived), "Solo aplica si la clase o dote otorga lanzamiento de conjuros."),
      sheetField("MODIFICADOR POR APTITUD MÁGICA", spellcastingModifier(derived), "Calcula con la aptitud mágica correspondiente."),
      sheetField("CD DE SALVACIÓN DE CONJUROS", spellSaveDc(derived), "8 + competencia + modificador por aptitud mágica."),
      sheetField("BONIFICADOR DE ATAQUE DE CONJUROS", spellAttackBonus(derived), "Competencia + modificador por aptitud mágica."),
      sheetField("TRUCOS Y CONJUROS PREPARADOS", spellSelectionText(derived), spellSelectionExplanation(derived)),
      sheetField("GRIMORIO", spellbookText(derived), "Anota los conjuros que existen en el grimorio; solo los preparados se lanzan normalmente."),
      sheetField("ESPACIOS DE CONJURO", spellSlots(derived), "Marca un espacio del mismo nivel o superior al lanzar un conjuro de nivel 1 o superior. Los trucos no consumen espacios."),
      sheetField("REGLAS DE LANZAMIENTO", spellRuleText(derived), "Notas rápidas para lanzar conjuros en mesa."),
    ]),
    sheetSection("Página 2 - Equipo, monedas e idiomas", [
      sheetField("EQUIPO", derived.equipmentItems.length ? equipmentInventoryText(derived) : "Pendiente", "Copia inventario, focos, paquetes y objetos relevantes; los ataques ya van en la tabla de armas."),
      sheetField("MONEDAS", derived.higherLevelGold.complete ? derived.coinText : "Pendiente: tira 1d10 para oro de nivel 5", coinExplanation(derived)),
      sheetField("OBJETOS MÁGICOS", magicItemText(derived), "Copia nombre, rareza, sintonía y efecto corto de los objetos aprobados por el DM."),
      sheetField("IDIOMAS", derived.languages.length ? displayList(derived.languages) : "Pendiente", "Copia los idiomas otorgados por la especie y futuras elecciónes."),
    ]),
  ];
}

function sheetField(field, value, explanation) {
  return {
    field,
    value,
    explanation,
  };
}

function sheetSection(title, fields) {
  return {
    title,
    fields,
  };
}

function level4SheetText(character, derived) {
  if (character.level4Mode === "abilities") {
    const entries = Object.entries(character.level4AbilityIncreases || {})
      .filter(([, value]) => Number(value) > 0)
      .map(([ability, value]) => `${displayValue(abilityLabels[ability])} +${value}`);
    return entries.length ? entries.join(", ") : "Pendiente";
  }

  if (character.level4Mode === "feat") {
    const feat = derived.grantedFeats.find((item) => item.id === character.level4FeatId);
    return feat ? sheetText(feat) : "Pendiente";
  }

  return "Pendiente";
}

function signed(value) {
  return value >= 0 ? `+${value}` : String(value);
}

function formatProgression(entries) {
  if (!entries.length) {
    return "Pendiente";
  }

  return entries.flatMap((entry) =>
    entry.features.map((feature) => `Nivel ${entry.level}: ${sheetText(feature)}`),
  );
}

function attackOptions(derived) {
  const weapons = derived.equipmentItems.filter((item) => item.category === "weapon");

  if (!weapons.length && derived.classData?.id !== "monk") {
    return "Pendiente";
  }

  const options = [];

  if (derived.classData?.id === "monk") {
    const attackBonus = derived.proficiencyBonus + derived.abilityModifiers.dexterity;
    const focusDc = 8 + derived.proficiencyBonus + derived.abilityModifiers.wisdom;
    options.push(`Golpe sin armas | ${signed(attackBonus)} / CD ${focusDc} | 1d8${signed(derived.abilityModifiers.dexterity)} contundente | Artes marciales: acción adicional.`);
  }

  weapons.forEach((weapon) => {
    const monkWeapon = derived.classData?.id === "monk" && isMonkWeapon(weapon);
    const ability = monkWeapon ? "dexterity" : weapon.ability || "strength";
    const attackBonus = derived.proficiencyBonus + derived.abilityModifiers[ability];
    const notes = [
      derived.equippedWeapon?.id === weapon.id ? "equipada" : "",
      derived.equippedWeapon?.id === weapon.id && derived.featureEffects.attackCount > 1 ? `${derived.featureEffects.attackCount} ataques` : "",
      derived.featureEffects.criticalRange < 20 ? `crítico ${derived.featureEffects.criticalRange}-20` : "",
      weapon.range ? `alcance ${formatRange(weapon.range)}` : "",
      weapon.mastery ? `maestria ${displayValue(weapon.mastery)}` : "",
      derived.classData?.id === "barbarian" && ability === "strength" ? "Furia +2 daño" : "",
      monkWeapon ? "arma de Monje usa DES" : "",
    ].filter(Boolean);
    const damage = monkWeapon
      ? `${addDamageModifier(monkDamageLabel(weapon.damageLabel), derived.abilityModifiers.dexterity)} o ${addDamageModifier(weapon.damageLabel, derived.abilityModifiers[ability])}`
      : addDamageModifier(weapon.damageLabel || weapon.damage || "pendiente", derived.abilityModifiers[ability]);
    options.push(`${sheetText(weapon)} | ${signed(attackBonus)} | ${damage} | ${notes.join("; ") || "-"}`);
  });

  return options;
}

function isMonkWeapon(weapon) {
  const group = String(weapon.weaponGroup || "");
  const properties = weapon.properties || [];
  return group === "Simple melee" || (group === "Martial melee" && properties.includes("Light"));
}

function monkDamageLabel(damageLabel = "") {
  if (damageLabel.includes("cortante")) return "1d8 cortante";
  if (damageLabel.includes("perforante")) return "1d8 perforante";
  return "1d8 contundente";
}

function sheetText(item) {
  return item.sheetText || displayName(item) || item;
}

function equipmentSheetText(item) {
  const details = [
    item.ac ? `CA ${item.ac}` : "",
    item.acBase ? `CA ${item.acBase}${item.dexterity === "max2" ? " + DES max 2" : item.dexterity === "full" ? " + DES" : ""}` : "",
  ].filter(Boolean);
  const base = sheetText(item);
  return details.length ? `${base} (${details.join("; ")}).` : base;
}

function equipmentInventoryText(derived) {
  return derived.equipmentItems
    .filter((item) => item.category !== "weapon" || item.id !== derived.equippedWeapon?.id)
    .map(equipmentSheetText);
}

function magicItemText(derived) {
  if (!derived.magicItems.length) {
    const suggested = derived.higherLevelGold.rule?.magicItems || [];
    return suggested.length ? `${suggested.join(", ")}; confirmar con DM` : "No aplica";
  }

  return derived.magicItems.map(magicItemSheetLine);
}

function coinExplanation(derived) {
  if (!derived.higherLevelGold.complete) {
    return `Suma equipo inicial normal y oro avanzado: ${derived.higherLevelGold.formula}.`;
  }

  const purchase = derived.equipmentPurchase;
  const spent = purchase?.spentCopper ? purchase.costText : "0 PO";
  const overspent = purchase?.hasOverspent ? ` Gasto excedido por ${purchase.overspentText}.` : "";
  return `Oro inicial: ${derived.startingCoinText}. Equipo adicional comprado: -${spent}.${overspent}`;
}

function spellcastingAbility(derived) {
  return derived.spellcasting.abilityLabel;
}

function spellcastingModifier(derived) {
  return derived.spellcasting.modifier === null ? (derived.spellcasting.canCast ? "Pendiente" : "No aplica") : signed(derived.spellcasting.modifier);
}

function spellSaveDc(derived) {
  return derived.spellcasting.saveDc === null ? (derived.spellcasting.canCast ? "Pendiente" : "No aplica") : derived.spellcasting.saveDc;
}

function spellAttackBonus(derived) {
  return derived.spellcasting.attackBonus === null ? (derived.spellcasting.canCast ? "Pendiente" : "No aplica") : signed(derived.spellcasting.attackBonus);
}

function spellSlots(derived) {
  const entries = derived.spellcasting.slotEntries || [];
  return entries.length
    ? entries.map((entry) => `Nivel ${entry.level}: ${entry.count} espacio${entry.count === 1 ? "" : "s"}`)
    : "No aplica";
}

function spellSelectionText(derived) {
  const selections = [
    ...derived.spellcasting.cantrips.map((spell) => ({ ...spell, tag: "" })),
    ...derived.spellcasting.preparedSpells.map((spell) => ({ ...spell, tag: "" })),
    ...(derived.spellcasting.alwaysPreparedSpells || []).map((spell) => ({ ...spell, tag: "siempre preparado" })),
  ].sort(compareSpellLevelThenName);
  const lines = selections.map((spell) => spellSheetLine(spell, derived, spell.tag));

  return lines.length ? lines : (derived.spellcasting.canCast ? "Pendiente" : "No aplica");
}

function spellSelectionExplanation(derived) {
  const preparation = derived.spellcasting.preparation;

  if (["cleric", "druid"].includes(derived.classData?.id)) {
    return `${preparation.sourceLabel}: prepara ${derived.spellcasting.preparedSpells.length} hoy; puede cambiarse al terminar un descanso largo.`;
  }

  if (derived.classData?.id === "artificer") {
    return `${preparation.sourceLabel}: prepara ${derived.spellcasting.preparedSpells.length} hoy; puede cambiarse al terminar descanso largo. Necesita herramientas competentes como foco.`;
  }

  if (["paladin", "ranger"].includes(derived.classData?.id)) {
    return `${preparation.sourceLabel}: prepara ${derived.spellcasting.preparedSpells.length}; al terminar descanso largo puedes reemplazar 1 conjuro preparado.`;
  }

  if (derived.classData?.id === "sorcerer") {
    return `${preparation.sourceLabel}: prepara ${derived.spellcasting.preparedSpells.length}; al subir de nivel puedes reemplazar 1 conjuro preparado.`;
  }

  if (derived.classData?.id === "warlock") {
    return `${preparation.sourceLabel}: prepara ${derived.spellcasting.preparedSpells.length}; 2 espacios de pacto de nivel 3, recuperan en descanso corto o largo.`;
  }

  if (derived.subclassData?.id === "arcane-trickster") {
    return `${preparation.sourceLabel}: prepara ${derived.spellcasting.preparedSpells.length}; al subir de nivel de Pícaro puedes reemplazar 1 conjuro preparado.`;
  }

  if (derived.classData?.id === "wizard") {
    return "El Mago prepara desde el grimorio; copia también los conjuros escritos en GRIMORIO.";
  }

  return "Copia los trucos y conjuros elegidos por clase, subclase, especie o dote.";
}

function spellbookText(derived) {
  const spells = derived.spellcasting.spellbook.map((spell) => spellbookLine(spell));
  return spells.length ? spells.join(", ") : (derived.classData?.id === "wizard" ? "Pendiente" : "No aplica");
}

function spellRuleText(derived) {
  if (!derived.spellcasting.canCast) {
    return "No aplica";
  }

  const preparation = derived.spellcasting.preparation;
  const preparationRule = preparation?.helper
    ? `${preparation.selectionLabel}: ${preparation.helper} Cambio: ${preparation.changeLabel}.`
    : "";

  return [
    preparationRule,
    ...derived.spellcasting.rules.map((rule) => rule.sheetText),
  ].filter(Boolean);
}

function spellSheetLine(selection, derived, tag = "") {
  const spell = resolveSpell(selection.id) || spellIndex[selection.id];
  const spellId = spell?.id || selection.id;
  const detail = getSpellSheetDetail(spellId) || getSpellSheetDetail(selection.id);
  const level = spellLevelLabel(spell);
  const name = detail?.label || displayValue(spellId) || spell?.label || spell?.name || selection.id;
  const detailText = cleanMechanic(detail?.detail || "");
  const higherLevel = cleanMechanic(detail?.higherLevel || spell?.higherLevel || "");
  const usesSave = detailText.includes("salvación");
  const usesSpellAttack = /ataques? de conjuro/.test(detailText);
  const notes = [
    spellFlags(spell),
    detailText,
    higherLevel ? `A mayor nivel: ${higherLevel}` : "",
    usesSave && derived.spellcasting.saveDc ? `CD ${derived.spellcasting.saveDc}` : "",
    usesSpellAttack && derived.spellcasting.attackBonus !== null ? `ataque ${signed(derived.spellcasting.attackBonus)}` : "",
    tag,
  ].filter(Boolean);
  return `${level} | ${name} | ${spell?.castingTime ? formatCastingTime(spell.castingTime) : "-"} | ${spell?.range ? formatRange(spell.range) : "-"} | ${notes.join("; ") || "-"}`;
}

function spellbookLine(selection) {
  const spell = resolveSpell(selection.id) || spellIndex[selection.id];
  const spellId = spell?.id || selection.id;
  const detail = getSpellSheetDetail(spellId) || getSpellSheetDetail(selection.id);
  const level = spellLevelLabel(spell);
  const name = detail?.label || displayValue(spellId) || spell?.label || spell?.name || selection.id;
  return `${name} (${level})`;
}

function spellLevelLabel(spell) {
  if (!spell) {
    return "Nivel ?";
  }

  return Number(spell.level) === 0 ? "Truco" : `Nivel ${spell.level}`;
}

function formatCost(cost = {}) {
  const labels = { cp: "PC", sp: "PP", ep: "PE", gp: "PO", pp: "PPT" };
  return Object.entries(cost)
    .filter(([, value]) => value)
    .map(([coin, value]) => `${value} ${labels[coin] || coin.toUpperCase()}`)
    .join(", ");
}

function magicItemSheetLine(item) {
  const rarity = rarityLabel(item.rarity);
  const attunement = item.requiresAttunement ? ", sintonía" : "";
  const hasGenericText = item.sheetText?.includes("efecto según DMG/DM");
  const text = hasGenericText
    ? `${displayName(item)}: efecto según manual o DM.`
    : sheetText(item);
  return `${text} (${rarity}${attunement})`;
}

function cleanMechanic(value) {
  return value.replace(/[.;]+$/g, "");
}

function formatCastingTime(value) {
  if (value === "Action") return "acción";
  if (value === "Action or Ritual") return "acción o ritual";
  if (value === "Bonus Action") return "acción adicional";
  if (value.startsWith("Bonus Action")) return "acción adicional";
  if (value.startsWith("Action")) return "acción";
  if (value.startsWith("Reaction")) return "reacción";
  if (value === "1 minute or Ritual") return "1 minuto o ritual";
  return value
    .replace("1 action", "acción")
    .replace("1 bonus action", "acción adicional")
    .replace("1 reaction", "reacción");
}

function formatRange(value) {
  return value
    .replace("Self", "personal")
    .replace("Touch", "toque")
    .replace(/feet/g, "pies")
    .replace("Unlimited", "ilimitado");
}

function addDamageModifier(damageLabel = "", modifier = 0) {
  if (!damageLabel || damageLabel === "pendiente") {
    return damageLabel || "pendiente";
  }

  return damageLabel.replace(/^(\d+d\d+)(.*)$/i, (_, dice, rest) => `${dice}${signed(modifier)}${rest}`);
}

function spellFlags(spell) {
  if (!spell) {
    return "";
  }

  const flags = [
    spell.concentration ? "C" : "",
    spell.ritual ? "R" : "",
    Array.isArray(spell.components) && spell.components.includes("M") ? "M" : "",
  ].filter(Boolean);

  return flags.length ? flags.join("/") : "";
}

function rarityLabel(rarity) {
  return {
    Common: "común",
    Uncommon: "poco común",
    Rare: "raro",
    "Very Rare": "muy raro",
    Legendary: "legendario",
    Artifact: "artefacto",
  }[rarity] || rarity;
}
