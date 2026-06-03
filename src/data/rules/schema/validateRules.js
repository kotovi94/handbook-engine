import {
  backgrounds,
  classes,
  classProgression,
  equipment,
  feats,
  magicItems,
  proficiencies,
  species,
  spells,
  subclasses,
  subclassProgression,
} from "../index.js";
import { choiceTypes, effectSchemas, ruleSchemas, supportedEffectTypes } from "./entitySchemas.js";

export function validateRules() {
  const report = {
    errors: [],
    warnings: [],
  };

  validateCollection("class", classes, report);
  validateCollection("subclass", subclasses, report);
  validateCollection("species", species, report);
  validateCollection("background", backgrounds, report);
  validateCollection("feat", feats, report);
  validateCollection("equipment", equipment, report);
  validateCollection("magicItem", magicItems, report);
  validateCollection("spell", spells, report);
  validateProficiencies(proficiencies, report);
  validateAdvancement({ classProgression, subclassProgression }, report);
  validateSubclassUniqueness(report);
  validateGlobalIds(report);
  validateReferences(report);

  return {
    ...report,
    ok: report.errors.length === 0,
  };
}

function validateSubclassUniqueness(report) {
  const seen = new Map();

  subclasses.forEach((subclass) => {
    const key = `${subclass.classId}:${normalizeKey(subclass.name)}`;

    if (seen.has(key)) {
      const previous = seen.get(key);
      report.errors.push(
        `duplicate subclass "${subclass.name}" for class "${subclass.classId}" from "${previous.source}" and "${subclass.source}"`,
      );
      return;
    }

    seen.set(key, subclass);
  });
}

function validateCollection(schemaName, items, report) {
  const schema = ruleSchemas[schemaName];
  const seen = new Set();

  items.forEach((item, index) => {
    const label = `${schemaName}[${index}]`;

    schema.required.forEach((field) => {
      if (!hasValue(item[field])) {
        report.errors.push(`${label} missing required field "${field}"`);
      }
    });

    if (item.id) {
      if (seen.has(item.id)) {
        report.errors.push(`${schemaName} duplicate id "${item.id}"`);
      }
      seen.add(item.id);
    }

    validateEnums(schemaName, item, schema, report);
    validateEntityDetails(schemaName, item, report);
    validateEffects(`${schemaName} "${item.id || index}"`, item.effects || [], report);
    validateChoices(`${schemaName} "${item.id || index}"`, item.choices || [], report);
  });
}

function validateEntityDetails(schemaName, item, report) {
  if (schemaName === "background" && item.abilityOptions) {
    const abilities = new Set(proficiencies.savingThrows || []);

    if (!Array.isArray(item.abilityOptions) || item.abilityOptions.length !== 3) {
      report.errors.push(`background "${item.id}" abilityOptions must contain exactly three abilities`);
      return;
    }

    item.abilityOptions.forEach((ability) => {
      if (!abilities.has(ability)) {
        report.errors.push(`background "${item.id}" has invalid ability option "${ability}"`);
      }
    });
  }
}

function validateEnums(schemaName, item, schema, report) {
  if (!schema.enums) {
    return;
  }

  Object.entries(schema.enums).forEach(([field, allowed]) => {
    const value = item[field];

    if (value && !allowed.includes(value)) {
      report.errors.push(`${schemaName} "${item.id}" has invalid ${field}: "${value}"`);
    }
  });
}

function validateProficiencies(proficiencyGroups, report) {
  const values = Object.values(proficiencyGroups).flat();
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);

  [...new Set(duplicates)].forEach((duplicate) => {
    report.warnings.push(`proficiency duplicate label "${duplicate}"`);
  });
}

function validateAdvancement({ classProgression, subclassProgression }, report) {
  const featureIds = new Set();

  Object.entries(classProgression).forEach(([classId, progression]) => {
    if (!progression.hitDie) {
      report.errors.push(`advancement "${classId}" missing hitDie`);
    }

    validateLevelEntries(`classProgression.${classId}`, progression.levels || [], report, featureIds);
  });

  Object.entries(subclassProgression).forEach(([subclassId, progression]) => {
    validateLevelEntries(`subclassProgression.${subclassId}`, progression.levels || [], report, featureIds);
  });
}

