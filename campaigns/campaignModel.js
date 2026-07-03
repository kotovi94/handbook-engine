export const CAMPAIGN_MODEL_VERSION = 1;

export const CAMPAIGN_ENTITY_TYPES = Object.freeze({
  note: "note",
  session: "session",
  character: "character",
  place: "place",
  city: "city",
  faction: "faction",
  mission: "mission",
  secret: "secret",
  image: "image",
  link: "link",
  connection: "connection",
  dmTool: "dmTool",
});

export const CAMPAIGN_VISIBILITY = Object.freeze({
  dm: "dm",
  players: "players",
});

export const CAMPAIGN_REVEAL_STATES = Object.freeze({
  draft: "draft",
  prepared: "prepared",
  revealed: "revealed",
  archived: "archived",
});

export const CAMPAIGN_VISIBILITY_PRESETS = Object.freeze({
  dmDraft: Object.freeze({
    id: "dm-draft",
    label: "Privado DM",
    visibility: Object.freeze({ audience: CAMPAIGN_VISIBILITY.dm, state: CAMPAIGN_REVEAL_STATES.draft }),
  }),
  dmPrepared: Object.freeze({
    id: "dm-prepared",
    label: "Preparado",
    visibility: Object.freeze({ audience: CAMPAIGN_VISIBILITY.dm, state: CAMPAIGN_REVEAL_STATES.prepared }),
  }),
  playersRevealed: Object.freeze({
    id: "players-revealed",
    label: "Revelado",
    visibility: Object.freeze({ audience: CAMPAIGN_VISIBILITY.players, state: CAMPAIGN_REVEAL_STATES.revealed }),
  }),
  archived: Object.freeze({
    id: "archived",
    label: "Archivado",
    visibility: Object.freeze({ audience: CAMPAIGN_VISIBILITY.dm, state: CAMPAIGN_REVEAL_STATES.archived }),
  }),
});

export const CAMPAIGN_WORKSPACE_COLLECTIONS = Object.freeze([
  "notes",
  "places",
  "cities",
  "factions",
  "missions",
  "secrets",
  "images",
  "links",
  "connections",
  "dmTools",
  "boards",
]);

const DEFAULT_EDITOR_CONTENT = Object.freeze({
  format: "campaign-blocks-v1",
  plainText: "",
  blocks: [],
});

const DEFAULT_VISIBILITY = Object.freeze({
  audience: CAMPAIGN_VISIBILITY.dm,
  state: CAMPAIGN_REVEAL_STATES.draft,
});
const PLAYER_REVEALED_VISIBILITY = CAMPAIGN_VISIBILITY_PRESETS.playersRevealed.visibility;

const DEFAULT_BOARD_ID = "main";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeTags(value) {
  return asArray(value)
    .map(tag => String(tag || "").trim())
    .filter(Boolean);
}

function normalizeIdList(value) {
  return asArray(value)
    .map(id => String(id || "").trim())
    .filter(Boolean);
}

function entityKey(type, id) {
  return type && id ? `${type}:${id}` : "";
}

export function normalizeCampaignVisibility(value = {}) {
  const audience = Object.values(CAMPAIGN_VISIBILITY).includes(value.audience)
    ? value.audience
    : DEFAULT_VISIBILITY.audience;
  const state = Object.values(CAMPAIGN_REVEAL_STATES).includes(value.state)
    ? value.state
    : DEFAULT_VISIBILITY.state;
  return { audience, state };
}

export function getCampaignVisibilityPresetId(value = {}) {
  const visibility = normalizeCampaignVisibility(value);
  const preset = Object.values(CAMPAIGN_VISIBILITY_PRESETS)
    .find(item => item.visibility.audience === visibility.audience && item.visibility.state === visibility.state);
  return preset?.id || CAMPAIGN_VISIBILITY_PRESETS.dmDraft.id;
}

export function getCampaignVisibilityLabel(value = {}) {
  const presetId = getCampaignVisibilityPresetId(value);
  return Object.values(CAMPAIGN_VISIBILITY_PRESETS).find(item => item.id === presetId)?.label || "Privado DM";
}

export function canReadCampaignContent(value = {}, audience = CAMPAIGN_VISIBILITY.dm, options = {}) {
  const visibility = normalizeCampaignVisibility(value.visibility || value);
  const includeArchived = Boolean(options.includeArchived);
  if (!includeArchived && visibility.state === CAMPAIGN_REVEAL_STATES.archived) return false;
  if (audience === CAMPAIGN_VISIBILITY.dm) return true;
  return visibility.audience === CAMPAIGN_VISIBILITY.players
    && visibility.state === CAMPAIGN_REVEAL_STATES.revealed;
}

