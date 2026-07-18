export const dungeonTypeTables = {
  cueva: {
    label: "Cueva",
    sites: ["Cueva", "Grieta", "Sima", "Red de tuneles"],
    anchors: ["estalactitas quebradas", "lagunas negras", "pasos estrechos", "ecos profundos"],
    finalRooms: ["caverna mayor", "pozo central", "nido de piedra", "cámara bajo la roca"],
  },
  cripta: {
    label: "Cripta",
    sites: ["Cripta", "Sepulcro", "Mausoleo", "Osario"],
    anchors: ["nichos sellados", "lapidas caídas", "velas sin llama", "urnas marcadas"],
    finalRooms: ["cámara funeraria", "sala del sarcofago", "capilla hundida", "osario mayor"],
  },
  mina: {
    label: "Mina",
    sites: ["Mina", "Galeria", "Cantera", "Pozo minero"],
    anchors: ["rieles torcidos", "vigas vencidas", "vetas brillantes", "carros oxidados"],
    finalRooms: ["filon prohibido", "elevador roto", "galeria madre", "pozo de carga"],
  },
  templo: {
    label: "Templo",
    sites: ["Templo", "Santuario", "Monasterio", "Capilla"],
    anchors: ["altares agrietados", "murales borrados", "incienso rancio", "campañas mudas"],
    finalRooms: ["sala del altar", "sanctum interior", "oratorio sellado", "coro hundido"],
  },
  fortaleza: {
    label: "Fortaleza",
    sites: ["Fortaleza", "Bastion", "Puesto fortificado", "Fuerte"],
    anchors: ["rastrillos trabados", "barracas vacías", "murallas partidas", "armerías saqueadas"],
    finalRooms: ["sala de mando", "torreon interior", "patio cerrado", "boveda de guerra"],
  },
  alcantarilla: {
    label: "Alcantarilla",
    sites: ["Alcantarilla", "Colector", "Canal subterraneo", "Cisterna"],
    anchors: ["canales turbios", "compuertas atascadas", "pasarelas mojadas", "rejillas vencidas"],
    finalRooms: ["deposito central", "cámara de compuertas", "cisterna profunda", "nudo de drenaje"],
  },
  ruina: {
    label: "Ruina",
    sites: ["Ruina", "Ciudad caída", "Palacio roto", "Recinto antiguo"],
    anchors: ["columnas partidas", "mosaicos cubiertos", "arcadas abiertas", "jardines secos"],
    finalRooms: ["sala del trono", "foro sepultado", "patio ceremonial", "boveda partida"],
  },
  torre: {
    label: "Torre",
    sites: ["Torre", "Aguja", "Atalaya", "Observatorio"],
    anchors: ["escaleras en espiral", "ventanas altas", "pisos crujientes", "campañas lejanas"],
    finalRooms: ["cima de la torre", "observatorio superior", "estudio cerrado", "plataforma del faro"],
  },
  guarida: {
    label: "Guarida",
    sites: ["Guarida", "Refugio", "Nido", "Antro"],
    anchors: ["marcas de garras", "huesos viejos", "pieles colgadas", "pasos vigilados"],
    finalRooms: ["nido principal", "cámara de trofeos", "foso de descanso", "sala del alfa"],
  },
  laboratorio: {
    label: "Laboratorio",
    sites: ["Laboratorio", "Taller arcano", "Sala de pruebas", "Archivo experimental"],
    anchors: ["frascos rotos", "mesas de diseccion", "bobinas apagadas", "diagramas incompletos"],
    finalRooms: ["sala de contención", "cámara de pruebas", "observatorio cerrado", "reactor menor"],
  },
};

