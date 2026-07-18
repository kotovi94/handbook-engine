import {
  wizardCantrips,
  wizardPreparedSpellsLevel5,
  wizardSchoolSpellsUpToLevel2,
  wizardSpellbookSpellsLevel5,
} from "../spellcasting/wizardLists.js";
import {
  clericCantrips,
  clericDomainSpellsLevel5,
  clericPreparedSpellsLevel5,
} from "../spellcasting/clericLists.js";
import {
  bardCantrips,
  bardCollegeSpellsLevel5,
  bardPreparedSpellsLevel5,
} from "../spellcasting/bardLists.js";
import {
  druidCantrips,
  druidCircleSpellsLevel5,
  druidPreparedSpellsLevel5,
} from "../spellcasting/druidLists.js";
import {
  paladinOathSpellsLevel5,
  paladinPreparedSpellsLevel5,
} from "../spellcasting/paladinLists.js";
import {
  rangerPreparedSpellsLevel5,
  rangerSubclassSpellsLevel5,
} from "../spellcasting/rangerLists.js";
import {
  arcaneTricksterCantripsLevel5,
  arcaneTricksterPreparedSpellsLevel5,
} from "../spellcasting/rogueLists.js";
import {
  sorcererCantrips,
  sorcererMetamagicOptions,
  sorcererPreparedSpellsLevel5,
  sorcererSubclassSpellsLevel5,
} from "../spellcasting/sorcererLists.js";
import {
  pactOfTomeRitualsLevel1,
  warlockCantrips,
  warlockInvocationOptionsLevel5,
  warlockPatronCantripsLevel5,
  warlockPatronSpellsLevel5,
  warlockPreparedSpellsLevel5,
} from "../spellcasting/warlockLists.js";
import {
  artificerArmorModels,
  artificerCantrips,
  artificerMagicItemPlansLevel5,
  artificerPreparedSpellsLevel5,
  artificerSubclassSpellsLevel5,
} from "../spellcasting/artificerLists.js";