export function normalizeEditorContent(value = {}) {
  if (typeof value === "string") {
    return { ...DEFAULT_EDITOR_CONTENT, plainText: value };
  }
  return {
    format: asString(value.format, DEFAULT_EDITOR_CONTENT.format),
    plainText: asString(value.plainText),
    blocks: asArray(value.blocks),
  };
}

export function normalizeCampaignEntity(type, entity = {}) {
  return {
    id: asString(entity.id),
    type,
    title: asString(entity.title || entity.name, "Sin título"),
    slug: asString(entity.slug),
    summary: asString(entity.summary || entity.description),
    content: normalizeEditorContent(entity.content || entity.body || entity.text),
    tags: normalizeTags(entity.tags),
    visibility: normalizeCampaignVisibility(entity.visibility),
    imageIds: normalizeIdList(entity.imageIds),
    linkIds: normalizeIdList(entity.linkIds),
    relatedIds: normalizeIdList(entity.relatedIds),
    metadata: entity.metadata && typeof entity.metadata === "object" ? entity.metadata : {},
    createdAt: asString(entity.createdAt || entity.created_at),
    updatedAt: asString(entity.updatedAt || entity.updated_at),
  };
}

export function normalizeCampaignCharacterRecord(character = {}) {
  const kind = asString(character.kind, "player");
  const defaultVisibility = kind === "npc"
    ? DEFAULT_VISIBILITY
    : PLAYER_REVEALED_VISIBILITY;
  return {
    ...character,
    type: CAMPAIGN_ENTITY_TYPES.character,
    kind,
    visibility: normalizeCampaignVisibility(character.visibility || defaultVisibility),
    portrait: asString(character.portrait || character.image || character.avatar),
    imageIds: normalizeIdList(character.imageIds),
    linkIds: normalizeIdList(character.linkIds),
    relatedIds: normalizeIdList(character.relatedIds),
    notes: normalizeEditorContent(character.notes),
  };
}

export function normalizeCampaignSession(session = {}) {
  return {
    ...session,
    type: CAMPAIGN_ENTITY_TYPES.session,
    visibility: normalizeCampaignVisibility(session.visibility || PLAYER_REVEALED_VISIBILITY),
    imageIds: normalizeIdList(session.imageIds),
    linkIds: normalizeIdList(session.linkIds),
    relatedIds: normalizeIdList(session.relatedIds),
    publicSummary: asString(session.publicSummary),
    dmNotes: normalizeEditorContent(session.dmNotes),
  };
}

export function normalizeCampaignImage(image = {}) {
  return {
    ...normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.image, image),
    src: asString(image.src || image.dataUrl || image.url),
    alt: asString(image.alt),
    caption: asString(image.caption),
    mimeType: asString(image.mimeType || image.mime_type),
    size: Number(image.size || 0),
  };
}

export function normalizeCampaignLink(link = {}) {
  const url = asString(link.url);
  const title = asString(link.title || link.label || url, "Sin título");
  return {
    ...normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.link, { ...link, title }),
    url,
    label: asString(link.label || title || url),
    source: asString(link.source),
  };
}

export function normalizeCampaignConnection(connection = {}) {
  return {
    id: asString(connection.id),
    type: CAMPAIGN_ENTITY_TYPES.connection,
    boardId: asString(connection.boardId, DEFAULT_BOARD_ID),
    from: {
      type: asString(connection.from?.type || connection.fromType),
      id: asString(connection.from?.id || connection.fromId),
    },
    to: {
      type: asString(connection.to?.type || connection.toType),
      id: asString(connection.to?.id || connection.toId),
    },
    label: asString(connection.label),
    description: asString(connection.description),
    visibility: normalizeCampaignVisibility(connection.visibility),
    order: Number(connection.order || 0),
    style: connection.style && typeof connection.style === "object" ? connection.style : {},
    createdAt: asString(connection.createdAt || connection.created_at),
    updatedAt: asString(connection.updatedAt || connection.updated_at),
  };
}

export function normalizeDmToolState(tool = {}) {
  return {
    ...normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.dmTool, tool),
    toolType: asString(tool.toolType || tool.tool_type || tool.kind),
    status: asString(tool.status, "draft"),
    data: tool.data && typeof tool.data === "object" ? tool.data : {},
  };
}

export function normalizeCampaignBoard(board = {}) {
  return {
    id: asString(board.id, DEFAULT_BOARD_ID),
    title: asString(board.title, "Tablero principal"),
    nodes: asArray(board.nodes).map(node => ({
      id: asString(node.id),
      entityType: asString(node.entityType || node.type),
      entityId: asString(node.entityId || node.id),
      x: Number(node.x || 0),
      y: Number(node.y || 0),
      color: asString(node.color),
      icon: asString(node.icon),
      width: Number(node.width || 220),
      collapsed: Boolean(node.collapsed),
      visibility: normalizeCampaignVisibility(node.visibility),
    })),
    viewport: {
      x: Number(board.viewport?.x || 0),
      y: Number(board.viewport?.y || 0),
      zoom: Number(board.viewport?.zoom || 1),
    },
    updatedAt: asString(board.updatedAt || board.updated_at),
  };
}