function validateLevelEntries(label, levels, report, featureIds) {
  levels.forEach((entry) => {
    if (!Number.isInteger(entry.level) || entry.level < 1 || entry.level > 20) {
      report.errors.push(`${label} has invalid level "${entry.level}"`);
    }

    if (!Array.isArray(entry.features)) {
      report.errors.push(`${label} level ${entry.level} must have features array`);
      return;
    }

    entry.features.forEach((feature, index) => {
      validateFeature(`${label} level ${entry.level} feature[${index}]`, feature, entry.level, report);

      if (feature.id) {
        if (featureIds.has(feature.id)) {
          report.errors.push(`feature duplicate id "${feature.id}"`);
        }
        featureIds.add(feature.id);
      }
    });
  });
}

function validateFeature(label, feature, level, report) {
  ruleSchemas.levelFeature.required.forEach((field) => {
    if (!hasValue(feature[field])) {
      report.errors.push(`${label} missing required field "${field}"`);
    }
  });

  if (feature.level !== level) {
    report.errors.push(`${label} level mismatch: feature level ${feature.level}, group level ${level}`);
  }

  if (!Array.isArray(feature.effects)) {
    report.errors.push(`${label} effects must be an array`);
  }

  validateEffects(label, feature.effects || [], report);
  validateChoices(label, feature.choices || [], report);

  if (feature.sheetText === feature.description) {
    report.warnings.push(`${label} sheetText matches description; keep copy-text short and separate from explanation`);
  }

  if (feature.sheetSection && ![
    "classFeatures",
    "subclassFeatures",
    "speciesTraits",
    "feats",
    "attacks",
    "magic",
    "equipment",
  ].includes(feature.sheetSection)) {
    report.errors.push(`${label} invalid sheetSection "${feature.sheetSection}"`);
  }
}

function validateChoices(label, choices, report) {
  const choiceIds = new Set();

  choices.forEach((choice, index) => {
    const choiceLabel = `${label} choice[${index}]`;

    ["id", "type", "count", "from"].forEach((field) => {
      if (!hasValue(choice[field])) {
        report.errors.push(`${choiceLabel} missing required field "${field}"`);
      }
    });

    if (choice.id) {
      if (choiceIds.has(choice.id)) {
        report.errors.push(`${label} duplicate choice id "${choice.id}"`);
      }
      choiceIds.add(choice.id);
    }

    if (choice.type && !choiceTypes.includes(choice.type)) {
      report.errors.push(`${choiceLabel} unsupported type "${choice.type}"`);
    }

    if (!Number.isInteger(choice.count) || choice.count < 1) {
      report.errors.push(`${choiceLabel} count must be a positive integer`);
    }

    if (!Array.isArray(choice.from) || choice.from.length < choice.count) {
      report.errors.push(`${choiceLabel} from must contain at least count options`);
    }
  });
}

function validateEffects(label, effects, report) {
  effects.forEach((effect, index) => {
    if (!effect.type) {
      report.errors.push(`${label} effect[${index}] missing type`);
      return;
    }

    if (!supportedEffectTypes.includes(effect.type)) {
      report.errors.push(`${label} effect[${index}] unsupported type "${effect.type}"`);
      return;
    }

    (effectSchemas[effect.type] || []).forEach((field) => {
      if (!hasValue(effect[field])) {
        report.errors.push(`${label} effect[${index}] "${effect.type}" missing required field "${field}"`);
      }
    });

    validateEffectReferences(`${label} effect[${index}]`, effect, report);
  });
}

