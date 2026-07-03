import { remoteStorage } from './remoteStorage.js';
import {
  CAMPAIGN_MODEL_VERSION,
  CAMPAIGN_VISIBILITY_PRESETS,
  getCampaignVisibilityLabel,
  getCampaignVisibilityPresetId,
  normalizeCampaignCharacterRecord,
  normalizeCampaignConnection,
  normalizeCampaignEntity,
  normalizeCampaignImage,
  normalizeCampaignLink,
  normalizeCampaignSession,
  normalizeCampaignVisibility,
  normalizeCampaignWorkspace,
  normalizeDmToolState,
} from './campaignModel.js';
import { setupPageBridge } from '../src/scripts/pageBridge.js';

const STORAGE_KEY = 'd20-travesias-archivo-v2';
const LEGACY_STORAGE_KEY = 'cronicas-experiencia-v1';
const DISPLAY_MODE_STORAGE_KEY = 'handbook-engine-display-mode';
const USE_REMOTE_STORAGE = !['', 'localhost', '127.0.0.1'].includes(window.location.hostname) && !window.location.search.includes('local=1');
const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const SYSTEMS = {
  dnd5e2024: {
    id: 'dnd5e2024',
    name: 'D&D 5e 2024',
    unit: 'PX',
    resourceName: 'experiencia',
    characterValueLabel: 'Experiencia actual o previa',
    characterValueHelp: 'Si ya jugaba antes de usar la app, escribe aqui toda la experiencia que ya tenia.',
    roleLabel: 'Clase',
    rolePlaceholder: 'Ej. Bardo',
    progressName: 'Nivel',
    maxProgressText: 'Nivel maximo',
    totalAwardedLabel: 'Experiencia total otorgada',
    poolsTitle: 'Fondos de la sesión',
    poolsHelp: 'Cada cantidad se divide en partes iguales entre quienes asistieron.',
    poolLabels: ['Combate', 'Roleo', 'Otros logros'],
    poolHelps: ['Enemigos y encuentros superados', 'Interpretacion y decisiones narrativas', 'Exploracion, objetivos o ajustes manuales'],
    bonusTitle: 'Bonos por personaje',
    bonusHelp: 'Anade experiencia particular a quienes destacaron. Solo se aplica a asistentes.',
    averageStatLabel: 'Nivel promedio',
  },
  cyberpunkRed: {
    id: 'cyberpunkRed',
    name: 'Cyberpunk RED',
    unit: 'PP',
    resourceName: 'puntos de perfeccionamiento',
    characterValueLabel: 'PP actuales o previos',
    characterValueHelp: 'Registra los Puntos de Perfeccionamiento disponibles o acumulados antes de usar la app.',
    roleLabel: 'Rol',
    rolePlaceholder: 'Ej. Netrunner',
    progressName: 'PP',
    maxProgressText: 'Lista para gastar',
    totalAwardedLabel: 'PP totales otorgados',
    poolsTitle: 'Puntos de perfeccionamiento',
    poolsHelp: 'Otorga PP segun exito de grupo, estilo de juego o ajustes manuales del DJ.',
    poolLabels: ['Grupo', 'Estilo', 'Manual'],
    poolHelps: ['Resultado de la mision', 'Guerrero, sociable, explorador o actor', 'Ajustes o recompensas especiales'],
    bonusTitle: 'PP por personaje',
    bonusHelp: 'Anade PP particulares a quienes destacaron. Solo se aplica a asistentes.',
    averageStatLabel: 'PP promedio',
    costTables: {
      typical: { label: 'Habilidad tipica', multiplier: 20 },
      difficult: { label: 'Habilidad dificil (x2)', multiplier: 40 },
      role: { label: 'Aptitud de rol', multiplier: 60 },
    },
  },
};
const SYSTEM_ALIASES = {
  'd&d': 'dnd5e2024',
  'd&d 5e': 'dnd5e2024',
  'd&d 5e 2024': 'dnd5e2024',
  'dnd': 'dnd5e2024',
  'dnd 5e': 'dnd5e2024',
  'dnd 5e 2024': 'dnd5e2024',
  'cyberpunk': 'cyberpunkRed',
  'cyberpunk red': 'cyberpunkRed',
  'cp red': 'cyberpunkRed',
  'cpr': 'cyberpunkRed',
};
const CYBERPUNK_PP_COLUMNS = [
  { id: 'grupo', label: 'Grupo' },
  { id: 'guerrero', label: 'Guerrero' },
  { id: 'sociable', label: 'Sociable' },
  { id: 'explorador', label: 'Explorador' },
  { id: 'actor', label: 'Actor' },
];
const CYBERPUNK_PP_REASONS = {
  grupo: [
    [10, 'Fallaron, pero lo intentaron'],
    [20, 'Apenas cumplieron objetivos'],
    [30, 'Cumplieron la mayoria de objetivos'],
    [40, 'Buena mision y cooperacion'],
    [50, 'Muy buena mision con momentos estelares'],
    [60, 'Gran exito, todos los objetivos cumplidos'],
    [70, 'Exito rotundo y objetivos secundarios'],
    [80, 'Mision legendaria y cooperacion excepcional'],
  ],
  guerrero: [
    [10, 'Uso combate con frecuencia'],
    [20, 'Combatio con eficacia'],
    [30, 'Derroto enemigos peligrosos'],
    [40, 'Logro de combate fuera de lo comun'],
    [50, 'Combate muy eficaz o inteligente'],
    [60, 'Combate critico para su personaje'],
    [70, 'Combate critico para todo el grupo'],
    [80, 'Algo increible en combate'],
  ],
  sociable: [
    [10, 'Ayudo al grupo'],
    [20, 'Apoyo la cohesion del grupo'],
    [30, 'Apoyo bastante al grupo'],
    [40, 'Apoyo excepcional al grupo'],
    [50, 'Ayuda muy eficaz al grupo'],
    [60, 'Apoyo muy importante para el grupo'],
    [70, 'Apoyo fundamental para todo el grupo'],
    [80, 'Algo increible apoyando al grupo'],
  ],
  explorador: [
    [10, 'Intento investigar o explorar'],
    [20, 'Exploro o investigo con eficacia'],
    [30, 'Investigo para avanzar objetivos'],
    [40, 'Descubrimiento fuera de lo comun'],
    [50, 'Descubre persona, lugar, pista o cosa importante'],
    [60, 'Investigacion clave para su personaje'],
    [70, 'Investigacion fundamental para todo el grupo'],
    [80, 'Descubrimiento realmente increible'],
  ],
  actor: [
    [10, 'Intento interpretar'],
    [20, 'Interpreto constantemente'],
    [30, 'Interpreto para lograr objetivos'],
    [40, 'Momento fuerte de interpretacion'],
    [50, 'Interpretacion muy eficaz o inteligente'],
    [60, 'Interpretacion decisiva para su personaje'],
    [70, 'Interpretacion cambia el resultado de la partida'],
    [80, 'Actuacion realmente increible'],
  ],
};
const DND_XP_REWARD_TIERS = buildDndRewardTiers();
const DND_XP_REWARDS = [
  { id: 'combat-low', bullet: 1, action: 'Combate (desempeno bajo)', xp: 20, note: 'Si los jugadores lucharon de manera torpe o sin estrategia.' },
  { id: 'combat-standard', bullet: 2, action: 'Combate (desempeno aceptable)', xp: 30, note: 'Si usaron tacticas basicas y tuvieron un combate estandar.' },
  { id: 'combat-excellent', bullet: 3, action: 'Combate (desempeno sobresaliente)', xp: 40, note: 'Si usaron estrategias avanzadas, combos o tacticas creativas.' },
  { id: 'valuable-information', bullet: 4, action: 'Adquirir información valiosa', xp: 15, note: 'Descubrir pistas, aprender sobre la trama o revelar secretos importantes.' },
  { id: 'accept-mission', bullet: 5, action: 'Aceptar una mision', xp: 10, note: 'Cuando el grupo se compromete con un objetivo importante.' },
  { id: 'complete-mission', bullet: 6, action: 'Cumplir una mision', xp: 40, note: 'Dependiendo de la dificultad de la mision.' },
  { id: 'noncombat-solution', bullet: 7, action: 'Resolver un problema sin combate', xp: 20, note: 'Diplomacia, sigilo, negociacion o engano para evitar un enfrentamiento.' },
  { id: 'notable-exploration', bullet: 8, action: 'Exploracion destacada', xp: 25, note: 'Descubrir lugares ocultos, mapas secretos, pasadizos o tesoros escondidos.' },
  { id: 'clever-skill-spell', bullet: 9, action: 'Uso ingenioso de habilidades o hechizos', xp: 25, note: 'Resolver una situacion de forma creativa usando mecanicas del juego.' },
  { id: 'teamwork', bullet: 10, action: 'Trabajo en equipo destacado', xp: 20, note: 'Si los jugadores colaboraron excepcionalmente bien en una tarea.' },
  { id: 'character-development', bullet: 11, action: 'Desarrollo de personaje (roleo significativo)', xp: 25, note: 'Si un jugador profundiza en su historia, relaciones o personalidad.' },
  { id: 'story-impact', bullet: 12, action: 'Impacto en la historia', xp: 30, note: 'Si una decision del grupo cambia el rumbo de la narrativa de manera importante.' },
  { id: 'heroic-act', bullet: 13, action: 'Sacrificio o acto heroico', xp: 30, note: 'Si un personaje pone en riesgo su seguridad por el grupo o la historia.' },
  { id: 'heroic-inspiration', bullet: 14, action: 'Inspiracion Heroica', xp: 30, note: 'Recompensa extra por hazanas epicas.' },
  { id: 'crisis-improvisation', bullet: 15, action: 'Improvisacion exitosa en crisis', xp: 25, note: 'Cuando un jugador resuelve algo sin recursos convencionales.' },
  { id: 'sacrifice-for-ally', bullet: 16, action: 'Sacrificio por otro miembro del grupo', xp: 30, note: 'Incluye poner su vida en riesgo o perder un recurso valioso.' },
  { id: 'deep-lore', bullet: 17, action: 'Descubrimiento de lore profundo o historia oculta', xp: 20, note: 'Cuando un jugador busca e interpreta información antigua o críptica.' },
  { id: 'emotional-roleplay', bullet: 18, action: 'Escena de roleo emocional poderosa', xp: 30, note: 'Llantos, traiciones, confesiones o algo que afecte a todos.' },
  { id: 'creative-feat', bullet: 19, action: 'Proeza ridiculamente creativa (y funcional)', xp: 27, note: 'Inventar una locura que funcione. Premia la locura logica.' },
  { id: 'history-changing-diplomacy', bullet: 20, action: 'Diplomacia que cambia el curso de la historia', xp: 35, note: 'Convencer a un enemigo, evitar una guerra o unir facciones.' },
  { id: 'nonviolent-defeat', bullet: 21, action: 'Derrotar a un enemigo de forma no violenta', xp: 30, note: 'Puede implicar engano, redencion, soborno o chantaje.' },
  { id: 'npc-growth', bullet: 22, action: 'Inspirar a un NPC a cambiar o crecer', xp: 25, note: 'Cuando un jugador deja huella en otro personaje.' },
  { id: 'mystic-event', bullet: 23, action: 'Desbloquear un destino, profecia o evento mistico', xp: 30, note: 'Usualmente relacionado a un arco narrativo.' },
  { id: 'perfect-master-plan', bullet: 24, action: 'Plan maestro ejecutado a la perfeccion', xp: 35, note: 'Cuando el grupo actua coordinado y todo sale bien.' },
  { id: 'combat-critical', bullet: 25, action: 'Critico en combate (natural 20)', xp: 10, note: 'Si el golpe tuvo impacto narrativo, fue creativo o decisivo.' },
  { id: 'noncombat-critical', bullet: 26, action: 'Critico fuera de combate (habilidad/hechizo)', xp: 15, note: 'Acciones epicas como convencer a una multitud, resolver un acertijo o salvar una vida.' },
  { id: 'plot-critical', bullet: 27, action: 'Critico en momento clave de trama', xp: 20, note: 'Ejemplo: activar un artefacto, evitar un desastre o cumplir una profecia.' },
  { id: 'combat-fumble', bullet: 28, action: 'Pifia en combate (natural 1)', xp: -5, note: 'Solo si perjudica al grupo o causa dano serio. Se puede ignorar si se rolea bien.' },
  { id: 'noncombat-fumble', bullet: 29, action: 'Pifia fuera de combate (habilidad)', xp: -5, note: 'Cuando genera consecuencias graves o muy costosas. Opcional segun el tono del juego.' },
  { id: 'memorable-fumble', bullet: 30, action: 'Pifia epica bien roleada', xp: 5, note: 'Recompensa si el jugador convierte el fallo en un momento memorable y divertido.' },
];
const WORKSPACE_ENTITY_CONFIGS = [
  { collection: 'notes', type: 'note', label: 'Nota', plural: 'Notas', emptyTitle: 'Nueva nota' },
  { collection: 'places', type: 'place', label: 'Lugar', plural: 'Lugares', emptyTitle: 'Nuevo lugar' },
  { collection: 'cities', type: 'city', label: 'Ciudad', plural: 'Ciudades', emptyTitle: 'Nueva ciudad' },
  { collection: 'factions', type: 'faction', label: 'Facción', plural: 'Facciones', emptyTitle: 'Nueva facción' },
  { collection: 'missions', type: 'mission', label: 'Misión', plural: 'Misiones', emptyTitle: 'Nueva misión' },
  { collection: 'secrets', type: 'secret', label: 'Secreto', plural: 'Secretos', emptyTitle: 'Nuevo secreto' },
];
const WORKSPACE_COLLECTIONS = WORKSPACE_ENTITY_CONFIGS.map(config => config.collection);
const WORKSPACE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const DM_TOOL_CONFIGS = [
  { type: 'scene', label: 'Escena', plural: 'Escenas', fields: [
    { key: 'purpose', label: 'Propósito' },
    { key: 'pressure', label: 'Presión' },
    { key: 'twist', label: 'Giro' },
  ] },
  { type: 'encounter', label: 'Encuentro', plural: 'Encuentros', fields: [
    { key: 'goal', label: 'Objetivo' },
    { key: 'terrain', label: 'Terreno' },
    { key: 'complication', label: 'Complicación' },
  ] },
  { type: 'trap', label: 'Trampa', plural: 'Trampas', fields: [
    { key: 'trigger', label: 'Detonante' },
    { key: 'tell', label: 'Señal' },
    { key: 'consequence', label: 'Consecuencia' },
  ] },
  { type: 'hazard', label: 'Peligro', plural: 'Peligros', fields: [
    { key: 'source', label: 'Fuente' },
    { key: 'zone', label: 'Zona' },
    { key: 'escalation', label: 'Escalada' },
  ] },
  { type: 'reward', label: 'Recompensa', plural: 'Recompensas', fields: [
    { key: 'type', label: 'Tipo' },
    { key: 'value', label: 'Valor' },
    { key: 'condition', label: 'Condición' },
  ] },
  { type: 'faction', label: 'Facción', plural: 'Facciones', fields: [
    { key: 'desire', label: 'Deseo' },
    { key: 'resource', label: 'Recurso' },
    { key: 'pressure', label: 'Presión' },
  ] },
  { type: 'settlement', label: 'Asentamiento', plural: 'Asentamientos', fields: [
    { key: 'trait', label: 'Rasgo' },
    { key: 'problem', label: 'Problema' },
    { key: 'opportunity', label: 'Oportunidad' },
  ] },
  { type: 'dungeon', label: 'Mazmorra', plural: 'Mazmorras', fields: [
    { key: 'theme', label: 'Tema' },
    { key: 'entrance', label: 'Entrada' },
    { key: 'secret', label: 'Secreto' },
  ] },
  { type: 'npc', label: 'PNJ', plural: 'PNJ', fields: [
    { key: 'role', label: 'Rol' },
    { key: 'desire', label: 'Deseo' },
    { key: 'secret', label: 'Secreto' },
  ] },
  { type: 'clock', label: 'Reloj', plural: 'Relojes', fields: [
    { key: 'progress', label: 'Avance' },
    { key: 'trigger', label: 'Disparador' },
    { key: 'outcome', label: 'Resultado' },
  ] },
];
const DM_TOOL_STATUSES = [
  { id: 'draft', label: 'Borrador' },
  { id: 'ready', label: 'Listo' },
  { id: 'active', label: 'Activo' },
  { id: 'resolved', label: 'Resuelto' },
  { id: 'archived', label: 'Archivado' },
];
const ONBOARDING_STEPS = [
  {
    id: 'overview',
    view: 'dashboard',
    kicker: 'Mapa general',
    title: 'Empieza por el resumen',
    copy: 'El resumen concentra el estado de la campaña, el buscador global y los accesos rápidos para seguir preparando la mesa.',
    points: ['Busca cualquier texto guardado dentro de la campaña.', 'Abre resultados de páginas, sesiones, personajes, recursos y herramientas DM.', 'Usa los accesos rápidos para pasar de preparación a registro de sesión.'],
    action: 'Abrir resumen',
  },
  {
    id: 'pages',
    view: 'notes',
    kicker: 'Diario vivo',
    title: 'Escribe páginas enlazables',
    copy: 'Páginas funciona como un diario de campaña para notas, lugares, ciudades, facciones, misiones y secretos.',
    points: ['Usa visibilidad para separar borradores DM de contenido revelado.', 'Escribe [[Nombre]] para enlazar a otra página, personaje, sesión o herramienta.', 'Filtra por tipo y busca por título, etiqueta o contenido.'],
    action: 'Abrir páginas',
  },
  {
    id: 'resources',
    view: 'notes',
    kicker: 'Recursos',
    title: 'Adjunta imágenes y links',
    copy: 'Cada página puede guardar recursos útiles para describir escenas, pistas, lugares o referencias de mesa.',
    points: ['Sube imágenes locales en PNG, JPG o WebP.', 'Guarda hipervínculos con una etiqueta legible.', 'Los recursos también aparecen en búsqueda y pueden entrar al tablero.'],
    action: 'Abrir recursos',
  },
  {
    id: 'board',
    view: 'board',
    kicker: 'Tablero detective',
    title: 'Une puntos visualmente',
    copy: 'El tablero conecta personajes, páginas, sesiones, imágenes, links y herramientas DM sin duplicar la información original.',
    points: ['Añade nodos desde la biblioteca lateral.', 'Conecta dos nodos, etiqueta la relación y cambia el orden de pistas.', 'Mueve, elimina, deshace y rehace cambios mientras preparas.'],
    action: 'Abrir tablero',
  },
  {
    id: 'dm-tools',
    view: 'tools',
    kicker: 'Mesa del DM',
    title: 'Prepara con herramientas DM',
    copy: 'Herramientas DM guarda escenas, encuentros, trampas, peligros, recompensas, facciones, asentamientos, mazmorras, PNJ y relojes.',
    points: ['Cada herramienta tiene estado, visibilidad, etiquetas y campos rápidos.', 'Puedes enlazarlas desde páginas con [[Nombre]].', 'También puedes llevarlas al tablero para relacionarlas con pistas y lugares.'],
    action: 'Abrir DM',
  },
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('es-CL');
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

let portfolio = { campaigns: [] };
let activeCampaignId = null;
let state = null;
let pendingBanner = '';
let pendingCharacterPortrait = '';
let pendingUnlockAction = 'open';
let activeWorkspaceCollection = 'notes';
let activeWorkspaceEntityId = '';
let activeDmToolType = 'scene';
let activeDmToolId = '';
let activeOnboardingStep = 0;
let activeBoardId = 'main';
let selectedBoardNodeId = '';
let selectedBoardConnectionId = '';
let boardConnectMode = false;
let boardConnectSourceNodeId = '';
let boardDrag = null;
let boardUndoStack = [];
let boardRedoStack = [];
let remoteWorkspaceSaveTimer = null;
let remoteWorkspaceSaveInFlight = null;
const unlockedCampaigns = new Set();
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let globalAppearance = loadGlobalAppearance();

setupPageBridge('campaigns', (link) => {
  const href = link.getAttribute('href') || '';
  return href.startsWith('../') ? 'compendium' : '';
});

function loadGlobalAppearance() {
  const saved = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return darkModeQuery.matches ? 'dark' : 'light';
}

function hasSavedGlobalAppearance() {
  const saved = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
  return saved === 'dark' || saved === 'light';
}

function resolveCampaignAppearance(preference = 'auto') {
  return preference === 'auto' ? globalAppearance : preference;
}

function applyGlobalAppearance() {
  document.body.classList.toggle('campaigns-dark', globalAppearance === 'dark');
  document.body.dataset.appearance = globalAppearance;

  const toggle = $('#campaigns-mode-toggle');
  if (toggle) {
    const nextLabel = globalAppearance === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro';
    toggle.textContent = globalAppearance === 'dark' ? '☀' : '☾';
    toggle.setAttribute('aria-label', nextLabel);
    toggle.title = nextLabel;
  }

  const app = $('#campaign-app');
  if (app?.dataset.appearancePreference === 'auto') {
    app.dataset.appearance = resolveCampaignAppearance('auto');
  }
}

function setGlobalAppearance(appearance) {
  globalAppearance = appearance;
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, appearance);
  applyGlobalAppearance();
}