export function createEmptyCampaignWorkspace() {
  return {
    schemaVersion: CAMPAIGN_MODEL_VERSION,
    notes: [],
    places: [],
    cities: [],
    factions: [],
    missions: [],
    secrets: [],
    images: [],
    links: [],
    connections: [],
    dmTools: [],
    boards: [normalizeCampaignBoard()],
    onboarding: {
      firstVisitAt: "",
      completedSteps: [],
      dismissedAt: "",
    },
  };
}

export function normalizeCampaignWorkspace(source = {}) {
  const workspace = source.workspace && typeof source.workspace === "object" ? source.workspace : source;
  return {
    schemaVersion: CAMPAIGN_MODEL_VERSION,
    notes: asArray(workspace.notes).map(item => normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.note, item)),
    places: asArray(workspace.places).map(item => normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.place, item)),
    cities: asArray(workspace.cities).map(item => normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.city, item)),
    factions: asArray(workspace.factions).map(item => normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.faction, item)),
    missions: asArray(workspace.missions).map(item => normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.mission, item)),
    secrets: asArray(workspace.secrets).map(item => normalizeCampaignEntity(CAMPAIGN_ENTITY_TYPES.secret, item)),
    images: asArray(workspace.images).map(normalizeCampaignImage),
    links: asArray(workspace.links).map(normalizeCampaignLink),
    connections: asArray(workspace.connections).map(normalizeCampaignConnection),
    dmTools: asArray(workspace.dmTools || workspace.tools).map(normalizeDmToolState),
    boards: asArray(workspace.boards).length ? workspace.boards.map(normalizeCampaignBoard) : [normalizeCampaignBoard()],
    onboarding: {
      firstVisitAt: asString(workspace.onboarding?.firstVisitAt),
      completedSteps: normalizeIdList(workspace.onboarding?.completedSteps),
      dismissedAt: asString(workspace.onboarding?.dismissedAt),
    },
  };
}

export function filterCampaignWorkspaceByAudience(workspace = {}, audience = CAMPAIGN_VISIBILITY.dm, options = {}) {
  const normalized = normalizeCampaignWorkspace(workspace);
  const filterVisible = item => canReadCampaignContent(item, audience, options);
  const visibleEntityIds = new Set(asArray(options.visibleEntityKeys).filter(Boolean));
  const filtered = {
    ...normalized,
    notes: normalized.notes.filter(filterVisible),
    places: normalized.places.filter(filterVisible),
    cities: normalized.cities.filter(filterVisible),
    factions: normalized.factions.filter(filterVisible),
    missions: normalized.missions.filter(filterVisible),
    secrets: normalized.secrets.filter(filterVisible),
    images: normalized.images.filter(filterVisible),
    links: normalized.links.filter(filterVisible),
    dmTools: normalized.dmTools.filter(filterVisible),
  };

  CAMPAIGN_WORKSPACE_COLLECTIONS
    .filter(collection => !["connections", "boards"].includes(collection))
    .forEach(collection => {
      asArray(filtered[collection]).forEach(item => {
        const key = entityKey(item.type, item.id);
        if (key) visibleEntityIds.add(key);
      });
    });

  filtered.connections = normalized.connections.filter(connection => (
    filterVisible(connection)
    && visibleEntityIds.has(entityKey(connection.from.type, connection.from.id))
    && visibleEntityIds.has(entityKey(connection.to.type, connection.to.id))
  ));

  filtered.boards = normalized.boards.map(board => ({
    ...board,
    nodes: board.nodes.filter(node => (
      canReadCampaignContent(node, audience, options)
      && visibleEntityIds.has(entityKey(node.entityType, node.entityId))
    )),
  }));

  return filtered;
}

export function createCampaignAudienceView(campaign = {}, audience = CAMPAIGN_VISIBILITY.dm, options = {}) {
  const characters = asArray(campaign.characters).map(normalizeCampaignCharacterRecord);
  const sessions = asArray(campaign.sessions).map(normalizeCampaignSession);
  const visibleCharacters = characters.filter(item => canReadCampaignContent(item, audience, options));
  const visibleSessions = sessions.filter(item => canReadCampaignContent(item, audience, options));
  const visibleEntityKeys = [
    ...visibleCharacters.map(item => entityKey(item.type, item.id)),
    ...visibleSessions.map(item => entityKey(item.type, item.id)),
  ].filter(Boolean);

  return {
    ...campaign,
    characters: visibleCharacters,
    sessions: visibleSessions,
    workspace: filterCampaignWorkspaceByAudience(campaign.workspace || campaign, audience, {
      ...options,
      visibleEntityKeys,
    }),
  };
}