export const visualThemeTables = {
  oscuro: {
    label: "Oscuro",
    adjectives: ["Sombria", "Sin Luz", "Negra", "Velada"],
    details: ["sombras densas", "antorchas casi apagadas", "rincones que parecen moverse"],
    moods: ["claustrofobica", "silenciosa", "opresiva"],
  },
  helado: {
    label: "Helado",
    adjectives: ["Helada", "Escarchada", "Blanca", "Glacial"],
    details: ["escarcha sobre la piedra", "aire que corta la piel", "charcos congelados"],
    moods: ["fragil", "crujiente", "inmovil"],
  },
  volcanico: {
    label: "Volcanico",
    adjectives: ["Ardiente", "Cenicienta", "Ignea", "Roja"],
    details: ["grietas calientes", "ceniza flotando", "piedra negra y porosa"],
    moods: ["sofocante", "inestable", "amenazante"],
  },
  feérico: {
    label: "Feérico",
    adjectives: ["Feérica", "Lunar", "Espejada", "Caprichosa"],
    details: ["luces pequeñas sin fuente", "plantas imposibles", "risas lejanas"],
    moods: ["extrana", "cambiante", "bella e inquietante"],
  },
  corrupto: {
    label: "Corrupto",
    adjectives: ["Corrupta", "Manchada", "Podrida", "Torcida"],
    details: ["venas oscuras en los muros", "olor metalico", "liquenes enfermos"],
    moods: ["malsana", "pegajosa", "hostil"],
  },
  infernal: {
    label: "Infernal",
    adjectives: ["Infernal", "Sellada", "Cruel", "Abrasada"],
    details: ["runas de castigo", "bronce caliente", "cadenas tensas"],
    moods: ["ritual", "despiadada", "tensa"],
  },
  natural: {
    label: "Natural",
    adjectives: ["Verde", "Raizal", "Silvestre", "Musgosa"],
    details: ["raíces abiertas", "agua limpia", "musgo sobre símbolos antiguos"],
    moods: ["humeda", "viva", "recuperada por la naturaleza"],
  },
  subterraneo: {
    label: "Subterraneo",
    adjectives: ["Profunda", "Hundida", "Mineral", "Enterrada"],
    details: ["presion en los oidos", "piedra compacta", "ecos que llegan tarde"],
    moods: ["pesada", "remota", "cerrada"],
  },
  abandonado: {
    label: "Abandonado",
    adjectives: ["Olvidada", "Vacia", "Polvorienta", "Marchita"],
    details: ["muebles cubiertos", "pisadas antiguas", "herramientas dejadas a medias"],
    moods: ["melancolica", "quieta", "suspendida en el tiempo"],
  },
};