function loadPortfolio() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.campaigns)) {
      return { ...saved, campaigns: saved.campaigns.map(normalizeCampaign) };
    }
  } catch (error) {
    console.warn('No se pudo leer el guardado local.', error);
  }
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacy && Array.isArray(legacy.characters) && Array.isArray(legacy.sessions)) {
      return { campaigns: [normalizeCampaign({ id: uid(), name: 'Mi primera campaña', dm: '', system: 'D&D 5e 2024', description: 'Campaña recuperada de Crónicas de Experiencia.', color: '#9b4e35', characters: legacy.characters, sessions: legacy.sessions, createdAt: new Date().toISOString() })] };
    }
  } catch (error) {
    console.warn('No se pudo migrar el guardado anterior.', error);
  }
  return { campaigns: [] };
}

async function loadInitialPortfolio() {
  if (!USE_REMOTE_STORAGE) return loadPortfolio();
  try {
    const data = await remoteStorage.listCampaigns();
    return { campaigns: (data.campaigns || []).map(normalizeCampaign) };
  } catch (error) {
    console.warn('No se pudo cargar Supabase; usando guardado local.', error);
    showToast('No se pudo conectar al archivo compartido. Usando modo local.');
    return loadPortfolio();
  }
}

async function reloadCampaigns() {
  portfolio = await loadInitialPortfolio();
  renderCampaigns();
}

async function reloadActiveCampaign() {
  if (!USE_REMOTE_STORAGE || !activeCampaignId) return;
  await flushRemoteWorkspaceSave();
  const data = await remoteStorage.getCampaign(activeCampaignId);
  const campaign = normalizeCampaign(data.campaign);
  portfolio.campaigns = portfolio.campaigns.map(entry => entry.id === campaign.id ? campaign : entry);
  if (!portfolio.campaigns.some(entry => entry.id === campaign.id)) portfolio.campaigns.push(campaign);
  state = campaign;
  renderAll();
  renderSessionForm();
}

function saveState() {
  if (USE_REMOTE_STORAGE) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
}

function queueRemoteWorkspaceSave() {
  if (!USE_REMOTE_STORAGE || !activeCampaignId || !state) return;
  clearTimeout(remoteWorkspaceSaveTimer);
  remoteWorkspaceSaveTimer = setTimeout(saveRemoteWorkspace, 350);
}

async function saveRemoteWorkspace() {
  if (!USE_REMOTE_STORAGE || !activeCampaignId || !state) return;
  clearTimeout(remoteWorkspaceSaveTimer);
  remoteWorkspaceSaveTimer = null;
  if (remoteWorkspaceSaveInFlight) {
    await remoteWorkspaceSaveInFlight;
    return saveRemoteWorkspace();
  }

  const workspace = normalizeCampaignWorkspace(state);
  remoteWorkspaceSaveInFlight = remoteStorage.saveWorkspace(activeCampaignId, workspace)
    .catch(error => {
      console.warn('No se pudo guardar el workspace remoto.', error);
      showToast('No se pudo guardar la Bitácora remota.');
    })
    .finally(() => {
      remoteWorkspaceSaveInFlight = null;
    });
  await remoteWorkspaceSaveInFlight;
}

async function flushRemoteWorkspaceSave() {
  if (!USE_REMOTE_STORAGE || (!remoteWorkspaceSaveTimer && !remoteWorkspaceSaveInFlight)) return;
  await saveRemoteWorkspace();
}

function activeCampaign() {
  return portfolio.campaigns.find(campaign => campaign.id === activeCampaignId);
}

function isSummaryOnlyMode() {
  return Boolean(state?.passwordHash && !unlockedCampaigns.has(state.id));
}

function getSystemId(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return SYSTEMS[value]?.id || SYSTEM_ALIASES[normalized] || 'dnd5e2024';
}

function getCampaignSystem(campaign = state) {
  return SYSTEMS[getSystemId(campaign?.systemId || campaign?.system)] || SYSTEMS.dnd5e2024;
}

function normalizeCampaign(campaign) {
  const system = getCampaignSystem(campaign);
  return {
    ...campaign,
    systemId: system.id,
    system: system.name,
    characters: Array.isArray(campaign.characters) ? campaign.characters.map(normalizeCharacter) : [],
    sessions: Array.isArray(campaign.sessions) ? campaign.sessions.map(normalizeCampaignSession) : [],
    workspace: normalizeCampaignWorkspace(campaign),
  };
}

function normalizeCharacter(character) {
  return normalizeCampaignCharacterRecord(character);
}

function formatResource(value, campaign = state) {
  const system = getCampaignSystem(campaign);
  return `${formatNumber(value)} ${system.unit}`;
}

function compareSessionsByRecency(a = {}, b = {}) {
  const aNumber = Number(a.number) || 0;
  const bNumber = Number(b.number) || 0;
  if (aNumber !== bNumber) return aNumber - bNumber;
  const aDate = Date.parse(`${a.date || ''}T00:00:00Z`) || Date.parse(a.createdAt || '') || 0;
  const bDate = Date.parse(`${b.date || ''}T00:00:00Z`) || Date.parse(b.createdAt || '') || 0;
  return aDate - bDate;
}

function getLatestCampaignSession(sessions = []) {
  return (sessions || []).reduce((latest, session) => (
    !latest || compareSessionsByRecency(session, latest) > 0 ? session : latest
  ), null);
}

function getCyberpunkAwardLedger(campaign = state, sessions = campaign?.sessions || []) {
  const characters = Array.isArray(campaign?.characters) ? campaign.characters : [];
  const characterIndex = new Map(characters.map((character, index) => [character.id, { character, index }]));
  const latestCampaignSession = getLatestCampaignSession(sessions);
  const ledger = new Map();

  function ensureEntry(characterId, fallbackName = 'Personaje eliminado') {
    const indexed = characterIndex.get(characterId);
    const character = indexed?.character;
    const key = character?.id || characterId || fallbackName;
    if (!ledger.has(key)) {
      ledger.set(key, {
        key,
        characterId: character?.id || characterId || '',
        characterName: character?.name || fallbackName || 'Personaje eliminado',
        player: character?.player || '',
        current: character ? Number(character.xp || 0) : null,
        assigned: 0,
        lastSessionAssigned: 0,
        sessionCount: 0,
        latestSession: 0,
        campaignLatestSessionNumber: Number(latestCampaignSession?.number) || 0,
        campaignLatestSessionName: latestCampaignSession?.name || '',
        categories: new Map(),
        order: indexed?.index ?? characters.length + ledger.size,
      });
    }

    const entry = ledger.get(key);
    if (character) {
      entry.characterName = character.name || entry.characterName;
      entry.player = character.player || entry.player;
      entry.current = Number(character.xp || 0);
    }
    return entry;
  }

  characters.forEach(character => ensureEntry(character.id, character.name));
  (sessions || []).forEach(session => {
    (session.allocations || []).forEach(allocation => {
      const character = characterIndex.get(allocation.characterId)?.character;
      const entry = ensureEntry(allocation.characterId, allocation.characterName || character?.name || 'Personaje eliminado');
      const total = Number(allocation.total || 0);
      entry.assigned += total;
      if (session === latestCampaignSession || (latestCampaignSession?.id && session.id === latestCampaignSession.id)) {
        entry.lastSessionAssigned += total;
      }
      entry.sessionCount += 1;
      entry.latestSession = Math.max(entry.latestSession, Number(session.number) || 0);

      const details = allocation.awardDetails?.length
        ? allocation.awardDetails
        : [{ category: allocation.awardCategory || 'Grupo', total }];
      details.forEach(detail => {
        const detailTotal = Number(detail.total || 0);
        if (!detailTotal) return;
        const category = String(detail.category || 'Grupo').trim() || 'Grupo';
        entry.categories.set(category, (entry.categories.get(category) || 0) + detailTotal);
      });
    });
  });

  return [...ledger.values()]
    .map(entry => ({ ...entry, categories: [...entry.categories.entries()] }))
    .sort((a, b) => a.order - b.order || b.assigned - a.assigned || a.characterName.localeCompare(b.characterName));
}

function getCyberpunkLedgerEntry(characterId, campaign = state) {
  const latestCampaignSession = getLatestCampaignSession(campaign?.sessions || []);
  return getCyberpunkAwardLedger(campaign).find(entry => entry.characterId === characterId) || {
    assigned: 0,
    lastSessionAssigned: 0,
    sessionCount: 0,
    campaignLatestSessionNumber: Number(latestCampaignSession?.number) || 0,
    campaignLatestSessionName: latestCampaignSession?.name || '',
    categories: [],
  };
}

function formatCyberpunkLedgerLine(entry = {}) {
  const count = Number(entry.sessionCount || 0);
  return `Asignado en bitácora: ${formatResource(entry.assigned || 0)} en ${formatNumber(count)} sesión${count === 1 ? '' : 'es'}`;
}

function formatCyberpunkLastSessionLine(entry = {}) {
  const sessionNumber = Number(entry.campaignLatestSessionNumber || 0);
  const sessionLabel = sessionNumber ? `Sesión ${formatNumber(sessionNumber)}` : 'Sin sesiones';
  return `Última sesión: ${formatResource(entry.lastSessionAssigned || 0)} (${sessionLabel})`;
}

function renderCyberpunkCharacterPpSummary(entry = {}) {
  const sessionNumber = Number(entry.campaignLatestSessionNumber || 0);
  const sessionLabel = sessionNumber ? `Sesión ${formatNumber(sessionNumber)}` : 'Sin sesiones';
  return `<div class="character-pp-summary">
    <div><span>PP asignados a este personaje</span><b>${formatResource(entry.assigned || 0)}</b></div>
    <div><span>PP asignados en última sesión</span><b>${formatResource(entry.lastSessionAssigned || 0)}</b><small>${escapeHTML(sessionLabel)}</small></div>
  </div>`;
}

function getSessionStats(campaign = state) {
  const sessions = Array.isArray(campaign?.sessions) ? campaign.sessions : [];
  const registered = Math.max(0, Number(campaign?.sessionCount ?? sessions.length) || 0);
  const latestFromSessions = sessions.reduce((max, session) => Math.max(max, Number(session.number) || 0), 0);
  const latest = Math.max(0, Number(campaign?.latestSessionNumber || 0), latestFromSessions);
  return {
    registered,
    latest,
    hasExternalHistory: latest > registered,
  };
}

function formatSessionRegistrationLabel(count) {
  return `${formatNumber(count)} registro${count === 1 ? '' : 's'} en bitácora`;
}

function formatCharacterCountLabel(count) {
  return `${formatNumber(count)} personaje${count === 1 ? '' : 's'}`;
}

function formatSessionCurrentLabel(number) {
  return number > 0 ? `Sesión actual ${formatNumber(number)}` : 'Sin sesiones';
}

function campaignSessionMeta(campaign) {
  const stats = getSessionStats(campaign);
  const meta = [];
  if (stats.latest > 0 && stats.latest !== stats.registered) meta.push(formatSessionCurrentLabel(stats.latest));
  meta.push(formatSessionRegistrationLabel(stats.registered));
  return meta;
}

function formatSignedResource(value, campaign = state) {
  return `${Number(value) > 0 ? '+' : ''}${formatResource(value, campaign)}`;
}

function formatSignedNumber(value) {
  const number = Math.round(Number(value) || 0);
  return number > 0 ? `+${formatNumber(number)}` : formatNumber(number);
}

function formatMultiplier(value) {
  return Number(value).toFixed(1).replace(/\.0$/, '');
}

function getDndLevelGap(level) {
  const index = Math.max(0, Math.min(XP_THRESHOLDS.length - 2, level - 1));
  return XP_THRESHOLDS[index + 1] - XP_THRESHOLDS[index];
}

function getAverageDndLevelGap(minLevel, maxLevel) {
  const gaps = [];
  for (let level = minLevel; level <= maxLevel && level < 20; level += 1) gaps.push(getDndLevelGap(level));
  return gaps.reduce((sum, gap) => sum + gap, 0) / Math.max(1, gaps.length);
}

function buildDndRewardTiers() {
  const tiers = [
    { minLevel: 1, maxLevel: 4, label: 'Niveles 1-4' },
    { minLevel: 5, maxLevel: 8, label: 'Niveles 5-8' },
    { minLevel: 9, maxLevel: 12, label: 'Niveles 9-12' },
    { minLevel: 13, maxLevel: 16, label: 'Niveles 13-16' },
    { minLevel: 17, maxLevel: 20, label: 'Niveles 17-20' },
  ];
  const baseGap = getAverageDndLevelGap(1, 4);
  return tiers.map(tier => ({
    ...tier,
    multiplier: tier.minLevel === 1 ? 1 : Math.round((getAverageDndLevelGap(tier.minLevel, tier.maxLevel) / baseGap) * 10) / 10,
  }));
}

function getDndRewardTier(level) {
  return DND_XP_REWARD_TIERS.find(tier => level >= tier.minLevel && level <= tier.maxLevel) || DND_XP_REWARD_TIERS[0];
}

