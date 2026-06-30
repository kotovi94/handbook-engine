import { pickMany, pickOne, weightedPick } from "./dungeonTypes.js";

const dungeonHabitatWeights = {
  cueva: ["cave", "underground", "climb"],
  cripta: ["underground", "swarm", "stealth"],
  mina: ["underground", "cave", "climb"],
  templo: ["guardian", "swarm", "flying"],
  fortaleza: ["guardian", "mount", "swarm"],
  alcantarilla: ["aquatic", "swarm", "stealth"],
  ruina: ["forest", "swarm", "guardian"],
  torre: ["flying", "guardian", "climb"],
  guarida: ["predator", "cave", "forest"],
  laboratorio: ["exotic", "swarm", "underground"],
};

const themeHabitatWeights = {
  helado: ["cold", "predator"],
  volcanico: ["cave", "exotic"],
  feerico: ["forest", "flying", "exotic"],
  corrupto: ["swarm", "predator", "underground"],
  infernal: ["exotic", "guardian"],
  natural: ["forest", "predator", "flying"],
  subterraneo: ["underground", "cave"],
  abandonado: ["swarm", "stealth", "guardian"],
  oscuro: ["stealth", "underground"],
};

const animalThreatTiers = {
  novice: ["minor", "low"],
  heroic: ["low", "standard", "elite"],
  paragon: ["standard", "elite", "apex"],
  legendary: ["elite", "apex", "mythic"],
};

const animalCatalog = [
  { name: "murcielagos", ref: "Bat / Swarm of Bats", tier: "minor", tags: ["flying", "swarm", "cave", "stealth"], role: "ruido, oscuridad y confusion" },
  { name: "ratas de tunel", ref: "Rat / Swarm of Rats", tier: "minor", tags: ["swarm", "underground", "stealth"], role: "presion de recursos y alarma natural" },
  { name: "aranas pequenas", ref: "Spider / Swarm of Insects", tier: "minor", tags: ["swarm", "climb", "underground"], role: "veneno menor, telaranas y terreno incomodo" },
  { name: "cuervos o aves carroneras", ref: "Raven / Vulture", tier: "minor", tags: ["flying", "swarm", "guardian"], role: "vigias, presagio o distraccion" },
  { name: "serpientes venenosas", ref: "Venomous Snake / Flying Snake", tier: "low", tags: ["stealth", "poison", "forest", "exotic"], role: "emboscada puntual y castigo al explorador" },
  { name: "lobos", ref: "Wolf / Dire Wolf", tier: "low", tags: ["predator", "forest", "guardian"], role: "manada que flanquea y derriba" },
  { name: "jabalies", ref: "Boar / Giant Boar", tier: "low", tags: ["predator", "forest", "charge"], role: "carga frontal y caos en espacios medianos" },
  { name: "osos", ref: "Black Bear / Brown Bear / Polar Bear", tier: "low", tags: ["predator", "forest", "cold", "climb"], role: "bruto territorial con buen olfato" },
  { name: "cocodrilos", ref: "Crocodile", tier: "low", tags: ["aquatic", "stealth", "predator"], role: "amenaza de agua y agarre" },
  { name: "murcielagos gigantes", ref: "Giant Bat", tier: "low", tags: ["flying", "cave", "underground"], role: "ataque desde techo y retirada rapida" },
  { name: "ciempies gigantes", ref: "Giant Centipede", tier: "low", tags: ["poison", "underground", "swarm"], role: "veneno, grietas y pasos estrechos" },
  { name: "lobos aracnidos", ref: "Giant Wolf Spider", tier: "low", tags: ["climb", "stealth", "poison", "underground"], role: "cazador de techo o pared" },
  { name: "panteras o grandes felinos", ref: "Panther / Lion / Tiger", tier: "standard", tags: ["predator", "stealth", "forest"], role: "acecho, salto y retirada a cobertura" },
  { name: "serpientes constrictoras", ref: "Constrictor Snake / Giant Constrictor Snake", tier: "standard", tags: ["aquatic", "stealth", "predator"], role: "control de una victima y presion de rescate" },
  { name: "osos polares o cavernarios", ref: "Polar Bear", tier: "standard", tags: ["cold", "predator", "cave"], role: "defensa territorial resistente" },
  { name: "escorpiones gigantes", ref: "Giant Scorpion", tier: "standard", tags: ["poison", "guardian", "underground"], role: "pinzas, veneno y guardian de camara" },
  { name: "aranas gigantes", ref: "Giant Spider", tier: "standard", tags: ["climb", "stealth", "poison", "underground"], role: "redes, emboscada vertical y veneno" },
  { name: "enjambres de piranas", ref: "Swarm of Piranhas", tier: "standard", tags: ["aquatic", "swarm"], role: "canal peligroso que divide al grupo" },
  { name: "tiburones", ref: "Reef Shark / Hunter Shark", tier: "standard", tags: ["aquatic", "predator"], role: "amenaza de agua abierta o cisterna" },
  { name: "alces o rinocerontes", ref: "Elk / Rhinoceros", tier: "standard", tags: ["charge", "guardian", "forest"], role: "carga y control por derribo" },
  { name: "simios gigantes", ref: "Giant Ape", tier: "elite", tags: ["climb", "predator", "forest", "guardian"], role: "amenaza vertical con lanzamiento de objetos" },
  { name: "aguilas o buhos gigantes", ref: "Giant Eagle / Giant Owl", tier: "elite", tags: ["flying", "guardian", "forest"], role: "control aereo, rescate o persecucion" },
  { name: "tiburones gigantes", ref: "Giant Shark", tier: "elite", tags: ["aquatic", "predator"], role: "depredador mayor para agua profunda" },
  { name: "dinosaurios cazadores", ref: "Allosaurus / Pteranodon", tier: "elite", tags: ["predator", "exotic", "charge"], role: "bestia exotica con movilidad explosiva" },
  { name: "dinosaurios acorazados", ref: "Ankylosaurus / Triceratops", tier: "apex", tags: ["guardian", "charge", "exotic"], role: "muro viviente que domina una sala grande" },
  { name: "mamuts o megafauna", ref: "Mammoth / Elephant", tier: "apex", tags: ["charge", "guardian", "cold"], role: "presencia enorme que cambia el mapa" },
  { name: "tiranosaurio", ref: "Tyrannosaurus Rex", tier: "mythic", tags: ["predator", "exotic", "apex"], role: "jefe bestial para una guarida amplia" },
];