export const classProgression = {
  fighter: {
    hitDie: 10,
    levels: [
      {
        level: 1,
        features: [
          feature("fighter-fighting-style", "Fighting Style", 1, [], "classFeatures", {
            label: "Estilo de combate",
            description: "Choose a Fighting Style feat that represents your preferred combat training.",
            sheetText: "Estilo de combate: copia el estilo elegido.",
            choices: [
              {
                id: "fighter-fighting-style-choice",
                label: "Estilo de combate",
                type: "fightingStyle",
                count: 1,
                from: ["archery", "defense", "dueling", "great-weapon-fighting", "protection", "two-weapon-fighting"],
                optionLabels: {
                  archery: "Tiro con arco",
                  defense: "Defensa",
                  dueling: "Duelo",
                  "great-weapon-fighting": "Combate con arma grande",
                  protection: "Protección",
                  "two-weapon-fighting": "Combate con dos armas",
                },
              },
            ],
          }),
          feature("fighter-second-wind", "Second Wind", 1, [
            { type: "resource.add", resource: "secondWind", value: 3 },
          ], "classFeatures", {
            label: "Segundo aliento",
            description: "Use a Bonus Action to recover hit points using a limited Fighter resource.",
            sheetText: "Segundo aliento: 3 usos; como acción adicional recuperas 1d10 + nivel de Guerrero PG.",
          }),
          feature("fighter-weapon-mastery", "Weapon Mastery", 1, [
            { type: "resource.add", resource: "weaponMastery", value: 4 },
          ], "classFeatures", {
            label: "Maestria con armas",
            description: "Choose weapons whose mastery properties you can use after training.",
            sheetText: "Maestria con armas: elige 4 armas para usar sus propiedades de maestria.",
            choices: [
              {
                id: "fighter-weapon-mastery-choice",
                label: "Armas con maestria",
                type: "weaponMastery",
                count: 4,
                from: [
                  "club",
                  "dagger",
                  "greatclub",
                  "handaxe",
                  "javelin",
                  "light-hammer",
                  "mace",
                  "quarterstaff",
                  "sickle",
                  "spear",
                  "dart",
                  "light-crossbow",
                  "shortbow",
                  "sling",
                  "battleaxe",
                  "flail",
                  "glaive",
                  "greataxe",
                  "greatsword",
                  "halberd",
                  "lance",
                  "longsword",
                  "maul",
                  "morningstar",
                  "pike",
                  "rapier",
                  "scimitar",
                  "shortsword",
                  "trident",
                  "warhammer",
                  "war-pick",
                  "whip",
                  "blowgun",
                  "hand-crossbow",
                  "heavy-crossbow",
                  "longbow",
                  "musket",
                  "pistol",
                ],
                optionLabels: {
                  club: "Garrote",
                  greatsword: "Espadón",
                  flail: "Mangual",
                  javelin: "Jabalina",
                  longsword: "Espada larga",
                  scimitar: "Cimitarra",
                  shortsword: "Espada corta",
                  longbow: "Arco largo",
                  dagger: "Daga",
                },
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("fighter-action-surge", "Action Surge", 2, [
            { type: "resource.add", resource: "actionSurge", value: 1 },
          ], "classFeatures", {
            label: "Oleada de acción",
            description: "Take one additional action on your turn, except the Magic action.",
            sheetText: "Oleada de acción: 1 uso por descanso corto o largo; tomas una acción adicional que no sea Magia.",
          }),
          feature("fighter-tactical-mind", "Tactical Mind", 2, [], "classFeatures", {
            label: "Mente táctica",
            description: "Spend Second Wind to improve a failed ability check.",
            sheetText: "Mente táctica: al fallar una prueba, puedes gastar Segundo aliento y sumar 1d10; si aún fallas, no gastas el uso.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("fighter-subclass", "Fighter Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Guerrero",
            description: "Gain a Fighter subclass and all subclass features available up to your Fighter level.",
            sheetText: "Subclase de Guerrero",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("fighter-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("fighter-extra-attack", "Extra Attack", 5, [
            { type: "attack.count", value: 2 },
          ], "classFeatures", {
            label: "Ataque adicional",
            description: "Attack twice when taking the Attack action.",
            sheetText: "Ataque adicional: 2 ataques con la acción de Atacar.",
          }),
          feature("fighter-tactical-shift", "Tactical Shift", 5, [], "classFeatures", {
            label: "Desplazamiento táctico",
            description: "Move up to half your Speed when you use Second Wind as a Bonus Action without provoking Opportunity Attacks.",
            sheetText: "Desplazamiento táctico: al usar Segundo aliento, puedes moverte hasta la mitad de tu Velocidad sin provocar ataques de oportunidad.",
          }),
        ],
      },
    ],
  },
  wizard: {
    hitDie: 6,
    levels: [
      {
        level: 1,
        features: [
          feature("wizard-spellcasting", "Spellcasting", 1, [
            { type: "spellcasting.enable", ability: "intelligence" },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Prepare and cast Wizard spells using Intelligence.",
            sheetText: "Lanzamiento de conjuros: Inteligencia; CD = 8 + Int + competencia; ataque = Int + competencia.",
            choices: [
              {
                id: "wizard-cantrip-choice",
                label: "Trucos de Mago",
                type: "cantrip",
                count: 4,
                from: wizardCantrips,
              },
              {
                id: "wizard-spellbook-choice",
                label: "Grimorio de Mago",
                type: "spellbook",
                count: 14,
                from: wizardSpellbookSpellsLevel5,
              },
              {
                id: "wizard-prepared-spell-choice",
                label: "Conjuros preparados de Mago",
                type: "spell",
                count: 9,
                from: wizardPreparedSpellsLevel5,
              },
            ],
          }),
          feature("wizard-ritual-adept", "Ritual Adept", 1, [], "magic", {
            label: "Adepto ritual",
            description: "Cast Wizard ritual spells from your spellbook without preparing them.",
            sheetText: "Adepto ritual: puedes lanzar como ritual cualquier conjuro ritual de Mago que este en tu grimorio; no necesita estar preparado.",
          }),
          feature("wizard-arcane-recovery", "Arcane Recovery", 1, [
            { type: "resource.add", resource: "arcaneRecovery", value: 1 },
          ], "classFeatures", {
            label: "Recuperacion arcana",
            description: "Recover some expended spell slots after resting.",
            sheetText: "Recuperacion arcana: 1 vez por descanso largo, tras descanso corto recuperas espacios con nivel total hasta 3.",
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("wizard-scholar", "Scholar", 2, [], "classFeatures", {
            label: "Erudito",
            description: "Improve academic expertise.",
            sheetText: "Erudito: elige una habilidad academica competente y gana pericia en ella.",
            choices: [
              {
                id: "wizard-scholar-expertise-choice",
                label: "Pericia de Erudito",
                type: "expertise",
                count: 1,
                from: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Religion"],
              },
            ],
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("wizard-subclass", "Wizard Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Mago",
            description: "Gain a Wizard subclass and its features.",
            sheetText: "Subclase de Mago",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("wizard-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("wizard-memorize-spell", "Memorize Spell", 5, [], "magic", {
            label: "Memorizar conjuro",
            description: "Replace one prepared Wizard spell after a Short Rest by studying the spellbook.",
            sheetText: "Memorizar conjuro: tras descanso corto, reemplaza 1 conjuro preparado de nivel 1+ por otro del grimorio.",
          }),
        ],
      },
    ],
  },
  cleric: {
    hitDie: 8,
    levels: [
      {
        level: 1,
        features: [
          feature("cleric-spellcasting", "Spellcasting", 1, [
            { type: "spellcasting.enable", ability: "wisdom" },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Prepare Cleric spells through prayer and meditation.",
            sheetText: "Lanzamiento de conjuros: Sabiduría; CD = 8 + Sab + competencia; ataque = Sab + competencia; foco: Símbolo sagrado.",
            choices: [
              {
                id: "cleric-cantrip-choice",
                label: "Trucos de Clérigo",
                type: "cantrip",
                count: 4,
                from: clericCantrips,
              },
              {
                id: "cleric-prepared-spell-choice",
                label: "Conjuros preparados hoy de Clérigo",
                type: "spell",
                count: 9,
                from: clericPreparedSpellsLevel5,
              },
            ],
          }),
          feature("cleric-divine-order", "Divine Order", 1, [], "classFeatures", {
            label: "Orden divina",
            description: "Choose Protector for battle training or Thaumaturge for stronger sacred study.",
            sheetText: "Orden divina: Protector da armas marciales y armadura pesada; Taumaturgo da 1 truco extra y bono a Arcanos o Religion igual a Sab.",
            choices: [
              {
                id: "cleric-divine-order-choice",
                label: "Orden divina",
                type: "divineOrder",
                count: 1,
                from: ["protector", "thaumaturge"],
                optionLabels: {
                  protector: "Protector",
                  thaumaturge: "Taumaturgo",
                },
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("cleric-channel-divinity", "Channel Divinity", 2, [
            { type: "resource.add", resource: "channelDivinity", value: 2 },
          ], "classFeatures", {
            label: "Canalizar divinidad",
            description: "Use Divine Spark or Turn Undead; uses recover on rests.",
            sheetText: "Canalizar divinidad: 2 usos; recuperas 1 en descanso corto y todos en descanso largo. CD usa tu CD de conjuros.",
          }),
          feature("cleric-divine-spark", "Divine Spark", 2, [], "classFeatures", {
            label: "Chispa divina",
            description: "Heal or harm a creature within 30 feet.",
            sheetText: "Chispa divina: acción de Magia; criatura a 30 pies recupera 1d8 + Sab PG o sufre necrótico/radiante con salvación CON.",
          }),
          feature("cleric-turn-undead", "Turn Undead", 2, [], "classFeatures", {
            label: "Expulsar muertos vivientes",
            description: "Frighten and incapacitate undead near you.",
            sheetText: "Expulsar muertos vivientes: acción de Magia; no muertos elegidos a 30 pies hacen salvación SAB o quedan Asustados e Incapacitados 1 minuto.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("cleric-subclass", "Cleric Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Clérigo",
            description: "Gain a Cleric domain and its features.",
            sheetText: "Subclase de Clérigo",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("cleric-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("cleric-sear-undead", "Sear Undead", 5, [], "classFeatures", {
            label: "Abrasador de muertos vivientes",
            description: "Turn Undead also deals radiant damage to failed saves.",
            sheetText: "Abrasador de muertos vivientes: al usar Expulsar muertos vivientes, cada no muerto que falle recibe d8s radiantes iguales a tu mod. Sab, mínimo 1d8.",
          }),
        ],
      },
    ],
  },
  barbarian: {
    hitDie: 12,
    levels: [
      {
        level: 1,
        features: [
          feature("barbarian-rage", "Rage", 1, [
            { type: "resource.add", resource: "rage", value: 3 },
          ], "classFeatures", {
            label: "Furia",
            description: "Enter Rage as a Bonus Action for resistance, Strength advantage, and bonus damage.",
            sheetText: "Furia: 3 usos; acción adicional opciónal, sin armadura pesada. Mientras está activa: resistencia a contundente/perforante/cortante, ventaja en Fuerza, +2 daño con ataques de Fuerza. No puedes concentrarte ni lanzar conjuros.",
          }),
          feature("barbarian-unarmored-defense", "Unarmored Defense", 1, [], "classFeatures", {
            label: "Defensa sin armadura",
            description: "While unarmored, AC equals 10 plus Dexterity and Constitution modifiers, plus shield if used.",
            sheetText: "Defensa sin armadura: si no llevas armadura, CA = 10 + DES + CON; puedes usar escudo.",
          }),
          feature("barbarian-weapon-mastery", "Weapon Mastery", 1, [
            { type: "resource.add", resource: "weaponMastery", value: 3 },
          ], "classFeatures", {
            label: "Maestria con armas",
            description: "Use mastery properties for three melee weapons at level 5.",
            sheetText: "Maestria con armas: elige 3 armas cuerpo a cuerpo simples o marciales para usar sus propiedades de maestria.",
            choices: [
              {
                id: "barbarian-weapon-mastery-choice",
                label: "Armas con maestria",
                type: "weaponMastery",
                count: 3,
                from: ["club", "dagger", "greatclub", "handaxe", "javelin", "light-hammer", "mace", "quarterstaff", "sickle", "spear", "battleaxe", "flail", "glaive", "greataxe", "greatsword", "halberd", "lance", "longsword", "maul", "morningstar", "pike", "rapier", "scimitar", "shortsword", "trident", "warhammer", "war-pick", "whip"],
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("barbarian-danger-sense", "Danger Sense", 2, [], "classFeatures", {
            label: "Sentido del peligro",
            description: "Gain Advantage on Dexterity saving throws unless Incapacitated.",
            sheetText: "Sentido del peligro: ventaja en salvaciones de Destreza si no estas Incapacitado.",
          }),
          feature("barbarian-reckless-attack", "Reckless Attack", 2, [], "classFeatures", {
            label: "Ataque temerario",
            description: "Gain Advantage on Strength attack rolls, but attacks against you have Advantage.",
            sheetText: "Ataque temerario: en tu primer ataque del turno puedes ganar ventaja en ataques con Fuerza hasta tu próximo turno; ataques contra ti tienen ventaja.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("barbarian-subclass", "Barbarian Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Bárbaro",
            description: "Gain a Barbarian subclass and its features.",
            sheetText: "Subclase de Bárbaro",
          }),
          feature("barbarian-primal-knowledge", "Primal Knowledge", 3, [], "classFeatures", {
            label: "Conocimiento primal",
            description: "Gain one extra Barbarian skill and use Strength for certain skills while raging.",
            sheetText: "Conocimiento primal: ganas 1 habilidad extra de Bárbaro. En Furia puedes usar Fuerza para Acrobacias, Intimidacion, Percepcion, Sigilo o Supervivencia.",
            choices: [
              {
                id: "barbarian-primal-knowledge-choice",
                label: "Habilidad de Conocimiento primal",
                type: "skill",
                count: 1,
                from: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
              },
            ],
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("barbarian-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("barbarian-extra-attack", "Extra Attack", 5, [
            { type: "attack.count", value: 2 },
          ], "classFeatures", {
            label: "Ataque adicional",
            description: "Attack twice when taking the Attack action.",
            sheetText: "Ataque adicional: 2 ataques con la acción de Atacar.",
          }),
          feature("barbarian-fast-movement", "Fast Movement", 5, [], "classFeatures", {
            label: "Movimiento rápido",
            description: "Speed increases by 10 feet while not wearing Heavy armor.",
            sheetText: "Movimiento rápido: tu Velocidad aumenta en 10 pies si no llevas armadura pesada.",
          }),
        ],
      },
    ],
  },
  bard: {
    hitDie: 8,
    levels: [
      {
        level: 1,
        features: [
          feature("bard-bardic-inspiration", "Bardic Inspiration", 1, [], "classFeatures", {
            label: "Inspiración bardica",
            description: "Inspire another creature with a Bardic Inspiration die.",
            sheetText: "Inspiración bardica: dado d8 a nivel 5. Acción adicional, criatura a 60 pies que te vea u oiga. Usos = mod. Carisma, mínimo 1; a nivel 5 recuperas en descanso corto o largo.",
          }),
          feature("bard-spellcasting", "Spellcasting", 1, [
            { type: "spellcasting.enable", ability: "charisma" },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Prepare Bard spells through music, dance, and words.",
            sheetText: "Lanzamiento de conjuros: Carisma; CD = 8 + Car + competencia; ataque = Car + competencia; foco: instrumento musical.",
            choices: [
              {
                id: "bard-cantrip-choice",
                label: "Trucos de Bardo",
                type: "cantrip",
                count: 3,
                from: bardCantrips,
              },
              {
                id: "bard-prepared-spell-choice",
                label: "Conjuros preparados de Bardo",
                type: "spell",
                count: 9,
                from: bardPreparedSpellsLevel5,
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("bard-expertise", "Expertise", 2, [], "classFeatures", {
            label: "Pericia",
            description: "Gain Expertise in two skill proficiencies.",
            sheetText: "Pericia: elige 2 habilidades competentes; duplicas competencia en ellas.",
            choices: [
              {
                id: "bard-expertise-choice",
                label: "Pericias de Bardo",
                type: "expertise",
                count: 2,
                from: ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"],
              },
            ],
          }),
          feature("bard-jack-of-all-trades", "Jack of All Trades", 2, [], "classFeatures", {
            label: "Aprendiz de todo",
            description: "Add half Proficiency Bonus to skill checks where you lack proficiency.",
            sheetText: "Aprendiz de todo: suma +1 a pruebas de habilidad que no usen tu competencia.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("bard-subclass", "Bard Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Bardo",
            description: "Gain a Bard college and its features.",
            sheetText: "Subclase de Bardo",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("bard-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("bard-font-of-inspiration", "Font of Inspiration", 5, [], "classFeatures", {
            label: "Fuente de inspiracion",
            description: "Regain Bardic Inspiration on Short or Long Rest; spend slots to restore a use.",
            sheetText: "Fuente de inspiracion: recuperas toda Inspiración bardica en descanso corto o largo. Puedes gastar un espacio de conjuro para recuperar 1 uso.",
          }),
        ],
      },
    ],
  },
  druid: {
    hitDie: 8,
    levels: [
      {
        level: 1,
        features: [
          feature("druid-spellcasting", "Spellcasting", 1, [
            { type: "spellcasting.enable", ability: "wisdom" },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Prepare Druid spells after a Long Rest and cast them using Wisdom.",
            sheetText: "Lanzamiento de conjuros: Sabiduría; CD = 8 + Sab + competencia; ataque = Sab + competencia; foco: Foco druídico.",
            choices: [
              {
                id: "druid-cantrip-choice",
                label: "Trucos de Druida",
                type: "cantrip",
                count: 3,
                from: druidCantrips,
              },
              {
                id: "druid-prepared-spell-choice",
                label: "Conjuros preparados hoy de Druida",
                type: "spell",
                count: 9,
                from: druidPreparedSpellsLevel5,
              },
            ],
          }),
          feature("druid-druidic", "Druidic", 1, [
            { type: "language.grant", languages: ["Druidic"] },
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: ["speak-with-animals"] },
          ], "classFeatures", {
            label: "Druídico",
            description: "Know the secret language of Druids and always have Speak with Animals prepared.",
            sheetText: "Druídico: conoces el idioma secreto Druídico. Hablar con animales siempre está preparado.",
          }),
          feature("druid-primal-order", "Primal Order", 1, [], "classFeatures", {
            label: "Orden primal",
            description: "Choose Warden for battle training or Magician for a stronger magical focus.",
            sheetText: "Orden primal: Mágico da 1 truco extra y bono a Arcanos o Naturaleza igual a Sab; Guardian da armadura media y armas marciales.",
            choices: [
              {
                id: "druid-primal-order-choice",
                label: "Orden primal",
                type: "primalOrder",
                count: 1,
                from: ["magician", "warden"],
                optionLabels: {
                  magician: "Mágico",
                  warden: "Guardian",
                },
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("druid-wild-shape", "Wild Shape", 2, [
            { type: "resource.add", resource: "wildShape", value: 2 },
          ], "classFeatures", {
            label: "Forma salvaje",
            description: "Expend Wild Shape uses to transform into known Beast forms.",
            sheetText: "Forma salvaje: 2 usos; acción adicional para asumir forma de Bestia conocida. A nivel 5: 6 formas conocidas, VD max. 1/2 sin vuelo, PG temporales = 5.",
          }),
          feature("druid-wild-companion", "Wild Companion", 2, [], "classFeatures", {
            label: "Compañero salvaje",
            description: "Summon a familiar with primal magic.",
            sheetText: "Compañero salvaje: acción de Magia; gasta espacio o Forma salvaje para lanzar Encontrar familiar sin material. El familiar es Feérico y dura hasta descanso largo.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("druid-subclass", "Druid Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Druida",
            description: "Gain a Druid circle and its features.",
            sheetText: "Subclase de Druida",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("druid-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("druid-wild-resurgence", "Wild Resurgence", 5, [], "classFeatures", {
            label: "Resurgimiento salvaje",
            description: "Convert spell slots and Wild Shape uses when your primal power runs low.",
            sheetText: "Resurgimiento salvaje: 1/turno, si no tienes usos de Forma salvaje puedes gastar un espacio para recuperar 1 uso. 1 vez por descanso largo puedes gastar Forma salvaje para recuperar un espacio de nivel 1.",
          }),
        ],
      },
    ],
  },
  monk: {
    hitDie: 8,
    levels: [
      {
        level: 1,
        features: [
          feature("monk-martial-arts", "Martial Arts", 1, [], "classFeatures", {
            label: "Artes marciales",
            description: "Use Unarmed Strikes and Monk weapons with Dexterity and a Martial Arts die.",
            sheetText: "Artes marciales: sin armadura ni escudo, y desarmado o solo con armas de Monje. Golpe sin armas como acción adicional; dado marcial 1d8 a nivel 5; puedes usar Destreza para ataque/daño de golpes sin armas y armas de Monje, y para CD de Agarrar/Empujar.",
          }),
          feature("monk-unarmored-defense", "Unarmored Defense", 1, [], "classFeatures", {
            label: "Defensa sin armadura",
            description: "While not wearing armor or wielding a Shield, AC equals 10 plus Dexterity and Wisdom modifiers.",
            sheetText: "Defensa sin armadura: si no llevas armadura ni escudo, CA = 10 + DES + SAB.",
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("monk-focus", "Monk's Focus", 2, [
            { type: "resource.add", resource: "focusPoints", value: 5 },
          ], "classFeatures", {
            label: "Enfoque de Monje",
            description: "Spend Focus Points on Flurry of Blows, Patient Defense, and Step of the Wind.",
            sheetText: "Enfoque de Monje: 5 puntos a nivel 5; recuperas todos en descanso corto o largo. CD de enfoque = 8 + SAB + competencia. Ráfaga de golpes: 1 punto, 2 golpes sin armas como acción adicional. Defensa paciente: acción adicional Desenganchar, o 1 punto para Desenganchar y Esquivar. Paso del viento: acción adicional Correr, o 1 punto para Desenganchar y Correr; salto duplicado ese turno.",
          }),
          feature("monk-unarmored-movement", "Unarmored Movement", 2, [], "classFeatures", {
            label: "Movimiento sin armadura",
            description: "Speed increases while not wearing armor or wielding a Shield.",
            sheetText: "Movimiento sin armadura: +10 pies a la Velocidad si no llevas armadura ni escudo.",
          }),
          feature("monk-uncanny-metabolism", "Uncanny Metabolism", 2, [], "classFeatures", {
            label: "Metabolismo sobrenatural",
            description: "Regain Focus Points and hit points when rolling Initiative once per Long Rest.",
            sheetText: "Metabolismo sobrenatural: al tirar iniciativa puedes recuperar todos los puntos de Enfoque; recuperas PG = nivel de Monje + dado marcial. 1 uso por descanso largo.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("monk-deflect-attacks", "Deflect Attacks", 3, [], "classFeatures", {
            label: "Desviar ataques",
            description: "Reduce bludgeoning, piercing, or slashing damage and possibly redirect it.",
            sheetText: "Desviar ataques: reacción cuando te impacta ataque con daño contundente/perforante/cortante; reduces 1d10 + DES + nivel de Monje. Si queda en 0, gasta 1 Enfoque para redirigir: objetivo salvación DES o recibe 2 dados marciales + DES del mismo tipo.",
          }),
          feature("monk-subclass", "Monk Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Monje",
            description: "Gain a Monk subclass and its features.",
            sheetText: "Subclase de Monje",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("monk-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
          feature("monk-slow-fall", "Slow Fall", 4, [], "classFeatures", {
            label: "Caída lenta",
            description: "Use a Reaction to reduce falling damage.",
            sheetText: "Caída lenta: reacción al caer; reduce daño de caída en 25 a nivel 5.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("monk-extra-attack", "Extra Attack", 5, [
            { type: "attack.count", value: 2 },
          ], "classFeatures", {
            label: "Ataque adicional",
            description: "Attack twice when taking the Attack action.",
            sheetText: "Ataque adicional: 2 ataques con la acción de Atacar.",
          }),
          feature("monk-stunning-strike", "Stunning Strike", 5, [], "classFeatures", {
            label: "Golpe aturdidor",
            description: "Spend Focus to stun or hinder a creature you hit once per turn.",
            sheetText: "Golpe aturdidor: 1/turno al impactar con arma de Monje o golpe sin armas, gasta 1 Enfoque. Salvación CON; fallo: Aturdido hasta inicio de tu próximo turno. Éxito: velocidad a la mitad y el próximo ataque contra el objetivo tiene ventaja.",
          }),
        ],
      },
    ],
  },
  paladin: {
    hitDie: 10,
    levels: [
      {
        level: 1,
        features: [
          feature("paladin-lay-on-hands", "Lay On Hands", 1, [
            { type: "resource.add", resource: "layOnHands", value: 25 },
          ], "classFeatures", {
            label: "Imponer manos",
            description: "Use a healing pool to restore hit points or remove Poisoned.",
            sheetText: "Imponer manos: reserva 25 PG a nivel 5; acción adicional, tocas criatura y curas hasta lo restante. Gasta 5 PG de la reserva para quitar Envenenado sin curar.",
          }),
          feature("paladin-spellcasting", "Spellcasting", 1, [
            { type: "spellcasting.enable", ability: "charisma" },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Prepara conjuros de Paladín mediante oración y meditación.",
            sheetText: "Lanzamiento de conjuros: Carisma; CD = 8 + Car + competencia; ataque = Car + competencia; foco: Símbolo sagrado. A nivel 5 preparas 6 conjuros de Paladín de nivel 1 o 2.",
            choices: [
              {
                id: "paladin-prepared-spell-choice",
                label: "Conjuros preparados de Paladín",
                type: "spell",
                count: 6,
                from: paladinPreparedSpellsLevel5,
              },
            ],
          }),
          feature("paladin-weapon-mastery", "Weapon Mastery", 1, [
            { type: "resource.add", resource: "weaponMastery", value: 2 },
          ], "classFeatures", {
            label: "Maestria con armas",
            description: "Choose two proficient weapons whose mastery properties you can use.",
            sheetText: "Maestria con armas: elige 2 armas competentes para usar sus propiedades de maestria; puedes cambiarlas tras descanso largo.",
            choices: [
              {
                id: "paladin-weapon-mastery-choice",
                label: "Armas con maestria",
                type: "weaponMastery",
                count: 2,
                from: ["club", "dagger", "greatclub", "handaxe", "javelin", "light-hammer", "mace", "quarterstaff", "sickle", "spear", "dart", "light-crossbow", "shortbow", "sling", "battleaxe", "flail", "glaive", "greataxe", "greatsword", "halberd", "lance", "longsword", "maul", "morningstar", "pike", "rapier", "scimitar", "shortsword", "trident", "warhammer", "war-pick", "whip", "blowgun", "hand-crossbow", "heavy-crossbow", "longbow"],
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("paladin-fighting-style", "Fighting Style", 2, [], "classFeatures", {
            label: "Estilo de combate",
            description: "Choose a Fighting Style feat or Blessed Warrior.",
            sheetText: "Estilo de combate: elige un estilo de combate o Guerrero bendito. Guerrero bendito da 2 trucos de Clérigo que cuentan como conjuros de Paladín y usan Carisma.",
            choices: [
              {
                id: "paladin-fighting-style-choice",
                label: "Estilo de combate de Paladín",
                type: "fightingStyle",
                count: 1,
                from: ["blessed-warrior", "defense", "dueling", "great-weapon-fighting", "protection"],
                optionLabels: {
                  "blessed-warrior": "Guerrero bendito",
                  defense: "Defensa",
                  dueling: "Duelo",
                  "great-weapon-fighting": "Combate con arma grande",
                  protection: "Protección",
                },
              },
              {
                id: "paladin-blessed-warrior-cantrip-choice",
                label: "Trucos de Guerrero bendito",
                type: "cantrip",
                count: 2,
                from: clericCantrips,
              },
            ],
          }),
          feature("paladin-smite", "Paladin's Smite", 2, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: ["divine-smite"] },
          ], "magic", {
            label: "Castigo divino",
            description: "Always have Castigo divino prepared and cast it once without a slot per Long Rest.",
            sheetText: "Castigo divino: Castigo divino siempre preparado; puedes lanzarlo 1 vez sin gastar espacio por descanso largo.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("paladin-channel-divinity", "Channel Divinity", 3, [
            { type: "resource.add", resource: "channelDivinity", value: 2 },
          ], "classFeatures", {
            label: "Canalizar divinidad",
            description: "Use Divine Sense or subclass Channel Divinity options.",
            sheetText: "Canalizar divinidad: 2 usos; recuperas 1 en descanso corto y todos en descanso largo. CD usa tu CD de conjuros. Sentido divino: acción adicional, 10 min; detecta Celestiales, Infernales y No muertos a 60 pies, y lugares/objetos consagrados o profanados.",
          }),
          feature("paladin-subclass", "Paladin Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Paladín",
            description: "Gain a sacred oath and its features.",
            sheetText: "Juramento sagrado de Paladín",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("paladin-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("paladin-extra-attack", "Extra Attack", 5, [
            { type: "attack.count", value: 2 },
          ], "classFeatures", {
            label: "Ataque adicional",
            description: "Attack twice when taking the Attack action.",
            sheetText: "Ataque adicional: 2 ataques con la acción de Atacar.",
          }),
          feature("paladin-faithful-steed", "Faithful Steed", 5, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: ["find-steed"] },
          ], "magic", {
            label: "Montura fiel",
            description: "Always have Find Steed prepared and cast it once without a slot per Long Rest.",
            sheetText: "Montura fiel: Encontrar montura siempre preparado; puedes lanzarlo 1 vez sin gastar espacio por descanso largo.",
          }),
        ],
      },
    ],
  },
  ranger: {
    hitDie: 10,
    levels: [
      {
        level: 1,
        features: [
          feature("ranger-spellcasting", "Spellcasting", 1, [
            { type: "spellcasting.enable", ability: "wisdom" },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Prepare Ranger spells using Wisdom and a Druidic Focus.",
            sheetText: "Lanzamiento de conjuros: Sabiduría; CD = 8 + Sab + competencia; ataque = Sab + competencia; foco: Foco druídico. A nivel 5 preparas 6 conjuros de Ranger de nivel 1 o 2.",
            choices: [
              {
                id: "ranger-prepared-spell-choice",
                label: "Conjuros preparados de Ranger",
                type: "spell",
                count: 6,
                from: rangerPreparedSpellsLevel5,
              },
            ],
          }),
          feature("ranger-favored-enemy", "Favored Enemy", 1, [
            { type: "resource.add", resource: "favoredEnemy", value: 3 },
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: ["hunters-mark"] },
          ], "magic", {
            label: "Enemigo predilecto",
            description: "Always have Marca del cazador prepared and cast it free a limited number of times.",
            sheetText: "Enemigo predilecto: Marca del cazador siempre preparado; puedes lanzarlo 3 veces sin gastar espacio a nivel 5, recuperas usos en descanso largo.",
          }),
          feature("ranger-weapon-mastery", "Weapon Mastery", 1, [
            { type: "resource.add", resource: "weaponMastery", value: 2 },
          ], "classFeatures", {
            label: "Maestria con armas",
            description: "Choose two proficient weapons whose mastery properties you can use.",
            sheetText: "Maestria con armas: elige 2 armas competentes para usar sus propiedades de maestria; puedes cambiarlas tras descanso largo.",
            choices: [
              {
                id: "ranger-weapon-mastery-choice",
                label: "Armas con maestria",
                type: "weaponMastery",
                count: 2,
                from: ["club", "dagger", "greatclub", "handaxe", "javelin", "light-hammer", "mace", "quarterstaff", "sickle", "spear", "dart", "light-crossbow", "shortbow", "sling", "battleaxe", "flail", "glaive", "greataxe", "greatsword", "halberd", "lance", "longsword", "maul", "morningstar", "pike", "rapier", "scimitar", "shortsword", "trident", "warhammer", "war-pick", "whip", "blowgun", "hand-crossbow", "heavy-crossbow", "longbow"],
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("ranger-deft-explorer", "Deft Explorer", 2, [], "classFeatures", {
            label: "Explorador habil",
            description: "Gain one Expertise and two languages.",
            sheetText: "Explorador habil: elige 1 habilidad competente para ganar pericia; conoces 2 idiomas de tu elección.",
            choices: [
              {
                id: "ranger-deft-explorer-expertise-choice",
                label: "Pericia de Explorador habil",
                type: "expertise",
                count: 1,
                from: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
              },
              {
                id: "ranger-deft-explorer-language-choice",
                label: "Idiomas de Explorador habil",
                type: "language",
                count: 2,
                from: ["Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Abyssal", "Chthonic", "Infernal"],
              },
            ],
          }),
          feature("ranger-fighting-style", "Fighting Style", 2, [], "classFeatures", {
            label: "Estilo de combate",
            description: "Choose a Fighting Style feat or Druidic Warrior.",
            sheetText: "Estilo de combate: elige un estilo de combate o Guerrero druídico. Guerrero druídico da 2 trucos de Druida que cuentan como conjuros de Ranger y usan Sabiduría.",
            choices: [
              {
                id: "ranger-fighting-style-choice",
                label: "Estilo de combate de Ranger",
                type: "fightingStyle",
                count: 1,
                from: ["archery", "defense", "dueling", "druidic-warrior", "two-weapon-fighting"],
                optionLabels: {
                  archery: "Tiro con arco",
                  defense: "Defensa",
                  dueling: "Duelo",
                  "druidic-warrior": "Guerrero druídico",
                  "two-weapon-fighting": "Combate con dos armas",
                },
              },
              {
                id: "ranger-druidic-warrior-cantrip-choice",
                label: "Trucos de Guerrero druídico",
                type: "cantrip",
                count: 2,
                from: druidCantrips,
              },
            ],
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("ranger-subclass", "Ranger Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Ranger",
            description: "Gain a Ranger subclass and its features.",
            sheetText: "Subclase de Ranger",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("ranger-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("ranger-extra-attack", "Extra Attack", 5, [
            { type: "attack.count", value: 2 },
          ], "classFeatures", {
            label: "Ataque adicional",
            description: "Attack twice when taking the Attack action.",
            sheetText: "Ataque adicional: 2 ataques con la acción de Atacar.",
          }),
        ],
      },
    ],
  },
  rogue: {
    hitDie: 8,
    levels: [
      {
        level: 1,
        features: [
          feature("rogue-expertise", "Expertise", 1, [], "classFeatures", {
            label: "Pericia",
            description: "Gain Expertise in two proficient skills.",
            sheetText: "Pericia: elige 2 habilidades competentes; duplicas el bonificador por competencia en ellas.",
            choices: [
              {
                id: "rogue-expertise-choice",
                label: "Pericias de Pícaro",
                type: "expertise",
                count: 2,
                from: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Persuasion", "Sleight of Hand", "Stealth"],
              },
            ],
          }),
          feature("rogue-sneak-attack", "Sneak Attack", 1, [
            { type: "resource.add", resource: "sneakAttackDice", value: 3 },
          ], "classFeatures", {
            label: "Ataque furtivo",
            description: "Deal extra damage once per turn with advantage or an adjacent ally.",
            sheetText: "Ataque furtivo: 1/turno, +3d6 daño si impactas con arma Sutil o a distancia y tienes ventaja; también aplica si un aliado no incapacitado esta a 5 pies del objetivo y no tienes desventaja.",
          }),
          feature("rogue-thieves-cant", "Thieves' Cant", 1, [
            { type: "language.grant", languages: ["Thieves' Cant"] },
          ], "classFeatures", {
            label: "Jerga de ladrones",
            description: "Know Thieves' Cant and one extra language.",
            sheetText: "Jerga de ladrones: conoces Jerga de ladrones y 1 idioma adicional.",
            choices: [
              {
                id: "rogue-thieves-cant-language-choice",
                label: "Idioma de Jerga de ladrones",
                type: "language",
                count: 1,
                from: ["Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Abyssal", "Chthonic", "Infernal"],
              },
            ],
          }),
          feature("rogue-weapon-mastery", "Weapon Mastery", 1, [
            { type: "resource.add", resource: "weaponMastery", value: 2 },
          ], "classFeatures", {
            label: "Maestria con armas",
            description: "Choose two proficient weapons whose mastery properties you can use.",
            sheetText: "Maestria con armas: elige 2 armas competentes para usar sus propiedades de maestria; puedes cambiarlas tras descanso largo.",
            choices: [
              {
                id: "rogue-weapon-mastery-choice",
                label: "Armas con maestria",
                type: "weaponMastery",
                count: 2,
                from: ["club", "dagger", "greatclub", "handaxe", "javelin", "light-hammer", "mace", "quarterstaff", "sickle", "spear", "dart", "light-crossbow", "shortbow", "sling", "rapier", "scimitar", "shortsword", "whip", "hand-crossbow"],
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("rogue-cunning-action", "Cunning Action", 2, [], "classFeatures", {
            label: "Acción astuta",
            description: "Dash, Disengage, or Hide as a Bonus Action.",
            sheetText: "Acción astuta: en tu turno puedes usar acción adicional para Correr, Retirarte o Esconderte.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("rogue-subclass", "Rogue Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Pícaro",
            description: "Gain a Rogue subclass and its features.",
            sheetText: "Subclase de Pícaro",
          }),
          feature("rogue-steady-aim", "Steady Aim", 3, [], "classFeatures", {
            label: "Apuntar firme",
            description: "Use a Bonus Action to gain Advantage on the next attack this turn if you have not moved.",
            sheetText: "Apuntar firme: acción adicional; ganas ventaja en tu próximo ataque del turno. Solo si no te moviste; tu velocidad queda en 0 hasta fin del turno.",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("rogue-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("rogue-cunning-strike", "Cunning Strike", 5, [], "classFeatures", {
            label: "Golpe astuto",
            description: "Spend Sneak Attack dice to add tactical effects.",
            sheetText: "Golpe astuto: al hacer Ataque furtivo puedes quitar 1d6 para aplicar Veneno, Derribo o Retirada. CD = 8 + Des + competencia. Veneno requiere Kit de envenenador; Derribo tumba a objetivo Grande o menor; Retirada te mueve hasta media Velocidad sin provocar oportunidad.",
          }),
          feature("rogue-uncanny-dodge", "Uncanny Dodge", 5, [], "classFeatures", {
            label: "Esquiva asombrosa",
            description: "Use a Reaction to halve damage from a visible attack.",
            sheetText: "Esquiva asombrosa: reacción cuando un atacante visible te impacta; reduces a la mitad el daño del ataque.",
          }),
        ],
      },
    ],
  },
  sorcerer: {
    hitDie: 6,
    levels: [
      {
        level: 1,
        features: [
          feature("sorcerer-spellcasting", "Spellcasting", 1, [
            { type: "spellcasting.enable", ability: "charisma" },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Prepare and cast Sorcerer spells using Charisma.",
            sheetText: "Lanzamiento de conjuros: Carisma; CD = 8 + Car + competencia; ataque = Car + competencia; foco: Foco arcano. A nivel 5 conoces 5 trucos y preparas 9 conjuros de Hechicero de nivel 1-3.",
            choices: [
              {
                id: "sorcerer-cantrip-choice",
                label: "Trucos de Hechicero",
                type: "cantrip",
                count: 5,
                from: sorcererCantrips,
              },
              {
                id: "sorcerer-prepared-spell-choice",
                label: "Conjuros preparados de Hechicero",
                type: "spell",
                count: 9,
                from: sorcererPreparedSpellsLevel5,
              },
            ],
          }),
          feature("sorcerer-innate-sorcery", "Innate Sorcery", 1, [
            { type: "resource.add", resource: "innateSorcery", value: 2 },
          ], "classFeatures", {
            label: "Hechicería innata",
            description: "Unleash innate magic to improve Sorcerer spell attacks and save DC.",
            sheetText: "Hechicería innata: 2 usos por descanso largo. Acción adicional, 1 min; CD de conjuros de Hechicero +1 y ventaja en ataques de conjuro de Hechicero.",
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("sorcerer-font-of-magic", "Font of Magic", 2, [
            { type: "resource.add", resource: "sorceryPoints", value: 5 },
          ], "classFeatures", {
            label: "Fuente de magia",
            description: "Use Sorcery Points to convert spell slots or create spell slots.",
            sheetText: "Fuente de magia: 5 puntos de hechicería a nivel 5. Recuperas todos en descanso largo. Puedes convertir espacios en puntos sin acción; como acción adicional puedes crear espacios: nivel 1 cuesta 2, nivel 2 cuesta 3, nivel 3 cuesta 5.",
          }),
          feature("sorcerer-metamagic", "Metamagic", 2, [], "classFeatures", {
            label: "Metamagia",
            description: "Choose two Metamagic options that modify spells.",
            sheetText: "Metamagia: elige 2 opciónes; gastas puntos de hechicería para modificar conjuros. Normalmente solo puedes aplicar 1 Metamagia por conjuro, salvo que la opción diga lo contrario.",
            choices: [
              {
                id: "sorcerer-metamagic-choice",
                label: "Opciones de Metamagia",
                type: "metamagic",
                count: 2,
                from: sorcererMetamagicOptions,
                optionLabels: {
                  "careful-spell": "Conjuro cuidadoso",
                  "distant-spell": "Conjuro distante",
                  "empowered-spell": "Conjuro potenciado",
                  "extended-spell": "Conjuro prolongado",
                  "heightened-spell": "Conjuro intensificado",
                  "quickened-spell": "Conjuro acelerado",
                  "seeking-spell": "Conjuro buscador",
                  "subtle-spell": "Conjuro sutil",
                  "transmuted-spell": "Conjuro transmutado",
                  "twinned-spell": "Conjuro duplicado",
                },
              },
            ],
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("sorcerer-subclass", "Sorcerer Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Hechicero",
            description: "Gain a Sorcerer subclass and its features.",
            sheetText: "Subclase de Hechicero",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("sorcerer-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("sorcerer-sorcerous-restoration", "Sorcerous Restoration", 5, [], "classFeatures", {
            label: "Restauración hechicera",
            description: "Regain some expended Sorcery Points after a Short Rest once per Long Rest.",
            sheetText: "Restauración hechicera: al terminar descanso corto puedes recuperar puntos de hechicería gastados hasta la mitad de tu nivel de Hechicero redondeado hacia abajo (2 a nivel 5). 1 vez por descanso largo.",
          }),
        ],
      },
    ],
  },
  warlock: {
    hitDie: 8,
    levels: [
      {
        level: 1,
        features: [
          feature("warlock-eldritch-invocations", "Eldritch Invocations", 1, [], "classFeatures", {
            label: "Invocaciones sobrenaturales",
            description: "Choose forbidden lessons that grant magical abilities.",
            sheetText: "Invocaciones sobrenaturales: a nivel 5 conoces 5 invocaciones. Puedes reemplazar 1 al subir de nivel de Brujo, siempre que no sea requisito de otra que conservas.",
            choices: [
              {
                id: "warlock-invocation-choice",
                label: "Invocaciones de Brujo",
                type: "invocation",
                count: 5,
                from: warlockInvocationOptionsLevel5,
                optionLabels: {
                  "agonizing-blast": "Explosión agonizante",
                  "armor-of-shadows": "Armadura de sombras",
                  "ascendant-step": "Paso ascendente",
                  "devils-sight": "Vista del diablo",
                  "eldritch-mind": "Mente sobrenatural",
                  "eldritch-smite": "Castigo sobrenatural",
                  "eldritch-spear": "Lanza sobrenatural",
                  "fiendish-vigor": "Vigor infernal",
                  "gaze-of-two-minds": "Mirada de dos mentes",
                  "gift-of-the-depths": "Don de las profundidades",
                  "investment-of-the-chain-master": "Inversión del amo de la cadena",
                  "lessons-of-the-first-ones": "Lecciones de los primeros",
                  "mask-of-many-faces": "Máscara de muchos rostros",
                  "master-of-myriad-forms": "Maestro de mil formas",
                  "misty-visions": "Visiones brumosas",
                  "one-with-shadows": "Uno con las sombras",
                  "otherworldly-leap": "Salto de otro mundo",
                  "pact-of-the-blade": "Pacto de la hoja",
                  "pact-of-the-chain": "Pacto de la cadena",
                  "pact-of-the-tome": "Pacto del tomo",
                  "repelling-blast": "Explosión repelente",
                  "thirsting-blade": "Hoja sedienta",
                },
              },
              {
                id: "warlock-pact-tome-cantrip-choice",
                label: "Trucos de Pacto del tomo",
                type: "cantrip",
                count: 3,
                from: [
                  ...warlockCantrips,
                  "acid-splash",
                  "dancing-lights",
                  "elementalism",
                  "fire-bolt",
                  "guidance",
                  "light",
                  "mending",
                  "message",
                  "resistance",
                  "sacred-flame",
                  "shocking-grasp",
                  "sorcerous-burst",
                  "spare-the-dying",
                  "word-of-radiance",
                ],
              },
              {
                id: "warlock-pact-tome-ritual-choice",
                label: "Rituales de Pacto del tomo",
                type: "spell",
                count: 2,
                from: pactOfTomeRitualsLevel1,
              },
            ],
          }),
          feature("warlock-pact-magic", "Pact Magic", 1, [
            { type: "spellcasting.enable", ability: "charisma" },
          ], "magic", {
            label: "Magia de pacto",
            description: "Cast Warlock spells with Pact Magic slots that refresh on Short or Long Rest.",
            sheetText: "Magia de pacto: Carisma; CD = 8 + Car + competencia; ataque = Car + competencia. A nivel 5 conoces 3 trucos, preparas 6 conjuros de Brujo y tienes 2 espacios de pacto de nivel 3; recuperas espacios en descanso corto o largo.",
            choices: [
              {
                id: "warlock-cantrip-choice",
                label: "Trucos de Brujo",
                type: "cantrip",
                count: 3,
                from: warlockCantrips,
              },
              {
                id: "warlock-prepared-spell-choice",
                label: "Conjuros preparados de Brujo",
                type: "spell",
                count: 6,
                from: warlockPreparedSpellsLevel5,
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("warlock-magical-cunning", "Magical Cunning", 2, [], "classFeatures", {
            label: "Astucia mágica",
            description: "Recover some Pact Magic slots with a 1-minute rite once per Long Rest.",
            sheetText: "Astucia mágica: rito de 1 minuto; recuperas espacios de Magia de pacto gastados hasta la mitad de tu máximo redondeado hacia arriba. A nivel 5 recuperas 1 espacio. 1 vez por descanso largo.",
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("warlock-subclass", "Warlock Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Brujo",
            description: "Gain a Warlock patrón and its features.",
            sheetText: "Patrono de Brujo",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("warlock-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
    ],
  },
  artificer: {
    hitDie: 8,
    levels: [
      {
        level: 1,
        features: [
          feature("artificer-magical-tinkering", "Magical Tinkering", 1, [], "classFeatures", {
            label: "Artilugio mágico",
            description: "Create a short-lived mundane item with tinker's tools.",
            sheetText: "Artilugio mágico: acción de Magia con herramientas de hojalatero; creas un objeto común barato a 5 pies. Dura 1 hora. Usos = mod. Inteligencia (min. 1) por descanso largo.",
          }),
          feature("artificer-spellcasting", "Spellcasting", 1, [
            { type: "spellcasting.enable", ability: "intelligence" },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Prepare Artificer spells using Intelligence and tools as the focus.",
            sheetText: "Lanzamiento de conjuros: Inteligencia; CD = 8 + Int + competencia; ataque = Int + competencia. Necesitas tener en mano herramientas competentes como foco.",
            choices: [
              {
                id: "artificer-cantrip-choice",
                label: "Trucos de Artífice",
                type: "cantrip",
                count: 2,
                from: artificerCantrips,
              },
              {
                id: "artificer-prepared-spell-choice",
                label: "Conjuros preparados hoy de Artífice",
                type: "spell",
                count: 6,
                from: artificerPreparedSpellsLevel5,
              },
            ],
          }),
        ],
      },
      {
        level: 2,
        features: [
          feature("artificer-replicate-magic-item", "Replicate Magic Item", 2, [
            { type: "resource.add", resource: "artificerMagicItemPlans", value: 4 },
            { type: "resource.add", resource: "artificerReplicatedItems", value: 2 },
          ], "classFeatures", {
            label: "Replicar objeto mágico",
            description: "Know magic item plans and create temporary magic items after a Long Rest.",
            sheetText: "Replicar objeto mágico: conoces 4 planes y al terminar descanso largo puedes crear 2 objetos mágicos distintos de esos planes con herramientas de hojalatero.",
            choices: [
              {
                id: "artificer-magic-item-plan-choice",
                label: "Planes de objeto mágico",
                type: "magicItemPlan",
                count: 4,
                from: artificerMagicItemPlansLevel5,
                optionLabels: {
                  "alchemy-jug": "Jarra alquimica",
                  "bag-of-holding": "Bolsa de contención",
                  "cap-of-water-breathing": "Gorro de respirar bajo el agua",
                  "common-magic-item": "Objeto mágico común permitido",
                  "goggles-of-night": "Gafas de visión nocturna",
                  "rope-of-climbing": "Cuerda de trepar",
                  "sending-stones": "Piedras mensajeras",
                  "shield-plus-one": "Escudo +1",
                  "wand-of-magic-detection": "Varita de detección mágica",
                  "wand-of-secrets": "Varita de secretos",
                  "wand-of-the-war-mage-plus-one": "Varita del mago de guerra +1",
                  "weapon-plus-one": "Arma +1",
                },
              },
              {
                id: "artificer-created-magic-item-choice",
                label: "Objetos replicados hoy",
                type: "magicItemCreated",
                count: 2,
                from: artificerMagicItemPlansLevel5,
                requiresChoiceLabel: "Planes de objeto mágico",
                optionLabels: {
                  "alchemy-jug": "Jarra alquimica",
                  "bag-of-holding": "Bolsa de contención",
                  "cap-of-water-breathing": "Gorro de respirar bajo el agua",
                  "common-magic-item": "Objeto mágico común permitido",
                  "goggles-of-night": "Gafas de visión nocturna",
                  "rope-of-climbing": "Cuerda de trepar",
                  "sending-stones": "Piedras mensajeras",
                  "shield-plus-one": "Escudo +1",
                  "wand-of-magic-detection": "Varita de detección mágica",
                  "wand-of-secrets": "Varita de secretos",
                  "wand-of-the-war-mage-plus-one": "Varita del mago de guerra +1",
                  "weapon-plus-one": "Arma +1",
                },
              },
            ],
          }),
        ],
      },
      {
        level: 3,
        features: [
          feature("artificer-subclass", "Artificer Subclass", 3, [], "subclassFeatures", {
            label: "Subclase de Artífice",
            description: "Gain an Artificer subclass and its features.",
            sheetText: "Subclase de Artífice",
          }),
          feature("artificer-right-tool-for-job", "Right Tool for the Job", 3, [], "classFeatures", {
            label: "Herramienta correcta para el trabajo",
            description: "Magical Tinkering can create artisan's tools.",
            sheetText: "Herramienta correcta: tu Artilugio mágico también puede crear herramientas de artesano temporales.",
          }),
        ],
      },
      {
        level: 4,
        features: [
          feature("artificer-asi-4", "Ability Score Improvement", 4, [], "feats", {
            label: "Mejora de característica",
            description: "Increase ability scores or choose a feat.",
            sheetText: "Mejora de característica: sube atributos o elige una dote para la que califiques.",
          }),
        ],
      },
    ],
  },
};

export const subclassProgression = {
  alchemist: {
    levels: [
      {
        level: 3,
        features: [
          feature("alchemist-tools", "Tool Proficiency", 3, [
            { type: "proficiency.tool", items: ["alchemists-supplies"] },
          ], "subclassFeatures", {
            label: "Competencia con herramientas",
            description: "Gain alchemist's supplies and craft potions faster.",
            sheetText: "Herramientas: ganas suministros de alquimista; si ya los tienes, elige otra herramienta de artesano. Fabricas pociones en la mitad de tiempo.",
          }),
          feature("alchemist-spells", "Alchemist Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: artificerSubclassSpellsLevel5.alchemist },
          ], "magic", {
            label: "Conjuros de alquimista",
            description: "Alchemist spells are always prepared.",
            sheetText: "Conjuros de alquimista siempre preparados: Palabra sanadora, Rayo nauseabundo, Esfera flamigera y Flecha acida de Melf.",
          }),
          feature("alchemist-experimental-elixir", "Experimental Elixir", 3, [
            { type: "resource.add", resource: "experimentalElixirs", value: 3 },
          ], "subclassFeatures", {
            label: "Elixir experimental",
            description: "Create random or chosen elixirs with alchemist's supplies.",
            sheetText: "Elixir experimental: al terminar descanso largo creas 3 elixires. Beber o administrar a 5 pies cuesta acción adicional. Resultados: curación 2d8+Int, +10 pies velocidad, +1 CA, 1d4 a ataques/salvaciones, vuelo 10 pies o elegir otro.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("alchemist-alchemical-savant", "Alchemical Savant", 5, [], "subclassFeatures", {
            label: "Sabio alquimico",
            description: "Add Intelligence to one healing or damage roll for certain Artificer spells.",
            sheetText: "Sabio alquimico: al lanzar conjuro de Artífice usando suministros de alquimista, suma Int (min. +1) a una tirada de curación o daño Ácido, fuego, necrótico o veneno.",
          }),
        ],
      },
    ],
  },
  armorer: {
    levels: [
      {
        level: 3,
        features: [
          feature("armorer-tools", "Tools of the Trade", 3, [
            { type: "proficiency.armor", items: ["Heavy"] },
            { type: "proficiency.tool", items: ["smiths-tools"] },
          ], "subclassFeatures", {
            label: "Herramientas del oficio",
            description: "Gain heavy armor and smith's tools.",
            sheetText: "Herramientas del oficio: ganas armadura pesada y herramientas de herrero; si ya las tienes, elige otra herramienta de artesano. Fabricas armaduras en la mitad de tiempo.",
          }),
          feature("armorer-spells", "Armorer Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: artificerSubclassSpellsLevel5.armorer },
          ], "magic", {
            label: "Conjuros de armero",
            description: "Armorer spells are always prepared.",
            sheetText: "Conjuros de armero siempre preparados: Proyectil mágico, Onda atronadora, Imagen multiple y Estallar.",
          }),
          feature("armorer-arcane-armor", "Arcane Armor", 3, [], "subclassFeatures", {
            label: "Armadura arcana",
            description: "Turn worn armor into Arcane Armor and use it as a focus.",
            sheetText: "Armadura arcana: acción de Magia con herramientas de herrero para convertir armadura equipada. Ignora requisito de Fuerza, se pone/quita como Utilizar, no se retira contra tu voluntad y sirve como foco.",
          }),
          feature("armorer-armor-model", "Armor Model", 3, [], "subclassFeatures", {
            label: "Modelo de armadura",
            description: "Choose Dreadnaught, Guardian, or Infiltrator after a rest.",
            sheetText: "Modelo de armadura: elige Acorazado, Guardian o Infiltrador; puedes cambiarlo tras descanso corto o largo con herramientas de herrero.",
            choices: [
              {
                id: "armorer-armor-model-choice",
                label: "Modelo de armadura",
                type: "armorModel",
                count: 1,
                from: artificerArmorModels,
                optionLabels: {
                  dreadnaught: "Acorazado",
                  guardian: "Guardian",
                  infiltrator: "Infiltrador",
                },
              },
            ],
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("armorer-extra-attack", "Extra Attack", 5, [
            { type: "attack.count", value: 2 },
          ], "subclassFeatures", {
            label: "Ataque adicional",
            description: "Attack twice when taking the Attack action.",
            sheetText: "Ataque adicional: 2 ataques con la acción de Atacar.",
          }),
        ],
      },
    ],
  },
  artillerist: {
    levels: [
      {
        level: 3,
        features: [
          feature("artillerist-tools", "Tool Proficiency", 3, [
            { type: "proficiency.tool", items: ["woodcarvers-tools"] },
          ], "subclassFeatures", {
            label: "Competencia con herramientas",
            description: "Gain woodcarver's tools and craft wands faster.",
            sheetText: "Herramientas: ganas herramientas de tallador; si ya las tienes, elige otra herramienta de artesano. Fabricas varitas en la mitad de tiempo.",
          }),
          feature("artillerist-spells", "Artillerist Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: artificerSubclassSpellsLevel5.artillerist },
          ], "magic", {
            label: "Conjuros de artillero",
            description: "Artillerist spells are always prepared.",
            sheetText: "Conjuros de artillero siempre preparados: Escudo, Onda atronadora, Rayo abrasador y Estallar.",
          }),
          feature("artillerist-eldritch-cannon", "Eldritch Cannon", 3, [
            { type: "resource.add", resource: "eldritchCannon", value: 1 },
          ], "subclassFeatures", {
            label: "Cañón sobrenatural",
            description: "Create a Tiny or Small cannon with offensive or protective modes.",
            sheetText: "Cañón sobrenatural: acción de Magia; creas cañón Pequeño/Diminuto 1 hora, CA 18, PG 25. 1 uso gratis por descanso largo o gasta espacio. Acción adicional a 60 pies: lanzallamas 2d8 fuego cono 15 pies, balista 2d8 fuerza y empuja 5 pies, o protector 1d8+Int PG temporales.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("artillerist-arcane-firearm", "Arcane Firearm", 5, [], "subclassFeatures", {
            label: "Arma de fuego arcana",
            description: "Turn a rod, staff, or wand into a stronger Artificer focus.",
            sheetText: "Arma de fuego arcana: tras descanso largo grabas vara, bastón o varita. Al lanzar conjuro de Artífice por ese foco, suma 1d8 a una tirada de daño del conjuro.",
          }),
        ],
      },
    ],
  },
  "battle-smith": {
    levels: [
      {
        level: 3,
        features: [
          feature("battle-smith-tools", "Tool Proficiency", 3, [
            { type: "proficiency.tool", items: ["smiths-tools"] },
          ], "subclassFeatures", {
            label: "Competencia con herramientas",
            description: "Gain smith's tools and craft weapons faster.",
            sheetText: "Herramientas: ganas herramientas de herrero; si ya las tienes, elige otra herramienta de artesano. Fabricas armas en la mitad de tiempo.",
          }),
          feature("battle-smith-spells", "Battle Smith Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: artificerSubclassSpellsLevel5["battle-smith"] },
          ], "magic", {
            label: "Conjuros de herrero de batalla",
            description: "Battle Smith spells are always prepared.",
            sheetText: "Conjuros de herrero de batalla siempre preparados: Heroísmo, Escudo, Castigo brillante y Vínculo protector.",
          }),
          feature("battle-smith-battle-ready", "Battle Ready", 3, [
            { type: "proficiency.weapon", items: ["Martial weapons"] },
          ], "subclassFeatures", {
            label: "Listo para la batalla",
            description: "Gain martial weapons and use Intelligence with magic weapons.",
            sheetText: "Listo para la batalla: ganas armas marciales. Con armas mágicas puedes usar Inteligencia para ataque y daño en lugar de Fuerza o Destreza.",
          }),
          feature("battle-smith-steel-defender", "Steel Defender", 3, [], "subclassFeatures", {
            label: "Defensor de acero",
            description: "Create a construct companion that fights beside you.",
            sheetText: "Defensor de acero: constructo Mediano, CA 15, PG 30, velocidad 40 pies. Actua en tu turno; sin orden solo Esquiva. Acción adicional para ordenar ataque 1d8+2+Int fuerza, reparar 2d8+Int o reacción para imponer desventaja a un ataque cercano.",
          }),
        ],
      },
      {
        level: 5,
        features: [
          feature("battle-smith-extra-attack", "Extra Attack", 5, [
            { type: "attack.count", value: 2 },
          ], "subclassFeatures", {
            label: "Ataque adicional",
            description: "Attack twice when taking the Attack action.",
            sheetText: "Ataque adicional: 2 ataques con la acción de Atacar.",
          }),
        ],
      },
    ],
  },
  "archfey-patrón": {
    levels: [
      {
        level: 3,
        features: [
          feature("archfey-patrón-spells", "Archfey Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: warlockPatronSpellsLevel5["archfey-patrón"] },
          ], "magic", {
            label: "Conjuros archifeericos",
            description: "Archfey spells are always prepared.",
            sheetText: "Conjuros archifeericos siempre preparados: Calmar emociones, Fuego feérico, Paso brumoso, Fuerza fantasmal, Dormir, Intermitencia y Crecimiento vegetal.",
          }),
          feature("archfey-steps-of-the-fey", "Steps of the Fey", 3, [], "subclassFeatures", {
            label: "Pasos de las hadas",
            description: "Cast Misty Step for free and add a fey effect.",
            sheetText: "Pasos de las hadas: puedes lanzar Paso brumoso sin gastar espacio usos = mod. Carisma (min. 1) por descanso largo. Al lanzarlo eliges: Paso refrescante, tu o criatura a 10 pies gana 1d10 PG temporales; o Paso provocador, criaturas a 5 pies del espacio que dejaste salvación SAB o desventaja al atacar a otros hasta inicio de tu próximo turno.",
          }),
        ],
      },
    ],
  },
  "celestial-patrón": {
    levels: [
      {
        level: 3,
        features: [
          feature("celestial-patrón-spells", "Celestial Spells", 3, [
            { type: "spell.choice", spellKind: "cantrip", spells: warlockPatronCantripsLevel5["celestial-patrón"] },
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: warlockPatronSpellsLevel5["celestial-patrón"] },
          ], "magic", {
            label: "Conjuros celestiales",
            description: "Celestial spells are always prepared.",
            sheetText: "Conjuros celestiales siempre preparados: Luz, Llama sagrada, Aid, Curar heridas, Rayo guiador, Restauración menor, Luz del día y Revivify.",
          }),
          feature("celestial-healing-light", "Healing Light", 3, [
            { type: "resource.add", resource: "healingLightDice", value: 6 },
          ], "subclassFeatures", {
            label: "Luz sanadora",
            description: "Use a pool of d6s to heal yourself or allies.",
            sheetText: "Luz sanadora: reserva de 6d6 a nivel 5. Acción adicional; curas a ti o criatura visible a 60 pies gastando dados. Max dados por uso = mod. Carisma (min. 1). Recuperas la reserva en descanso largo.",
          }),
        ],
      },
    ],
  },
  "fiend-patrón": {
    levels: [
      {
        level: 3,
        features: [
          feature("fiend-dark-ones-blessing", "Dark One's Blessing", 3, [], "subclassFeatures", {
            label: "Bendicion del oscuro",
            description: "Gain Temporary Hit Points when enemies drop near you.",
            sheetText: "Bendicion del oscuro: cuando reduces enemigo a 0 PG, o alguien reduce a 0 PG a enemigo a 10 pies de ti, ganas PG temporales = mod. Carisma + nivel de Brujo (min. 1).",
          }),
          feature("fiend-patrón-spells", "Fiend Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: warlockPatronSpellsLevel5["fiend-patrón"] },
          ], "magic", {
            label: "Conjuros infernales",
            description: "Fiend spells are always prepared.",
            sheetText: "Conjuros infernales siempre preparados: Manos ardientes, Orden imperiosa, Rayo abrasador, Sugestion, Bola de fuego y Nube apestosa.",
          }),
        ],
      },
    ],
  },
  "great-old-one-patrón": {
    levels: [
      {
        level: 3,
        features: [
          feature("great-old-one-awakened-mind", "Awakened Mind", 3, [], "subclassFeatures", {
            label: "Mente despierta",
            description: "Form a temporary telepathic connection.",
            sheetText: "Mente despierta: acción adicional, eliges criatura visible a 30 pies. Pueden comunicarse telepáticamente mientras esten a millas igual a tu mod. Carisma (min. 1). Dura minutos igual a tu nivel de Brujo y requiere compartir idioma mentalmente.",
          }),
          feature("great-old-one-spells", "Great Old One Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: warlockPatronSpellsLevel5["great-old-one-patrón"] },
          ], "magic", {
            label: "Conjuros del gran antiguo",
            description: "Great Old One spells are always prepared.",
            sheetText: "Conjuros del gran antiguo siempre preparados: Detectar pensamientos, Susurros disonantes, Fuerza fantasmal, Risa horrible de Tasha, Clarividencia y Hambre de Hadar.",
          }),
          feature("great-old-one-psychic-spells", "Psychic Spells", 3, [], "subclassFeatures", {
            label: "Conjuros psíquicos",
            description: "Alter damage type and cast subtle enchantments and illusions.",
            sheetText: "Conjuros psíquicos: cuando lanzas conjuro de Brujo que haga daño, puedes cambiarlo a psíquico. Si lanzas conjuro de Brujo de Encantamiento o Ilusión, lo haces sin componentes verbales ni somaticos.",
          }),
        ],
      },
    ],
  },
  "aberrant-sorcery": {
    levels: [
      {
        level: 3,
        features: [
          feature("aberrant-sorcery-psionic-spells", "Psionic Spells", 3, [
            { type: "spell.choice", spellKind: "cantrip", spells: sorcererSubclassSpellsLevel5["aberrant-sorcery"].cantrips },
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: sorcererSubclassSpellsLevel5["aberrant-sorcery"].spells },
          ], "magic", {
            label: "Conjuros psiónicos",
            description: "Aberrant spells are always prepared.",
            sheetText: "Conjuros psiónicos siempre preparados: Astilla mental, Brazos de Hadar, Calmar emociones, Detectar pensamientos, Susurros disonantes, Hambre de Hadar y Enviar.",
          }),
          feature("aberrant-sorcery-telepathic-speech", "Telepathic Speech", 3, [], "subclassFeatures", {
            label: "Habla telepática",
            description: "Form a temporary telepathic connection.",
            sheetText: "Habla telepática: acción adicional, eliges criatura visible a 30 pies. Pueden comunicarse telepáticamente mientras esten a millas igual a tu mod. Carisma (min. 1). Dura minutos igual a tu nivel de Hechicero y requiere compartir idioma mentalmente.",
          }),
        ],
      },
    ],
  },
  "clockwork-sorcery": {
    levels: [
      {
        level: 3,
        features: [
          feature("clockwork-sorcery-clockwork-spells", "Clockwork Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: sorcererSubclassSpellsLevel5["clockwork-sorcery"].spells },
          ], "magic", {
            label: "Conjuros mecánicos",
            description: "Clockwork spells are always prepared.",
            sheetText: "Conjuros mecánicos siempre preparados: Aid, Alarm, Lesser Restoration, Protection from Evil and Good, Dispel Magic y Protection from Energy.",
          }),
          feature("clockwork-sorcery-restore-balance", "Restore Balance", 3, [], "subclassFeatures", {
            label: "Restaurar equilibrio",
            description: "Cancel Advantage or Disadvantage on a d20 roll.",
            sheetText: "Restaurar equilibrio: reacción cuando criatura visible a 60 pies va a tirar d20 con ventaja o desventaja; cancelas ambas. Usos = mod. Carisma (min. 1) por descanso largo.",
          }),
        ],
      },
    ],
  },
  "draconic-sorcery": {
    levels: [
      {
        level: 3,
        features: [
          feature("draconic-sorcery-resilience", "Draconic Resilience", 3, [
            { type: "hitPoints.perLevel", value: 1 },
          ], "subclassFeatures", {
            label: "Resiliencia dracónica",
            description: "Gain extra hit points and natural draconic armor.",
            sheetText: "Resiliencia dracónica: tus PG maximos aumentan en 1 por nivel de Hechicero. Sin armadura, tu CA base es 10 + Destreza + Carisma.",
          }),
          feature("draconic-sorcery-spells", "Draconic Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: sorcererSubclassSpellsLevel5["draconic-sorcery"].spells },
          ], "magic", {
            label: "Conjuros draconicos",
            description: "Draconic spells are always prepared.",
            sheetText: "Conjuros draconicos siempre preparados: Alter Self, Chromatic Orb, Command, Dragon's Breath, Fear y Fly.",
          }),
        ],
      },
    ],
  },
  "wild-magic-sorcery": {
    levels: [
      {
        level: 3,
        features: [
          feature("wild-magic-surge", "Wild Magic Surge", 3, [], "subclassFeatures", {
            label: "Oleada de magia salvaje",
            description: "Roll for wild magic after casting Sorcerer spells with slots.",
            sheetText: "Oleada de magia salvaje: 1/turno, justo después de lanzar conjuro de Hechicero con espacio, puedes tirar 1d20. Con 20, tira en la tabla de Oleada de magia salvaje. Si el efecto es conjuro, no se modifica con Metamagia.",
          }),
          feature("wild-magic-tides-of-chaos", "Tides of Chaos", 3, [], "subclassFeatures", {
            label: "Mareas del caos",
            description: "Gain Advantage on a D20 Test, then recharge through a wild surge or Long Rest.",
            sheetText: "Mareas del caos: ganas ventaja en una prueba d20 antes de tirar. Luego debes lanzar un conjuro de Hechicero con espacio o terminar descanso largo para usarlo de nuevo; si lanzas ese conjuro, tiras automáticamente Oleada de magia salvaje.",
          }),
        ],
      },
    ],
  },
  "arcane-trickster": {
    levels: [
      {
        level: 3,
        features: [
          feature("arcane-trickster-spellcasting", "Spellcasting", 3, [
            { type: "spellcasting.enable", ability: "intelligence" },
            { type: "spell.choice", spellKind: "cantrip", spells: ["mage-hand"] },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Cast Wizard spells using Intelligence.",
            sheetText: "Lanzamiento de conjuros: Inteligencia; Mano de mago fijo. A nivel 5 conoces 2 trucos extra de Mago, preparas 4 conjuros de Mago de nivel 1 y tienes 3 espacios de nivel 1.",
            choices: [
              {
                id: "arcane-trickster-cantrip-choice",
                label: "Trucos de Tramposo arcano",
                type: "cantrip",
                count: 2,
                from: arcaneTricksterCantripsLevel5,
              },
              {
                id: "arcane-trickster-prepared-spell-choice",
                label: "Conjuros preparados de Tramposo arcano",
                type: "spell",
                count: 4,
                from: arcaneTricksterPreparedSpellsLevel5,
              },
            ],
          }),
          feature("arcane-trickster-mage-hand-legerdemain", "Mage Hand Legerdemain", 3, [], "subclassFeatures", {
            label: "Mano de mago ladina",
            description: "Improve Mage Hand for stealth and manipulation.",
            sheetText: "Mano de mago ladina: puedes lanzar Mano de mago como acción adicional, hacerla invisible, controlarla como acción adicional y usarla para pruebas de Destreza (Juego de manos).",
          }),
        ],
      },
    ],
  },
  assassin: {
    levels: [
      {
        level: 3,
        features: [
          feature("assassin-assassinate", "Assassinate", 3, [], "subclassFeatures", {
            label: "Asesinar",
            description: "Improve initiative and first-round strikes.",
            sheetText: "Asesinar: ventaja en iniciativa. En el primer asalto, tienes ventaja contra criaturas que aún no actuaron; si tu Ataque furtivo impacta en ese asalto, suma daño extra igual a tu nivel de Pícaro.",
          }),
          feature("assassin-tools", "Assassin's Tools", 3, [
            { type: "equipment.grant", items: ["disguise-kit", "poisoners-kit"] },
            { type: "proficiency.tool", items: ["disguise-kit", "poisoners-kit"] },
          ], "subclassFeatures", {
            label: "Herramientas de asesino",
            description: "Gain disguise and poison tools.",
            sheetText: "Herramientas de asesino: obtienes Kit de disfraz y Kit de envenenador, y tienes competencia con ambos.",
          }),
        ],
      },
    ],
  },
  soulknife: {
    levels: [
      {
        level: 3,
        features: [
          feature("soulknife-psionic-power", "Psionic Power", 3, [
            { type: "resource.add", resource: "psionicEnergyDice", value: 6 },
          ], "subclassFeatures", {
            label: "Poder psiónico",
            description: "Use psionic dice for skill support and telepathy.",
            sheetText: "Poder psiónico: 6 dados psíquicos d8 a nivel 5. Recuperas 1 en descanso corto y todos en descanso largo. Apoyo psiónico: al fallar prueba con habilidad/herramienta competente, suma 1 dado y solo se gasta si conviertes el fallo en éxito. Susurros psíquicos: acción de Magia, comunicas telepáticamente con criaturas hasta tu PB durante horas igual al dado; primer uso por descanso largo no gasta dado.",
          }),
          feature("soulknife-psychic-blades", "Psychic Blades", 3, [
            { type: "equipment.grant", items: ["psychic-blade"] },
          ], "subclassFeatures", {
            label: "Hojas psíquicas",
            description: "Manifest finesse thrown psychic blades.",
            sheetText: "Hojas psíquicas: al Atacar u oportunidad, manifiestas hoja psíquica. Ataque simple cuerpo a cuerpo, Sutil, Arrojadiza 60/120, daño 1d6 psíquico + mod.; maestria Vex gratis. Tras atacar en tu turno, si la otra mano esta libre puedes atacar con segunda hoja como acción adicional, daño 1d4 psíquico + mod.",
          }),
        ],
      },
    ],
  },
  thief: {
    levels: [
      {
        level: 3,
        features: [
          feature("thief-fast-hands", "Fast Hands", 3, [], "subclassFeatures", {
            label: "Manos rápidas",
            description: "Use quick object and Thieves' Tools actions.",
            sheetText: "Manos rápidas: como acción adicional puedes hacer Juego de manos para abrir cerradura/desactivar trampa con Herramientas de ladrón o robar; también puedes Usar objeto o usar acción Magia para objeto mágico que requiera esa acción.",
          }),
          feature("thief-second-story-work", "Second-Story Work", 3, [], "subclassFeatures", {
            label: "Trabajo de segundo piso",
            description: "Gain climbing and Dexterity-based jumps.",
            sheetText: "Trabajo de segundo piso: ganas velocidad de trepar igual a tu Velocidad; puedes calcular distancia de salto usando Destreza en vez de Fuerza.",
          }),
        ],
      },
    ],
  },
  "beast-master": {
    levels: [
      {
        level: 3,
        features: [
          feature("beast-master-primal-companion", "Primal Companion", 3, [], "subclassFeatures", {
            label: "Compañero primal",
            description: "Summon a primal beast companion.",
            sheetText: "Compañero primal: eliges Bestia de tierra, mar o cielo. Actua durante tu turno; se mueve y usa reacción sola, pero solo Esquiva salvo que uses acción adicional para comandarla o sacrifiques 1 ataque para que use Golpe de bestia. Si muere hace menos de 1 hora, acción de Magia + espacio para revivirla tras 1 min.",
            choices: [
              {
                id: "beast-master-companion-choice",
                label: "Bestia primal",
                type: "beastCompanion",
                count: 1,
                from: ["beast-land", "beast-sea", "beast-sky"],
                optionLabels: {
                  "beast-land": "Bestia de tierra",
                  "beast-sea": "Bestia de mar",
                  "beast-sky": "Bestia de cielo",
                },
              },
            ],
          }),
        ],
      },
    ],
  },
  "fey-wanderer": {
    levels: [
      {
        level: 3,
        features: [
          feature("fey-wanderer-dreadful-strikes", "Dreadful Strikes", 3, [], "subclassFeatures", {
            label: "Golpes aterradores",
            description: "Add psychic damage once per turn when you hit with a weapon.",
            sheetText: "Golpes aterradores: 1/turno al impactar criatura con arma, +1d4 daño psíquico.",
          }),
          feature("fey-wanderer-spells", "Fey Wanderer Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: rangerSubclassSpellsLevel5["fey-wanderer"] },
          ], "magic", {
            label: "Conjuros de errante feérico",
            description: "Fey Wanderer spells are always prepared.",
            sheetText: "Conjuros de errante feérico siempre preparados: Hechizar persona y Paso brumoso.",
          }),
          feature("fey-wanderer-glamour", "Otherworldly Glamour", 3, [], "subclassFeatures", {
            label: "Glamour sobrenatural",
            description: "Add Wisdom to Charisma checks and gain one social skill.",
            sheetText: "Glamour sobrenatural: al hacer prueba de Carisma, suma tu mod. Sabiduría (min. +1). Ganas competencia en Engaño, Interpretación o Persuasion.",
            choices: [
              {
                id: "fey-wanderer-glamour-skill-choice",
                label: "Habilidad de Glamour sobrenatural",
                type: "skill",
                count: 1,
                from: ["Deception", "Performance", "Persuasion"],
              },
            ],
          }),
        ],
      },
    ],
  },
  "gloom-stalker": {
    levels: [
      {
        level: 3,
        features: [
          feature("gloom-stalker-dread-ambusher", "Dread Ambusher", 3, [
            { type: "resource.add", resource: "dreadfulStrike", value: 1 },
          ], "subclassFeatures", {
            label: "Emboscador aterrador",
            description: "Improve first-turn movement, initiative, and weapon damage bursts.",
            sheetText: "Emboscador aterrador: en tu primer turno de cada combate, +10 pies velocidad hasta fin del turno. Al impactar con arma, puedes hacer +2d6 psíquico 1/turno; usos = Sab (min. 1) por descanso largo. Sumas Sabiduría a iniciativa.",
          }),
          feature("gloom-stalker-spells", "Gloom Stalker Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: rangerSubclassSpellsLevel5["gloom-stalker"] },
          ], "magic", {
            label: "Conjuros de acechador sombrio",
            description: "Gloom Stalker spells are always prepared.",
            sheetText: "Conjuros de acechador sombrio siempre preparados: Disfrazarse y Truco de cuerda.",
          }),
          feature("gloom-stalker-umbral-sight", "Umbral Sight", 3, [
            { type: "sense.darkvision", value: 60 },
          ], "subclassFeatures", {
            label: "Visión umbria",
            description: "Gain Darkvision and become invisible to creatures relying on Darkvision in Darkness.",
            sheetText: "Visión umbria: Visión en la oscuridad 60 pies, o +60 pies si ya la tienes. Mientras estas completamente en oscuridad, eres Invisible para criaturas que dependen de Visión en la oscuridad para verte.",
          }),
        ],
      },
    ],
  },
  hunter: {
    levels: [
      {
        level: 3,
        features: [
          feature("hunter-lore", "Hunter's Lore", 3, [], "subclassFeatures", {
            label: "Saber del cazador",
            description: "Learn immunities, resistances, and vulnerabilities of Marca del cazador targets.",
            sheetText: "Saber del cazador: mientras una criatura esta marcada por Marca del cazador, sabes si tiene inmunidades, resistencias o vulnerabilidades y cuales son.",
          }),
          feature("hunter-prey", "Hunter's Prey", 3, [], "subclassFeatures", {
            label: "Presa del cazador",
            description: "Choose Colossus Slayer or Horde Breaker; can swap after a rest.",
            sheetText: "Presa del cazador: elige una opción, puedes cambiarla tras descanso corto o largo. Coloso: 1/turno, al impactar con arma a criatura herida, +1d8 daño. Rompehordas: 1/turno, al atacar con arma, haces otro ataque con la misma arma contra criatura distinta a 5 pies del objetivo original, dentro del alcance y que no hayas atacado este turno.",
            choices: [
              {
                id: "hunter-prey-choice",
                label: "Presa del cazador",
                type: "hunterPrey",
                count: 1,
                from: ["colossus-slayer", "horde-breaker"],
                optionLabels: {
                  "colossus-slayer": "Azote de colosos",
                  "horde-breaker": "Rompehordas",
                },
              },
            ],
          }),
        ],
      },
    ],
  },
  "devotion-oath": {
    levels: [
      {
        level: 3,
        features: [
          feature("devotion-oath-spells", "Oath of Devotion Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: paladinOathSpellsLevel5["devotion-oath"] },
          ], "magic", {
            label: "Conjuros de devocion",
            description: "Devotion oath spells are always prepared.",
            sheetText: "Conjuros de devocion siempre preparados: Protección contra el mal y el bien, Escudo de fe, Ayuda y Zona de verdad.",
          }),
          feature("devotion-sacred-weapon", "Sacred Weapon", 3, [], "subclassFeatures", {
            label: "Arma sagrada",
            description: "Spend Channel Divinity to empower a melee weapon.",
            sheetText: "Arma sagrada: al tomar la acción Atacar, gasta Canalizar divinidad para imbuir 1 arma cuerpo a cuerpo que sostienes por 10 min. Sumas Carisma a ataques con ella (min. +1); al impactar puede hacer su daño normal o radiante. Emite luz 20/20 pies.",
          }),
        ],
      },
    ],
  },
  "glory-oath": {
    levels: [
      {
        level: 3,
        features: [
          feature("glory-inspiring-smite", "Inspiring Smite", 3, [], "subclassFeatures", {
            label: "Castigo inspirador",
            description: "After Castigo divino, spend Channel Divinity to distribute temporary hit points.",
            sheetText: "Castigo inspirador: justo después de lanzar Castigo divino, gasta Canalizar divinidad; reparte PG temporales = 2d8 + nivel de Paladín entre criaturas elegidas a 30 pies, incluyéndote si quieres.",
          }),
          feature("glory-oath-spells", "Oath of Glory Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: paladinOathSpellsLevel5["glory-oath"] },
          ], "magic", {
            label: "Conjuros de gloria",
            description: "Glory oath spells are always prepared.",
            sheetText: "Conjuros de gloria siempre preparados: Rayo guiador, Heroísmo, Mejorar característica y Arma mágica.",
          }),
          feature("glory-peerless-athlete", "Peerless Athlete", 3, [], "subclassFeatures", {
            label: "Atleta sin igual",
            description: "Spend Channel Divinity to improve Athletics, Acrobatics, and jumps.",
            sheetText: "Atleta sin igual: acción adicional, gasta Canalizar divinidad; por 1 hora tienes ventaja en Atletismo y Acrobacias, y tus saltos largos/altos aumentan 10 pies.",
          }),
        ],
      },
    ],
  },
  "ancients-oath": {
    levels: [
      {
        level: 3,
        features: [
          feature("ancients-natures-wrath", "Nature's Wrath", 3, [], "subclassFeatures", {
            label: "Ira de la naturaleza",
            description: "Spend Channel Divinity to restrain nearby creatures with spectral vines.",
            sheetText: "Ira de la naturaleza: acción de Magia, gasta Canalizar divinidad; criaturas elegidas visibles a 15 pies hacen salvación FUE o quedan Restringidas 1 min. Repiten al final de cada turno.",
          }),
          feature("ancients-oath-spells", "Oath of the Ancients Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: paladinOathSpellsLevel5["ancients-oath"] },
          ], "magic", {
            label: "Conjuros de los antiguos",
            description: "Ancients oath spells are always prepared.",
            sheetText: "Conjuros de los antiguos siempre preparados: Golpe atrapador, Hablar con animales, Paso brumoso y Rayo lunar.",
          }),
        ],
      },
    ],
  },
  "vengeance-oath": {
    levels: [
      {
        level: 3,
        features: [
          feature("vengeance-oath-spells", "Oath of Vengeance Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: paladinOathSpellsLevel5["vengeance-oath"] },
          ], "magic", {
            label: "Conjuros de venganza",
            description: "Vengeance oath spells are always prepared.",
            sheetText: "Conjuros de venganza siempre preparados: Perdicion, Marca del cazador, Inmovilizar persona y Paso brumoso.",
          }),
          feature("vengeance-vow-of-enmity", "Vow of Enmity", 3, [], "subclassFeatures", {
            label: "Voto de enemistad",
            description: "Spend Channel Divinity to gain Advantage against one creature.",
            sheetText: "Voto de enemistad: al tomar la acción Atacar, gasta Canalizar divinidad contra criatura visible a 30 pies. Tienes ventaja en ataques contra ella 1 min o hasta usarlo otra vez. Si cae a 0 PG, transfieres el voto a otra criatura a 30 pies sin acción.",
          }),
        ],
      },
    ],
  },
  "mercy-warrior": {
    levels: [
      {
        level: 3,
        features: [
          feature("mercy-hand-of-harm", "Hand of Harm", 3, [], "subclassFeatures", {
            label: "Mano del daño",
            description: "Spend Focus to add necrotic damage after an Unarmed Strike.",
            sheetText: "Mano del daño: 1/turno al impactar con golpe sin armas y hacer daño, gasta 1 Enfoque para daño necrótico extra = dado marcial + SAB.",
          }),
          feature("mercy-hand-of-healing", "Hand of Healing", 3, [], "subclassFeatures", {
            label: "Mano de curación",
            description: "Spend Focus to restore hit points, or replace one Flurry of Blows strike with healing.",
            sheetText: "Mano de curación: acción de Magia, gasta 1 Enfoque y tocas criatura; cura dado marcial + SAB. Al usar Ráfaga de golpes, puedes reemplazar 1 golpe por esta curación sin gastar Enfoque extra.",
          }),
          feature("mercy-implements", "Implements of Mercy", 3, [
            { type: "proficiency.skill", items: ["Insight", "Medicine"] },
            { type: "proficiency.tool", items: ["herbalism-kit"] },
          ], "subclassFeatures", {
            label: "Implementos de misericordia",
            description: "Gain Insight, Medicine, and Herbalism Kit proficiency.",
            sheetText: "Implementos de misericordia: competencia en Perspicacia, Medicina y Kit de herboristería.",
          }),
        ],
      },
    ],
  },
  "shadow-warrior": {
    levels: [
      {
        level: 3,
        features: [
          feature("shadow-arts", "Shadow Arts", 3, [
            { type: "sense.darkvision", value: 60 },
            { type: "spellcasting.enable", ability: "wisdom" },
            { type: "spell.choice", spellKind: "cantrip", spells: ["minor-illusion"] },
          ], "subclassFeatures", {
            label: "Artes sombrio",
            description: "Use Focus for Darkness, gain Darkvision, and know Minor Illusion.",
            sheetText: "Artes sombrio: gasta 1 Enfoque para lanzar Oscuridad sin componentes; puedes ver dentro de esa oscuridad y moverla a 60 pies al inicio de tus turnos. Visión en la oscuridad 60 pies, o +60 pies si ya la tienes. Conoces Ilusión menor; Sabiduría es tu aptitud mágica.",
          }),
        ],
      },
    ],
  },
  "elements-warrior": {
    levels: [
      {
        level: 3,
        features: [
          feature("elements-attunement", "Elemental Attunement", 3, [], "subclassFeatures", {
            label: "Sintonización elemental",
            description: "Spend Focus to empower Unarmed Strikes with elemental reach and damage.",
            sheetText: "Sintonización elemental: al inicio de tu turno gasta 1 Enfoque; dura 10 min o hasta Incapacitado. Tus golpes sin armas tienen +10 pies alcance. Al impactar, pueden hacer Ácido, frío, fuego, relámpago o trueno; si lo hacen, objetivo salvación FUE o lo mueves 10 pies hacia ti o lejos de ti.",
          }),
          feature("elements-manipulate", "Manipulate Elements", 3, [
            { type: "spellcasting.enable", ability: "wisdom" },
            { type: "spell.choice", spellKind: "cantrip", spells: ["elementalism"] },
          ], "subclassFeatures", {
            label: "Manipular elementos",
            description: "Know Elementalism using Wisdom.",
            sheetText: "Manipular elementos: conoces Elementalismo; Sabiduría es tu aptitud mágica.",
          }),
        ],
      },
    ],
  },
  "open-hand-warrior": {
    levels: [
      {
        level: 3,
        features: [
          feature("open-hand-technique", "Open Hand Technique", 3, [], "subclassFeatures", {
            label: "Técnica de mano abierta",
            description: "Apply an effect when a Flurry of Blows attack hits.",
            sheetText: "Técnica de mano abierta: cuando impactas con ataque otorgado por Ráfaga de golpes, elige: Aturdir leve, no puede hacer ataques de oportunidad hasta inicio de su próximo turno; Empujar, salvación FUE o empujas 15 pies; Derribar, salvación DES o queda Tumbado.",
          }),
        ],
      },
    ],
  },
  "land-circle": {
    levels: [
      {
        level: 3,
        features: [
          feature("land-circle-spells", "Circle of the Land Spells", 3, [], "magic", {
            label: "Conjuros del círculo",
            description: "Choose a land type after a Long Rest to gain circle spells.",
            sheetText: "Conjuros del círculo: tras descanso largo elige tierra arida, polar, templada o tropical; esos conjuros siempre están preparados hasta el siguiente descanso largo.",
            choices: [
              {
                id: "land-circle-type-choice",
                label: "Tipo de tierra",
                type: "landType",
                count: 1,
                from: ["arid", "polar", "temperate", "tropical"],
                optionLabels: {
                  arid: "Arida",
                  polar: "Polar",
                  temperate: "Templada",
                  tropical: "Tropical",
                },
              },
            ],
          }),
          feature("land-circle-lands-aid", "Land's Aid", 3, [], "subclassFeatures", {
            label: "Auxilio de la tierra",
            description: "Spend Wild Shape to drain enemies and restore an ally.",
            sheetText: "Auxilio de la tierra: acción de Magia, gasta Forma salvaje; punto a 60 pies, esfera 10 pies. Criaturas elegidas salvación CON, 2d6 necrótico o mitad; una criatura elegida recupera 2d6 PG.",
          }),
        ],
      },
    ],
  },
  "moon-circle": {
    levels: [
      {
        level: 3,
        features: [
          feature("moon-circle-forms", "Circle Forms", 3, [], "subclassFeatures", {
            label: "Formas del círculo",
            description: "Improve Wild Shape forms while transformed.",
            sheetText: "Formas del círculo: en Forma salvaje, VD max. = nivel de Druida / 3 redondeado abajo; a nivel 5 VD 1. CA = 13 + Sab si supera la CA de la Bestia. PG temporales = 15.",
          }),
          feature("moon-circle-spells", "Circle of the Moon Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: druidCircleSpellsLevel5["moon-circle"] },
          ], "magic", {
            label: "Conjuros de luna",
            description: "Always have the Moon circle spells prepared and cast them in Wild Shape.",
            sheetText: "Conjuros de luna siempre preparados: Curar heridas, Rayo lunar, Destello estrellado y Conjurar animales. Puedes lanzarlos en Forma salvaje.",
          }),
        ],
      },
    ],
  },
  "sea-circle": {
    levels: [
      {
        level: 3,
        features: [
          feature("sea-circle-spells", "Circle of the Sea Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: druidCircleSpellsLevel5["sea-circle"] },
          ], "magic", {
            label: "Conjuros del mar",
            description: "Always have the Sea circle spells prepared.",
            sheetText: "Conjuros del mar siempre preparados: Nube brumosa, Ráfaga de viento, Rayo de escarcha, Estallar, Onda atronadora, Relámpago y Respirar bajo el agua.",
          }),
          feature("sea-circle-wrath", "Wrath of the Sea", 3, [], "subclassFeatures", {
            label: "Ira del mar",
            description: "Spend Wild Shape to surround yourself with pushing ocean spray.",
            sheetText: "Ira del mar: acción adicional, gasta Forma salvaje; emanacion 5 pies por 10 min. Al activarla y como acción adicional, criatura en emanacion salvación CON o recibe frío = dados d6 iguales a Sab (min. 1d6) y empuje hasta 15 pies si es Grande o menor.",
          }),
        ],
      },
    ],
  },
  "stars-circle": {
    levels: [
      {
        level: 3,
        features: [
          feature("stars-circle-star-map", "Star Map", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: druidCircleSpellsLevel5["stars-circle"] },
          ], "magic", {
            label: "Mapa estelar",
            description: "Use a star map as a focus and gain star spells.",
            sheetText: "Mapa estelar: sirve como foco. Guía y Rayo guía están preparados; puedes lanzar Rayo guía sin espacio usos = Sab (min. 1) por descanso largo.",
          }),
          feature("stars-circle-starry-form", "Starry Form", 3, [], "subclassFeatures", {
            label: "Forma estrellada",
            description: "Spend Wild Shape to take a luminous star form with a chosen constellation.",
            sheetText: "Forma estrellada: acción adicional, gasta Forma salvaje; dura 10 min. Elige Arquero (ataque a distancia 60 pies, 1d8 + Sab radiante), Caliz (curación extra 1d8 + Sab) o Dragon (9 o menos cuenta como 10 en Int/Sab y concentración).",
          }),
        ],
      },
    ],
  },
  "life-domain": {
    levels: [
      {
        level: 3,
        features: [
          feature("life-domain-spells", "Life Domain Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: clericDomainSpellsLevel5["life-domain"] },
          ], "magic", {
            label: "Conjuros de dominio de vida",
            description: "Life domain spells are always prepared.",
            sheetText: "Conjuros siempre preparados: Aid, Bless, Cure Wounds, Lesser Restoration, Mass Healing Word y Revivify.",
          }),
          feature("life-disciple-of-life", "Disciple of Life", 3, [], "subclassFeatures", {
            label: "Discipulo de vida",
            description: "Healing spells restore extra hit points.",
            sheetText: "Discipulo de vida: si un conjuro con espacio restaura PG, suma 2 + nivel del espacio a la curación.",
          }),
          feature("life-preserve-life", "Preserve Life", 3, [], "subclassFeatures", {
            label: "Preservar vida",
            description: "Use Channel Divinity to restore a pool of hit points.",
            sheetText: "Preservar vida: acción de Magia y 1 Canalizar divinidad; reparte hasta 25 PG entre criaturas ensangrentadas a 30 pies, sin superar mitad de PG maximos.",
          }),
        ],
      },
    ],
  },
  "light-domain": {
    levels: [
      {
        level: 3,
        features: [
          feature("light-domain-spells", "Light Domain Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: clericDomainSpellsLevel5["light-domain"] },
          ], "magic", {
            label: "Conjuros de dominio de luz",
            description: "Light domain spells are always prepared.",
            sheetText: "Conjuros siempre preparados: Manos ardientes, Fuego feérico, Rayo abrasador, Ver invisibilidad, Luz del día y Bola de fuego.",
          }),
          feature("light-radiance-of-the-dawn", "Radiance of the Dawn", 3, [], "subclassFeatures", {
            label: "Resplandor del alba",
            description: "Use Channel Divinity to dispel magical darkness and burn nearby creatures.",
            sheetText: "Resplandor del alba: acción de Magia y 1 Canalizar divinidad; emanacion 30 pies, disipa oscuridad mágica y daño radiante 2d10 + 5, salvación CON mitad.",
          }),
          feature("light-warding-flare", "Warding Flare", 3, [], "subclassFeatures", {
            label: "Destello protector",
            description: "Use a reaction to impose Disadvantage on an attack.",
            sheetText: "Destello protector: reacción cuando una criatura a 30 pies ataca; impone Desventaja. Usos = mod. Sab, mínimo 1 por descanso largo.",
          }),
        ],
      },
    ],
  },
  "trickery-domain": {
    levels: [
      {
        level: 3,
        features: [
          feature("trickery-domain-spells", "Trickery Domain Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: clericDomainSpellsLevel5["trickery-domain"] },
          ], "magic", {
            label: "Conjuros de dominio del engaño",
            description: "Trickery domain spells are always prepared.",
            sheetText: "Conjuros siempre preparados: Hechizar persona, Disfrazarse, Invisibilidad, Pasar sin dejar rastro, Patron hipnotico e Indetectable.",
          }),
          feature("trickery-blessing", "Blessing of the Trickster", 3, [], "subclassFeatures", {
            label: "Bendicion del embaucador",
            description: "Grant Advantage on Stealth checks.",
            sheetText: "Bendicion del embaucador: acción de Magia; tu o criatura voluntaria a 30 pies gana ventaja en Sigilo hasta descanso largo o nuevo uso.",
          }),
          feature("trickery-invoke-duplicity", "Invoke Duplicity", 3, [], "subclassFeatures", {
            label: "Invocar duplicidad",
            description: "Use Channel Divinity to create an illusory duplicate.",
            sheetText: "Invocar duplicidad: acción adicional y 1 Canalizar divinidad; crea duplicado ilusorio 1 min a 30 pies. Puedes lanzar desde su espacio, distraer y moverlo 30 pies.",
          }),
        ],
      },
    ],
  },
  "war-domain": {
    levels: [
      {
        level: 3,
        features: [
          feature("war-domain-spells", "War Domain Spells", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: clericDomainSpellsLevel5["war-domain"] },
          ], "magic", {
            label: "Conjuros de dominio de guerra",
            description: "War domain spells are always prepared.",
            sheetText: "Conjuros siempre preparados: Guiding Bolt, Magic Weapon, Shield of Faith, Spiritual Weapon, Crusader's Mantle y Spirit Guardians.",
          }),
          feature("war-guided-strike", "Guided Strike", 3, [], "subclassFeatures", {
            label: "Golpe guiado",
            description: "Use Channel Divinity to add +10 to a missed attack.",
            sheetText: "Golpe guiado: cuando tu o criatura a 30 pies falla ataque, gasta 1 Canalizar divinidad y suma +10; si ayudas a otro, usas reacción.",
          }),
          feature("war-priest", "War Priest", 3, [], "subclassFeatures", {
            label: "Sacerdote de guerra",
            description: "Make a weapon or unarmed attack as a Bonus Action.",
            sheetText: "Sacerdote de guerra: acción adicional para atacar con arma o golpe sin armas. Usos = mod. Sab, mínimo 1; recupera en descanso corto o largo.",
          }),
        ],
      },
    ],
  },
  berserker: {
    levels: [
      {
        level: 3,
        features: [
          feature("berserker-frenzy", "Frenzy", 3, [], "subclassFeatures", {
            label: "Frenesi",
            description: "Deal extra damage with the first Strength-based hit after Reckless Attack while raging.",
            sheetText: "Frenesi: si usas Ataque temerario mientras estas en Furia, el primer objetivo que golpees ese turno con ataque de Fuerza recibe +2d6 daño del mismo tipo.",
          }),
        ],
      },
    ],
  },
  "wild-heart": {
    levels: [
      {
        level: 3,
        features: [
          feature("wild-heart-animal-speaker", "Animal Speaker", 3, [], "subclassFeatures", {
            label: "Hablante animal",
            description: "Cast Beast Sense and Speak with Animals only as rituals.",
            sheetText: "Hablante animal: puedes lanzar Beast Sense y Speak with Animals solo como rituales; aptitud Sabiduría.",
          }),
          feature("wild-heart-rage-of-the-wilds", "Rage of the Wilds", 3, [], "subclassFeatures", {
            label: "Furia de las tierras salvajes",
            description: "Choose Bear, Eagle, or Wolf whenever you activate Rage.",
            sheetText: "Furia salvaje: al activar Furia eliges Oso (resistencia a todo excepto fuerza/necrótico/psíquico/radiante), Aguila (Retirarte y Correr al activar y como acción adicional), o Lobo (aliados tienen ventaja contra enemigos a 5 pies de ti).",
          }),
        ],
      },
    ],
  },
  "world-tree": {
    levels: [
      {
        level: 3,
        features: [
          feature("world-tree-vitality", "Vitality of the Tree", 3, [], "subclassFeatures", {
            label: "Vitalidad del Árbol",
            description: "Gain temporary hit points when raging and grant them to another creature each turn.",
            sheetText: "Vitalidad del Árbol: al activar Furia ganas 5 PG temporales. Al inicio de cada turno en Furia, otra criatura a 10 pies gana 2d6 PG temporales.",
          }),
        ],
      },
    ],
  },
  zealot: {
    levels: [
      {
        level: 3,
        features: [
          feature("zealot-divine-fury", "Divine Fury", 3, [], "subclassFeatures", {
            label: "Furia divina",
            description: "Deal extra Necrotic or Radiant damage once each turn while raging.",
            sheetText: "Furia divina: una vez por turno en Furia, el primer objetivo que golpees con arma o golpe sin armas recibe +1d6 + 2 necrótico o radiante.",
          }),
          feature("zealot-warrior-of-the-gods", "Warrior of the Gods", 3, [
            { type: "resource.add", resource: "warriorOfTheGods", value: 4 },
          ], "subclassFeatures", {
            label: "Guerrero de los dioses",
            description: "Spend d12s to heal yourself as a Bonus Action.",
            sheetText: "Guerrero de los dioses: reserva de 4d12; acción adicional para gastar dados y curarte el total. Recuperas la reserva en descanso largo.",
          }),
        ],
      },
    ],
  },
  "dance-college": {
    levels: [
      {
        level: 3,
        features: [
          feature("dance-dazzling-footwork", "Dazzling Footwork", 3, [], "subclassFeatures", {
            label: "Juego de pies deslumbrante",
            description: "Gain dance performance benefits, unarmored defense, agile strikes, and Bardic unarmed damage.",
            sheetText: "Juego de pies deslumbrante: sin armadura ni escudo, CA = 10 + DES + CAR. Ventaja en Interpretación para bailar. Al gastar Inspiración como parte de acción/acción adicional/reacción puedes hacer 1 golpe sin armas. Golpes sin armas pueden usar DES y daño = d8 bardico + DES.",
          }),
        ],
      },
    ],
  },
  "glamour-college": {
    levels: [
      {
        level: 3,
        features: [
          feature("glamour-beguiling-magic", "Beguiling Magic", 3, [
            { type: "spell.choice", spellKind: "alwaysPrepared", spells: bardCollegeSpellsLevel5["glamour-college"] },
          ], "magic", {
            label: "Magia cautivadora",
            description: "Charm Person and Mirror Image are always prepared; enchantment or illusion can charm or frighten.",
            sheetText: "Magia cautivadora: Hechizar persona e Imagen multiple siempre preparados. Tras lanzar Encantamiento o Ilusión con espacio, criatura a 60 pies salva SAB o queda Encantada o Asustada 1 min. 1 uso por descanso largo o gasta Inspiración para recuperar.",
          }),
          feature("glamour-mantle-of-inspiration", "Mantle of Inspiration", 3, [], "subclassFeatures", {
            label: "Manto de inspiracion",
            description: "Spend Bardic Inspiration to grant temporary hit points and movement.",
            sheetText: "Manto de inspiracion: acción adicional y 1 Inspiración; hasta mod. Car criaturas a 60 pies ganan PG temporales = 2 x d8 bardico y pueden usar reacción para moverse sin ataques de oportunidad.",
          }),
        ],
      },
    ],
  },
  "lore-college": {
    levels: [
      {
        level: 3,
        features: [
          feature("lore-bonus-proficiencies", "Bonus Proficiencies", 3, [], "subclassFeatures", {
            label: "Competencias adicionales",
            description: "Gain proficiency with three skills of your choice.",
            sheetText: "Competencias adicionales: elige 3 habilidades extra.",
            choices: [
              {
                id: "lore-bonus-skill-choice",
                label: "Habilidades del Colegio del saber",
                type: "skill",
                count: 3,
                from: ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"],
              },
            ],
          }),
          feature("lore-cutting-words", "Cutting Words", 3, [], "subclassFeatures", {
            label: "Palabras cortantes",
            description: "Use Bardic Inspiration as a Reaction to reduce a roll.",
            sheetText: "Palabras cortantes: reacción cuando criatura visible a 60 pies hace daño o tiene éxito en prueba/ataque; gastas Inspiración y restas d8 al resultado.",
          }),
        ],
      },
    ],
  },
  "valor-college": {
    levels: [
      {
        level: 3,
        features: [
          feature("valor-combat-inspiration", "Combat Inspiration", 3, [], "subclassFeatures", {
            label: "Inspiración de combate",
            description: "Bardic Inspiration can improve defense or damage.",
            sheetText: "Inspiración de combate: quien tenga tu dado puede usar reacción al recibir impacto para sumar d8 a CA, o sumar d8 al daño tras impactar.",
          }),
          feature("valor-martial-training", "Martial Training", 3, [
            { type: "proficiency.weapon", items: ["Martial weapons"] },
            { type: "proficiency.armor", items: ["Medium", "Shields"] },
          ], "subclassFeatures", {
            label: "Entrenamiento marcial",
            description: "Gain Martial weapons, Medium armor, Shields, and weapon focus.",
            sheetText: "Entrenamiento marcial: armas marciales, armadura media y escudos. Puedes usar arma simple o marcial como foco de conjuros de Bardo.",
          }),
        ],
      },
    ],
  },
  "battle-master": {
    levels: [
      {
        level: 3,
        features: [
          feature("battle-master-combat-superiority", "Combat Superiority", 3, [
            { type: "resource.add", resource: "superiorityDice", value: 4 },
          ], "subclassFeatures", {
            label: "Superioridad en combate",
            description: "Learn maneuvers powered by d8 Superiority Dice.",
            sheetText: "Superioridad en combate: 4 dados d8 por descanso corto o largo; elige 3 maniobras.",
            choices: [
              {
                id: "battle-master-maneuver-choice",
                label: "Maniobras",
                type: "maneuver",
                count: 3,
                from: [
                  "ambush",
                  "bait-and-switch",
                  "commanders-strike",
                  "commanding-presence",
                  "disarming-attack",
                  "distracting-strike",
                  "evasive-footwork",
                  "feinting-attack",
                  "goading-attack",
                  "lunging-attack",
                  "maneuvering-attack",
                  "menacing-attack",
                  "parry",
                  "precisión-attack",
                  "pushing-attack",
                  "rally",
                  "riposte",
                  "sweeping-attack",
                  "tactical-assessment",
                  "trip-attack",
                ],
                optionLabels: {
                  ambush: "Emboscada",
                  "bait-and-switch": "Cebo y cambio",
                  "commanders-strike": "Golpe del comandante",
                  "commanding-presence": "Presencia dominante",
                  "disarming-attack": "Ataque desarmante",
                  "distracting-strike": "Golpe distractor",
                  "evasive-footwork": "Juego de pies evasivo",
                  "feinting-attack": "Ataque fintado",
                  "goading-attack": "Ataque provocador",
                  "lunging-attack": "Ataque de estocada",
                  "maneuvering-attack": "Ataque de maniobra",
                  "menacing-attack": "Ataque amenazante",
                  parry: "Parada",
                  "precisión-attack": "Ataque preciso",
                  "pushing-attack": "Ataque de empuje",
                  rally: "Arenga",
                  riposte: "Riposta",
                  "sweeping-attack": "Ataque de barrido",
                  "tactical-assessment": "Evaluacion táctica",
                  "trip-attack": "Ataque derribador",
                },
              },
            ],
          }),
          feature("battle-master-student-of-war", "Student of War", 3, [], "subclassFeatures", {
            label: "Estudiante de la guerra",
            description: "Gain training in one Artisan's Tool and one Fighter skill.",
            sheetText: "Estudiante de la guerra: elige una herramienta de artesano y una habilidad de Guerrero.",
            choices: [
              {
                id: "battle-master-student-skill-choice",
                label: "Habilidad de Estudiante de la guerra",
                type: "skill",
                count: 1,
                from: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Persuasion", "Perception", "Survival"],
              },
              {
                id: "battle-master-artisan-tool-choice",
                label: "Herramienta de artesano",
                type: "tool",
                count: 1,
                from: ["smiths-tools", "carpenters-tools", "leatherworkers-tools", "painters-supplies", "masons-tools"],
                optionLabels: {
                  "smiths-tools": "Herramientas de herrero",
                  "carpenters-tools": "Herramientas de carpintero",
                  "leatherworkers-tools": "Herramientas de peletero",
                  "painters-supplies": "Suministros de pintor",
                  "masons-tools": "Herramientas de albañil",
                },
              },
            ],
          }),
        ],
      },
    ],
  },
  champion: {
    levels: [
      {
        level: 3,
        features: [
          feature("champion-improved-critical", "Improved Critical", 3, [
            { type: "attack.criticalRange", value: 19 },
          ], "subclassFeatures", {
            label: "Crítico mejorado",
            description: "Weapon attacks score a critical hit on a lower roll.",
            sheetText: "Crítico mejorado: crítico con 19-20.",
          }),
          feature("champion-remarkable-athlete", "Remarkable Athlete", 3, [], "subclassFeatures", {
            label: "Atleta notable",
            description: "Athletic training improves physical performance.",
            sheetText: "Atleta notable",
          }),
        ],
      },
    ],
  },
  "eldritch-knight": {
    levels: [
      {
        level: 3,
        features: [
          feature("eldritch-knight-spellcasting", "Spellcasting", 3, [
            { type: "spellcasting.enable", ability: "intelligence" },
            { type: "spell.slot.unlock", spellLevel: 1 },
          ], "magic", {
            label: "Lanzamiento de conjuros",
            description: "Cast Wizard spells using Intelligence with Eldritch Knight spell slots.",
            sheetText: "Lanzamiento de conjuros: Inteligencia; 2 trucos, 4 conjuros preparados y 3 espacios de nivel 1 a nivel 5.",
            choices: [
              {
                id: "eldritch-knight-cantrip-choice",
                label: "Trucos de Mago",
                type: "cantrip",
                count: 2,
                from: ["ray-of-frost", "shocking-grasp", "fire-bolt", "light", "mage-hand", "prestidigitation"],
                optionLabels: {
                  "ray-of-frost": "Rayo de escarcha",
                  "shocking-grasp": "Agarre electrizante",
                  "fire-bolt": "Descarga de fuego",
                  light: "Luz",
                  "mage-hand": "Mano de mago",
                  prestidigitation: "Prestidigitación",
                },
              },
              {
                id: "eldritch-knight-spell-choice",
                label: "Conjuros preparados de Mago",
                type: "spell",
                count: 4,
                from: ["burning-hands", "jump", "shield-spell", "magic-missile", "detect-magic", "thunderwave"],
                optionLabels: {
                  "burning-hands": "Manos ardientes",
                  jump: "Saltar",
                  "shield-spell": "Escudo",
                  "magic-missile": "Proyectil mágico",
                  "detect-magic": "Detectar magia",
                  thunderwave: "Onda atronadora",
                },
              },
            ],
          }),
          feature("eldritch-knight-war-bond", "War Bond", 3, [], "subclassFeatures", {
            label: "Vínculo de guerra",
            description: "Bond with up to two weapons and summon one as a Bonus Action.",
            sheetText: "Vínculo de guerra: puedes vincular hasta 2 armas; no te desarman de ellas salvo incapacitado y puedes invocar una como acción adicional.",
          }),
        ],
      },
    ],
  },
  "psi-warrior": {
    levels: [
      {
        level: 3,
        features: [
          feature("psi-warrior-psionic-power", "Psionic Power", 3, [
            { type: "resource.add", resource: "psionicEnergyDice", value: 6 },
          ], "subclassFeatures", {
            label: "Poder psiónico",
            description: "Use Psionic Energy Dice to protect allies, enhance strikes, and move creatures or objects.",
            sheetText: "Poder psiónico: 6 dados d8 a nivel 5; CD = 8 + Inteligencia + competencia cuando aplique.",
          }),
          feature("psi-warrior-protective-field", "Protective Field", 3, [], "subclassFeatures", {
            label: "Campo protector",
            description: "Reduce damage to a creature you can see using a Psionic Energy Die.",
            sheetText: "Campo protector: reacción, reduce daño en 1 dado psiónico + Int (min. 1) a una criatura a 30 pies.",
          }),
          feature("psi-warrior-psionic-strike", "Psionic Strike", 3, [], "subclassFeatures", {
            label: "Golpe psiónico",
            description: "Add Force damage to a weapon hit using a Psionic Energy Die once per turn.",
            sheetText: "Golpe psiónico: 1/turno tras impactar con arma a 30 pies, gasta dado psiónico y suma fuerza = dado + Int.",
          }),
          feature("psi-warrior-telekinetic-movement", "Telekinetic Movement", 3, [], "subclassFeatures", {
            label: "Movimiento telequinético",
            description: "Move a loose object or willing creature with psionic force.",
            sheetText: "Movimiento telequinético: acción de Magia para mover objeto o criatura voluntaria hasta 30 pies; 1 uso o gasta dado psiónico.",
          }),
        ],
      },
    ],
  },
  "arcane-archer": {
    levels: [
      {
        level: 3,
        features: [
          feature("arcane-archer-lore", "Arcane Archer Lore", 3, [], "subclassFeatures", {
            label: "Saber de arquero arcano",
            description: "Gain magical or nature training tied to arcane archery.",
            sheetText: "Saber de arquero arcano: elige Arcanos o Naturaleza, y un truco indicado por la subclase.",
            choices: [
              {
                id: "arcane-archer-lore-skill-choice",
                label: "Habilidad de Arquero arcano",
                type: "skill",
                count: 1,
                from: ["Arcana", "Nature"],
              },
              {
                id: "arcane-archer-lore-cantrip-choice",
                label: "Truco de Arquero arcano",
                type: "cantrip",
                count: 1,
                from: ["prestidigitation", "druidcraft"],
                optionLabels: {
                  prestidigitation: "Prestidigitación",
                  druidcraft: "Druidismo",
                },
              },
            ],
          }),
          feature("arcane-archer-arcane-shot", "Arcane Shot", 3, [
            { type: "resource.add", resource: "arcaneShot", value: 2 },
          ], "subclassFeatures", {
            label: "Disparo arcano",
            description: "Choose magical shot options and apply them to arrows from a shortbow or longbow.",
            sheetText: "Disparo arcano: 2 usos por descanso corto o largo; elige 2 opciónes de disparo arcano.",
          }),
        ],
      },
    ],
  },
  cavalier: {
    levels: [
      {
        level: 3,
        features: [
          feature("cavalier-bonus-proficiency", "Bonus Proficiency", 3, [], "subclassFeatures", {
            label: "Competencia adicional",
            description: "Gain a Cavalier skill or a language.",
            sheetText: "Competencia adicional: elige una habilidad de Caballero o un idioma.",
            choices: [
              {
                id: "cavalier-bonus-proficiency-choice",
                label: "Competencia de Caballero",
                type: "skill",
                count: 1,
                from: ["Animal Handling", "History", "Insight", "Performance", "Persuasion"],
              },
            ],
          }),
          feature("cavalier-born-to-the-saddle", "Born to the Saddle", 3, [], "subclassFeatures", {
            label: "Nacido para la silla",
            description: "Improve mounted handling and recovery from falling.",
            sheetText: "Nacido para la silla: ventaja para evitar caer de la montura; montar o desmontar cuesta 5 pies.",
          }),
          feature("cavalier-unwavering-mark", "Unwavering Mark", 3, [], "subclassFeatures", {
            label: "Marca firme",
            description: "Mark enemies you hit and punish them for attacking others.",
            sheetText: "Marca firme: al impactar con ataque cuerpo a cuerpo marcas al objetivo; dificulta ataques contra otros y habilita un ataque especial.",
          }),
        ],
      },
    ],
  },
  "rune-knight": {
    levels: [
      {
        level: 3,
        features: [
          feature("rune-knight-bonus-proficiencies", "Bonus Proficiencies", 3, [
            { type: "proficiency.tool", items: ["smiths-tools"] },
            { type: "language.grant", languages: ["Giant"] },
          ], "subclassFeatures", {
            label: "Competencias adicionales",
            description: "Gain smith's tools and Giant.",
            sheetText: "Competencias adicionales: herramientas de herrero e idioma Gigante.",
          }),
          feature("rune-knight-rune-carver", "Rune Carver", 3, [], "subclassFeatures", {
            label: "Tallador de runas",
            description: "Learn two runes and inscribe them on carried or worn objects after a Long Rest.",
            sheetText: "Tallador de runas: elige 2 runas y las inscribes tras un descanso largo.",
            choices: [
              {
                id: "rune-knight-rune-choice",
                label: "Runas conocidas",
                type: "rune",
                count: 2,
                from: ["cloud-rune", "fire-rune", "frost-rune", "stone-rune"],
                optionLabels: {
                  "cloud-rune": "Runa de nube",
                  "fire-rune": "Runa de fuego",
                  "frost-rune": "Runa de escarcha",
                  "stone-rune": "Runa de piedra",
                },
              },
            ],
          }),
          feature("rune-knight-giants-might", "Giant's Might", 3, [
            { type: "resource.add", resource: "giantsMight", value: 3 },
          ], "subclassFeatures", {
            label: "Poder de gigante",
            description: "Temporarily grow and empower one hit per turn.",
            sheetText: "Poder de gigante: 3 usos; acción adicional, tamaño Grande si hay espacio, ventaja en pruebas/salvaciones de Fuerza y +1d6 daño 1/turno.",
          }),
        ],
      },
    ],
  },
  samurai: {
    levels: [
      {
        level: 3,
        features: [
          feature("samurai-bonus-proficiency", "Bonus Proficiency", 3, [], "subclassFeatures", {
            label: "Competencia adicional",
            description: "Gain a Samurai skill or a language.",
            sheetText: "Competencia adicional: elige una habilidad de Samurai o un idioma.",
            choices: [
              {
                id: "samurai-bonus-proficiency-choice",
                label: "Competencia de Samurai",
                type: "skill",
                count: 1,
                from: ["History", "Insight", "Performance", "Persuasion"],
              },
            ],
          }),
          feature("samurai-fighting-spirit", "Fighting Spirit", 3, [
            { type: "resource.add", resource: "fightingSpirit", value: 3 },
          ], "subclassFeatures", {
            label: "Espiritu de combate",
            description: "Gain Advantage on weapon attacks and temporary hit points.",
            sheetText: "Espiritu de combate: 3 usos; acción adicional para ventaja en ataques con arma este turno y 5 PG temporales.",
          }),
        ],
      },
    ],
  },
  abjurer: {
    levels: [
      {
        level: 3,
        features: [
          feature("abjurer-abjuration-savant", "Abjuration Savant", 3, [], "subclassFeatures", {
            label: "Sabio de abjuracion",
            description: "Add abjuration spells to the spellbook for free.",
            sheetText: "Sabio de abjuracion: agrega 2 conjuros de abjuracion de nivel 1-2 al grimorio; al desbloquear nuevos niveles de conjuro, agrega 1 abjuracion gratis.",
            choices: [
              {
                id: "abjurer-savant-spell-choice",
                label: "Conjuros gratis de Abjurador",
                type: "spellbook",
                count: 2,
                from: wizardSchoolSpellsUpToLevel2.Abjuration,
              },
            ],
          }),
          feature("abjurer-arcane-ward", "Arcane Ward", 3, [], "subclassFeatures", {
            label: "Custodia arcana",
            description: "Create a ward when casting abjuration spells with spell slots.",
            sheetText: "Custodia arcana: al lanzar abjuracion con espacio, crea custodia con PG max. 2 x nivel de Mago + Int; absorbe daño y recupera 2 x nivel del espacio al lanzar abjuracion.",
          }),
        ],
      },
    ],
  },
  diviner: {
    levels: [
      {
        level: 3,
        features: [
          feature("diviner-divination-savant", "Divination Savant", 3, [], "subclassFeatures", {
            label: "Sabio de adivinacion",
            description: "Add divination spells to the spellbook for free.",
            sheetText: "Sabio de adivinacion: agrega 2 conjuros de adivinacion de nivel 1-2 al grimorio; al desbloquear nuevos niveles de conjuro, agrega 1 adivinacion gratis.",
            choices: [
              {
                id: "diviner-savant-spell-choice",
                label: "Conjuros gratis de Adivino",
                type: "spellbook",
                count: 2,
                from: wizardSchoolSpellsUpToLevel2.Divination,
              },
            ],
          }),
          feature("diviner-portent", "Portent", 3, [], "subclassFeatures", {
            label: "Portento",
            description: "Record two d20 rolls after a Long Rest and replace visible D20 Tests.",
            sheetText: "Portento: tras descanso largo tira 2d20 y anotalos; puedes reemplazar una prueba d20 tuya o de criatura visible antes de la tirada, 1 vez por turno.",
          }),
        ],
      },
    ],
  },
  evoker: {
    levels: [
      {
        level: 3,
        features: [
          feature("evoker-evocation-savant", "Evocation Savant", 3, [], "subclassFeatures", {
            label: "Sabio de evocación",
            description: "Add evocation spells to the spellbook for free.",
            sheetText: "Sabio de evocación: agrega 2 conjuros de evocación de nivel 1-2 al grimorio; al desbloquear nuevos niveles de conjuro, agrega 1 evocación gratis.",
            choices: [
              {
                id: "evoker-savant-spell-choice",
                label: "Conjuros gratis de Evocador",
                type: "spellbook",
                count: 2,
                from: wizardSchoolSpellsUpToLevel2.Evocation,
              },
            ],
          }),
          feature("evoker-potent-cantrip", "Potent Cantrip", 3, [], "subclassFeatures", {
            label: "Truco potente",
            description: "Damaging cantrips still deal half damage when avoided.",
            sheetText: "Truco potente: si fallas ataque de truco o el objetivo supera la salvación contra un truco danino, recibe la mitad del daño del truco sin efectos extra.",
          }),
        ],
      },
    ],
  },
  illusionist: {
    levels: [
      {
        level: 3,
        features: [
          feature("illusionist-illusion-savant", "Illusion Savant", 3, [], "subclassFeatures", {
            label: "Sabio de ilusión",
            description: "Add illusion spells to the spellbook for free.",
            sheetText: "Sabio de ilusión: agrega 2 conjuros de ilusión de nivel 1-2 al grimorio; al desbloquear nuevos niveles de conjuro, agrega 1 ilusión gratis.",
            choices: [
              {
                id: "illusionist-savant-spell-choice",
                label: "Conjuros gratis de Ilusionista",
                type: "spellbook",
                count: 2,
                from: wizardSchoolSpellsUpToLevel2.Illusion,
              },
            ],
          }),
          feature("illusionist-improved-illusions", "Improved Illusions", 3, [
            { type: "spell.choice", spellKind: "cantrip", spells: ["minor-illusion"] },
          ], "subclassFeatures", {
            label: "Ilusiones mejoradas",
            description: "Cast illusion spells more subtly and improve Minor Illusion.",
            sheetText: "Ilusiones mejoradas: conjuros de ilusión sin componente verbal; si tienen alcance 10+ pies, +60 pies. Conoces Ilusión menor gratis; puede crear sonido e imagen y lanzarse como acción adicional.",
          }),
        ],
      },
    ],
  },
  bladesinging: {
    levels: [
      {
        level: 3,
        features: [
          feature("bladesinging-training", "Training in War and Song", 3, [
            { type: "proficiency.armor", items: ["Light"] },
            { type: "proficiency.skill", items: ["Performance"] },
          ], "subclassFeatures", {
            label: "Entrenamiento en guerra y canto",
            description: "Gain light armor, Performance, and one one-handed melee weapon proficiency.",
            sheetText: "Entrenamiento en guerra y canto: competencia con armadura ligera, Interpretación y 1 arma cuerpo a cuerpo de una mano a elección.",
            choices: [
              {
                id: "bladesinging-weapon-choice",
                label: "Arma de Canto de espada",
                type: "weaponMastery",
                count: 1,
                from: ["club", "dagger", "handaxe", "javelin", "light-hammer", "mace", "quarterstaff", "sickle", "spear", "battleaxe", "flail", "longsword", "morningstar", "rapier", "scimitar", "shortsword", "trident", "warhammer", "war-pick", "whip"],
              },
            ],
          }),
          feature("bladesinging-bladesong", "Bladesong", 3, [
            { type: "resource.add", resource: "bladesong", value: 3 },
          ], "subclassFeatures", {
            label: "Canto de espada",
            description: "Bonus Action defensive stance that improves AC, speed, Acrobatics, and concentration.",
            sheetText: "Canto de espada: 3 usos; acción adicional, 1 min. Sin armadura media/pesada ni escudo: +Int a CA, +10 pies velocidad, ventaja Acrobacias y +Int a salvaciones de Concentración.",
          }),
        ],
      },
    ],
  },
  "order-of-scribes": {
    levels: [
      {
        level: 3,
        features: [
          feature("scribes-wizardly-quill", "Wizardly Quill", 3, [], "subclassFeatures", {
            label: "Pluma mágica",
            description: "Create a magical quill for copying and erasing writing.",
            sheetText: "Pluma mágica: acción adicional para crear pluma diminuta; no requiere tinta, copia conjuros en 2 min por nivel y puede borrar escritura propia a 5 pies.",
          }),
          feature("scribes-awakened-spellbook", "Awakened Spellbook", 3, [], "subclassFeatures", {
            label: "Grimorio despierto",
            description: "Use the spellbook as a focus and alter damage types using spells in the book.",
            sheetText: "Grimorio despierto: sirve como foco; al lanzar conjuro con espacio, puedes cambiar su tipo de daño por uno de otro conjuro del mismo nivel en tu grimorio; 1 ritual con tiempo normal por descanso largo.",
          }),
        ],
      },
    ],
  },
  "war-magic": {
    levels: [
      {
        level: 3,
        features: [
          feature("war-magic-arcane-deflection", "Arcane Deflection", 3, [], "subclassFeatures", {
            label: "Desvio arcano",
            description: "Use a reaction to improve AC or a saving throw.",
            sheetText: "Desvio arcano: reacción al recibir impacto o fallar salvación; +2 CA contra ese ataque o +4 a esa salvación. Luego solo trucos hasta fin de tu próximo turno.",
          }),
          feature("war-magic-tactical-wit", "Tactical Wit", 3, [], "subclassFeatures", {
            label: "Ingenio táctico",
            description: "Add Intelligence modifier to Initiative.",
            sheetText: "Ingenio táctico: suma tu modificador de Inteligencia a la iniciativa.",
          }),
        ],
      },
    ],
  },
};

export const higherLevelStartingEquipment = [
  {
    id: "higher-start-2-4",
    minLevel: 2,
    maxLevel: 4,
    equipmentText: "Equipo inicial normal",
    baseCoins: { gp: 0 },
    roll: null,
    magicItems: ["1 común"],
    sheetText: "Nivel 2-4: equipo inicial normal; 1 objeto mágico común si el DM lo permite.",
  },
  {
    id: "higher-start-5-10",
    minLevel: 5,
    maxLevel: 10,
    equipmentText: "500 PO + 1d10 x 25 PO + equipo inicial normal",
    baseCoins: { gp: 500 },
    roll: { die: 10, multiplier: 25, coin: "gp" },
    magicItems: ["1 común", "1 poco común"],
    sheetText: "Nivel 5-10: 500 PO + 1d10 x 25 PO, además del equipo inicial normal; 1 objeto mágico común y 1 poco común si el DM lo permite.",
  },
  {
    id: "higher-start-11-16",
    minLevel: 11,
    maxLevel: 16,
    equipmentText: "5,000 PO + 1d10 x 250 PO + equipo inicial normal",
    baseCoins: { gp: 5000 },
    roll: { die: 10, multiplier: 250, coin: "gp" },
    magicItems: ["2 comunes", "3 poco comunes", "1 raro"],
    sheetText: "Nivel 11-16: 5,000 PO + 1d10 x 250 PO, además del equipo inicial normal; objetos mágicos según DM.",
  },
  {
    id: "higher-start-17-20",
    minLevel: 17,
    maxLevel: 20,
    equipmentText: "20,000 PO + 1d10 x 250 PO + equipo inicial normal",
    baseCoins: { gp: 20000 },
    roll: { die: 10, multiplier: 250, coin: "gp" },
    magicItems: ["2 comunes", "4 poco comunes", "3 raros", "1 muy raro"],
    sheetText: "Nivel 17-20: 20,000 PO + 1d10 x 250 PO, además del equipo inicial normal; objetos mágicos según DM.",
  },
];

function feature(id, name, level, effects = [], sheetSection = "classFeatures", text = {}) {
  return {
    id,
    name,
    label: text.label || name,
    level,
    description: text.description || "",
    sheetSection,
    effects,
    choices: text.choices || [],
    sheetText: text.sheetText || name,
  };
}