export const inhabitantTables = {
  goblins: {
    label: "Goblins",
    signs: ["trampas de cuerda", "pintadas burlonas", "ollas humeantes", "tambores pequeños"],
    enemiesByTier: {
      novice: ["vigilantes goblin", "hostigadores con hondas", "saqueadores ruidosos"],
      heroic: ["capitanes goblin", "jinetes de alimanas", "tramperos veteranos"],
      paragon: ["estrategas goblin", "asesinos de tunel", "maestros de jauria"],
      legendary: ["senores goblin con guardia", "campeones de clan", "saboteadores de elite"],
    },
    leaders: ["jefe de banda", "chaman de clan", "rey de chatarra"],
  },
  orcos: {
    label: "Orcos",
    signs: ["estandartes rotos", "marcas de hacha", "hogueras grandes", "trofeos de guerra"],
    enemiesByTier: {
      novice: ["guerreros orcos", "guardianes con lanza", "batidores furiosos"],
      heroic: ["veteranos orcos", "rompeescudos", "gritadores de guerra"],
      paragon: ["campeones orcos", "devastadores tribales", "guardias de honor"],
      legendary: ["senores de guerra", "campeones juramentados", "ejecutores de clan"],
    },
    leaders: ["caudillo brutal", "portaestandarte sagrado", "campeón del pozo"],
  },
  kobolds: {
    label: "Kobolds",
    signs: ["tuneles bajos", "cables tensos", "escamas sueltas", "pequeñas ofrendas"],
    enemiesByTier: {
      novice: ["kobolds con lanzas", "lanzadores de frascos", "vigias escondidos"],
      heroic: ["tramperos kobold", "guardianes escamados", "técnicos de emboscada"],
      paragon: ["maestros de trampas", "hechiceros de escama", "guardias del huevo"],
      legendary: ["elegidos draconicos", "arquitectos de muerte", "líderes de nido"],
    },
    leaders: ["vocero del nido", "hechicero escamado", "campeón de la garra"],
  },
  "no-muertos": {
    label: "No muertos",
    signs: ["velas frias", "huesos ordenados", "susurros sin cuerpo", "sellos funerarios"],
    enemiesByTier: {
      novice: ["cadaveres animados", "huesos guardianes", "sombras hambrientas"],
      heroic: ["caballeros sin descanso", "espectros de pasillo", "custodios funerarios"],
      paragon: ["nobles malditos", "apariciones vengativas", "guardianes de tumba"],
      legendary: ["regentes no muertos", "sombras coronadas", "oraculos del sepulcro"],
    },
    leaders: ["senor del sarcofago", "oraculo muerto", "capitan espectral"],
  },
  bestias: {
    label: "Bestias",
    signs: ["huellas recientes", "plumas o pelos", "huesos roidos", "nidos improvisados"],
    enemiesByTier: {
      novice: ["depredadores hambrientos", "enjambres territoriales", "bestias de cueva"],
      heroic: ["depredadores enormes", "manadas coordinadas", "bestias acorazadas"],
      paragon: ["alpha de la guarida", "bestias tocadas por magia", "cazadores primordiales"],
      legendary: ["monstruos territoriales", "bestias antiguas", "engendros de la espesura"],
    },
    leaders: ["alpha herido", "madre territorial", "bestia marcada"],
  },
  cultistas: {
    label: "Cultistas",
    signs: ["símbolos pintados", "cuencos rituales", "mascaras colgadas", "cantos medidos"],
    enemiesByTier: {
      novice: ["iniciados armados", "fanaticos con dagas", "aprendices improvisados"],
      heroic: ["oficiantes de rito", "guardias fanatizados", "invocadores menores"],
      paragon: ["sacerdotes oscuros", "verdugos ceremoniales", "oradores profanos"],
      legendary: ["hierofantes ocultos", "elegidos del culto", "maestros del sello"],
    },
    leaders: ["profeta del rito", "sumo oficiante", "portador de la máscara"],
  },
  constructos: {
    label: "Constructos",
    signs: ["engranajes dispersos", "pisadas metalicas", "runas de control", "aceite seco"],
    enemiesByTier: {
      novice: ["automas defectuosos", "centinelas simples", "herramientas animadas"],
      heroic: ["guardianes mecánicos", "automas de combate", "torretas arcanas"],
      paragon: ["colosos menores", "centinelas perfectos", "mecanismos cazadores"],
      legendary: ["constructos soberanos", "motores de defensa", "guardianes primarios"],
    },
    leaders: ["núcleo custodio", "maquina directora", "golem incompleto"],
  },
  aberraciones: {
    label: "Aberraciones",
    signs: ["geometria incorrecta", "mucosidad irisada", "pensamientos intrusivos", "ojos en la piedra"],
    enemiesByTier: {
      novice: ["formas tentaculares", "parasitos psíquicos", "observadores menores"],
      heroic: ["cazadores de mente", "engendros mutados", "enjambres del vacio"],
      paragon: ["oraculos deformes", "horrores de pasillo", "nidos pensantes"],
      legendary: ["intelectos abisales", "avatares deformes", "coros de ojos"],
    },
    leaders: ["mente en el pozo", "profeta deformado", "ojo central"],
  },
  elementales: {
    label: "Elementales",
    signs: ["piedra flotante", "aire cargado", "agua que sube", "chispas bajo el polvo"],
    enemiesByTier: {
      novice: ["chispas vivas", "fragmentos de roca", "remolinos pequeños"],
      heroic: ["guardianes de fuego", "oleadas animadas", "duendes de piedra"],
      paragon: ["senores menores del elemento", "tempestades cerradas", "colosos de magma"],
      legendary: ["avatares elementales", "principes de la grieta", "núcleos primordiales"],
    },
    leaders: ["núcleo elemental", "voz de la grieta", "custodio primordial"],
  },
  demonios: {
    label: "Demonios",
    signs: ["rasgones en el aire", "sangre seca", "risas guturales", "símbolos quemados"],
    enemiesByTier: {
      novice: ["engendros menores", "mordedores caoticos", "acechadores infernales"],
      heroic: ["desgarradores del portal", "verdugos menores", "tentadores violentos"],
      paragon: ["capitanes del abismo", "devoradores de pacto", "cazadores profanos"],
      legendary: ["heraldos abisales", "principes menores", "campeones del portal"],
    },
    leaders: ["heraldo del portal", "verdugo marcado", "senor menor encadenado"],
  },
  "dragones-menores": {
    label: "Dragones menores",
    signs: ["escamas sueltas", "marcas de garras", "calor localizado", "monedas mordidas"],
    enemiesByTier: {
      novice: ["crias draconicas", "sirvientes escamados", "guardianes del tesoro"],
      heroic: ["dracos jovenes", "campeones escamados", "alientos menores"],
      paragon: ["nobles draconicos", "guardianes alados", "veteranos del nido"],
      legendary: ["herederos draconicos", "consortes alados", "senores del tesoro menor"],
    },
    leaders: ["heredero del nido", "draco dominante", "custodio de escamas"],
  },
};