const animalBehaviorNotes = [
  "Da una pista antes del ataque: olor, huellas, restos o silencio repentino.",
  "Usa hambre, territorio, cria o miedo como motivacion simple.",
  "Permite evitar el combate con comida, calma, ruido, fuego o ruta alternativa.",
  "Haz que el terreno importe: techo, agua, grietas, maleza, barro o cornisa.",
  "Si son muchas criaturas pequenas, tratalas como presion y no como duelo largo.",
  "Si es una bestia grande, deja espacio para carga, salto o retirada.",
];

export function generateAnimalEncounter({ config, roomType, encounterPlan, rng }) {
  const primaryGroup = encounterPlan?.groups?.[0];
  const options = getAnimalOptions(config, roomType, primaryGroup);
  const primary = weightedPick(rng, options, animalCatalog[0]);
  const behavior = pickOne(rng, animalBehaviorNotes);
  const count = getAnimalCount(primaryGroup, primary, roomType);
  const lines = [
    `${formatAnimalCount(count, primary)} (${formatAnimalCr(primaryGroup)}; rol: ${primary.role}; referencia: ${primary.ref})`,
  ];

  if (roomType === "jefe") {
    const support = pickOne(rng, getSupportAnimals(config, primary), null);
    const supportGroup = encounterPlan?.groups?.[1];
    lines[0] = `jefe bestial: ${primary.name} dominante (${formatAnimalCr(primaryGroup)}; rol: ${primary.role}; referencia: ${primary.ref})`;

    if (support && supportGroup) {
      lines.push(`${formatAnimalCount(supportGroup.count, support)} de apoyo (${formatAnimalCr(supportGroup)})`);
    }
  }

  if (roomType === "entrada" || roomType === "pasillo") {
    lines.push("rastro claro o alarma natural cercana");
  }

  lines.push(`conducta: ${behavior}`);
  return lines;
}