async function hashPassword(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function requestCampaignUnlock(campaign, action = 'open') {
  pendingUnlockAction = action;
  $('#unlock-campaign-id').value = campaign.id;
  $('#unlock-title').textContent = campaign.name;
  $('#unlock-copy').textContent = action === 'open' ? 'Introduce la contraseña para acceder a sus personajes, sesiones y bitácora.' : 'Introduce la contraseña para administrar esta campaña.';
  $('#unlock-password').value = '';
  $('#unlock-error').classList.add('hidden');
  $('#unlock-modal').classList.remove('hidden');
  $('#unlock-password').focus();
}

function activateCampaign(campaign) {
  const theme = campaign.theme || 'parchment';
  const font = campaign.font || 'classic';
  const appearance = campaign.appearance || 'auto';
  const app = $('#campaign-app');
  activeCampaignId = campaign.id;
  state = campaign;
  resetBoardRuntimeState();
  $('#campaigns-home').classList.add('hidden');
  app.classList.remove('hidden');
  app.dataset.theme = theme;
  app.dataset.font = font;
  app.dataset.appearance = resolveCampaignAppearance(appearance);
  app.dataset.appearancePreference = appearance;
  app.style.setProperty('--accent', campaign.color || '#9b4e35');
  const topbar = app.querySelector('.topbar');
  topbar.classList.toggle('has-banner', Boolean(campaign.banner));
  topbar.style.backgroundImage = campaign.banner ? `linear-gradient(90deg, rgba(20,15,11,.86), rgba(20,15,11,.34)), url('${campaign.banner}')` : '';
  $('#sidebar-campaign-name').textContent = campaign.name;
  $('#campaign-context').textContent = campaign.name;
  updateSystemCopy();
  updateAccessMode();
  renderAll();
  renderSessionForm();
  navigate('dashboard');
  queueCampaignOnboarding();
}

function updateAccessMode() {
  const locked = isSummaryOnlyMode();
  const app = $('#campaign-app');
  app.dataset.access = locked ? 'summary' : 'full';
  $$('[data-view]').forEach(button => {
    const shouldLock = locked && button.dataset.view !== 'dashboard';
    button.disabled = shouldLock;
    button.classList.toggle('is-locked', shouldLock);
  });
  $$('[data-go]').forEach(button => {
    const shouldLock = locked && button.dataset.go !== 'dashboard';
    button.disabled = shouldLock;
    button.classList.toggle('is-locked', shouldLock);
  });

  const topbarButton = $('.topbar .primary-button');
  if (!topbarButton) return;
  if (locked) {
    topbarButton.textContent = 'Desbloquear campaña';
    delete topbarButton.dataset.go;
    topbarButton.dataset.action = 'unlock-active-campaign';
    topbarButton.disabled = false;
    topbarButton.classList.remove('is-locked');
  } else {
    topbarButton.textContent = '+ Registrar sesión';
    topbarButton.dataset.go = 'new-session';
    delete topbarButton.dataset.action;
    topbarButton.disabled = false;
    topbarButton.classList.remove('is-locked');
  }
}

async function openCampaign(id) {
  let campaign = portfolio.campaigns.find(entry => entry.id === id);
  if (!campaign) return;
  if (USE_REMOTE_STORAGE) {
    try {
      const data = await remoteStorage.getCampaign(id);
      campaign = normalizeCampaign(data.campaign);
    } catch (error) {
      showToast('No se pudo abrir la campaña compartida.');
      return;
    }
  }
  activateCampaign(campaign);
}

async function deleteCampaign(campaign) {
  if (!confirm(`¿Eliminar la campaña ${campaign.name}? Se borrarán sus personajes, sesiones y ${getCampaignSystem(campaign).resourceName}.`)) return;
  if (USE_REMOTE_STORAGE) {
    try {
      await remoteStorage.deleteCampaign(campaign.id);
      unlockedCampaigns.delete(campaign.id);
      await reloadCampaigns();
      showToast('Campaña eliminada.');
    } catch (error) {
      showToast('No se pudo eliminar la campaña compartida.');
    }
    return;
  }
  portfolio.campaigns = portfolio.campaigns.filter(entry => entry.id !== campaign.id);
  unlockedCampaigns.delete(campaign.id);
  saveState();
  renderCampaigns();
  showToast('Campaña eliminada.');
}

function showCampaignsHome() {
  activeCampaignId = null;
  state = null;
  $('#campaign-app').classList.add('hidden');
  $('#campaigns-home').classList.remove('hidden');
  renderCampaigns();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCampaigns() {
  const campaigns = portfolio.campaigns.map(normalizeCampaign);
  const totals = campaigns.reduce((summary, campaign) => {
    const characterCount = campaign.characterCount ?? campaign.characters.length;
    const sessionStats = getSessionStats(campaign);
    const totalAwarded = campaign.totalAwarded ?? campaign.sessions.reduce((sum, session) => sum + (session.totalAwarded || 0), 0);
    summary.characters += characterCount;
    summary.sessions += sessionStats.registered;
    summary.awards += totalAwarded;
    return summary;
  }, { characters: 0, sessions: 0, awards: 0 });
  $("#campaign-count").textContent = `${campaigns.length} campaña${campaigns.length === 1 ? "" : "s"}`;
  $("#home-campaign-total").textContent = formatNumber(campaigns.length);
  $("#home-character-total").textContent = formatNumber(totals.characters);
  $("#home-session-total").textContent = formatNumber(totals.sessions);
  $("#home-award-total").textContent = formatNumber(totals.awards);
  $("#campaign-grid").classList.toggle("single-campaign", campaigns.length === 1);
  $("#campaign-grid").innerHTML = campaigns.length ? campaigns.map(campaign => {
    const characterCount = campaign.characterCount ?? campaign.characters.length;
    const sessionStats = getSessionStats(campaign);
    const sessionMeta = campaignSessionMeta(campaign).map(item => `<span>${escapeHTML(item)}</span>`).join("");
    const totalXP = campaign.totalAwarded ?? campaign.sessions.reduce((sum, session) => sum + (session.totalAwarded || 0), 0);
    const nextStep = characterCount === 0
      ? "Siguiente paso: agrega los personajes de la mesa."
      : (sessionStats.registered === 0
        ? "Siguiente paso: registra la primera sesión."
        : (sessionStats.hasExternalHistory
          ? `Bitácora iniciada en sesión ${formatNumber(sessionStats.latest)}; continúa con la ${formatNumber(sessionStats.latest + 1)}.`
          : "Lista para continuar la bitácora."));
    const bannerStyle = campaign.banner ? `background-image:url('${campaign.banner}')` : "";
    const fontFamilies = { classic: "Cinzel,serif", medieval: "MedievalSharp,cursive", chronicle: "IM Fell English,serif", arcane: "Uncial Antiqua,serif", modern: "Inter,sans-serif" };
    return `<article class="campaign-card" style="--campaign-color:${campaign.color || "#9b4e35"};--card-display-font:${fontFamilies[campaign.font || "classic"]}">
      <div class="campaign-card-banner" style="${bannerStyle}"></div>
      <div class="campaign-card-content">
        <p class="eyebrow">${escapeHTML(getCampaignSystem(campaign).name)}</p>
        <h3>${escapeHTML(campaign.name)}</h3>
        <p>${escapeHTML(campaign.description || "Una nueva travesia esta a punto de comenzar.")}</p>
        <div class="campaign-meta"><span>${formatCharacterCountLabel(characterCount)}</span>${sessionMeta}<span>${formatResource(totalXP, campaign)}</span>${campaign.dm ? `<span>DM: ${escapeHTML(campaign.dm)}</span>` : ""}${campaign.passwordHash ? '<span class="lock-label">Protegida</span>' : ""}</div>
        <div class="campaign-next-step">${nextStep}</div>
      </div>
      <div class="campaign-card-actions">
        <button class="primary-button open-campaign" data-id="${campaign.id}">Entrar a la campaña</button>
        <div class="campaign-card-tools"><button class="text-button share-campaign" data-id="${campaign.id}">Compartir</button><button class="text-button edit-campaign" data-id="${campaign.id}">Editar</button><button class="text-button danger-button delete-campaign" data-id="${campaign.id}">Eliminar</button></div>
      </div>
    </article>`;
  }).join("") : `<div class="empty-state" style="grid-column:1/-1"><h3>Tu primera travesía te espera</h3><p>Crea una campaña para comenzar a reunir personajes, sesiones y experiencia.</p><button class="primary-button new-campaign-button" id="empty-new-campaign">Crear primera campaña</button></div>`;
}

function openNewCampaignModal(trigger) {
  if (trigger) {
    trigger.classList.remove('is-launching');
    void trigger.offsetWidth;
    trigger.classList.add('is-launching');
    window.setTimeout(() => trigger.classList.remove('is-launching'), 520);
  }
  window.setTimeout(() => openCampaignModal(), 110);
}

function getCampaignShareUrl(campaign) {
  if (USE_REMOTE_STORAGE) return `${window.location.origin}/api/campaigns/${campaign.id}/preview`;
  const params = new URLSearchParams(window.location.search);
  params.set('campaign', campaign.id);
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

async function shareCampaign(campaign) {
  const url = getCampaignShareUrl(campaign);
  const text = campaign.description || 'Bitácora compartida de D20 Travesías.';
  try {
    if (navigator.share) {
      await navigator.share({ title: campaign.name, text, url });
      return;
    }
    await copyText(url);
    showToast('Enlace de campana copiado.');
  } catch (error) {
    if (error.name !== 'AbortError') showToast('No se pudo compartir la campana.');
  }
}

function openCampaignModal(campaign = null) {
  const system = getCampaignSystem(campaign);
  $('#campaign-form').reset();
  $('#campaign-id').value = campaign?.id || '';
  $('#campaign-name').value = campaign?.name || '';
  $('#campaign-dm').value = campaign?.dm || '';
  $('#campaign-system').value = system.id;
  $('#campaign-description').value = campaign?.description || '';
  $('#campaign-theme').value = campaign?.theme || 'parchment';
  $('#campaign-font').value = campaign?.font || 'classic';
  $('#font-preview').dataset.font = campaign?.font || 'classic';
  $('#campaign-appearance').value = campaign?.appearance || 'auto';
  $('#campaign-color').value = campaign?.color || '#9b4e35';
  $('#campaign-protected').checked = Boolean(campaign?.passwordHash);
  $('#campaign-password').value = '';
  $('#campaign-password-fields').classList.toggle('hidden', !campaign?.passwordHash);
  pendingBanner = campaign?.banner || '';
  updateBannerPreview();
  $('#campaign-form-title').textContent = campaign ? 'Editar campaña' : 'Crear campaña';
  $('#campaign-modal').classList.remove('hidden');
  $('#campaign-name').focus();
}

function updateBannerPreview() {
  const preview = $('#campaign-banner-preview');
  preview.style.backgroundImage = pendingBanner ? `url('${pendingBanner}')` : '';
  preview.innerHTML = pendingBanner ? '' : '<span>Sin imagen seleccionada</span>';
  $('#remove-campaign-banner').classList.toggle('hidden', !pendingBanner);
}

function updateCharacterPortraitPreview() {
  const preview = $('#character-portrait-preview');
  preview.style.backgroundImage = pendingCharacterPortrait ? `url('${pendingCharacterPortrait}')` : '';
  preview.innerHTML = pendingCharacterPortrait ? '' : '<span>Sin retrato seleccionado</span>';
  $('#remove-character-portrait').classList.toggle('hidden', !pendingCharacterPortrait);
}

function resizeImage(file, { maxWidth = 1600, quality = .82 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function closeCampaignModal() {
  $('#campaign-modal').classList.add('hidden');
}

function getLevel(xp) {
  let level = 1;
  XP_THRESHOLDS.forEach((threshold, index) => { if (xp >= threshold) level = index + 1; });
  return Math.min(level, 20);
}

function getProgress(xp) {
  const system = getCampaignSystem();
  if (system.id === 'cyberpunkRed') return getCyberpunkProgress(xp);
  const level = getLevel(xp);
  if (level === 20) return { level, percent: 100, current: xp, next: null, remaining: 0 };
  const current = XP_THRESHOLDS[level - 1];
  const next = XP_THRESHOLDS[level];
  return { level, current, next, remaining: next - xp, percent: Math.max(0, Math.min(100, ((xp - current) / (next - current)) * 100)) };
}

function getCyberpunkProgress(points) {
  const pp = Math.max(0, Math.round(Number(points) || 0));
  const nextCost = Array.from({ length: 10 }, (_, index) => (index + 1) * SYSTEMS.cyberpunkRed.costTables.typical.multiplier).find(cost => pp < cost) || null;
  return {
    level: pp,
    percent: nextCost ? Math.max(0, Math.min(100, (pp / nextCost) * 100)) : 100,
    current: pp,
    next: nextCost,
    remaining: nextCost ? nextCost - pp : 0,
  };
}

function getCyberpunkUpgradeSummary(points) {
  const pp = Math.max(0, Math.round(Number(points) || 0));
  return Object.values(SYSTEMS.cyberpunkRed.costTables).map(table => {
    const maxRank = Math.min(10, Math.floor(pp / table.multiplier));
    const nextRank = Math.min(10, maxRank + 1);
    const nextCost = nextRank <= 10 ? nextRank * table.multiplier : null;
    const status = maxRank > 0 ? `cubre coste hasta valor ${maxRank}` : 'sin mejora disponible';
    return `${table.label}: ${status}${nextCost ? `; siguiente ${nextCost} PP` : '; coste maximo cubierto'}`;
  }).join(' | ');
}

function updateSystemCopy() {
  const system = getCampaignSystem();
  $('#character-class-label').textContent = system.roleLabel;
  $('#character-class').placeholder = system.rolePlaceholder;
  $('#character-xp-label').textContent = system.characterValueLabel;
  $('#character-xp-help').textContent = system.characterValueHelp;
  $('#pools-help').textContent = system.poolsHelp;
  $('#pool-combat-label').textContent = system.poolLabels[0];
  $('#pool-roleplay-label').textContent = system.poolLabels[1];
  $('#pool-manual-label').textContent = system.poolLabels[2];
  $('#pool-combat-help').textContent = system.poolHelps[0];
  $('#pool-roleplay-help').textContent = system.poolHelps[1];
  $('#pool-manual-help').textContent = system.poolHelps[2];
  $('#bonus-title').textContent = system.bonusTitle;
  $('#bonus-help').textContent = system.bonusHelp;
  $('#session-total-label').textContent = system.totalAwardedLabel;
  const poolsPanel = document.querySelector('.xp-pools')?.closest('.panel');
  if (poolsPanel) poolsPanel.classList.toggle('hidden', system.id === 'cyberpunkRed');
  const poolsHeading = poolsPanel?.querySelector('h2');
  if (poolsHeading) poolsHeading.textContent = system.poolsTitle;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function clampOnboardingStep(index = 0) {
  return Math.min(Math.max(Number(index) || 0, 0), ONBOARDING_STEPS.length - 1);
}

function getCampaignOnboarding() {
  const workspace = ensureWorkspace();
  const current = workspace.onboarding || {};
  workspace.onboarding = {
    firstVisitAt: current.firstVisitAt || '',
    completedSteps: Array.isArray(current.completedSteps) ? current.completedSteps : [],
    dismissedAt: current.dismissedAt || '',
  };
  return workspace.onboarding;
}

function updateCampaignOnboarding(patch = {}) {
  if (!state) return null;
  const workspace = ensureWorkspace();
  const current = getCampaignOnboarding();
  workspace.onboarding = {
    ...current,
    ...patch,
    completedSteps: [...new Set(patch.completedSteps || current.completedSteps || [])],
  };
  persistActiveCampaign();
  return workspace.onboarding;
}

function markCampaignOnboardingStep(stepId) {
  const onboarding = getCampaignOnboarding();
  const nextSteps = [...new Set([...(onboarding.completedSteps || []), stepId])];
  if (onboarding.completedSteps.length !== nextSteps.length) updateCampaignOnboarding({ completedSteps: nextSteps });
}

function renderCampaignOnboarding() {
  const modal = $('#onboarding-modal');
  if (!modal) return;
  const step = ONBOARDING_STEPS[activeOnboardingStep];
  $('#onboarding-progress').textContent = `Paso ${activeOnboardingStep + 1} de ${ONBOARDING_STEPS.length}`;
  $('#onboarding-kicker').textContent = step.kicker;
  $('#onboarding-step-title').textContent = step.title;
  $('#onboarding-copy').textContent = step.copy;
  $('#onboarding-points').innerHTML = step.points.map(point => `<li>${escapeHTML(point)}</li>`).join('');
  $('#onboarding-stepper').innerHTML = ONBOARDING_STEPS.map((item, index) => (
    `<button type="button" class="${index === activeOnboardingStep ? 'active' : ''}" data-onboarding-step="${index}" aria-label="Abrir paso ${index + 1}">${index + 1}<span>${escapeHTML(item.kicker)}</span></button>`
  )).join('');
  $('#onboarding-prev').disabled = activeOnboardingStep === 0;
  $('#onboarding-next').textContent = activeOnboardingStep === ONBOARDING_STEPS.length - 1 ? 'Finalizar' : 'Siguiente';
  $('#onboarding-open-section').textContent = step.action;
  $('#onboarding-open-section').dataset.onboardingView = step.view;
  markCampaignOnboardingStep(step.id);
}

function showCampaignOnboarding(options = {}) {
  if (!state) return;
  if (isSummaryOnlyMode()) {
    if (options.manual) requestCampaignUnlock(state, 'open');
    return;
  }
  const onboarding = getCampaignOnboarding();
  if (!options.manual && onboarding.dismissedAt) return;
  activeOnboardingStep = clampOnboardingStep(options.step ?? activeOnboardingStep);
  if (!onboarding.firstVisitAt) updateCampaignOnboarding({ firstVisitAt: new Date().toISOString() });
  renderCampaignOnboarding();
  $('#onboarding-modal')?.classList.remove('hidden');
  $('#onboarding-next')?.focus();
}

function queueCampaignOnboarding() {
  window.setTimeout(() => {
    if (!state || isSummaryOnlyMode()) return;
    const onboarding = getCampaignOnboarding();
    if (!onboarding.dismissedAt) showCampaignOnboarding({ step: 0 });
  }, 350);
}

function hideCampaignOnboarding() {
  $('#onboarding-modal')?.classList.add('hidden');
}

function dismissCampaignOnboarding(complete = false) {
  const patch = { dismissedAt: new Date().toISOString() };
  if (complete) patch.completedSteps = ONBOARDING_STEPS.map(step => step.id);
  updateCampaignOnboarding(patch);
  hideCampaignOnboarding();
  showToast(complete ? 'Tutorial completado.' : 'Tutorial cerrado. Puedes reabrirlo desde Ver tutorial.');
}

function openCampaignOnboardingSection() {
  const step = ONBOARDING_STEPS[activeOnboardingStep];
  if (!step?.view) return;
  navigate(step.view);
  hideCampaignOnboarding();
  showToast('Tutorial pausado. Puedes volver desde Ver tutorial.');
}

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getWorkspaceConfig(collection = activeWorkspaceCollection) {
  return WORKSPACE_ENTITY_CONFIGS.find(config => config.collection === collection) || WORKSPACE_ENTITY_CONFIGS[0];
}

function getWorkspaceConfigByType(type = '') {
  return WORKSPACE_ENTITY_CONFIGS.find(config => config.type === type) || WORKSPACE_ENTITY_CONFIGS[0];
}

function ensureWorkspace() {
  if (!state) return normalizeCampaignWorkspace({});
  const workspace = state.workspace;
  const needsNormalization = !workspace
    || typeof workspace !== 'object'
    || workspace.schemaVersion !== CAMPAIGN_MODEL_VERSION
    || !Array.isArray(workspace.boards)
    || !Array.isArray(workspace.dmTools)
    || !workspace.onboarding
    || !Array.isArray(workspace.onboarding.completedSteps);
  if (needsNormalization) state.workspace = normalizeCampaignWorkspace(state);
  return state.workspace;
}

function persistActiveCampaign() {
  if (!state) return;
  state = normalizeCampaign(state);
  portfolio.campaigns = portfolio.campaigns.map(campaign => campaign.id === state.id ? state : campaign);
  if (USE_REMOTE_STORAGE) queueRemoteWorkspaceSave();
  else saveState();
}

function workspaceTypeOptions(selected = activeWorkspaceCollection, includeAll = false) {
  const allOption = includeAll ? `<option value="all"${selected === 'all' ? ' selected' : ''}>Todo</option>` : '';
  return allOption + WORKSPACE_ENTITY_CONFIGS
    .map(config => `<option value="${config.collection}"${config.collection === selected ? ' selected' : ''}>${config.plural}</option>`)
    .join('');
}

function visibilityOptions(selectedVisibility = {}) {
  const selected = getCampaignVisibilityPresetId(selectedVisibility);
  return Object.values(CAMPAIGN_VISIBILITY_PRESETS)
    .map(preset => `<option value="${preset.id}"${preset.id === selected ? ' selected' : ''}>${preset.label}</option>`)
    .join('');
}

function visibilityFromPreset(presetId) {
  const preset = Object.values(CAMPAIGN_VISIBILITY_PRESETS).find(item => item.id === presetId);
  return normalizeCampaignVisibility(preset?.visibility);
}

function parseTags(value = '') {
  return String(value)
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

function getWorkspaceEntities() {
  const workspace = ensureWorkspace();
  return WORKSPACE_ENTITY_CONFIGS.flatMap(config => (
    (workspace[config.collection] || []).map(entity => ({ ...entity, collection: config.collection, config }))
  ));
}

function getWorkspaceEntity(collection, id) {
  const workspace = ensureWorkspace();
  return (workspace[collection] || []).find(entity => entity.id === id) || null;
}

function findWorkspaceEntityByType(type, id) {
  const config = getWorkspaceConfigByType(type);
  return getWorkspaceEntity(config.collection, id);
}

function getMentionCandidates() {
  const workspaceEntities = getWorkspaceEntities().map(entity => ({
    id: entity.id,
    type: entity.type,
    title: entity.title,
    label: entity.config.label,
    collection: entity.collection,
  }));
  const characters = (state?.characters || []).map(character => ({
    id: character.id,
    type: 'character',
    title: character.name,
    label: character.kind === 'npc' ? 'PNJ' : 'Personaje',
  }));
  const sessions = (state?.sessions || []).map(session => ({
    id: session.id,
    type: 'session',
    title: `Sesión ${session.number}: ${session.name}`,
    label: 'Sesión',
  }));
  const dmTools = getDmTools().map(tool => ({
    id: tool.id,
    type: 'dmTool',
    title: tool.title,
    label: tool.config.label,
  }));
  return [...workspaceEntities, ...dmTools, ...characters, ...sessions].filter(item => item.id && item.title);
}

function getMentionIndex() {
  return getMentionCandidates().reduce((index, item) => {
    index.set(normalizeSearchText(item.title), item);
    return index;
  }, new Map());
}

function extractMentionRefs(text = '') {
  const index = getMentionIndex();
  return [...String(text).matchAll(/\[\[([^\]]+)\]\]/g)]
    .map(match => index.get(normalizeSearchText(match[1].trim())))
    .filter(Boolean)
    .map(item => ({ type: item.type, id: item.id, title: item.title }));
}

function safeHref(value = '') {
  try {
    const parsed = new URL(String(value).replace(/&amp;/g, '&'), window.location.href);
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return escapeHTML(parsed.href);
  } catch (error) {
    return '#';
  }
  return '#';
}

function renderEditorInline(text = '') {
  const mentionIndex = getMentionIndex();
  let html = escapeHTML(text);
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => (
    `<a href="${safeHref(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
  ));
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_, label) => {
    const entity = mentionIndex.get(normalizeSearchText(label.trim()));
    if (!entity) return `<span class="workspace-mention missing">${label}</span>`;
    return `<button type="button" class="workspace-mention" data-entity-type="${escapeHTML(entity.type)}" data-entity-id="${escapeHTML(entity.id)}">${label}</button>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
}

function renderEditorPreview(text = '') {
  const lines = String(text).split(/\r?\n/);
  if (!lines.some(line => line.trim())) return '<p class="workspace-preview-empty">Sin contenido todavía.</p>';
  return lines.map(line => {
    if (!line.trim()) return '<div class="workspace-preview-spacer"></div>';
    if (line.startsWith('### ')) return `<h4>${renderEditorInline(line.slice(4))}</h4>`;
    if (line.startsWith('## ')) return `<h3>${renderEditorInline(line.slice(3))}</h3>`;
    if (line.startsWith('# ')) return `<h2>${renderEditorInline(line.slice(2))}</h2>`;
    const check = line.match(/^- \[( |x)\] (.+)$/i);
    if (check) return `<p class="workspace-preview-check"><span>${check[1].toLowerCase() === 'x' ? '✓' : ''}</span>${renderEditorInline(check[2])}</p>`;
    if (/^[-*] /.test(line)) return `<p class="workspace-preview-bullet">${renderEditorInline(line.slice(2))}</p>`;
    if (line.startsWith('> ')) return `<blockquote>${renderEditorInline(line.slice(2))}</blockquote>`;
    return `<p>${renderEditorInline(line)}</p>`;
  }).join('');
}

function renderMentionSuggestions() {
  const suggestions = $('#workspace-mention-suggestions');
  if (!suggestions) return;
  const candidates = getMentionCandidates().slice(0, 16);
  suggestions.innerHTML = candidates.length
    ? candidates.map(item => `<button type="button" data-mention-title="${escapeHTML(item.title)}">${escapeHTML(item.title)}<small>${escapeHTML(item.label)}</small></button>`).join('')
    : '<span>Guarda páginas o personajes para enlazarlos aquí.</span>';
}

function renderWorkspaceTypeControls() {
  const typeFilter = $('#workspace-type-filter');
  const entryType = $('#workspace-entry-type');
  if (typeFilter) typeFilter.innerHTML = workspaceTypeOptions(typeFilter.value || 'all', true);
  if (entryType) entryType.innerHTML = workspaceTypeOptions(activeWorkspaceCollection, false);
  const visibility = $('#workspace-entry-visibility');
  if (visibility && !visibility.options.length) visibility.innerHTML = visibilityOptions(CAMPAIGN_VISIBILITY_PRESETS.dmDraft.visibility);
}

function currentWorkspaceEditorEntity() {
  const id = $('#workspace-entry-id')?.value;
  const collection = $('#workspace-entry-original-collection')?.value || activeWorkspaceCollection;
  return id ? getWorkspaceEntity(collection, id) : null;
}

function parseResourceIds(value = '') {
  return String(value || '').split(',').map(id => id.trim()).filter(Boolean);
}

function uniqueResourceIds(ids = []) {
  return [...new Set(ids.map(id => String(id || '').trim()).filter(Boolean))];
}

function getWorkspaceResourceIds(kind) {
  const input = kind === 'image' ? $('#workspace-entry-image-ids') : $('#workspace-entry-link-ids');
  return parseResourceIds(input?.value || '');
}

function setWorkspaceResourceIds(kind, ids = []) {
  const input = kind === 'image' ? $('#workspace-entry-image-ids') : $('#workspace-entry-link-ids');
  if (input) input.value = uniqueResourceIds(ids).join(',');
}

function getWorkspaceImage(id) {
  return (ensureWorkspace().images || []).find(image => image.id === id) || null;
}

function getWorkspaceLink(id) {
  return (ensureWorkspace().links || []).find(link => link.id === id) || null;
}

function findWorkspaceEntityUsingResource(kind, id) {
  const field = kind === 'image' ? 'imageIds' : 'linkIds';
  return getWorkspaceEntities().find(entity => (entity[field] || []).includes(id)) || null;
}

function normalizeExternalUrl(value = '') {
  try {
    const raw = String(value || '').trim();
    const normalized = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(normalized);
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return parsed.href;
  } catch (error) {
    return '';
  }
  return '';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function resourceTitleFromFile(fileName = '') {
  return String(fileName || 'Imagen').replace(/\.[^.]+$/, '').trim() || 'Imagen';
}

function syncCurrentWorkspaceEntityAssets() {
  const entity = currentWorkspaceEditorEntity();
  if (!entity) return;
  entity.imageIds = getWorkspaceResourceIds('image');
  entity.linkIds = getWorkspaceResourceIds('link');
  entity.updatedAt = new Date().toISOString();
  persistActiveCampaign();
  renderWorkspaceList();
  renderCampaignSearch();
  if ($('#board-view')?.classList.contains('active')) renderBoard();
}

function renderWorkspaceResources() {
  const list = $('#workspace-resource-list');
  if (!list) return;
  const images = getWorkspaceResourceIds('image').map(getWorkspaceImage).filter(Boolean);
  const links = getWorkspaceResourceIds('link').map(getWorkspaceLink).filter(Boolean);
  const items = [
    ...images.map(image => ({ kind: 'image', item: image })),
    ...links.map(link => ({ kind: 'link', item: link })),
  ];

  if (!items.length) {
    list.innerHTML = emptyState('Sin recursos adjuntos', 'Esta página todavía no tiene imágenes ni links asociados.', '', '');
    return;
  }

  list.innerHTML = items.map(({ kind, item }) => {
    if (kind === 'image') {
      return `<article class="workspace-resource-card image-resource">
        <img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.alt || item.title)}">
        <div><span class="workspace-entry-type">Imagen</span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.caption || item.alt || 'Sin descripción')}</small></div>
        <button type="button" class="text-button danger-button" data-resource-remove-type="image" data-resource-remove-id="${escapeHTML(item.id)}">Quitar</button>
      </article>`;
    }
    return `<article class="workspace-resource-card link-resource">
      <div><span class="workspace-entry-type">Link</span><strong>${escapeHTML(item.label || item.title)}</strong><small>${escapeHTML(item.url)}</small></div>
      <a class="text-button" href="${safeHref(item.url)}" target="_blank" rel="noopener noreferrer">Abrir</a>
      <button type="button" class="text-button danger-button" data-resource-remove-type="link" data-resource-remove-id="${escapeHTML(item.id)}">Quitar</button>
    </article>`;
  }).join('');
}

async function addWorkspaceImage(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    showToast('Usa una imagen PNG, JPG o WebP.');
    return;
  }
  if (file.size > WORKSPACE_IMAGE_MAX_BYTES) {
    showToast('La imagen supera el límite local de 2 MB.');
    return;
  }

  const workspace = ensureWorkspace();
  const previousImages = [...(workspace.images || [])];
  const previousIds = getWorkspaceResourceIds('image');
  try {
    const dataUrl = await fileToDataUrl(file);
    const now = new Date().toISOString();
    const image = normalizeCampaignImage({
      id: uid(),
      title: resourceTitleFromFile(file.name),
      src: dataUrl,
      alt: file.name,
      caption: '',
      mimeType: file.type,
      size: file.size,
      visibility: visibilityFromPreset($('#workspace-entry-visibility').value),
      createdAt: now,
      updatedAt: now,
    });
    workspace.images.push(image);
    setWorkspaceResourceIds('image', [...previousIds, image.id]);
    persistActiveCampaign();
    syncCurrentWorkspaceEntityAssets();
    renderWorkspaceResources();
    renderCampaignSearch();
    if ($('#board-view')?.classList.contains('active')) renderBoard();
    showToast('Imagen adjuntada.');
  } catch (error) {
    ensureWorkspace().images = previousImages;
    setWorkspaceResourceIds('image', previousIds);
    showToast('No se pudo guardar la imagen.');
  }
}

function addWorkspaceLink() {
  const url = normalizeExternalUrl($('#workspace-link-url').value);
  if (!url) {
    $('#workspace-link-url').focus();
    showToast('Ingresa una URL válida.');
    return;
  }

  const workspace = ensureWorkspace();
  const previousLinks = [...(workspace.links || [])];
  const previousIds = getWorkspaceResourceIds('link');
  const existing = workspace.links.find(link => link.url === url);
  const label = $('#workspace-link-label').value.trim() || existing?.label || new URL(url).hostname || url;
  const now = new Date().toISOString();
  const link = existing || normalizeCampaignLink({
    id: uid(),
    title: label,
    label,
    url,
    source: 'manual',
    visibility: visibilityFromPreset($('#workspace-entry-visibility').value),
    createdAt: now,
    updatedAt: now,
  });

  try {
    if (!existing) workspace.links.push(link);
    setWorkspaceResourceIds('link', [...previousIds, link.id]);
    $('#workspace-link-label').value = '';
    $('#workspace-link-url').value = '';
    persistActiveCampaign();
    syncCurrentWorkspaceEntityAssets();
    renderWorkspaceResources();
    renderCampaignSearch();
    if ($('#board-view')?.classList.contains('active')) renderBoard();
    showToast('Link adjuntado.');
  } catch (error) {
    ensureWorkspace().links = previousLinks;
    setWorkspaceResourceIds('link', previousIds);
    showToast('No se pudo guardar el link.');
  }
}

function detachWorkspaceResource(kind, id) {
  const previousIds = getWorkspaceResourceIds(kind);
  setWorkspaceResourceIds(kind, previousIds.filter(item => item !== id));
  try {
    syncCurrentWorkspaceEntityAssets();
  } catch (error) {
    setWorkspaceResourceIds(kind, previousIds);
    showToast('No se pudo quitar el recurso.');
    return;
  }
  renderWorkspaceResources();
  showToast('Recurso quitado de la página.');
}

function getDmToolConfig(type = activeDmToolType) {
  return DM_TOOL_CONFIGS.find(config => config.type === type) || DM_TOOL_CONFIGS[0];
}

function dmToolTypeOptions(selected = activeDmToolType, includeAll = false) {
  const allOption = includeAll ? `<option value="all"${selected === 'all' ? ' selected' : ''}>Todo</option>` : '';
  return allOption + DM_TOOL_CONFIGS
    .map(config => `<option value="${config.type}"${config.type === selected ? ' selected' : ''}>${config.plural}</option>`)
    .join('');
}

function dmToolStatusOptions(selected = 'draft') {
  return DM_TOOL_STATUSES
    .map(status => `<option value="${status.id}"${status.id === selected ? ' selected' : ''}>${status.label}</option>`)
    .join('');
}

function getDmToolStatusLabel(value = 'draft') {
  return DM_TOOL_STATUSES.find(status => status.id === value)?.label || 'Borrador';
}

function getDmTools() {
  const workspace = ensureWorkspace();
  return (workspace.dmTools || []).map(tool => ({ ...tool, config: getDmToolConfig(tool.toolType) }));
}

function getDmTool(id) {
  return getDmTools().find(tool => tool.id === id) || null;
}

function renderDmToolTypeControls() {
  const typeFilter = $('#dm-tool-type-filter');
  const typeInput = $('#dm-tool-type');
  if (typeFilter) typeFilter.innerHTML = dmToolTypeOptions(typeFilter.value || 'all', true);
  if (typeInput) typeInput.innerHTML = dmToolTypeOptions(activeDmToolType, false);
  const status = $('#dm-tool-status');
  if (status && !status.options.length) status.innerHTML = dmToolStatusOptions('draft');
  const visibility = $('#dm-tool-visibility');
  if (visibility && !visibility.options.length) visibility.innerHTML = visibilityOptions(CAMPAIGN_VISIBILITY_PRESETS.dmDraft.visibility);
}

function renderDmToolFields(tool = null) {
  const container = $('#dm-tool-dynamic-fields');
  if (!container) return;
  const config = getDmToolConfig($('#dm-tool-type')?.value || activeDmToolType);
  const data = tool?.data || {};
  container.innerHTML = config.fields.map(field => (
    `<label>${escapeHTML(field.label)}<input class="dm-tool-data-field" data-tool-field="${escapeHTML(field.key)}" maxlength="180" value="${escapeHTML(data[field.key] || '')}"></label>`
  )).join('');
}

function readDmToolData() {
  return $$('.dm-tool-data-field').reduce((data, input) => {
    data[input.dataset.toolField] = input.value.trim();
    return data;
  }, {});
}

function renderDmToolList() {
  const list = $('#dm-tool-list');
  if (!list) return;
  const typeFilter = $('#dm-tool-type-filter')?.value || 'all';
  const query = normalizeSearchText($('#dm-tool-search')?.value || '');
  const tools = getDmTools()
    .filter(tool => typeFilter === 'all' || tool.toolType === typeFilter)
    .filter(tool => {
      if (!query) return true;
      const searchable = [
        tool.title,
        tool.summary,
        tool.content?.plainText,
        tool.config.label,
        getDmToolStatusLabel(tool.status),
        getCampaignVisibilityLabel(tool.visibility),
        ...(tool.tags || []),
        ...Object.values(tool.data || {}),
      ].join(' ');
      return normalizeSearchText(searchable).includes(query);
    })
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));

  if (!tools.length) {
    list.innerHTML = emptyState(query ? 'Sin resultados' : 'Sin herramientas', query ? 'No hay herramientas que coincidan con la búsqueda.' : 'Crea la primera herramienta para preparar tu mesa.', '', '');
    return;
  }

  list.innerHTML = tools.map(tool => {
    const selected = tool.id === activeDmToolId;
    const tags = (tool.tags || []).slice(0, 3).map(tag => `<span>${escapeHTML(tag)}</span>`).join('');
    return `<button type="button" class="dm-tool-card${selected ? ' active' : ''}" data-dm-tool-id="${escapeHTML(tool.id)}">
      <span class="workspace-entry-type">${escapeHTML(tool.config.label)} · ${escapeHTML(getDmToolStatusLabel(tool.status))}</span>
      <strong>${escapeHTML(tool.title)}</strong>
      <small>${escapeHTML(tool.summary || tool.content?.plainText || 'Sin resumen')}</small>
      ${tags ? `<span class="workspace-entry-tags">${tags}</span>` : ''}
    </button>`;
  }).join('');
}

function clearDmToolForm(type = activeDmToolType) {
  const config = getDmToolConfig(type);
  activeDmToolType = config.type;
  activeDmToolId = '';
  $('#dm-tool-id').value = '';
  $('#dm-tool-type').value = config.type;
  $('#dm-tool-status').innerHTML = dmToolStatusOptions('draft');
  $('#dm-tool-visibility').innerHTML = visibilityOptions(CAMPAIGN_VISIBILITY_PRESETS.dmDraft.visibility);
  $('#dm-tool-title').value = '';
  $('#dm-tool-summary').value = '';
  $('#dm-tool-tags').value = '';
  $('#dm-tool-notes').value = '';
  $('#dm-tool-editor-title').textContent = `Nueva ${config.label.toLowerCase()}`;
  $('#delete-dm-tool').classList.add('hidden');
  renderDmToolFields();
  renderDmToolList();
}

function loadDmTool(id) {
  const tool = getDmTool(id);
  if (!tool) return clearDmToolForm(activeDmToolType);
  activeDmToolId = tool.id;
  activeDmToolType = tool.toolType;
  $('#dm-tool-id').value = tool.id;
  $('#dm-tool-type').value = tool.toolType;
  $('#dm-tool-status').innerHTML = dmToolStatusOptions(tool.status);
  $('#dm-tool-visibility').innerHTML = visibilityOptions(tool.visibility);
  $('#dm-tool-title').value = tool.title || '';
  $('#dm-tool-summary').value = tool.summary || '';
  $('#dm-tool-tags').value = (tool.tags || []).join(', ');
  $('#dm-tool-notes').value = tool.content?.plainText || '';
  $('#dm-tool-editor-title').textContent = `Editar ${tool.config.label.toLowerCase()}`;
  $('#delete-dm-tool').classList.remove('hidden');
  renderDmToolFields(tool);
  renderDmToolList();
}

function renderDmTools() {
  if (!state) return;
  ensureWorkspace();
  renderDmToolTypeControls();
  $('#dm-tool-remote-warning')?.classList.add('hidden');
  const activeExists = activeDmToolId && getDmTool(activeDmToolId);
  if (activeExists) loadDmTool(activeDmToolId);
  else clearDmToolForm(activeDmToolType);
}

function saveDmTool(event) {
  event.preventDefault();
  const title = $('#dm-tool-title').value.trim();
  if (!title) {
    $('#dm-tool-title').focus();
    showToast('Ponle un título a la herramienta.');
    return;
  }
  const workspace = ensureWorkspace();
  const id = $('#dm-tool-id').value || uid();
  const previous = getDmTool(id);
  const now = new Date().toISOString();
  const toolType = $('#dm-tool-type').value;
  const tool = normalizeDmToolState({
    id,
    title,
    summary: $('#dm-tool-summary').value.trim(),
    content: { format: 'dm-tool-v1', plainText: $('#dm-tool-notes').value.trim(), blocks: [] },
    tags: parseTags($('#dm-tool-tags').value),
    visibility: visibilityFromPreset($('#dm-tool-visibility').value),
    toolType,
    status: $('#dm-tool-status').value,
    data: readDmToolData(),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  });

  workspace.dmTools = (workspace.dmTools || []).filter(entry => entry.id !== id);
  workspace.dmTools.push(tool);
  activeDmToolId = id;
  activeDmToolType = toolType;
  persistActiveCampaign();
  loadDmTool(id);
  renderCampaignSearch();
  if ($('#board-view')?.classList.contains('active')) renderBoard();
  showToast('Herramienta guardada.');
}

function deleteDmTool() {
  const id = $('#dm-tool-id').value;
  const tool = getDmTool(id);
  if (!tool || !confirm(`¿Eliminar "${tool.title}"?`)) return;
  const workspace = ensureWorkspace();
  const key = `dmTool:${id}`;
  workspace.dmTools = (workspace.dmTools || []).filter(entry => entry.id !== id);
  workspace.connections = (workspace.connections || []).filter(connection => (
    boardEndpointKey(connection.from) !== key && boardEndpointKey(connection.to) !== key
  ));
  workspace.boards = (workspace.boards || []).map(board => ({
    ...board,
    nodes: (board.nodes || []).filter(node => !(node.entityType === 'dmTool' && node.entityId === id)),
  }));
  persistActiveCampaign();
  clearDmToolForm(tool.toolType);
  renderCampaignSearch();
  if ($('#board-view')?.classList.contains('active')) renderBoard();
  showToast('Herramienta eliminada.');
}

function renderWorkspaceList() {
  const list = $('#workspace-entity-list');
  if (!list) return;
  const typeFilter = $('#workspace-type-filter')?.value || 'all';
  const query = normalizeSearchText($('#workspace-search')?.value || '');
  const items = getWorkspaceEntities()
    .filter(entity => typeFilter === 'all' || entity.collection === typeFilter)
    .filter(entity => {
      if (!query) return true;
      const searchable = [
        entity.title,
        entity.summary,
        entity.content?.plainText,
        ...(entity.tags || []),
        getCampaignVisibilityLabel(entity.visibility),
        entity.config.label,
      ].join(' ');
      return normalizeSearchText(searchable).includes(query);
    })
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));

  if (!items.length) {
    list.innerHTML = emptyState(query ? 'Sin resultados' : 'Sin páginas', query ? 'No hay páginas que coincidan con la búsqueda.' : 'Crea la primera página de campaña para empezar a enlazar tu mundo.', '', '');
    return;
  }

  list.innerHTML = items.map(entity => {
    const selected = entity.id === activeWorkspaceEntityId && entity.collection === activeWorkspaceCollection;
    const tags = (entity.tags || []).slice(0, 3).map(tag => `<span>${escapeHTML(tag)}</span>`).join('');
    return `<button type="button" class="workspace-entry-card${selected ? ' active' : ''}" data-workspace-collection="${entity.collection}" data-workspace-id="${entity.id}">
      <span class="workspace-entry-type">${escapeHTML(entity.config.label)} · ${escapeHTML(getCampaignVisibilityLabel(entity.visibility))}</span>
      <strong>${escapeHTML(entity.title)}</strong>
      <small>${escapeHTML(entity.summary || entity.content?.plainText || 'Sin resumen')}</small>
      ${tags ? `<span class="workspace-entry-tags">${tags}</span>` : ''}
    </button>`;
  }).join('');
}

function updateWorkspacePreview() {
  const preview = $('#workspace-entry-preview');
  if (!preview) return;
  const body = $('#workspace-entry-body')?.value || '';
  preview.innerHTML = renderEditorPreview(body);
  const mentions = extractMentionRefs(body);
  $('#workspace-preview-meta').textContent = mentions.length
    ? `${mentions.length} vínculo${mentions.length === 1 ? '' : 's'} interno${mentions.length === 1 ? '' : 's'}`
    : 'Sin vínculos internos';
}

function clearWorkspaceEditor(collection = activeWorkspaceCollection) {
  const config = getWorkspaceConfig(collection);
  activeWorkspaceCollection = config.collection;
  activeWorkspaceEntityId = '';
  $('#workspace-entry-id').value = '';
  $('#workspace-entry-original-collection').value = '';
  $('#workspace-entry-type').value = config.collection;
  $('#workspace-entry-visibility').innerHTML = visibilityOptions(CAMPAIGN_VISIBILITY_PRESETS.dmDraft.visibility);
  $('#workspace-entry-title').value = '';
  $('#workspace-entry-summary').value = '';
  $('#workspace-entry-tags').value = '';
  $('#workspace-entry-body').value = '';
  $('#workspace-entry-image-ids').value = '';
  $('#workspace-entry-link-ids').value = '';
  $('#workspace-editor-title').textContent = config.emptyTitle;
  $('#delete-workspace-entry').classList.add('hidden');
  renderMentionSuggestions();
  updateWorkspacePreview();
  renderWorkspaceResources();
  renderWorkspaceList();
}

function loadWorkspaceEntity(collection, id) {
  const entity = getWorkspaceEntity(collection, id);
  if (!entity) return clearWorkspaceEditor(collection);
  activeWorkspaceCollection = collection;
  activeWorkspaceEntityId = id;
  const config = getWorkspaceConfig(collection);
  $('#workspace-entry-id').value = entity.id;
  $('#workspace-entry-original-collection').value = collection;
  $('#workspace-entry-type').value = collection;
  $('#workspace-entry-visibility').innerHTML = visibilityOptions(entity.visibility);
  $('#workspace-entry-title').value = entity.title || '';
  $('#workspace-entry-summary').value = entity.summary || '';
  $('#workspace-entry-tags').value = (entity.tags || []).join(', ');
  $('#workspace-entry-body').value = entity.content?.plainText || '';
  $('#workspace-entry-image-ids').value = (entity.imageIds || []).join(',');
  $('#workspace-entry-link-ids').value = (entity.linkIds || []).join(',');
  $('#workspace-editor-title').textContent = `Editar ${config.label.toLowerCase()}`;
  $('#delete-workspace-entry').classList.remove('hidden');
  renderMentionSuggestions();
  updateWorkspacePreview();
  renderWorkspaceResources();
  renderWorkspaceList();
}

function renderWorkspaceEditor() {
  if (!state) return;
  ensureWorkspace();
  renderWorkspaceTypeControls();
  $('#workspace-remote-warning')?.classList.add('hidden');
  const activeExists = activeWorkspaceEntityId && getWorkspaceEntity(activeWorkspaceCollection, activeWorkspaceEntityId);
  if (activeExists) loadWorkspaceEntity(activeWorkspaceCollection, activeWorkspaceEntityId);
  else clearWorkspaceEditor(activeWorkspaceCollection);
}

function insertAtCursor(textarea, value) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  textarea.value = `${textarea.value.slice(0, start)}${value}${textarea.value.slice(end)}`;
  const cursor = start + value.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  updateWorkspacePreview();
}

function handleEditorInsert(kind) {
  const textarea = $('#workspace-entry-body');
  if (!textarea) return;
  if (kind === 'heading') return insertAtCursor(textarea, '# ');
  if (kind === 'bullet') return insertAtCursor(textarea, '- ');
  if (kind === 'check') return insertAtCursor(textarea, '- [ ] ');
  if (kind === 'quote') return insertAtCursor(textarea, '> ');
  if (kind === 'link') {
    const label = prompt('Texto del link');
    if (!label) return;
    const url = prompt('URL');
    if (!url) return;
    return insertAtCursor(textarea, `[${label}](${url})`);
  }
  if (kind === 'mention') {
    const title = prompt('Nombre exacto de la página, personaje o sesión');
    if (!title) return;
    return insertAtCursor(textarea, `[[${title}]]`);
  }
}

function saveWorkspaceEntity(event) {
  event.preventDefault();
  const collection = $('#workspace-entry-type').value;
  const config = getWorkspaceConfig(collection);
  const title = $('#workspace-entry-title').value.trim();
  if (!title) {
    $('#workspace-entry-title').focus();
    showToast('Ponle un título a la página.');
    return;
  }

  const workspace = ensureWorkspace();
  const now = new Date().toISOString();
  const id = $('#workspace-entry-id').value || uid();
  const body = $('#workspace-entry-body').value.trim();
  const previous = currentWorkspaceEditorEntity();
  const mentions = extractMentionRefs(body);
  const entity = normalizeCampaignEntity(config.type, {
    id,
    title,
    summary: $('#workspace-entry-summary').value.trim(),
    content: { format: 'campaign-markdown-v1', plainText: body, blocks: [] },
    tags: parseTags($('#workspace-entry-tags').value),
    visibility: visibilityFromPreset($('#workspace-entry-visibility').value),
    imageIds: getWorkspaceResourceIds('image'),
    linkIds: getWorkspaceResourceIds('link'),
    relatedIds: mentions.map(item => item.id),
    metadata: { ...(previous?.metadata || {}), mentions },
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  });

  WORKSPACE_COLLECTIONS.forEach(name => {
    workspace[name] = (workspace[name] || []).filter(item => item.id !== id);
  });
  workspace[collection].push(entity);
  activeWorkspaceCollection = collection;
  activeWorkspaceEntityId = id;
  persistActiveCampaign();
  loadWorkspaceEntity(collection, id);
  renderCampaignSearch();
  if ($('#board-view')?.classList.contains('active')) renderBoard();
  showToast('Página guardada.');
}

function deleteWorkspaceEntity() {
  const id = $('#workspace-entry-id').value;
  const collection = $('#workspace-entry-original-collection').value || activeWorkspaceCollection;
  const entity = getWorkspaceEntity(collection, id);
  if (!entity || !confirm(`¿Eliminar "${entity.title}"?`)) return;
  const workspace = ensureWorkspace();
  workspace[collection] = (workspace[collection] || []).filter(item => item.id !== id);
  workspace.connections = (workspace.connections || []).filter(connection => (
    !(connection.from?.type === entity.type && connection.from?.id === id)
    && !(connection.to?.type === entity.type && connection.to?.id === id)
  ));
  workspace.boards = (workspace.boards || []).map(board => ({
    ...board,
    nodes: (board.nodes || []).filter(node => !(node.entityType === entity.type && node.entityId === id)),
  }));
  persistActiveCampaign();
  clearWorkspaceEditor(collection);
  renderCampaignSearch();
  if ($('#board-view')?.classList.contains('active')) renderBoard();
  showToast('Página eliminada.');
}

function openMentionTarget(type, id) {
  if (type === 'character') {
    navigate('characters');
    return;
  }
  if (type === 'session') {
    navigate('log');
    const session = state.sessions.find(entry => entry.id === id);
    if (session) {
      $('#log-search').value = session.name;
      renderLog(session.name);
    }
    return;
  }
  if (type === 'image' || type === 'link') {
    const owner = findWorkspaceEntityUsingResource(type, id);
    navigate('notes');
    if (owner) loadWorkspaceEntity(owner.collection, owner.id);
    else showToast('Recurso guardado en la campaña, sin página asociada.');
    return;
  }
  if (type === 'dmTool') {
    navigate('tools');
    loadDmTool(id);
    return;
  }
  const config = getWorkspaceConfigByType(type);
  if (findWorkspaceEntityByType(type, id)) {
    navigate('notes');
    loadWorkspaceEntity(config.collection, id);
  }
}

function compactText(value = '', maxLength = 170) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function sessionParticipantNames(session = {}) {
  return (session.allocations || [])
    .map(item => item.characterName || state.characters.find(character => character.id === item.characterId)?.name || '')
    .filter(Boolean)
    .join(' ');
}

function sessionAwardText(session = {}) {
  return (session.allocations || [])
    .flatMap(item => [
      item.awardCategory,
      ...((item.awardDetails || []).flatMap(detail => [detail.category, detail.reason, detail.note])),
    ])
    .filter(Boolean)
    .join(' ');
}

function getCampaignSearchItems() {
  if (!state) return [];
  const workspace = ensureWorkspace();
  const workspaceItems = getWorkspaceEntities().map(entity => {
    const tags = (entity.tags || []).join(' ');
    const body = [entity.summary, entity.content?.plainText].filter(Boolean).join(' ');
    return {
      id: entity.id,
      resultType: 'workspace',
      filterType: entity.collection,
      collection: entity.collection,
      label: entity.config.label,
      title: entity.title,
      meta: [getCampaignVisibilityLabel(entity.visibility), tags].filter(Boolean).join(' · '),
      excerpt: compactText(body || 'Sin resumen'),
      titleText: normalizeSearchText(entity.title),
      metaText: normalizeSearchText(`${entity.config.label} ${getCampaignVisibilityLabel(entity.visibility)} ${tags}`),
      bodyText: normalizeSearchText(body),
      sortDate: Date.parse(entity.updatedAt || entity.createdAt || '') || 0,
    };
  });

  const imageItems = (workspace.images || []).map(image => ({
    id: image.id,
    resultType: 'image',
    filterType: 'image',
    label: 'Imagen',
    title: image.title,
    meta: [getCampaignVisibilityLabel(image.visibility), image.mimeType].filter(Boolean).join(' · '),
    excerpt: compactText(image.caption || image.alt || 'Imagen de campaña'),
    titleText: normalizeSearchText(image.title),
    metaText: normalizeSearchText(`${getCampaignVisibilityLabel(image.visibility)} ${image.mimeType || ''}`),
    bodyText: normalizeSearchText(`${image.caption || ''} ${image.alt || ''}`),
    sortDate: Date.parse(image.updatedAt || image.createdAt || '') || 0,
  }));

  const linkItems = (workspace.links || []).map(link => ({
    id: link.id,
    resultType: 'link',
    filterType: 'link',
    label: 'Link',
    title: link.label || link.title,
    meta: link.url,
    excerpt: compactText(link.summary || link.source || link.url),
    titleText: normalizeSearchText(`${link.label || ''} ${link.title || ''}`),
    metaText: normalizeSearchText(link.url),
    bodyText: normalizeSearchText(`${link.summary || ''} ${link.source || ''}`),
    sortDate: Date.parse(link.updatedAt || link.createdAt || '') || 0,
  }));

  const dmToolItems = getDmTools().map(tool => ({
    id: tool.id,
    resultType: 'dmTool',
    filterType: 'dmTool',
    label: tool.config.label,
    title: tool.title,
    meta: [getDmToolStatusLabel(tool.status), getCampaignVisibilityLabel(tool.visibility)].filter(Boolean).join(' · '),
    excerpt: compactText(tool.summary || tool.content?.plainText || Object.values(tool.data || {}).join(' ') || 'Sin resumen'),
    titleText: normalizeSearchText(tool.title),
    metaText: normalizeSearchText(`${tool.config.label} ${getDmToolStatusLabel(tool.status)} ${(tool.tags || []).join(' ')}`),
    bodyText: normalizeSearchText(`${tool.summary || ''} ${tool.content?.plainText || ''} ${Object.values(tool.data || {}).join(' ')}`),
    sortDate: Date.parse(tool.updatedAt || tool.createdAt || '') || 0,
  }));

  const sessionItems = (state.sessions || []).map(session => {
    const participants = sessionParticipantNames(session);
    const awards = sessionAwardText(session);
    const notes = [session.notes?.combat, session.notes?.roleplay].filter(Boolean).join(' ');
    return {
      id: session.id,
      resultType: 'session',
      filterType: 'session',
      label: 'Sesión',
      title: `Sesión ${session.number}: ${session.name}`,
      meta: `${formatDate(session.date)} · ${session.allocations?.length || 0} participante${session.allocations?.length === 1 ? '' : 's'}`,
      excerpt: compactText(notes || participants || 'Sin notas'),
      titleText: normalizeSearchText(`${session.name} ${session.number}`),
      metaText: normalizeSearchText(`${formatDate(session.date)} ${participants}`),
      bodyText: normalizeSearchText(`${notes} ${awards}`),
      sortDate: Date.parse(session.date || session.createdAt || '') || 0,
    };
  });

  const characterItems = (state.characters || []).map(character => {
    const notes = character.notes?.plainText || '';
    return {
      id: character.id,
      resultType: 'character',
      filterType: 'character',
      collection: '',
      label: character.kind === 'npc' ? 'PNJ' : 'Personaje',
      title: character.name,
      meta: [character.className, character.player].filter(Boolean).join(' · ') || 'Sin detalle',
      excerpt: compactText(notes || `Progreso actual: ${formatResource(character.xp)}`),
      titleText: normalizeSearchText(character.name),
      metaText: normalizeSearchText(`${character.className || ''} ${character.player || ''} ${character.kind || ''}`),
      bodyText: normalizeSearchText(notes),
      sortDate: Date.parse(character.updatedAt || character.createdAt || '') || 0,
    };
  });

  return [...workspaceItems, ...imageItems, ...linkItems, ...dmToolItems, ...sessionItems, ...characterItems];
}

function scoreCampaignSearchItem(item, terms = []) {
  if (!terms.length) return 1;
  return terms.reduce((score, term) => {
    if (item.titleText.includes(term)) return score + 45;
    if (item.metaText.includes(term)) return score + 24;
    if (item.bodyText.includes(term)) return score + 12;
    return Number.NEGATIVE_INFINITY;
  }, 0);
}

function renderCampaignSearch() {
  const results = $('#campaign-search-results');
  if (!results || !state) return;
  const meta = $('#campaign-search-meta');
  if (isSummaryOnlyMode()) {
    if (meta) meta.textContent = 'Campaña protegida';
    results.innerHTML = emptyState('Campaña protegida', 'Desbloquea la campaña para buscar en su archivo.', '', '');
    return;
  }

  const query = normalizeSearchText($('#campaign-global-search')?.value || '');
  const terms = query.split(/\s+/).filter(Boolean);
  const filter = $('#campaign-global-filter')?.value || 'all';
  const allItems = getCampaignSearchItems()
    .filter(item => filter === 'all' || item.filterType === filter || (filter === 'workspace' && item.resultType === 'workspace'));
  const matchedItems = allItems
    .map(item => ({ ...item, score: scoreCampaignSearchItem(item, terms) }))
    .filter(item => !terms.length || item.score > 0)
    .sort((a, b) => (terms.length ? b.score - a.score : b.sortDate - a.sortDate) || b.sortDate - a.sortDate);
  const visibleItems = matchedItems.slice(0, 12);

  if (meta) {
    const label = matchedItems.length === 1 ? 'resultado' : 'resultados';
    meta.textContent = terms.length ? `${matchedItems.length} ${label}` : `${visibleItems.length} recientes`;
  }

  if (!visibleItems.length) {
    results.innerHTML = emptyState(query ? 'Sin resultados' : 'Sin contenido', query ? 'No encontramos coincidencias en esta campaña.' : 'La campaña todavía no tiene contenido para listar.', '', '');
    return;
  }

  results.innerHTML = visibleItems.map(item => `
    <button type="button" class="campaign-search-result" data-result-type="${escapeHTML(item.resultType)}" data-result-id="${escapeHTML(item.id)}" data-result-collection="${escapeHTML(item.collection || '')}">
      <span class="campaign-search-type">${escapeHTML(item.label)}</span>
      <strong>${escapeHTML(item.title)}</strong>
      <small>${escapeHTML(item.meta)}</small>
      <p>${escapeHTML(item.excerpt)}</p>
    </button>
  `).join('');
}

function openCampaignSearchResult(resultType, id, collection = '') {
  if (resultType === 'workspace') {
    const targetCollection = collection || WORKSPACE_COLLECTIONS.find(name => getWorkspaceEntity(name, id));
    if (!targetCollection) return;
    navigate('notes');
    loadWorkspaceEntity(targetCollection, id);
    return;
  }
  if (resultType === 'session') {
    const session = state.sessions.find(entry => entry.id === id);
    navigate('log');
    if (session) {
      $('#log-search').value = session.name;
      renderLog(session.name);
    }
    return;
  }
  if (resultType === 'character') navigate('characters');
  if (resultType === 'image' || resultType === 'link') {
    const owner = findWorkspaceEntityUsingResource(resultType, id);
    navigate('notes');
    if (owner) loadWorkspaceEntity(owner.collection, owner.id);
    else showToast('Recurso guardado en la campaña, sin página asociada.');
  }
  if (resultType === 'dmTool') {
    navigate('tools');
    loadDmTool(id);
  }
}

function resetBoardRuntimeState() {
  activeBoardId = 'main';
  selectedBoardNodeId = '';
  selectedBoardConnectionId = '';
  boardConnectMode = false;
  boardConnectSourceNodeId = '';
  boardDrag = null;
  boardUndoStack = [];
  boardRedoStack = [];
}

function captureBoardState() {
  const workspace = ensureWorkspace();
  return JSON.parse(JSON.stringify({
    boards: workspace.boards || [],
    connections: workspace.connections || [],
  }));
}

function restoreBoardState(snapshot) {
  if (!snapshot) return;
  const workspace = ensureWorkspace();
  workspace.boards = JSON.parse(JSON.stringify(snapshot.boards || []));
  workspace.connections = JSON.parse(JSON.stringify(snapshot.connections || []));
  selectedBoardNodeId = '';
  selectedBoardConnectionId = '';
  boardConnectSourceNodeId = '';
  persistActiveCampaign();
  renderBoard();
}

function pushBoardHistory(snapshot = captureBoardState()) {
  boardUndoStack.push(snapshot);
  if (boardUndoStack.length > 30) boardUndoStack.shift();
  boardRedoStack = [];
}

function canMutateBoard() {
  return true;
}

function getActiveBoard() {
  const workspace = ensureWorkspace();
  let board = (workspace.boards || []).find(entry => entry.id === activeBoardId);
  if (!board) {
    board = { id: activeBoardId, title: 'Tablero principal', nodes: [], viewport: { x: 0, y: 0, zoom: 1 }, updatedAt: '' };
    workspace.boards = [...(workspace.boards || []), board];
  }
  return board;
}

function getBoardConnections() {
  const workspace = ensureWorkspace();
  return (workspace.connections || [])
    .filter(connection => (connection.boardId || 'main') === activeBoardId)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

function boardNodeKey(node = {}) {
  return `${node.entityType}:${node.entityId}`;
}

function boardEndpointKey(endpoint = {}) {
  return `${endpoint.type}:${endpoint.id}`;
}

function boardEntityColor(type = '') {
  return ({
    note: '#9b4e35',
    place: '#4f7a68',
    city: '#426a91',
    faction: '#7a4a83',
    mission: '#9a6d2f',
    secret: '#7a2f42',
    image: '#8a6f2d',
    link: '#3f728a',
    dmTool: '#80613a',
    character: '#b97a45',
    session: '#5e667a',
  })[type] || '#735f43';
}

function getBoardCandidates() {
  const workspace = ensureWorkspace();
  const workspaceEntities = getWorkspaceEntities().map(entity => ({
    id: entity.id,
    type: entity.type,
    collection: entity.collection,
    label: entity.config.label,
    title: entity.title,
    meta: [getCampaignVisibilityLabel(entity.visibility), (entity.tags || []).join(', ')].filter(Boolean).join(' · '),
    excerpt: compactText(entity.summary || entity.content?.plainText || 'Sin resumen', 130),
    visibility: entity.visibility,
    color: boardEntityColor(entity.type),
  }));
  const characters = (state?.characters || []).map(character => ({
    id: character.id,
    type: 'character',
    collection: '',
    label: character.kind === 'npc' ? 'PNJ' : 'Personaje',
    title: character.name,
    meta: [character.className, character.player].filter(Boolean).join(' · ') || 'Sin detalle',
    excerpt: compactText(character.notes?.plainText || `Progreso actual: ${formatResource(character.xp)}`, 130),
    visibility: character.visibility,
    color: character.color || boardEntityColor('character'),
  }));
  const sessions = (state?.sessions || []).map(session => ({
    id: session.id,
    type: 'session',
    collection: '',
    label: 'Sesión',
    title: `Sesión ${session.number}: ${session.name}`,
    meta: formatDate(session.date),
    excerpt: compactText([session.notes?.combat, session.notes?.roleplay, sessionParticipantNames(session)].filter(Boolean).join(' '), 130) || 'Sin notas',
    visibility: session.visibility,
    color: boardEntityColor('session'),
  }));
  const images = (workspace.images || []).map(image => ({
    id: image.id,
    type: 'image',
    collection: '',
    label: 'Imagen',
    title: image.title,
    meta: [getCampaignVisibilityLabel(image.visibility), image.mimeType].filter(Boolean).join(' · '),
    excerpt: compactText(image.caption || image.alt || 'Imagen de campaña', 130),
    visibility: image.visibility,
    color: boardEntityColor('image'),
    src: image.src,
  }));
  const links = (workspace.links || []).map(link => ({
    id: link.id,
    type: 'link',
    collection: '',
    label: 'Link',
    title: link.label || link.title,
    meta: link.url,
    excerpt: compactText(link.summary || link.source || link.url, 130),
    visibility: link.visibility,
    color: boardEntityColor('link'),
    url: link.url,
  }));
  const dmTools = getDmTools().map(tool => ({
    id: tool.id,
    type: 'dmTool',
    collection: '',
    label: tool.config.label,
    title: tool.title,
    meta: getDmToolStatusLabel(tool.status),
    excerpt: compactText(tool.summary || tool.content?.plainText || Object.values(tool.data || {}).join(' ') || 'Herramienta DM', 130),
    visibility: tool.visibility,
    color: boardEntityColor('dmTool'),
  }));
  return [...workspaceEntities, ...images, ...links, ...dmTools, ...characters, ...sessions].filter(item => item.id && item.title);
}

function getBoardEntity(type, id) {
  return getBoardCandidates().find(item => item.type === type && item.id === id) || null;
}

function renderBoardLibrary() {
  const list = $('#board-library-list');
  if (!list) return;
  const query = normalizeSearchText($('#board-library-search')?.value || '');
  const board = getActiveBoard();
  const added = new Set((board.nodes || []).map(boardNodeKey));
  const candidates = getBoardCandidates()
    .filter(item => {
      if (!query) return true;
      return normalizeSearchText(`${item.title} ${item.label} ${item.meta} ${item.excerpt}`).includes(query);
    })
    .slice(0, 40);

  if (!candidates.length) {
    list.innerHTML = emptyState(query ? 'Sin resultados' : 'Sin elementos', query ? 'No encontramos contenido para añadir al tablero.' : 'Crea páginas, personajes o sesiones para llenar el tablero.', '', '');
    return;
  }

  list.innerHTML = candidates.map(item => {
    const inBoard = added.has(`${item.type}:${item.id}`);
    return `<button type="button" class="board-library-card${inBoard ? ' in-board' : ''}" data-board-add-type="${escapeHTML(item.type)}" data-board-add-id="${escapeHTML(item.id)}">
      <span class="workspace-entry-type">${escapeHTML(item.label)}${inBoard ? ' · En tablero' : ''}</span>
      <strong>${escapeHTML(item.title)}</strong>
      <small>${escapeHTML(item.excerpt)}</small>
    </button>`;
  }).join('');
}

function renderBoardToolbar() {
  const board = getActiveBoard();
  const connections = getBoardConnections();
  const selected = selectedBoardNodeId || selectedBoardConnectionId;
  const sourceNode = board.nodes.find(node => node.id === boardConnectSourceNodeId);
  const sourceEntity = sourceNode ? getBoardEntity(sourceNode.entityType, sourceNode.entityId) : null;
  $('#board-status').textContent = sourceEntity
    ? `Conectando: ${sourceEntity.title}`
    : `${board.nodes.length} nodo${board.nodes.length === 1 ? '' : 's'} · ${connections.length} conexión${connections.length === 1 ? '' : 'es'}`;
  $('#board-connect-mode')?.classList.toggle('is-active', boardConnectMode);
  $('#board-connect-mode').textContent = boardConnectMode ? 'Conectando' : 'Conectar';
  $('#board-delete-selection').disabled = !selected;
  $('#board-undo').disabled = !boardUndoStack.length;
  $('#board-redo').disabled = !boardRedoStack.length;
}

function renderBoardNodes() {
  const layer = $('#board-nodes-layer');
  if (!layer) return;
  const board = getActiveBoard();
  if (!board.nodes.length) {
    layer.innerHTML = '<div class="board-empty"><h3>Sin nodos</h3><p>El tablero está listo para recibir contenido de campaña.</p></div>';
    return;
  }

  layer.innerHTML = board.nodes.map(node => {
    const entity = getBoardEntity(node.entityType, node.entityId);
    const selected = node.id === selectedBoardNodeId;
    const connecting = node.id === boardConnectSourceNodeId;
    const title = entity?.title || 'Elemento eliminado';
    const label = entity?.label || node.entityType || 'Elemento';
    const excerpt = entity?.excerpt || 'Este contenido ya no existe en la campaña.';
    const color = node.color || entity?.color || boardEntityColor(node.entityType);
    return `<button type="button" class="board-node${selected ? ' selected' : ''}${connecting ? ' connecting' : ''}" data-board-node-id="${escapeHTML(node.id)}" style="left:${Number(node.x) || 0}px;top:${Number(node.y) || 0}px;width:${Number(node.width) || 220}px;--node-color:${escapeHTML(color)}">
      <span>${escapeHTML(label)}</span>
      ${entity?.type === 'image' && entity.src ? `<img src="${escapeHTML(entity.src)}" alt="${escapeHTML(title)}">` : ''}
      <strong>${escapeHTML(title)}</strong>
      <small>${escapeHTML(excerpt)}</small>
    </button>`;
  }).join('');
}

function renderBoardConnections() {
  const svg = $('#board-connections');
  const boardElement = $('#connection-board');
  if (!svg || !boardElement) return;
  const board = getActiveBoard();
  const nodeByKey = new Map((board.nodes || []).map(node => [boardNodeKey(node), node]));
  const width = Math.max(boardElement.scrollWidth, boardElement.clientWidth, 920);
  const height = Math.max(boardElement.scrollHeight, boardElement.clientHeight, 640);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.innerHTML = getBoardConnections().map(connection => {
    const fromNode = nodeByKey.get(boardEndpointKey(connection.from));
    const toNode = nodeByKey.get(boardEndpointKey(connection.to));
    if (!fromNode || !toNode) return '';
    const fromEl = $(`.board-node[data-board-node-id="${CSS.escape(fromNode.id)}"]`);
    const toEl = $(`.board-node[data-board-node-id="${CSS.escape(toNode.id)}"]`);
    if (!fromEl || !toEl) return '';
    const x1 = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const y1 = fromEl.offsetTop + fromEl.offsetHeight / 2;
    const x2 = toEl.offsetLeft + toEl.offsetWidth / 2;
    const y2 = toEl.offsetTop + toEl.offsetHeight / 2;
    const dx = Math.max(80, Math.abs(x2 - x1) * .45);
    const c1 = x1 <= x2 ? x1 + dx : x1 - dx;
    const c2 = x1 <= x2 ? x2 - dx : x2 + dx;
    const path = `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`;
    const label = connection.label || '';
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 8;
    const selected = connection.id === selectedBoardConnectionId;
    return `<g class="board-edge${selected ? ' selected' : ''}">
      <path class="board-edge-line" d="${path}"></path>
      <path class="board-edge-hit board-connection-hit" data-board-connection-id="${escapeHTML(connection.id)}" d="${path}"></path>
      ${label ? `<text x="${midX}" y="${midY}" text-anchor="middle">${escapeHTML(label)}</text>` : ''}
    </g>`;
  }).join('');
}

function renderBoardInspector() {
  const detail = $('#board-selection-detail');
  if (!detail) return;
  const board = getActiveBoard();
  const selectedNode = board.nodes.find(node => node.id === selectedBoardNodeId);
  const selectedConnection = getBoardConnections().find(connection => connection.id === selectedBoardConnectionId);

  if (selectedNode) {
    const entity = getBoardEntity(selectedNode.entityType, selectedNode.entityId);
    const media = entity?.type === 'image' && entity.src
      ? `<img class="board-detail-image" src="${escapeHTML(entity.src)}" alt="${escapeHTML(entity.title)}">`
      : '';
    const externalLink = entity?.type === 'link' && entity.url
      ? `<a class="text-button" href="${safeHref(entity.url)}" target="_blank" rel="noopener noreferrer">Abrir link</a>`
      : '';
    detail.innerHTML = `
      <div class="board-detail-card">
        <span class="workspace-entry-type">${escapeHTML(entity?.label || selectedNode.entityType || 'Elemento')}</span>
        ${media}
        <strong>${escapeHTML(entity?.title || 'Elemento eliminado')}</strong>
        <small>${escapeHTML(entity?.meta || '')}</small>
        <p>${escapeHTML(entity?.excerpt || 'Este contenido ya no existe en la campaña.')}</p>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary-button" data-board-action="open-node">Abrir</button>
        ${externalLink}
        <button type="button" class="text-button danger-button" data-board-action="remove-node">Quitar</button>
      </div>`;
    return;
  }

  if (selectedConnection) {
    const from = getBoardEntity(selectedConnection.from.type, selectedConnection.from.id);
    const to = getBoardEntity(selectedConnection.to.type, selectedConnection.to.id);
    detail.innerHTML = `
      <div class="board-detail-card">
        <span class="workspace-entry-type">Conexión</span>
        <strong>${escapeHTML(from?.title || 'Origen')} → ${escapeHTML(to?.title || 'Destino')}</strong>
        <small>${escapeHTML(getCampaignVisibilityLabel(selectedConnection.visibility))}</small>
      </div>
      <label>Etiqueta<input id="board-connection-label" value="${escapeHTML(selectedConnection.label || '')}" maxlength="80"></label>
      <label>Descripción<textarea id="board-connection-description" rows="3" maxlength="260">${escapeHTML(selectedConnection.description || '')}</textarea></label>
      <div class="form-actions board-connection-actions">
        <button type="button" class="secondary-button" data-board-action="connection-up">Subir</button>
        <button type="button" class="secondary-button" data-board-action="connection-down">Bajar</button>
        <button type="button" class="text-button danger-button" data-board-action="remove-connection">Eliminar</button>
      </div>`;
    return;
  }

  detail.innerHTML = emptyState('Sin selección', 'Selecciona un nodo o una conexión del tablero.', '', '');
}

function renderBoard() {
  if (!state) return;
  ensureWorkspace();
  $('#board-remote-warning')?.classList.add('hidden');
  renderBoardLibrary();
  renderBoardToolbar();
  renderBoardNodes();
  renderBoardInspector();
  requestAnimationFrame(renderBoardConnections);
}

function addBoardNode(type, id) {
  if (!canMutateBoard()) return;
  const board = getActiveBoard();
  const existing = board.nodes.find(node => node.entityType === type && node.entityId === id);
  if (existing) {
    selectedBoardNodeId = existing.id;
    selectedBoardConnectionId = '';
    renderBoard();
    return;
  }
  const entity = getBoardEntity(type, id);
  if (!entity) return;
  pushBoardHistory();
  const index = board.nodes.length;
  board.nodes.push({
    id: uid(),
    entityType: type,
    entityId: id,
    x: 48 + (index % 3) * 260,
    y: 54 + Math.floor(index / 3) * 150,
    color: entity.color || boardEntityColor(type),
    width: 220,
    collapsed: false,
    visibility: normalizeCampaignVisibility(entity.visibility || CAMPAIGN_VISIBILITY_PRESETS.dmDraft.visibility),
  });
  board.updatedAt = new Date().toISOString();
  selectedBoardNodeId = board.nodes[board.nodes.length - 1].id;
  selectedBoardConnectionId = '';
  persistActiveCampaign();
  renderBoard();
}

function selectBoardNode(nodeId) {
  selectedBoardNodeId = nodeId;
  selectedBoardConnectionId = '';
  renderBoardToolbar();
  renderBoardNodes();
  renderBoardInspector();
  requestAnimationFrame(renderBoardConnections);
}

function selectBoardConnection(connectionId) {
  selectedBoardConnectionId = connectionId;
  selectedBoardNodeId = '';
  boardConnectSourceNodeId = '';
  renderBoardToolbar();
  renderBoardNodes();
  renderBoardInspector();
  requestAnimationFrame(renderBoardConnections);
}

function setBoardConnectMode(enabled) {
  boardConnectMode = enabled;
  boardConnectSourceNodeId = '';
  renderBoard();
}

function connectBoardNodes(fromNodeId, toNodeId) {
  if (!canMutateBoard() || fromNodeId === toNodeId) return;
  const board = getActiveBoard();
  const fromNode = board.nodes.find(node => node.id === fromNodeId);
  const toNode = board.nodes.find(node => node.id === toNodeId);
  if (!fromNode || !toNode) return;
  const fromKey = boardNodeKey(fromNode);
  const toKey = boardNodeKey(toNode);
  const existing = getBoardConnections().find(connection => {
    const a = boardEndpointKey(connection.from);
    const b = boardEndpointKey(connection.to);
    return (a === fromKey && b === toKey) || (a === toKey && b === fromKey);
  });
  if (existing) {
    selectBoardConnection(existing.id);
    return;
  }

  pushBoardHistory();
  const now = new Date().toISOString();
  const highestOrder = getBoardConnections().reduce((max, connection) => Math.max(max, Number(connection.order) || 0), 0);
  const label = prompt('Etiqueta de la conexión') || '';
  const workspace = ensureWorkspace();
  workspace.connections.push(normalizeCampaignConnection({
    id: uid(),
    boardId: activeBoardId,
    from: { type: fromNode.entityType, id: fromNode.entityId },
    to: { type: toNode.entityType, id: toNode.entityId },
    label: label.trim(),
    visibility: CAMPAIGN_VISIBILITY_PRESETS.dmPrepared.visibility,
    order: highestOrder + 1,
    createdAt: now,
    updatedAt: now,
  }));
  selectedBoardConnectionId = workspace.connections[workspace.connections.length - 1].id;
  selectedBoardNodeId = '';
  boardConnectSourceNodeId = '';
  persistActiveCampaign();
  renderBoard();
}

function handleBoardNodeAction(nodeId) {
  if (boardConnectMode) {
    if (!boardConnectSourceNodeId) {
      boardConnectSourceNodeId = nodeId;
      selectedBoardNodeId = nodeId;
      selectedBoardConnectionId = '';
      renderBoard();
      return;
    }
    connectBoardNodes(boardConnectSourceNodeId, nodeId);
    return;
  }
  selectBoardNode(nodeId);
}

function removeBoardSelection() {
  if (!canMutateBoard()) return;
  const workspace = ensureWorkspace();
  const board = getActiveBoard();
  if (selectedBoardConnectionId) {
    pushBoardHistory();
    workspace.connections = (workspace.connections || []).filter(connection => connection.id !== selectedBoardConnectionId);
    selectedBoardConnectionId = '';
    persistActiveCampaign();
    renderBoard();
    return;
  }
  if (!selectedBoardNodeId) return;
  const node = board.nodes.find(entry => entry.id === selectedBoardNodeId);
  if (!node) return;
  pushBoardHistory();
  board.nodes = board.nodes.filter(entry => entry.id !== selectedBoardNodeId);
  const key = boardNodeKey(node);
  workspace.connections = (workspace.connections || []).filter(connection => (
    boardEndpointKey(connection.from) !== key && boardEndpointKey(connection.to) !== key
  ));
  selectedBoardNodeId = '';
  selectedBoardConnectionId = '';
  boardConnectSourceNodeId = '';
  board.updatedAt = new Date().toISOString();
  persistActiveCampaign();
  renderBoard();
}

function openSelectedBoardNode() {
  const node = getActiveBoard().nodes.find(entry => entry.id === selectedBoardNodeId);
  if (!node) return;
  openMentionTarget(node.entityType, node.entityId);
}

function updateSelectedBoardConnection() {
  if (!canMutateBoard()) return;
  const connection = getBoardConnections().find(entry => entry.id === selectedBoardConnectionId);
  if (!connection) return;
  pushBoardHistory();
  connection.label = $('#board-connection-label')?.value.trim() || '';
  connection.description = $('#board-connection-description')?.value.trim() || '';
  connection.updatedAt = new Date().toISOString();
  persistActiveCampaign();
  renderBoard();
}

function shiftSelectedBoardConnection(direction) {
  if (!canMutateBoard()) return;
  const workspace = ensureWorkspace();
  const connections = getBoardConnections();
  const index = connections.findIndex(connection => connection.id === selectedBoardConnectionId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= connections.length) return;
  pushBoardHistory();
  const current = connections[index];
  const next = connections[nextIndex];
  const currentOrder = Number(current.order) || index + 1;
  current.order = Number(next.order) || nextIndex + 1;
  next.order = currentOrder;
  current.updatedAt = new Date().toISOString();
  next.updatedAt = current.updatedAt;
  workspace.connections = (workspace.connections || []).map(connection => {
    if (connection.id === current.id) return current;
    if (connection.id === next.id) return next;
    return connection;
  });
  persistActiveCampaign();
  renderBoard();
}

function undoBoard() {
  if (!boardUndoStack.length || !canMutateBoard()) return;
  const current = captureBoardState();
  const previous = boardUndoStack.pop();
  boardRedoStack.push(current);
  restoreBoardState(previous);
}

function redoBoard() {
  if (!boardRedoStack.length || !canMutateBoard()) return;
  const current = captureBoardState();
  const next = boardRedoStack.pop();
  boardUndoStack.push(current);
  restoreBoardState(next);
}

function startBoardNodeDrag(event) {
  const nodeElement = event.target.closest('.board-node[data-board-node-id]');
  if (!nodeElement || event.button !== 0 || boardConnectMode) return;
  const board = getActiveBoard();
  const node = board.nodes.find(entry => entry.id === nodeElement.dataset.boardNodeId);
  if (!node) return;
  selectedBoardNodeId = node.id;
  selectedBoardConnectionId = '';
  $$('.board-node.selected').forEach(entry => entry.classList.remove('selected'));
  nodeElement.classList.add('selected');
  renderBoardToolbar();
  renderBoardInspector();
  boardDrag = {
    nodeId: node.id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: Number(node.x) || 0,
    originY: Number(node.y) || 0,
    snapshot: captureBoardState(),
    moved: false,
  };
  nodeElement.setPointerCapture(event.pointerId);
}

function moveBoardNodeDrag(event) {
  if (!boardDrag || event.pointerId !== boardDrag.pointerId) return;
  const boardElement = $('#connection-board');
  const board = getActiveBoard();
  const node = board.nodes.find(entry => entry.id === boardDrag.nodeId);
  const nodeElement = $(`.board-node[data-board-node-id="${CSS.escape(boardDrag.nodeId)}"]`);
  if (!boardElement || !node || !nodeElement) return;
  const deltaX = event.clientX - boardDrag.startX;
  const deltaY = event.clientY - boardDrag.startY;
  if (Math.abs(deltaX) + Math.abs(deltaY) > 3) boardDrag.moved = true;
  const maxX = Math.max(20, boardElement.scrollWidth - nodeElement.offsetWidth - 20);
  const maxY = Math.max(20, boardElement.scrollHeight - nodeElement.offsetHeight - 20);
  node.x = Math.min(maxX, Math.max(20, boardDrag.originX + deltaX));
  node.y = Math.min(maxY, Math.max(20, boardDrag.originY + deltaY));
  nodeElement.style.left = `${node.x}px`;
  nodeElement.style.top = `${node.y}px`;
  renderBoardConnections();
}

function endBoardNodeDrag(event) {
  if (!boardDrag || event.pointerId !== boardDrag.pointerId) return;
  const nodeElement = $(`.board-node[data-board-node-id="${CSS.escape(boardDrag.nodeId)}"]`);
  if (nodeElement?.hasPointerCapture(event.pointerId)) nodeElement.releasePointerCapture(event.pointerId);
  if (boardDrag.moved) {
    pushBoardHistory(boardDrag.snapshot);
    getActiveBoard().updatedAt = new Date().toISOString();
    persistActiveCampaign();
    renderBoard();
  }
  boardDrag = null;
}

function navigate(view) {
  if (!state) return;
  if (isSummaryOnlyMode() && view !== 'dashboard') {
    requestCampaignUnlock(state, 'open');
    return;
  }
  $$('.view').forEach(section => section.classList.toggle('active', section.id === `${view}-view`));
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const titles = { dashboard: 'Resumen de campaña', characters: 'Personajes', 'new-session': 'Registrar nueva sesión', notes: 'Páginas de campaña', board: 'Tablero de conexiones', tools: 'Herramientas DM', log: 'Bitácora de campaña' };
  $('#page-title').textContent = titles[view];
  if (view === 'new-session') renderSessionForm();
  if (view === 'notes') renderWorkspaceEditor();
  if (view === 'board') renderBoard();
  if (view === 'tools') renderDmTools();
  if (view === 'log') renderLog();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function characterCard(character) {
  const system = getCampaignSystem();
  const progress = getProgress(character.xp);
  const subtitle = [character.className, character.player ? `Jugador: ${character.player}` : ''].filter(Boolean).join(' · ') || 'Aventurero';
  const cyberpunkLedger = system.id === 'cyberpunkRed' ? getCyberpunkLedgerEntry(character.id) : null;
  const progressCaption = system.id === 'cyberpunkRed'
    ? 'PP actuales o disponibles'
    : (progress.next ? `${formatResource(progress.remaining)} para nivel ${progress.level + 1}` : system.maxProgressText);
  const progressValue = system.id === 'cyberpunkRed' ? `Actual: ${formatResource(character.xp)}` : formatResource(character.xp);
  const cyberpunkPpSummary = system.id === 'cyberpunkRed' ? renderCyberpunkCharacterPpSummary(cyberpunkLedger) : '';
  return `
    <article class="character-card">
      <div class="character-top">
        ${characterAvatar(character)}
        <div class="character-meta"><h3>${escapeHTML(character.name)}</h3><p>${escapeHTML(subtitle)}</p></div>
        <div class="level-badge">${system.progressName.toUpperCase()}<b>${system.id === 'cyberpunkRed' ? formatNumber(progress.level) : progress.level}</b></div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress.percent}%"></div></div>
      <div class="progress-caption"><span>${progressValue}</span><span>${progressCaption}</span></div>
      ${cyberpunkPpSummary}
    </article>`;
}

function characterAvatar(character, size = 43, fontSize = 17) {
  const initial = escapeHTML(character.name.charAt(0).toUpperCase());
  const baseStyle = `width:${size}px;height:${size}px;font-size:${fontSize}px;`;
  if (character.portrait) {
    return `<span class="avatar" style="${baseStyle}background-image:url('${character.portrait}');background-color:${character.color}" aria-label="${escapeHTML(character.name)}"></span>`;
  }
  return `<span class="avatar" style="${baseStyle}background:${character.color}">${initial}</span>`;
}

function renderDashboard() {
  const system = getCampaignSystem();
  const sessionStats = getSessionStats(state);
  const totalAwarded = state.sessions.reduce((sum, session) => sum + session.totalAwarded, 0);
  const averageProgress = state.characters.length
    ? (state.characters.reduce((sum, character) => sum + (system.id === 'cyberpunkRed' ? Number(character.xp || 0) : getLevel(character.xp)), 0) / state.characters.length).toFixed(1)
    : '—';
  $('#stats-grid').innerHTML = [
    ['Personajes', state.characters.length],
    ['Sesión actual', sessionStats.latest || 0],
    ['Registros', sessionStats.registered],
    [`${system.unit} otorgados`, formatNumber(totalAwarded)],
    [system.averageStatLabel, averageProgress]
  ].map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`).join('');

  $('#dashboard-characters').innerHTML = state.characters.length
    ? state.characters.map(characterCard).join('')
    : emptyState('Aún no hay personajes', `Añade a los aventureros de la campaña para comenzar a registrar ${system.resourceName}.`, 'characters', 'Crear primer personaje');

  const recent = [...state.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  $('#recent-sessions').innerHTML = recent.length ? recent.map(session => `
    <article class="timeline-item">
      <div class="timeline-number">SESIÓN ${session.number}</div>
      <div><h3>${escapeHTML(session.name)}</h3><p>${formatDate(session.date)} · ${session.allocations.length} participante${session.allocations.length === 1 ? '' : 's'}</p></div>
      <div class="timeline-xp">${formatResource(session.totalAwarded)}</div>
    </article>`).join('') : emptyState('La historia comienza aquí', 'Cuando registres una sesión, aparecerá en esta línea de tiempo.', 'new-session', 'Registrar sesión');
  renderCampaignSearch();
}

function emptyState(title, copy, view, action) {
  const button = view && action ? `<button class="secondary-button" data-go="${view}">${action}</button>` : '';
  return `<div class="empty-state"><h3>${title}</h3><p>${copy}</p>${button}</div>`;
}

function renderCharacters() {
  const system = getCampaignSystem();
  $('#character-list').innerHTML = state.characters.length ? state.characters.map(character => {
    const progress = getProgress(character.xp);
    const cyberpunkLedger = system.id === 'cyberpunkRed' ? getCyberpunkLedgerEntry(character.id) : null;
    const progressLabel = system.id === 'cyberpunkRed' ? `${formatNumber(character.xp)} PP actuales` : `Nivel ${progress.level}`;
    const progressHelp = system.id === 'cyberpunkRed'
      ? `${formatCyberpunkLedgerLine(cyberpunkLedger)} | ${formatCyberpunkLastSessionLine(cyberpunkLedger)}`
      : (progress.next ? `${formatResource(progress.remaining)} para subir` : system.maxProgressText);
    return `<article class="character-row">
      ${characterAvatar(character)}
      <div class="character-meta"><h3>${escapeHTML(character.name)}</h3><p>${escapeHTML(character.className || `Sin ${system.roleLabel.toLowerCase()}`)} · ${progressLabel}${character.player ? ` · ${escapeHTML(character.player)}` : ''}</p></div>
      <div class="xp-amount">${formatResource(character.xp)}<small>${progressHelp}</small></div>
      <div class="row-actions"><button class="text-button edit-character" data-id="${character.id}">Editar</button><button class="text-button danger-button delete-character" data-id="${character.id}">Eliminar</button></div>
    </article>`;
  }).join('') : emptyState('Sin aventureros', 'Usa el formulario para añadir el primer personaje de la campaña.', '', '');
}

function resetCharacterForm() {
  $('#character-form').reset();
  $('#character-id').value = '';
  $('#character-color').value = '#b97a45';
  $('#character-xp').value = 0;
  pendingCharacterPortrait = '';
  updateCharacterPortraitPreview();
  $('#character-form-title').textContent = 'Añadir personaje';
  $('#cancel-character').classList.add('hidden');
}

function renderSessionForm() {
  updateSystemCopy();
  const system = getCampaignSystem();
  const sessionStats = getSessionStats(state);
  $('#session-number').value = sessionStats.latest ? sessionStats.latest + 1 : 1;
  if (!$('#session-date').value) $('#session-date').value = new Date().toISOString().slice(0, 10);
  const attendance = $('#attendance-list');
  if (!state.characters.length) {
    attendance.innerHTML = emptyState('Primero necesitas personajes', `Añade los integrantes de la campaña antes de repartir ${system.resourceName}.`, 'characters', 'Añadir personajes');
    $('#individual-bonuses').innerHTML = '';
    updateDistribution();
    return;
  }
  attendance.innerHTML = state.characters.map(character => `
    <label class="attendance-item"><input class="attendance-check" type="checkbox" value="${character.id}" checked>${characterAvatar(character, 30, 12)}<b>${escapeHTML(character.name)}</b><small>${system.id === 'cyberpunkRed' ? formatResource(character.xp) : `Nivel ${getLevel(character.xp)}`}</small></label>`).join('');
  $('#individual-bonuses').innerHTML = system.id === 'cyberpunkRed' ? renderCyberpunkAwards() : renderDndAwards();
  updateDistribution();
}

function renderDndAwards() {
  const system = getCampaignSystem();
  return state.characters.map(character => {
    const level = getLevel(character.xp);
    const tier = getDndRewardTier(level);
    return `
    <div class="bonus-item dnd-award" data-character="${character.id}">
      <div class="bonus-head">${characterAvatar(character, 27, 11)}<strong>${escapeHTML(character.name)}</strong></div>
      <div class="dnd-scale-summary">
        <span class="dnd-scale-copy">Nivel ${level} - ${tier.label} - x${formatMultiplier(tier.multiplier)}</span>
        <strong class="dnd-guided-total">0 PX</strong>
      </div>
      <div class="dnd-award-table">
        <div class="dnd-award-header"><span>Logro</span><span>PX base</span><span></span></div>
        <div class="dnd-award-rows">${renderDndAwardRow()}</div>
      </div>
      <button type="button" class="text-button dnd-add-award" data-action="dnd-add-award">+ Agregar logro</button>
      <div class="bonus-inputs dnd-manual-inputs">
        <label>${system.poolLabels[0]} manual<input class="bonus-combat" type="number" min="0" step="1" value="0"></label>
        <label>${system.poolLabels[1]} manual<input class="bonus-roleplay" type="number" min="0" step="1" value="0"></label>
        <label>${system.poolLabels[2]} manual<input class="bonus-manual" type="number" min="0" step="1" value="0"></label>
      </div>
    </div>`;
  }).join('');
}

function renderDndAwardRow(selectedId = '') {
  const reward = DND_XP_REWARDS.find(item => item.id === selectedId);
  return `<div class="dnd-award-row">
    <div class="dnd-award-select-wrap">
      <select class="dnd-reward-select" aria-label="Logro de D&D">${getDndRewardOptions(selectedId)}</select>
      <small class="dnd-award-note">${reward ? escapeHTML(reward.note) : ''}</small>
    </div>
    <strong class="dnd-award-value">${reward ? `${formatSignedNumber(reward.xp)} PX` : '0 PX'}</strong>
    <button type="button" class="text-button danger-button dnd-remove-award" data-action="dnd-remove-award" aria-label="Quitar logro">Quitar</button>
  </div>`;
}

function getDndRewardOptions(selectedId = '') {
  const empty = `<option value=""${selectedId ? '' : ' selected'}>Sin logro seleccionado</option>`;
  return empty + DND_XP_REWARDS.map(reward => {
    return `<option value="${reward.id}"${reward.id === selectedId ? ' selected' : ''}>${reward.bullet}. ${escapeHTML(reward.action)} (${formatSignedNumber(reward.xp)} PX)</option>`;
  }).join('');
}

function updateDndAwardRow(row) {
  const reward = DND_XP_REWARDS.find(item => item.id === row?.querySelector('.dnd-reward-select')?.value);
  row?.querySelector('.dnd-award-value')?.replaceChildren(document.createTextNode(reward ? `${formatSignedNumber(reward.xp)} PX` : '0 PX'));
  row?.querySelector('.dnd-award-note')?.replaceChildren(document.createTextNode(reward?.note || ''));
}

function renderCyberpunkAwards() {
  return state.characters.map(character => {
    const defaultColumn = getDefaultCyberpunkColumn(character);
    return `
    <div class="bonus-item cyberpunk-award" data-character="${character.id}">
      <div class="bonus-head">${characterAvatar(character, 27, 11)}<strong>${escapeHTML(character.name)}</strong></div>
      <div class="cyberpunk-award-table">
        <div class="cyberpunk-award-header"><span>Columna</span><span>Motivo</span><span>PP</span><span></span></div>
        <div class="cyberpunk-award-rows">
          ${renderCyberpunkAwardRow(defaultColumn, 40)}
        </div>
      </div>
      <button type="button" class="text-button cyberpunk-add-award" data-action="cyberpunk-add-award">+ Agregar PP</button>
    </div>`;
  }).join('');
}

function renderCyberpunkAwardRow(columnId = 'grupo', selectedValue = 40) {
  const columnOptions = CYBERPUNK_PP_COLUMNS.map(column => `<option value="${column.id}"${column.id === columnId ? ' selected' : ''}>${column.label}</option>`).join('');
  const reasonOptions = getCyberpunkReasonOptions(columnId, selectedValue);
  return `<div class="cyberpunk-award-row">
    <select class="bonus-category" aria-label="Columna de PP">${columnOptions}</select>
    <select class="bonus-reason" aria-label="Motivo de PP">${reasonOptions}</select>
    <strong class="bonus-award-value">${selectedValue} PP</strong>
    <button type="button" class="text-button danger-button cyberpunk-remove-award" data-action="cyberpunk-remove-award" aria-label="Quitar PP">Quitar</button>
  </div>`;
}

function getCyberpunkReasonOptions(columnId, selectedValue = 40) {
  const reasons = CYBERPUNK_PP_REASONS[columnId] || CYBERPUNK_PP_REASONS.grupo;
  return reasons.map(([value, reason]) => `<option value="${value}" data-reason="${escapeHTML(reason)}"${value === Number(selectedValue) ? ' selected' : ''}>${value} PP - ${escapeHTML(reason)}</option>`).join('');
}

function getDefaultCyberpunkColumn(character) {
  const text = `${character.name || ''} ${character.className || ''}`.toLowerCase();
  if (text.includes('merc') || text.includes('solo') || text.includes('raider')) return 'guerrero';
  if (text.includes('netrunner') || text.includes('stella')) return 'explorador';
  if (text.includes('tecnom') || text.includes('medtech') || text.includes('yiliao')) return 'sociable';
  return 'grupo';
}

function getDistribution() {
  if (getCampaignSystem().id === 'cyberpunkRed') return getCyberpunkDistribution();
  const attendees = $$('.attendance-check:checked').map(input => input.value);
  const pools = {
    combat: Number($('#combat-pool').value) || 0,
    roleplay: Number($('#roleplay-pool').value) || 0,
    manual: Number($('#manual-pool').value) || 0
  };
  const count = attendees.length;
  return attendees.map(characterId => {
    const bonus = $(`.bonus-item[data-character="${characterId}"]`);
    const individual = {
      combat: Number(bonus?.querySelector('.bonus-combat').value) || 0,
      roleplay: Number(bonus?.querySelector('.bonus-roleplay').value) || 0,
      manual: Number(bonus?.querySelector('.bonus-manual').value) || 0
    };
    const group = {
      combat: count ? pools.combat / count : 0,
      roleplay: count ? pools.roleplay / count : 0,
      manual: count ? pools.manual / count : 0
    };
    const character = state.characters.find(entry => entry.id === characterId);
    const guided = getDndGuidedAward(bonus, character);
    const rawTotal = group.combat + group.roleplay + group.manual + individual.combat + individual.roleplay + individual.manual + guided.total;
    const total = Math.max(-(Number(character?.xp) || 0), rawTotal);
    if (bonus?.querySelector('.dnd-guided-total')) {
      bonus.querySelector('.dnd-guided-total').textContent = formatResource(guided.total);
      bonus.querySelector('.dnd-scale-copy').textContent = `Nivel ${guided.level} - ${guided.tierLabel} - x${formatMultiplier(guided.multiplier)}`;
    }
    return {
      characterId,
      characterName: character?.name || 'Personaje',
      group,
      individual,
      guided,
      awardCategory: guided.details.length ? `${guided.details.length} logro${guided.details.length === 1 ? '' : 's'}` : '',
      awardDetails: guided.details,
      total,
    };
  });
}

function getDndGuidedAward(award, character = {}) {
  const level = getLevel(Number(character?.xp) || 0);
  const tier = getDndRewardTier(level);
  const details = [...(award?.querySelectorAll('.dnd-award-row') || [])].map(row => {
    const reward = DND_XP_REWARDS.find(item => item.id === row.querySelector('.dnd-reward-select')?.value);
    if (!reward) return null;
    return {
      category: 'Logro',
      reason: reward.action,
      note: reward.note,
      baseXp: reward.xp,
      total: Math.round(reward.xp * tier.multiplier),
    };
  }).filter(Boolean);
  const baseTotal = details.reduce((sum, detail) => sum + detail.baseXp, 0);
  return {
    level,
    tierLabel: tier.label,
    multiplier: tier.multiplier,
    baseTotal,
    total: Math.round(baseTotal * tier.multiplier),
    details,
  };
}

function getCyberpunkDistribution() {
  return $$('.attendance-check:checked').map(input => {
    const characterId = input.value;
    const award = $(`.bonus-item[data-character="${characterId}"]`);
    const details = [...(award?.querySelectorAll('.cyberpunk-award-row') || [])].map(row => {
      const categoryId = row.querySelector('.bonus-category')?.value || 'grupo';
      const category = CYBERPUNK_PP_COLUMNS.find(column => column.id === categoryId) || CYBERPUNK_PP_COLUMNS[0];
      const reasonSelect = row.querySelector('.bonus-reason');
      const total = Number(reasonSelect?.value) || 0;
      const reason = reasonSelect?.selectedOptions?.[0]?.dataset.reason || reasonSelect?.selectedOptions?.[0]?.textContent || '';
      return { category: category.label, reason, total };
    }).filter(item => item.total > 0);
    const total = details.reduce((sum, item) => sum + item.total, 0);
    const character = state.characters.find(entry => entry.id === characterId);
    return {
      characterId,
      characterName: character?.name || 'Personaje',
      awardCategory: details.map(item => item.category).join(', ') || 'Grupo',
      awardDetails: details,
      group: { combat: 0, roleplay: 0, manual: 0 },
      individual: { combat: 0, roleplay: 0, manual: total },
      total,
    };
  });
}

function updateDistribution() {
  const attending = new Set($$('.attendance-check:checked').map(input => input.value));
  $$('.bonus-item').forEach(item => {
    const enabled = attending.has(item.dataset.character);
    item.classList.toggle('disabled', !enabled);
    item.querySelectorAll('input, select, button').forEach(input => input.disabled = !enabled);
  });
  const distribution = getDistribution();
  const total = distribution.reduce((sum, item) => sum + item.total, 0);
  $('#session-total').textContent = formatResource(total);
  $('#distribution-preview').innerHTML = distribution.length ? distribution.map(item => {
    const character = state.characters.find(entry => entry.id === item.characterId);
    const category = item.awardDetails?.length
      ? ` <small>${item.awardDetails.length} motivo${item.awardDetails.length === 1 ? '' : 's'}</small>`
      : (item.awardCategory ? ` <small>${escapeHTML(item.awardCategory)}</small>` : '');
    return `<div class="preview-row"><span>${escapeHTML(character?.name || 'Personaje')}${category}</span><b>${formatSignedResource(item.total)}</b></div>`;
  }).join('') : '<p class="helper">Marca al menos un personaje como asistente.</p>';
}

async function saveSession(event) {
  event.preventDefault();
  const distribution = getDistribution();
  if (!state.characters.length) return showToast('Añade personajes antes de crear una sesión.');
  if (!distribution.length) return showToast('Marca al menos un personaje presente.');

  const session = {
    id: uid(),
    number: Number($('#session-number').value),
    date: $('#session-date').value,
    name: $('#session-name').value.trim(),
    pools: { combat: Number($('#combat-pool').value) || 0, roleplay: Number($('#roleplay-pool').value) || 0, manual: Number($('#manual-pool').value) || 0 },
    notes: { combat: $('#combat-notes').value.trim(), roleplay: $('#roleplay-notes').value.trim() },
    historical: $('#historical-session').checked,
    allocations: distribution,
    totalAwarded: distribution.reduce((sum, item) => sum + item.total, 0),
    createdAt: new Date().toISOString()
  };
  const normalizedSession = normalizeCampaignSession(session);

  if (USE_REMOTE_STORAGE) {
    try {
      await remoteStorage.saveSession(activeCampaignId, normalizedSession);
      $('#session-form').reset();
      $('#session-date').value = new Date().toISOString().slice(0, 10);
      await reloadActiveCampaign();
      navigate('log');
      showToast(`Sesión guardada y ${getCampaignSystem().resourceName} aplicada.`);
    } catch (error) {
      showToast('No se pudo guardar la sesión compartida.');
    }
    return;
  }

  normalizedSession.allocations.forEach(allocation => {
    const character = state.characters.find(entry => entry.id === allocation.characterId);
    if (character) character.xp = Math.round((character.xp + allocation.total) * 100) / 100;
  });
  state.sessions.push(normalizedSession);
  saveState();
  $('#session-form').reset();
  $('#session-date').value = new Date().toISOString().slice(0, 10);
  renderAll();
  navigate('log');
  showToast(`Sesión guardada y ${getCampaignSystem().resourceName} aplicada.`);
}

function renderLog(query = '') {
  const system = getCampaignSystem();
  const normalized = query.trim().toLowerCase();
  const sessions = [...state.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).filter(session => {
    const participantNames = session.allocations.map(item => item.characterName || state.characters.find(character => character.id === item.characterId)?.name || '').join(' ');
    const awardText = session.allocations.flatMap(item => item.awardDetails?.map(detail => `${detail.reason || ''} ${detail.note || ''}`) || []).join(' ');
    return `${session.name} ${session.number} ${session.notes.combat} ${session.notes.roleplay} ${participantNames} ${awardText}`.toLowerCase().includes(normalized);
  });
  const cyberpunkLedger = system.id === 'cyberpunkRed' && sessions.length ? renderCyberpunkAwardLedger(sessions, Boolean(normalized)) : '';
  $('#session-log').innerHTML = sessions.length ? cyberpunkLedger + sessions.map(session => `
    <article class="log-card">
      <header class="log-card-header">
        <div class="session-seal">${session.number}</div>
        <div><h3>${escapeHTML(session.name)}${session.historical ? '<span class="history-badge">Sesión anterior</span>' : ''}</h3><p>${formatDate(session.date)} · ${session.allocations.length} participante${session.allocations.length === 1 ? '' : 's'}</p></div>
        <div class="log-card-total">${formatResource(session.totalAwarded)}<small>Total otorgado</small></div>
      </header>
      <div class="log-body">
        ${(session.notes.combat || session.notes.roleplay) ? `<div class="log-notes">
          <div class="log-note"><b>Combate</b><p>${escapeHTML(session.notes.combat || 'Sin notas de combate.')}</p></div>
          <div class="log-note"><b>Roleo y aventura</b><p>${escapeHTML(session.notes.roleplay || 'Sin notas de roleo.')}</p></div>
        </div>` : ''}
        ${system.id === 'cyberpunkRed' ? renderCyberpunkLogTable(session) : renderStandardLogTable(session, system)}
        <footer class="log-footer"><button class="text-button danger-button delete-session" data-id="${session.id}">Eliminar sesión y revertir ${getCampaignSystem().unit}</button></footer>
      </div>
    </article>`).join('') : emptyState(normalized ? 'Sin resultados' : 'Bitácora vacía', normalized ? 'No encontramos sesiones que coincidan con la búsqueda.' : 'Registra la primera sesión para comenzar el historial.', 'new-session', 'Registrar sesión');
}

function renderCyberpunkAwardLedger(sessions, filtered = false) {
  const entries = getCyberpunkAwardLedger(state, sessions);
  const visibleEntries = filtered ? entries.filter(entry => entry.assigned || entry.sessionCount) : entries;
  if (!visibleEntries.length) return '';

  const assignedTotal = visibleEntries.reduce((sum, entry) => sum + entry.assigned, 0);
  const heading = filtered ? 'Reparto filtrado por jugador' : 'Reparto acumulado por jugador';
  const rows = visibleEntries.map(entry => {
    const details = entry.categories.length
      ? entry.categories.map(([category, total]) => `<small>${escapeHTML(category)}: ${formatResource(total)}</small>`).join('')
      : '<small>Sin PP registrados</small>';
    const player = entry.player || 'Sin jugador';
    const current = entry.current === null ? '-' : formatResource(entry.current);
    return `<tr>
      <td>${escapeHTML(player)}</td>
      <td>${escapeHTML(entry.characterName)}${entry.latestSession ? `<small>Última asistencia: ${formatNumber(entry.latestSession)}</small>` : ''}</td>
      <td>${current}</td>
      <td><b>${formatResource(entry.assigned)}</b></td>
      <td>${formatResource(entry.lastSessionAssigned || 0)}</td>
      <td>${formatNumber(entry.sessionCount)}</td>
      <td>${details}</td>
    </tr>`;
  }).join('');

  return `<article class="log-card cyberpunk-ledger">
    <header class="log-card-header">
      <div class="session-seal">PP</div>
      <div><h3>${heading}</h3><p>${formatNumber(visibleEntries.length)} personaje${visibleEntries.length === 1 ? '' : 's'} incluido${visibleEntries.length === 1 ? '' : 's'}</p></div>
      <div class="log-card-total">${formatResource(assignedTotal)}<small>Total asignado</small></div>
    </header>
    <div class="log-body">
      <table class="allocation-table cyberpunk-ledger-table">
        <thead><tr><th>Jugador</th><th>Personaje</th><th>PP actual</th><th>PP asignados</th><th>Última sesión</th><th>Sesiones</th><th>Detalle</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </article>`;
}

function renderStandardLogTable(session, system) {
  const showGuided = system.id === 'dnd5e2024' && session.allocations.some(item => item.guided || item.awardDetails?.length);
  return `<table class="allocation-table">
    <thead><tr><th>Personaje</th>${showGuided ? '<th>Logros guiados</th>' : ''}<th>${system.poolLabels[0]}</th><th>${system.poolLabels[1]}</th><th>${system.poolLabels[2]}</th><th>Total</th></tr></thead>
    <tbody>${session.allocations.map(item => {
      const character = state.characters.find(entry => entry.id === item.characterId);
      const combat = (item.group?.combat || 0) + (item.individual?.combat || 0);
      const roleplay = (item.group?.roleplay || 0) + (item.individual?.roleplay || 0);
      const manual = (item.group?.manual || 0) + (item.individual?.manual || 0);
      return `<tr><td>${escapeHTML(item.characterName || character?.name || 'Personaje eliminado')}</td>${showGuided ? `<td>${renderDndAllocationSummary(item)}</td>` : ''}<td>${formatResource(combat)}</td><td>${formatResource(roleplay)}</td><td>${formatResource(manual)}</td><td><b>${formatResource(item.total)}</b></td></tr>`;
    }).join('')}</tbody>
  </table>`;
}

function renderDndAllocationSummary(item) {
  const details = item.awardDetails || [];
  if (!details.length) return formatResource(0);
  const guided = item.guided || {};
  const detailText = details.slice(0, 3).map(detail => escapeHTML(detail.reason || 'Logro')).join('<br>');
  const hiddenCount = details.length - 3;
  const tierText = guided.tierLabel ? `<small>${escapeHTML(guided.tierLabel)} x${formatMultiplier(guided.multiplier || 1)}</small>` : '';
  return `<b>${formatResource(guided.total || 0)}</b>${tierText}<small>${detailText}${hiddenCount > 0 ? `<br>+${hiddenCount} mas` : ''}</small>`;
}

function renderCyberpunkLogTable(session) {
  const rows = session.allocations.flatMap(item => {
    const character = state.characters.find(entry => entry.id === item.characterId);
    const name = escapeHTML(item.characterName || character?.name || 'Personaje eliminado');
    const characterTotal = formatResource(item.total);
    const details = item.awardDetails?.length ? item.awardDetails : [{ category: item.awardCategory || 'Grupo', reason: '', total: item.total }];
    return details.map(detail => `<tr><td>${name}</td><td><b>${characterTotal}</b></td><td>${escapeHTML(detail.category || 'Grupo')}</td><td>${escapeHTML(detail.reason || 'Sin motivo registrado')}</td><td><b>${formatResource(detail.total)}</b></td></tr>`);
  }).join('');
  return `<table class="allocation-table">
    <thead><tr><th>Personaje</th><th>Total personaje</th><th>Columna</th><th>Motivo</th><th>PP motivo</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function formatDate(date) {
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function renderAll() {
  if (!state) return;
  renderDashboard();
  renderCharacters();
  if ($('#board-view')?.classList.contains('active')) renderBoard();
  if ($('#tools-view')?.classList.contains('active')) renderDmTools();
}

document.addEventListener('click', async event => {
  if (event.target.closest('[data-action="campaigns-home"]')) showCampaignsHome();
  if (event.target.closest('#open-campaign-tutorial')) showCampaignOnboarding({ manual: true, step: 0 });
  if (event.target.id === 'onboarding-modal' || event.target.closest('#close-onboarding') || event.target.closest('#skip-onboarding')) {
    dismissCampaignOnboarding(false);
  }
  const onboardingStepButton = event.target.closest('[data-onboarding-step]');
  if (onboardingStepButton) {
    activeOnboardingStep = clampOnboardingStep(onboardingStepButton.dataset.onboardingStep);
    renderCampaignOnboarding();
  }
  if (event.target.closest('#onboarding-prev')) {
    activeOnboardingStep = clampOnboardingStep(activeOnboardingStep - 1);
    renderCampaignOnboarding();
  }
  if (event.target.closest('#onboarding-next')) {
    if (activeOnboardingStep >= ONBOARDING_STEPS.length - 1) dismissCampaignOnboarding(true);
    else {
      activeOnboardingStep = clampOnboardingStep(activeOnboardingStep + 1);
      renderCampaignOnboarding();
    }
  }
  if (event.target.closest('#onboarding-open-section')) openCampaignOnboardingSection();
  const openCampaignButton = event.target.closest('.open-campaign');
  if (openCampaignButton) openCampaign(openCampaignButton.dataset.id);
  const shareCampaignButton = event.target.closest('.share-campaign');
  if (shareCampaignButton) {
    const campaign = portfolio.campaigns.find(entry => entry.id === shareCampaignButton.dataset.id);
    if (campaign) shareCampaign(campaign);
  }
  const editCampaignButton = event.target.closest('.edit-campaign');
  if (editCampaignButton) {
    const campaign = portfolio.campaigns.find(entry => entry.id === editCampaignButton.dataset.id);
    if (campaign?.passwordHash && !unlockedCampaigns.has(campaign.id)) requestCampaignUnlock(campaign, 'edit');
    else if (campaign) openCampaignModal(campaign);
  }
  const emptyNewCampaignButton = event.target.closest('#empty-new-campaign');
  if (emptyNewCampaignButton) openNewCampaignModal(emptyNewCampaignButton);
  if (event.target.closest('[data-action="unlock-active-campaign"]')) {
    if (state) requestCampaignUnlock(state, 'open');
  }
  const addDndAward = event.target.closest('[data-action="dnd-add-award"]');
  if (addDndAward) {
    addDndAward.closest('.dnd-award')?.querySelector('.dnd-award-rows')?.insertAdjacentHTML('beforeend', renderDndAwardRow());
    updateDistribution();
  }
  const removeDndAward = event.target.closest('[data-action="dnd-remove-award"]');
  if (removeDndAward) {
    const rows = removeDndAward.closest('.dnd-award-rows');
    if (rows && rows.querySelectorAll('.dnd-award-row').length > 1) {
      removeDndAward.closest('.dnd-award-row')?.remove();
    } else {
      const row = removeDndAward.closest('.dnd-award-row');
      const select = row?.querySelector('.dnd-reward-select');
      if (select) select.value = '';
      updateDndAwardRow(row);
    }
    updateDistribution();
  }
  const addCyberpunkAward = event.target.closest('[data-action="cyberpunk-add-award"]');
  if (addCyberpunkAward) {
    const award = addCyberpunkAward.closest('.cyberpunk-award');
    const character = state.characters.find(entry => entry.id === award?.dataset.character);
    award?.querySelector('.cyberpunk-award-rows')?.insertAdjacentHTML('beforeend', renderCyberpunkAwardRow(getDefaultCyberpunkColumn(character || {}), 40));
    updateDistribution();
  }
  const removeCyberpunkAward = event.target.closest('[data-action="cyberpunk-remove-award"]');
  if (removeCyberpunkAward) {
    const rows = removeCyberpunkAward.closest('.cyberpunk-award-rows');
    if (rows && rows.querySelectorAll('.cyberpunk-award-row').length > 1) {
      removeCyberpunkAward.closest('.cyberpunk-award-row')?.remove();
      updateDistribution();
    } else {
      showToast('Deja al menos una fila de PP para ese personaje.');
    }
  }
  const deleteCampaignButton = event.target.closest('.delete-campaign');
  if (deleteCampaignButton) {
    const campaign = portfolio.campaigns.find(entry => entry.id === deleteCampaignButton.dataset.id);
    if (campaign?.passwordHash && !unlockedCampaigns.has(campaign.id)) requestCampaignUnlock(campaign, 'delete');
    else if (campaign) deleteCampaign(campaign);
  }
  const goButton = event.target.closest('[data-go]');
  if (goButton && goButton.dataset.go) navigate(goButton.dataset.go);
  const navButton = event.target.closest('.nav-item');
  if (navButton?.dataset.view) navigate(navButton.dataset.view);
  const workspaceEntryCard = event.target.closest('.workspace-entry-card');
  if (workspaceEntryCard) {
    loadWorkspaceEntity(workspaceEntryCard.dataset.workspaceCollection, workspaceEntryCard.dataset.workspaceId);
  }
  const dmToolCard = event.target.closest('.dm-tool-card[data-dm-tool-id]');
  if (dmToolCard) {
    loadDmTool(dmToolCard.dataset.dmToolId);
  }
  const workspaceMention = event.target.closest('.workspace-mention[data-entity-type][data-entity-id]');
  if (workspaceMention) {
    openMentionTarget(workspaceMention.dataset.entityType, workspaceMention.dataset.entityId);
  }
  const campaignSearchResult = event.target.closest('.campaign-search-result[data-result-type][data-result-id]');
  if (campaignSearchResult) {
    openCampaignSearchResult(campaignSearchResult.dataset.resultType, campaignSearchResult.dataset.resultId, campaignSearchResult.dataset.resultCollection);
  }
  const boardLibraryCard = event.target.closest('.board-library-card[data-board-add-type][data-board-add-id]');
  if (boardLibraryCard) {
    addBoardNode(boardLibraryCard.dataset.boardAddType, boardLibraryCard.dataset.boardAddId);
  }
  const boardNode = event.target.closest('.board-node[data-board-node-id]');
  if (boardNode) {
    handleBoardNodeAction(boardNode.dataset.boardNodeId);
  }
  const boardConnection = event.target.closest('.board-connection-hit[data-board-connection-id]');
  if (boardConnection) {
    selectBoardConnection(boardConnection.dataset.boardConnectionId);
  }
  const resourceRemoveButton = event.target.closest('[data-resource-remove-type][data-resource-remove-id]');
  if (resourceRemoveButton) {
    detachWorkspaceResource(resourceRemoveButton.dataset.resourceRemoveType, resourceRemoveButton.dataset.resourceRemoveId);
  }

  const editButton = event.target.closest('.edit-character');
  if (editButton) {
    const character = state.characters.find(entry => entry.id === editButton.dataset.id);
    if (!character) return;
    $('#character-id').value = character.id;
    $('#character-name').value = character.name;
    $('#player-name').value = character.player;
    $('#character-class').value = character.className;
    $('#character-xp').value = character.xp;
    $('#character-color').value = character.color;
    pendingCharacterPortrait = character.portrait || '';
    updateCharacterPortraitPreview();
    $('#character-form-title').textContent = 'Editar personaje';
    $('#cancel-character').classList.remove('hidden');
    $('#character-name').focus();
  }

  const deleteCharacter = event.target.closest('.delete-character');
  if (deleteCharacter) {
    const character = state.characters.find(entry => entry.id === deleteCharacter.dataset.id);
    if (character && confirm(`¿Eliminar a ${character.name}? Las sesiones guardadas permanecerán en la bitácora.`)) {
      if (USE_REMOTE_STORAGE) {
        try {
          await remoteStorage.deleteCharacter(activeCampaignId, character.id);
          await reloadActiveCampaign();
          showToast('Personaje eliminado.');
        } catch (error) {
          showToast('No se pudo eliminar el personaje compartido.');
        }
        return;
      }
      state.characters = state.characters.filter(entry => entry.id !== character.id);
      saveState();
      renderAll();
      showToast('Personaje eliminado.');
    }
  }

  const deleteSession = event.target.closest('.delete-session');
  if (deleteSession) {
    const session = state.sessions.find(entry => entry.id === deleteSession.dataset.id);
    if (session && confirm(`¿Eliminar la sesión ${session.number}? ${getCampaignSystem().resourceName} otorgada se descontará de los personajes.`)) {
      if (USE_REMOTE_STORAGE) {
        try {
          await remoteStorage.deleteSession(activeCampaignId, session.id);
          await reloadActiveCampaign();
          renderLog($('#log-search').value);
          showToast(`Sesión eliminada y ${getCampaignSystem().resourceName} revertida.`);
        } catch (error) {
          showToast('No se pudo eliminar la sesión compartida.');
        }
        return;
      }
      session.allocations.forEach(allocation => {
        const character = state.characters.find(entry => entry.id === allocation.characterId);
        if (character) character.xp = Math.max(0, Math.round((character.xp - allocation.total) * 100) / 100);
      });
      state.sessions = state.sessions.filter(entry => entry.id !== session.id);
      saveState();
      renderAll();
      renderLog($('#log-search').value);
      showToast(`Sesión eliminada y ${getCampaignSystem().resourceName} revertida.`);
    }
  }
});

$('#character-form').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#character-id').value;
  const data = normalizeCharacter({
    id: id || (USE_REMOTE_STORAGE ? undefined : uid()),
    name: $('#character-name').value.trim(),
    player: $('#player-name').value.trim(),
    className: $('#character-class').value.trim(),
    xp: Number($('#character-xp').value) || 0,
    color: $('#character-color').value,
    portrait: pendingCharacterPortrait
  });
  if (USE_REMOTE_STORAGE) {
    try {
      await remoteStorage.saveCharacter(activeCampaignId, data);
      resetCharacterForm();
      await reloadActiveCampaign();
      showToast(id ? 'Personaje actualizado.' : 'Personaje añadido.');
    } catch (error) {
      showToast('No se pudo guardar el personaje compartido.');
    }
    return;
  }
  if (id) state.characters = state.characters.map(character => character.id === id ? data : character);
  else state.characters.push(data);
  saveState();
  resetCharacterForm();
  renderAll();
  showToast(id ? 'Personaje actualizado.' : 'Personaje añadido.');
});

$('#cancel-character').addEventListener('click', resetCharacterForm);
$('#session-form').addEventListener('submit', saveSession);
$('#session-form').addEventListener('input', updateDistribution);
$('#session-form').addEventListener('change', event => {
  if (event.target.matches('.dnd-reward-select')) {
    updateDndAwardRow(event.target.closest('.dnd-award-row'));
  }
  if (event.target.matches('.bonus-category')) {
    const row = event.target.closest('.cyberpunk-award-row');
    const reason = row?.querySelector('.bonus-reason');
    const currentValue = Number(reason?.value) || 40;
    if (reason) reason.innerHTML = getCyberpunkReasonOptions(event.target.value, currentValue);
    row?.querySelector('.bonus-award-value')?.replaceChildren(document.createTextNode(`${reason?.value || currentValue} PP`));
  }
  if (event.target.matches('.bonus-reason')) {
    event.target.closest('.cyberpunk-award-row')?.querySelector('.bonus-award-value')?.replaceChildren(document.createTextNode(`${event.target.value} PP`));
  }
  updateDistribution();
});
$('#select-all').addEventListener('click', () => {
  const checks = $$('.attendance-check');
  const shouldCheck = checks.some(check => !check.checked);
  checks.forEach(check => check.checked = shouldCheck);
  updateDistribution();
});
$('#log-search').addEventListener('input', event => renderLog(event.target.value));
$('#campaign-global-search').addEventListener('input', renderCampaignSearch);
$('#campaign-global-filter').addEventListener('change', renderCampaignSearch);
$('#board-library-search').addEventListener('input', renderBoardLibrary);
$('#board-connect-mode').addEventListener('click', () => setBoardConnectMode(!boardConnectMode));
$('#board-delete-selection').addEventListener('click', removeBoardSelection);
$('#board-undo').addEventListener('click', undoBoard);
$('#board-redo').addEventListener('click', redoBoard);
$('#board-nodes-layer').addEventListener('pointerdown', startBoardNodeDrag);
document.addEventListener('pointermove', moveBoardNodeDrag);
document.addEventListener('pointerup', endBoardNodeDrag);
document.addEventListener('pointercancel', endBoardNodeDrag);
$('#board-selection-detail').addEventListener('click', event => {
  const action = event.target.closest('[data-board-action]')?.dataset.boardAction;
  if (!action) return;
  if (action === 'open-node') openSelectedBoardNode();
  if (action === 'remove-node' || action === 'remove-connection') removeBoardSelection();
  if (action === 'connection-up') shiftSelectedBoardConnection(-1);
  if (action === 'connection-down') shiftSelectedBoardConnection(1);
});
$('#board-selection-detail').addEventListener('change', event => {
  if (event.target.matches('#board-connection-label, #board-connection-description')) {
    updateSelectedBoardConnection();
  }
});
$('#new-dm-tool').addEventListener('click', () => clearDmToolForm($('#dm-tool-type-filter').value === 'all' ? activeDmToolType : $('#dm-tool-type-filter').value));
$('#dm-tool-form').addEventListener('submit', saveDmTool);
$('#delete-dm-tool').addEventListener('click', deleteDmTool);
$('#reset-dm-tool').addEventListener('click', () => clearDmToolForm($('#dm-tool-type').value));
$('#dm-tool-type-filter').addEventListener('change', event => {
  if (event.target.value !== 'all') activeDmToolType = event.target.value;
  renderDmToolList();
});
$('#dm-tool-search').addEventListener('input', renderDmToolList);
$('#dm-tool-type').addEventListener('change', event => {
  activeDmToolType = event.target.value;
  const config = getDmToolConfig(event.target.value);
  $('#dm-tool-editor-title').textContent = $('#dm-tool-id').value ? `Editar ${config.label.toLowerCase()}` : `Nueva ${config.label.toLowerCase()}`;
  renderDmToolFields();
});
$('#new-workspace-entry').addEventListener('click', () => clearWorkspaceEditor($('#workspace-type-filter').value === 'all' ? activeWorkspaceCollection : $('#workspace-type-filter').value));
$('#workspace-editor-form').addEventListener('submit', saveWorkspaceEntity);
$('#reset-workspace-editor').addEventListener('click', () => clearWorkspaceEditor($('#workspace-entry-type').value));
$('#delete-workspace-entry').addEventListener('click', deleteWorkspaceEntity);
$('#workspace-type-filter').addEventListener('change', event => {
  if (event.target.value !== 'all') activeWorkspaceCollection = event.target.value;
  renderWorkspaceList();
});
$('#workspace-search').addEventListener('input', renderWorkspaceList);
$('#workspace-entry-type').addEventListener('change', event => {
  activeWorkspaceCollection = event.target.value;
  $('#workspace-editor-title').textContent = $('#workspace-entry-id').value ? `Editar ${getWorkspaceConfig(event.target.value).label.toLowerCase()}` : getWorkspaceConfig(event.target.value).emptyTitle;
});
$('#workspace-image-upload').addEventListener('change', addWorkspaceImage);
$('#workspace-add-link').addEventListener('click', addWorkspaceLink);
['workspace-entry-title', 'workspace-entry-summary', 'workspace-entry-tags', 'workspace-entry-visibility'].forEach(id => {
  $(`#${id}`).addEventListener('input', updateWorkspacePreview);
  $(`#${id}`).addEventListener('change', updateWorkspacePreview);
});
$('#workspace-entry-body').addEventListener('input', updateWorkspacePreview);
$('.editor-toolbar').addEventListener('click', event => {
  const button = event.target.closest('[data-editor-insert]');
  if (button) handleEditorInsert(button.dataset.editorInsert);
});
$('#workspace-mention-suggestions').addEventListener('click', event => {
  const button = event.target.closest('[data-mention-title]');
  if (button) insertAtCursor($('#workspace-entry-body'), `[[${button.dataset.mentionTitle}]]`);
});

$('#open-campaign-form').addEventListener('click', event => openNewCampaignModal(event.currentTarget));
$('#hero-new-campaign').addEventListener('click', event => openNewCampaignModal(event.currentTarget));
$('#campaigns-mode-toggle').addEventListener('click', () => {
  setGlobalAppearance(globalAppearance === 'dark' ? 'light' : 'dark');
});
$('#close-campaign-form').addEventListener('click', closeCampaignModal);
$('#campaign-modal').addEventListener('click', event => { if (event.target.id === 'campaign-modal') closeCampaignModal(); });
$('#campaign-protected').addEventListener('change', event => {
  $('#campaign-password-fields').classList.toggle('hidden', !event.target.checked);
  if (event.target.checked) $('#campaign-password').focus();
});
$('#campaign-font').addEventListener('change', event => {
  $('#font-preview').dataset.font = event.target.value;
});
$('#campaign-banner').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    event.target.value = '';
    return showToast('La imagen debe pesar menos de 8 MB.');
  }
  try {
    pendingBanner = await resizeImage(file);
    updateBannerPreview();
  } catch (error) {
    showToast('No se pudo leer esa imagen.');
  }
});
$('#remove-campaign-banner').addEventListener('click', () => {
  pendingBanner = '';
  $('#campaign-banner').value = '';
  updateBannerPreview();
});
$('#character-portrait').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    event.target.value = '';
    return showToast('El retrato debe pesar menos de 5 MB.');
  }
  try {
    pendingCharacterPortrait = await resizeImage(file, { maxWidth: 640, quality: .8 });
    updateCharacterPortraitPreview();
  } catch (error) {
    showToast('No se pudo leer ese retrato.');
  }
});
$('#remove-character-portrait').addEventListener('click', () => {
  pendingCharacterPortrait = '';
  $('#character-portrait').value = '';
  updateCharacterPortraitPreview();
});
$('#close-unlock-form').addEventListener('click', () => $('#unlock-modal').classList.add('hidden'));
$('#unlock-modal').addEventListener('click', event => { if (event.target.id === 'unlock-modal') $('#unlock-modal').classList.add('hidden'); });
$('#unlock-form').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#unlock-campaign-id').value;
  const campaign = portfolio.campaigns.find(entry => entry.id === id);
  if (!campaign) return;
  if (USE_REMOTE_STORAGE) {
    try {
      await remoteStorage.unlockCampaign(id, $('#unlock-password').value);
      unlockedCampaigns.add(id);
      $('#unlock-modal').classList.add('hidden');
      const data = await remoteStorage.getCampaign(id);
      const unlockedCampaign = normalizeCampaign(data.campaign);
      portfolio.campaigns = portfolio.campaigns.map(entry => entry.id === id ? unlockedCampaign : entry);
      if (pendingUnlockAction === 'edit') openCampaignModal(unlockedCampaign);
      else if (pendingUnlockAction === 'delete') deleteCampaign(unlockedCampaign);
      else activateCampaign(unlockedCampaign);
    } catch (error) {
      $('#unlock-error').classList.remove('hidden');
      $('#unlock-password').select();
    }
    return;
  }
  const passwordHash = await hashPassword($('#unlock-password').value);
  if (passwordHash !== campaign.passwordHash) {
    $('#unlock-error').classList.remove('hidden');
    $('#unlock-password').select();
    return;
  }
  unlockedCampaigns.add(id);
  $('#unlock-modal').classList.add('hidden');
  if (pendingUnlockAction === 'edit') openCampaignModal(campaign);
  else if (pendingUnlockAction === 'delete') deleteCampaign(campaign);
  else activateCampaign(campaign);
});
$('#campaign-form').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#campaign-id').value;
  const existing = portfolio.campaigns.find(campaign => campaign.id === id);
  const selectedSystem = SYSTEMS[$('#campaign-system').value] || SYSTEMS.dnd5e2024;
  const wantsProtection = $('#campaign-protected').checked;
  const password = $('#campaign-password').value;
  if (wantsProtection && !existing?.passwordHash && password.length < 4) {
    $('#campaign-password').focus();
    return showToast('La contraseña debe tener al menos 4 caracteres.');
  }
  if (USE_REMOTE_STORAGE && wantsProtection && existing?.passwordHash && password && password.length < 4) {
    $('#campaign-password').focus();
    return showToast('La contraseña debe tener al menos 4 caracteres.');
  }
  const passwordHash = wantsProtection ? (password ? await hashPassword(password) : existing?.passwordHash) : '';
  const campaign = {
    id: id || uid(),
    name: $('#campaign-name').value.trim(),
    dm: $('#campaign-dm').value.trim(),
    systemId: selectedSystem.id,
    system: selectedSystem.name,
    description: $('#campaign-description').value.trim(),
    theme: $('#campaign-theme').value,
    font: $('#campaign-font').value,
    appearance: $('#campaign-appearance').value,
    color: $('#campaign-color').value,
    banner: pendingBanner,
    passwordHash,
    characters: existing?.characters || [],
    sessions: existing?.sessions || [],
    workspace: normalizeCampaignWorkspace(existing || {}),
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  if (USE_REMOTE_STORAGE) {
    try {
      if (existing) {
        await remoteStorage.updateCampaign(campaign, wantsProtection ? password : '', wantsProtection && !password);
      } else {
        await remoteStorage.createCampaign(campaign, wantsProtection ? password : '');
      }
      if (wantsProtection && password) unlockedCampaigns.add(campaign.id);
      if (!wantsProtection) unlockedCampaigns.delete(campaign.id);
      closeCampaignModal();
      await reloadCampaigns();
      showToast(existing ? 'Campaña actualizada.' : 'Campaña creada.');
    } catch (error) {
      showToast('No se pudo guardar la campaña compartida.');
    }
    return;
  }
  if (existing) portfolio.campaigns = portfolio.campaigns.map(entry => entry.id === id ? campaign : entry);
  else portfolio.campaigns.push(campaign);
  if (passwordHash) unlockedCampaigns.add(campaign.id);
  else unlockedCampaigns.delete(campaign.id);
  saveState();
  closeCampaignModal();
  renderCampaigns();
  showToast(existing ? 'Campaña actualizada.' : 'Campaña creada.');
});

