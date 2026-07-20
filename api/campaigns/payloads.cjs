class PayloadValidationError extends Error {
  constructor(field, reason) {
    super(reason);
    this.name = 'PayloadValidationError';
    this.field = field;
    this.reason = reason;
  }
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeOptionalText(value) {
  return asString(value).trim();
}

function normalizeRequiredText(value, field) {
  const text = asString(value).trim();
  if (!text) {
    throw new PayloadValidationError(field, 'Expected a non-empty string');
  }
  return text;
}

function normalizeNonNegativeNumber(value, field = 'xp') {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new PayloadValidationError(field, 'Expected a non-negative finite number');
  }
  return Math.round(number * 100) / 100;
}

function normalizeId(value) {
  return asString(value).trim();
}

function normalizeIdArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => String(item || '').trim()).filter(Boolean);
}

function normalizeDate(value) {
  return asString(value) || new Date().toISOString();
}

function normalizeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeVisibility(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return asString(value.audience || value.visibility, 'public');
  }
  return 'public';
}

function normalizeImageReference(value) {
  return asString(value).trim();
}

function normalizeCharacterPayload(input = {}, options = {}) {
  const id = normalizeId(input.id);
  if (options.requireId && !id) {
    throw new PayloadValidationError('id', 'Expected a valid character id');
  }

  const type = asString(input.type, 'character');
  if (type && type !== 'character') {
    throw new PayloadValidationError('type', 'Expected a character payload');
  }

  const kind = asString(input.kind, 'player');
  if (kind && kind !== 'player' && kind !== 'npc') {
    throw new PayloadValidationError('kind', 'Expected player or npc kind');
  }

  const visibility = normalizeVisibility(input.visibility);
  const name = normalizeRequiredText(input.name, 'name');
  const player = normalizeOptionalText(input.player);
  const className = normalizeOptionalText(input.className ?? input.role);
  const xp = normalizeNonNegativeNumber(input.xp ?? input.pp, 'xp');
  const portrait = normalizeImageReference(input.portrait ?? input.image);
  const color = normalizeOptionalText(input.color);
  const notes = normalizeObject(input.notes);
  const imageIds = normalizeIdArray(input.imageIds);
  const linkIds = normalizeIdArray(input.linkIds);
  const relatedIds = normalizeIdArray(input.relatedIds);
  const createdAt = normalizeDate(input.createdAt || input.created_at);
  const updatedAt = normalizeDate(input.updatedAt || input.updated_at);
  const metadata = normalizeObject(input.metadata);

  return {
    id,
    type,
    kind,
    visibility,
    name,
    player,
    className,
    xp,
    portrait,
    color,
    notes,
    imageIds,
    linkIds,
    relatedIds,
    createdAt,
    updatedAt,
    metadata,
  };
}

function normalizeSessionPayload(input = {}, options = {}) {
  const id = normalizeId(input.id);
  if (options.requireId && !id) {
    throw new PayloadValidationError('id', 'Expected a valid session id');
  }

  const name = normalizeRequiredText(input.name || input.title, 'name');
  const number = Number.isFinite(Number(input.number)) ? Number(input.number) : 1;
  const date = asString(input.date) || new Date().toISOString().slice(0, 10);
  const pools = normalizeObject(input.pools);
  const notes = normalizeObject(input.notes);
  const historical = Boolean(input.historical);
  const allocations = Array.isArray(input.allocations) ? input.allocations : [];
  const totalAwarded = normalizeNonNegativeNumber(input.totalAwarded ?? input.total_awarded, 'totalAwarded');
  return {
    id,
    number,
    date,
    name,
    pools,
    notes,
    historical,
    allocations,
    totalAwarded,
    createdAt: normalizeDate(input.createdAt || input.created_at),
    updatedAt: normalizeDate(input.updatedAt || input.updated_at),
  };
}

module.exports = {
  PayloadValidationError,
  normalizeCharacterPayload,
  normalizeSessionPayload,
};