export const roomTypeTables = {
  entrada: {
    label: "Entrada",
    names: ["Umbral Vigilado", "Porton Partido", "Boca del Sitio", "Antesala Fria"],
    descriptions: ["El acceso revela de inmediato el tono del lugar y una primera pista de sus habitantes.", "Una entrada estrecha deja ver marcas recientes y una ruta principal hacia el interior."],
    notes: ["Marca aquí el primer indicio de peligro.", "Buen punto para revelar el objetivo inmediato."],
  },
  pasillo: {
    label: "Pasillo",
    names: ["Paso Angosto", "Cruce Desgastado", "Galeria Larga", "Corredor Bajo"],
    descriptions: ["Un tramo de conexión con cobertura, ruido distante y una decisión de ruta.", "El pasillo cambia la orientación del grupo y muestra rastros de movimiento reciente."],
    notes: ["Usalo para presion de tiempo o escucha previa.", "Puede conectar con un atajo o con una puerta bloqueada."],
  },
  combate: {
    label: "Combate",
    names: ["Sala de Guardia", "Nido Activo", "Puesto de Choque", "Cámara Disputada"],
    descriptions: ["Un espacio ocupado por fuerzas listas para reaccionar si la entrada no es cuidadosa.", "La sala ofrece cobertura, posiciones altas o rutas laterales para un combate dinamico."],
    notes: ["Define tácticas simples: alarma, retirada o flanqueo.", "Deja una salida para negociar o infiltrarse."],
  },
  trampa: {
    label: "Trampa",
    names: ["Tramo Preparado", "Cámara de Presion", "Piso Falso", "Puerta Maliciosa"],
    descriptions: ["El espacio parece Útil, pero está preparado para castigar el avance descuidado.", "Una amenaza ambiental protege el camino o consume recursos antes del siguiente encuentro."],
    notes: ["Incluye una pista visible antes del disparo.", "Permite desactivar, rodear o activar a distancia."],
  },
  puzzle: {
    label: "Puzzle",
    names: ["Mecanismo de Sellos", "Sala de Simbolos", "Cámara de Ecos", "Panel de Prueba"],
    descriptions: ["Un obstaculo lógico o ritual bloquea una puerta, tesoro o atajo.", "La sala exige observar patrónes, mover piezas o interpretar marcas del lugar."],
    notes: ["Prepara tres pistas: obvia, parcial y directa.", "Acepta soluciones creativas que consuman recursos."],
  },
  tesoro: {
    label: "Tesoro",
    names: ["Deposito Oculto", "Boveda Menor", "Almacen Sellado", "Nicho de Ofrendas"],
    descriptions: ["Una reserva protegida guarda recompensas, herramientas o información Útil.", "El lugar contiene objetos de valor y una pista sobre el conflicto principal."],
    notes: ["Conecta el tesoro con la historia local.", "Puede contener una llave, mapa o favor pendiente."],
  },
  descanso: {
    label: "Descanso",
    names: ["Refugio Seco", "Cámara Silenciosa", "Cuarto Barricado", "Rincon Seguro"],
    descriptions: ["Un punto relativamente seguro permite respirar, curar heridas o reorganizar el plan.", "El espacio esta aislado del flujo principal y muestra signos de uso antiguo."],
    notes: ["Decide que puede interrumpir el descanso.", "Incluye un recurso menor: agua, vendas, brasero o cobertura."],
  },
  vacia: {
    label: "Sala vacía",
    names: ["Sala Despojada", "Cuarto Sin Uso", "Cámara Polvorienta", "Alcoba Olvidada"],
    descriptions: ["No hay amenaza inmediata, pero si detalles que dan contexto y ritmo.", "El cuarto sirve como pausa, pista falsa o lugar para escuchar lo que viene."],
    notes: ["Una sala vacía debe decir algo del lugar.", "Agrega una huella, olor, ruido o objeto sin valor evidente."],
  },
  jefe: {
    label: "Jefe",
    names: ["Cámara Final", "Sala del Líder", "Corazón del Sitio", "Trono de Guerra"],
    descriptions: ["El conflicto principal se concentra aquí con terreno memorable y una salida clara.", "La sala final combina presencia del líder, objetivo visible y peligro ambiental."],
    notes: ["Haz que el jefe quiera algo durante la escena.", "Incluye terreno: cobertura, altura, fuego, agua, cadenas o ritual."],
  },
  secreto: {
    label: "Secreto",
    names: ["Puerta Oculta", "Nicho Sellado", "Ruta Trasera", "Cámara Escondida"],
    descriptions: ["Una sección opciónal recompensa exploración, sospecha o buen uso de herramientas.", "El acceso no es obvio y revela tesoro, información o un atajo importante."],
    notes: ["Ofrece al menos dos formas de descubrirlo.", "No bloquees progreso crítico detras del secreto."],
  },
};

