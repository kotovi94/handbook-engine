export function collectEffects(sources) {
  return sources.flatMap((source) => source?.effects || []);
}

export function resolveEffects(effects) {
  const result = createEffectState();

  effects.forEach((effect) => {
    applyEffect(result, effect);
  });

  return {
    ...result,
    languages: [...result.languages],
    skills: [...result.skills],
    expertise: [...result.expertise],
    savingThrows: [...result.savingThrows],
    armorTraining: [...result.armorTraining],
    weaponTraining: [...result.weaponTraining],
    tools: [...result.tools],
    equipment: [...result.equipment],
    feats: [...result.feats],
    resistances: [...result.resistances],
    traits: [...result.traits],
    spellChoices: [...result.spellChoices],
    unlockedSpellLevels: [...result.unlockedSpellLevels].sort((a, b) => a - b),
  };
}

function createEffectState() {
  return {
    attackCount: 1,
    criticalRange: 20,
    armorClassBonuses: [],
    speedBonuses: [],
    languages: new Set(),
    skills: new Set(),
    expertise: new Set(),
    savingThrows: new Set(),
    armorTraining: new Set(),
    weaponTraining: new Set(),
    tools: new Set(),
    equipment: new Set(),
    feats: new Set(),
    resistances: new Set(),
    traits: new Set(),
    coins: {},
    resources: {},
    spellcasting: null,
    spellChoices: [],
    unlockedSpellLevels: new Set(),
    senses: {},
  };
}

function applyEffect(state, effect) {
  const handlers = {
    "armor.acBonus": () => state.armorClassBonuses.push(effect.value),
    "armor.ac": () => {
      state.armorClassBase = effect.value;
    },
    "armor.acBase": () => {
      state.armorClassBase = effect.value;
      state.armorDexterity = effect.dexterity;
    },
    "armor.shieldBonus": () => state.armorClassBonuses.push(effect.value),
    "attack.count": () => {
      state.attackCount = Math.max(state.attackCount, effect.value);
    },
    "attack.criticalRange": () => {
      state.criticalRange = Math.min(state.criticalRange, effect.value);
    },
    "coin.add": () => addCoins(state.coins, effect.coins),
    "equipment.grant": () => addMany(state.equipment, effect.items),
    "feat.grant": () => state.feats.add(effect.featId),
    "hitPoints.perLevel": () => {
      state.hitPointsPerLevel = (state.hitPointsPerLevel || 0) + effect.value;
    },
    "language.grant": () => addMany(state.languages, effect.languages),
    "proficiency.armor": () => addMany(state.armorTraining, effect.items),
    "proficiency.savingThrow": () => addMany(state.savingThrows, effect.items),
    "proficiency.skill": () => addMany(state.skills, effect.items),
    "proficiency.expertise": () => addMany(state.expertise, effect.items),
    "proficiency.tool": () => addMany(state.tools, effect.items),
    "proficiency.weapon": () => addMany(state.weaponTraining, effect.items),
    "resource.add": () => {
      state.resources[effect.resource] = (state.resources[effect.resource] || 0) + effect.value;
    },
    "resistance.grant": () => addMany(state.resistances, effect.items),
    "sense.darkvision": () => {
      state.senses.darkvision = Math.max(state.senses.darkvision || 0, effect.value);
    },
    "size.set": () => {
      state.size = effect.value;
    },
    "speed.set": () => {
      state.speed = effect.value;
    },
    "spell.slot.unlock": () => state.unlockedSpellLevels.add(effect.spellLevel),
    "spell.choice": () => {
      state.spellChoices.push({ kind: effect.spellKind, spells: effect.spells || [] });
    },
    "spellcasting.initiate": () => {
      state.spellcastingInitiate = effect.source || "choice";
    },
    "spellcasting.enable": () => {
      state.spellcasting = { ability: effect.ability };
    },
    "trait.grant": () => addMany(state.traits, effect.items),
  };

  handlers[effect.type]?.();
}

function addMany(set, values = []) {
  values.forEach((value) => set.add(value));
}

function addCoins(total, source = {}) {
  Object.entries(source).forEach(([coin, amount]) => {
    total[coin] = (total[coin] || 0) + amount;
  });
}