function validateEffectReferences(label, effect, report) {
  const featIds = new Set(feats.map((item) => item.id));
  const equipmentIds = new Set(equipment.map((item) => item.id));
  const armorProficiencies = new Set(proficiencies.armor || []);
  const weaponProficiencies = new Set(proficiencies.weapons || []);
  const savingThrows = new Set(proficiencies.savingThrows || []);
  const skills = new Set(proficiencies.skills || []);

  if (effect.type === "feat.grant" && effect.featId && !featIds.has(effect.featId)) {
    report.errors.push(`${label} references unknown feat "${effect.featId}"`);
  }

  if (effect.type === "equipment.grant") {
    (effect.items || []).forEach((itemId) => {
      if (!equipmentIds.has(itemId)) {
        report.errors.push(`${label} references unknown equipment "${itemId}"`);
      }
    });
  }

  if (effect.type === "proficiency.armor") {
    validateKnownValues(label, "armor proficiency", effect.items || [], armorProficiencies, report);
  }

  if (effect.type === "proficiency.weapon") {
    validateKnownValues(label, "weapon proficiency", effect.items || [], weaponProficiencies, report);
  }

  if (effect.type === "proficiency.savingThrow") {
    validateKnownValues(label, "saving throw", effect.items || [], savingThrows, report);
  }

  if (effect.type === "proficiency.skill") {
    validateKnownValues(label, "skill", effect.items || [], skills, report);
  }

  if (effect.type === "proficiency.expertise") {
    validateKnownValues(label, "skill", effect.items || [], skills, report);
  }
}

function validateKnownValues(label, kind, values, knownValues, report) {
  values.forEach((value) => {
    if (!knownValues.has(value)) {
      report.errors.push(`${label} references unknown ${kind} "${value}"`);
    }
  });
}

function validateReferences(report) {
  const classIds = new Set(classes.map((item) => item.id));
  const subclassIds = new Set(subclasses.map((item) => item.id));
  const featIds = new Set(feats.map((item) => item.id));
  const equipmentIds = new Set(equipment.map((item) => item.id));

  subclasses.forEach((subclass) => {
    if (!classIds.has(subclass.classId)) {
      report.errors.push(`subclass "${subclass.id}" references unknown class "${subclass.classId}"`);
    }
  });

  backgrounds.forEach((background) => {
    const featId = background.grants?.featId;

    if (featId && !featIds.has(featId)) {
      report.errors.push(`background "${background.id}" references unknown feat "${featId}"`);
    }

    (background.grants?.equipment || []).forEach((equipmentId) => {
      if (!equipmentIds.has(equipmentId)) {
        report.errors.push(`background "${background.id}" references unknown equipment "${equipmentId}"`);
      }
    });
  });

  Object.keys(classProgression).forEach((classId) => {
    if (!classIds.has(classId)) {
      report.errors.push(`classProgression references unknown class "${classId}"`);
    }
  });

  Object.keys(subclassProgression).forEach((subclassId) => {
    if (!subclassIds.has(subclassId)) {
      report.errors.push(`subclassProgression references unknown subclass "${subclassId}"`);
    }
  });
}

function validateGlobalIds(report) {
  const all = [
    ...classes.map((item) => ["class", item.id]),
    ...subclasses.map((item) => ["subclass", item.id]),
    ...species.map((item) => ["species", item.id]),
    ...backgrounds.map((item) => ["background", item.id]),
    ...feats.map((item) => ["feat", item.id]),
    ...equipment.map((item) => ["equipment", item.id]),
    ...magicItems.map((item) => ["magicItem", item.id]),
    ...spells.map((item) => ["spell", item.id]),
  ];
  const seen = new Map();

  all.forEach(([type, id]) => {
    if (!id) {
      return;
    }

    if (seen.has(id)) {
      const firstType = seen.get(id);
      report.errors.push(`global duplicate id "${id}" used by ${firstType} and ${type}`);
      return;
    }

    seen.set(id, type);
  });
}

function hasValue(value) {
  if (Array.isArray(value)) {
    return true;
  }

  return value !== undefined && value !== null && value !== "";
}

function normalizeKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