export const eventTable = [
  "ruido de pasos que se alejan",
  "puerta que se cierra sola",
  "olor fresco que contradice la antiguedad del sitio",
  "rastro de sangre que cruza el área",
  "mensaje incompleto en una pared",
  "corriente de aire desde una grieta",
  "objeto común colocado con demasiado cuidado",
  "eco de una voz conocida por nadie",
  "huellas que aparecen y desaparecen",
  "marca reciente de campamento",
];

export const trapTable = {
  novice: [
    "cuerda baja con campanillas y dardos improvisados",
    "piso suelto que abre un foso poco profundo",
    "puerta con aguja oxidada en la manilla",
    "techo con grava lista para caer",
  ],
  heroic: [
    "placas de presion conectadas a cuchillas laterales",
    "nube irritante liberada desde ranuras ocultas",
    "puente falso sobre una zanja de estacas",
    "sello mágico que empuja hacia atras al intruso",
  ],
  paragon: [
    "mecanismo de gravedad que invierte el piso por un instante",
    "runa que separa al grupo con muros de fuerza menor",
    "estatuas que disparan rayos de energía inestable",
    "pozo con cierre automatico y agua ascendente",
  ],
  legendary: [
    "secuencia de sellos que roba acciones si se ignora",
    "coro de runas que invoca guardianes si falla la desactivacion",
    "cámara que cambia de forma cada ronda",
    "trampa ritual que consume luz, sonido y orientación",
  ],
};