function formatAnimalCount(count, animal) {
  if (count === 1) {
    return `1 encuentro con ${animal.name}`;
  }

  return `${count} ${animal.name}`;
}

function formatAnimalCr(group) {
  if (!group) {
    return "CR por definir";
  }

  return `presupuesto ${group.totalXp} XP; busca CR cercano a ${group.cr}`;
}

function getAnimalOptions(config, roomType, primaryGroup = null) {
  const allowedTiers = animalThreatTiers[getAnimalLevelTier(config.averageLevel)] || animalThreatTiers.novice;
  const habitatTags = [
    ...(dungeonHabitatWeights[config.dungeonType] || []),
    ...(themeHabitatWeights[config.theme] || []),
  ];

  return animalCatalog
    .filter((animal) => allowedTiers.includes(animal.tier) || (roomType === "jefe" && animal.tier === "apex"))
    .filter((animal) => fitsTargetCr(animal, primaryGroup?.crValue || 0))
    .map((animal) => ({
      ...animal,
      weight: getAnimalWeight(animal, habitatTags, roomType),
    }))
    .filter((animal) => animal.weight > 0);
}

function fitsTargetCr(animal, targetCr) {
  if (!targetCr) {
    return true;
  }

  if (targetCr >= 7) {
    return ["elite", "apex", "mythic"].includes(animal.tier);
  }

  if (targetCr >= 5) {
    return ["standard", "elite", "apex"].includes(animal.tier);
  }

  if (targetCr >= 2) {
    return ["low", "standard", "elite"].includes(animal.tier);
  }

  return ["minor", "low", "standard"].includes(animal.tier);
}

function getSupportAnimals(config, primary) {
  return animalCatalog.filter((animal) => (
    animal.name !== primary.name
    && (animal.tier === "minor" || animal.tier === "low")
    && animal.tags.some((tag) => primary.tags.includes(tag) || (dungeonHabitatWeights[config.dungeonType] || []).includes(tag))
  ));
}

function getAnimalWeight(animal, habitatTags, roomType) {
  let weight = 0;
  animal.tags.forEach((tag) => {
    if (habitatTags.includes(tag)) {
      weight += 2;
    }
  });

  if (weight > 0 && roomType === "jefe" && (animal.tier === "elite" || animal.tier === "apex" || animal.tier === "mythic")) {
    weight += 5;
  }

  if (roomType === "trampa" && (animal.tags.includes("swarm") || animal.tags.includes("stealth"))) {
    weight += 3;
  }

  if (roomType === "tesoro" && animal.tags.includes("guardian")) {
    weight += 3;
  }

  return weight;
}

function getAnimalCount(group, animal, roomType) {
  if (roomType === "jefe" || animal.tier === "mythic" || animal.tier === "apex") {
    return 1;
  }

  const plannedCount = group?.count || 1;

  if (animal.tags.includes("swarm")) {
    return Math.max(1, Math.ceil(plannedCount / 2));
  }

  if (animal.tier === "elite") {
    return Math.max(1, Math.floor(plannedCount / 3));
  }

  if (animal.tier === "standard") {
    return Math.max(1, Math.min(2, Math.ceil(plannedCount / 2)));
  }

  if (animal.tier === "low") {
    return Math.max(1, Math.min(5, plannedCount));
  }

  return Math.max(1, Math.min(8, plannedCount));
}

function getAnimalLevelTier(level) {
  if (level >= 17) return "legendary";
  if (level >= 11) return "paragon";
  if (level >= 5) return "heroic";
  return "novice";
}