$('#export-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(portfolio, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `d20-travesias-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

$('#import-data').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  if (USE_REMOTE_STORAGE) {
    event.target.value = '';
    return showToast('La importación de respaldos solo está disponible en modo local.');
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      const normalized = Array.isArray(imported.campaigns)
        ? { ...imported, campaigns: imported.campaigns.map(normalizeCampaign) }
        : (Array.isArray(imported.characters) && Array.isArray(imported.sessions) ? { campaigns: [normalizeCampaign({ id: uid(), name: 'Campaña importada', dm: '', system: 'D&D 5e 2024', description: '', color: '#9b4e35', characters: imported.characters, sessions: imported.sessions, createdAt: new Date().toISOString() })] } : null);
      if (!normalized) throw new Error('Formato inválido');
      if (!confirm('Esto reemplazará los datos actuales. ¿Continuar?')) return;
      portfolio = normalized;
      saveState();
      showCampaignsHome();
      showToast('Respaldo importado correctamente.');
    } catch (error) {
      showToast('El archivo no es un respaldo válido.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
});

initializeCampaigns();

async function initializeCampaigns() {
  applyGlobalAppearance();
  portfolio = await loadInitialPortfolio();
  const storageCopy = $('.sidebar-footer p');
  if (storageCopy) storageCopy.textContent = USE_REMOTE_STORAGE ? 'Los datos se guardan en el archivo compartido.' : 'Los datos se guardan en este navegador.';
  renderCampaigns();
  const initialCampaignId = new URLSearchParams(window.location.search).get('campaign');
  if (initialCampaignId) await openCampaign(initialCampaignId);
}

darkModeQuery.addEventListener('change', event => {
  if (!hasSavedGlobalAppearance()) {
    globalAppearance = event.matches ? 'dark' : 'light';
    applyGlobalAppearance();
  }
});

window.addEventListener('storage', event => {
  if (event.key !== DISPLAY_MODE_STORAGE_KEY) return;
  globalAppearance = loadGlobalAppearance();
  applyGlobalAppearance();
});