export const treasureTable = {
  mundane: [
    "herramientas Útiles para explorar",
    "provisiones secas en buen estado",
    "mapa parcial con marcas dudosas",
    "llave sin etiqueta",
    "caja de componentes raros",
    "registro de pagos o deudas",
  ],
  low: [
    "bolsa de monedas mezcladas",
    "joya pequeña con símbolo local",
    "arma bien cuidada sin propiedades especiales",
    "pergamino con instrucciones rituales",
  ],
  normal: [
    "reliquia menor vendible",
    "consumible mágico de un solo uso",
    "cofre con monedas y una pista",
    "objeto Útil con rareza local",
  ],
  high: [
    "pieza de arte protegida",
    "objeto mágico menor para revisar después",
    "tesoro marcado por un antiguo propietario",
    "reserva principal de monedas y gemas",
  ],
};

export const descriptionTable = {
  sensory: [
    "el aire sabe a polvo viejo",
    "gotas caen con ritmo irregular",
    "hay marcas de manos a media altura",
    "un frío raro queda pegado a la ropa",
    "la luz se refleja en pequeñas particulas",
    "algo raspa piedra muy lejos",
    "el piso no esta tan quieto como parece",
  ],
  clues: [
    "una ruta secundaria esta parcialmente tapada",
    "hay signos de una pelea reciente",
    "las marcas del suelo muestran patrullas regulares",
    "un símbolo se repite en objetos distintos",
    "una puerta fue reparada desde dentro",
    "alguien borro nombres de una placa",
  ],
};

export const nameTable = {
  suffixes: [
    "Ecos",
    "Dientes",
    "Velos",
    "Cenizas",
    "Raices",
    "Juramentos",
    "Llaves",
    "Sombras",
    "Campañas",
    "Cristales",
    "Huesos",
    "Mareas",
  ],
  epithets: [
    "de la Última Guardia",
    "bajo la Colina",
    "sin Amanecer",
    "del Pacto Roto",
    "del Pozo Mudo",
    "de las Puertas Torcidas",
    "de la Reina Perdida",
    "del Invierno Seco",
    "del Fuego Quieto",
    "de los Tres Sellos",
  ],
};

export const dungeonQuirkTable = [
  "la meta principal queda lejos de la entrada y obliga a elegir ruta",
  "hay al menos una entrada secundaria o salida de emergencia",
  "la ruta más corta cruza una zona peligrosa, pero hay un rodeo más lento",
  "una sección vertical conecta pisos, balcones, fosos o escaleras",
  "una ruta opciónal recompensa exploración sin bloquear el avance principal",
  "un derrumbe, grieta o zona inundada cambia la forma normal de moverse",
  "varias salas muestran uso anterior distinto al uso actual",
  "las patrullas o habitantes conocen atajos que el grupo puede descubrir",
];

export const dungeonDecayTable = [
  {
    id: "peligrosa",
    label: "Peligrosa",
    effect: "La estructura amenaza con fallar durante escenas tensas.",
  },
  {
    id: "crujiente",
    label: "Crujiente",
    effect: "Muros, pisos o soportes dan pistas de que algo puede ceder.",
  },
  {
    id: "descuidada",
    label: "Descuidada",
    effect: "Hay polvo, bloqueos parciales y mecanismos que funcionan a medias.",
  },
  {
    id: "abandonada",
    label: "Abandonada",
    effect: "El lugar conserva rastros antiguos y pocas reparaciónes recientes.",
  },
  {
    id: "segura",
    label: "Segura",
    effect: "Los accesos importantes estan mantenidos y vigilados.",
  },
  {
    id: "activa",
    label: "Activa",
    effect: "Habitantes, rutas de servicio y defensas siguen en uso frecuente.",
  },
];

export const dungeonLayoutPrincipleTable = [
  "Usa cuadricula de 5 pies para que el mapa funcione en mesa.",
  "Evita simetría perfecta: rota salas, desplaza corredores y mezcla tamaños.",
  "Incluye decisiones de ruta: cruce, atajo, rodeo o puerta bloqueada.",
  "Reserva secretos para recompensas, información o rutas opciónales.",
  "Agrega altura, escaleras, fosos, balcones o plataformas cuando encaje.",
  "Muestra desgaste con derrumbes, grietas, reparaciónes o pasajes cerrados.",
  "Incluye agua, puentes, canales o drenajes si el tipo de mazmorra lo sugiere.",
  "Haz que la sala final tenga terreno visible antes de empezar el conflicto.",
  "Varia formas de sala: ovalos, cruces, L, anillos, fosos, balcones y niveles cuando ayuden a la escena.",
];

export const doorMaterialTable = {
  madera: {
    label: "Madera",
    ac: 15,
    hp: 18,
    forceOpenDc: 15,
  },
  cristal: {
    label: "Cristal",
    ac: 13,
    hp: 4,
    forceOpenDc: 10,
  },
  metal: {
    label: "Metal",
    ac: 19,
    hp: 72,
    forceOpenDc: 25,
  },
  piedra: {
    label: "Piedra",
    ac: 17,
    hp: 40,
    forceOpenDc: 20,
  },
};

export const doorSizeTable = [
  { id: "normal", label: "Normal", hpMultiplier: 1, dcBonus: 0, weight: 8 },
  { id: "grande", label: "Grande", hpMultiplier: 2, dcBonus: 5, weight: 2 },
  { id: "monumental", label: "Monumental", hpMultiplier: 3, dcBonus: 5, weight: 1 },
];

export const doorStateTable = [
  {
    id: "abierta",
    label: "Abierta",
    weight: 2,
    note: "Cruce libre; Útil para ritmo rápido o emboscadas.",
  },
  {
    id: "cerrada",
    label: "Cerrada",
    weight: 5,
    note: "Puede abrirse normalmente si no esta bloqueada desde el otro lado.",
  },
  {
    id: "cerrada-con-llave",
    label: "Con cerradura",
    weight: 3,
    usesLock: true,
    note: "Se puede forzar, romper o abrir con herramientas adecuadas.",
  },
  {
    id: "barrada",
    label: "Atrancada",
    weight: 2,
    note: "Una barra o traba impide abrirla desde el lado opuesto.",
  },
  {
    id: "atascada",
    label: "Atascada",
    weight: 2,
    note: "Oxido, piedra torcida o madera hinchada exige fuerza o tiempo.",
  },
];

export const lockQualityTable = [
  { id: "inferior", label: "Inferior", dc: 10, weight: 2 },
  { id: "buena", label: "Buena", dc: 15, weight: 5 },
  { id: "superior", label: "Superior", dc: 20, weight: 2 },
];

export const secretDoorTable = [
  { id: "apenas-oculta", label: "Apenas oculta", detectionDc: 10, weight: 2 },
  { id: "estándar", label: "Estándar", detectionDc: 15, weight: 5 },
  { id: "muy-oculta", label: "Muy oculta", detectionDc: 20, weight: 2 },
];

export const portcullisLiftTable = {
  hierro: {
    mediano: 20,
    grande: 25,
    enorme: 30,
  },
  madera: {
    mediano: 15,
    grande: 20,
    enorme: 25,
  },
};

export const enemyLevelRanges = [
  { id: "novice", min: 1, max: 4, label: "Nivel bajo" },
  { id: "heroic", min: 5, max: 10, label: "Nivel medio" },
  { id: "paragon", min: 11, max: 16, label: "Nivel alto" },
  { id: "legendary", min: 17, max: 20, label: "Nivel épico" },
];

export function getLevelRange(level) {
  return enemyLevelRanges.find((range) => level >= range.min && level <= range.max) || enemyLevelRanges[0];
}
