const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const supabasePath = path.join(projectRoot, 'api', '_supabase.js');
const realSecurity = require(supabasePath);

function responseRecorder() {
  return {
    statusCode: 0,
    payload: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    end(raw) { this.payload = raw ? JSON.parse(raw) : null; },
  };
}

function loadHandler(relativePath, overrides) {
  const handlerPath = path.join(projectRoot, relativePath);
  const original = require.cache[supabasePath];
  require.cache[supabasePath] = { id: supabasePath, filename: supabasePath, loaded: true, exports: overrides };
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  return {
    handler,
    restore() {
      delete require.cache[handlerPath];
      if (original) require.cache[supabasePath] = original;
      else delete require.cache[supabasePath];
    },
  };
}

function apiMocks(body, fetchImpl) {
  return {
    ...realSecurity,
    createRecoveryCode: () => 'ABCD-EFGH-JKLM',
    hashPassword: value => value ? `hash:${value}` : '',
    readBody: async () => body,
    sendJson: (res, status, payload) => { res.statusCode = status; res.payload = payload; return payload; },
    sendError: (res, error) => { throw error; },
    signUnlockToken: (id, version) => `token:${id}:${version}`,
    supabaseFetch: fetchImpl,
    verifyUnlockToken: () => true,
  };
}

test('los códigos de recuperación tienen formato legible y evitan caracteres ambiguos', () => {
  const code = realSecurity.createRecoveryCode();
  assert.match(code, /^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){2}$/);
  assert.doesNotMatch(code, /[01IO]/);
});

test('el hash valida la contraseña correcta y rechaza otra', () => {
  const hash = realSecurity.hashPassword('clave-segura');
  assert.equal(realSecurity.verifyPassword('clave-segura', hash), true);
  assert.equal(realSecurity.verifyPassword('otra-clave', hash), false);
});

test('crear una campaña protegida crea contraseña, recuperación y sesión juntas', async () => {
  const writes = [];
  const mocks = apiMocks({ name: 'Prueba', password: 'secreto' }, async (url, options) => {
    writes.push({ url, body: JSON.parse(options.body) });
    return [{ id: 'campaign-1', access_version: 1 }];
  });
  const loaded = loadHandler('api/campaigns.js', mocks);
  try {
    const res = responseRecorder();
    await loaded.handler({ method: 'POST' }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(writes[0].body.password_hash, 'hash:secreto');
    assert.equal(writes[0].body.recovery_hash, 'hash:ABCD-EFGH-JKLM');
    assert.equal(res.payload.recoveryCode, 'ABCD-EFGH-JKLM');
    assert.equal(res.payload.token, 'token:campaign-1:1');
  } finally { loaded.restore(); }
});

test('crear una campaña abierta no genera credenciales', async () => {
  let inserted;
  const mocks = apiMocks({ name: 'Abierta', password: '' }, async (url, options) => {
    inserted = JSON.parse(options.body);
    return [{ id: 'campaign-2', access_version: 1 }];
  });
  const loaded = loadHandler('api/campaigns.js', mocks);
  try {
    const res = responseRecorder();
    await loaded.handler({ method: 'POST' }, res);
    assert.equal(inserted.password_hash, '');
    assert.equal(inserted.recovery_hash, '');
    assert.equal(res.payload.recoveryCode, undefined);
  } finally { loaded.restore(); }
});

test('el servidor rechaza contraseñas demasiado cortas antes de escribir', async () => {
  let writes = 0;
  const mocks = apiMocks({ name: 'Inválida', password: '123' }, async () => { writes += 1; return []; });
  const loaded = loadHandler('api/campaigns.js', mocks);
  try {
    const res = responseRecorder();
    await loaded.handler({ method: 'POST' }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(writes, 0);
  } finally { loaded.restore(); }
});

test('cambiar contraseña renueva también el código e invalida la versión anterior', async () => {
  let patch;
  const mocks = apiMocks({ name: 'Prueba', password: 'nueva-clave', keepPassword: false }, async (url, options) => {
    if (!options) return [{ id: 'campaign-3', protected: true, access_version: 4 }];
    patch = JSON.parse(options.body);
    return [];
  });
  const loaded = loadHandler('api/campaigns/[id].js', mocks);
  try {
    const res = responseRecorder();
    await loaded.handler({ method: 'PATCH', query: { id: 'campaign-3' }, headers: {} }, res);
    assert.equal(patch.password_hash, 'hash:nueva-clave');
    assert.equal(patch.recovery_hash, 'hash:ABCD-EFGH-JKLM');
    assert.equal(patch.access_version, 5);
    assert.equal(res.payload.recoveryCode, 'ABCD-EFGH-JKLM');
  } finally { loaded.restore(); }
});

test('quitar protección borra contraseña y recuperación', async () => {
  let patch;
  const mocks = apiMocks({ name: 'Prueba', password: '', keepPassword: false }, async (url, options) => {
    if (!options) return [{ id: 'campaign-4', protected: true, access_version: 2 }];
    patch = JSON.parse(options.body);
    return [];
  });
  const loaded = loadHandler('api/campaigns/[id].js', mocks);
  try {
    const res = responseRecorder();
    await loaded.handler({ method: 'PATCH', query: { id: 'campaign-4' }, headers: {} }, res);
    assert.equal(patch.password_hash, '');
    assert.equal(patch.recovery_hash, '');
    assert.equal(patch.access_version, 3);
    assert.equal(res.payload.recoveryCode, undefined);
  } finally { loaded.restore(); }
});

test('editar otros datos conserva las credenciales existentes', async () => {
  let patch;
  const mocks = apiMocks({ name: 'Nombre nuevo', password: '', keepPassword: true }, async (url, options) => {
    if (!options) return [{ id: 'campaign-5', protected: true, access_version: 7 }];
    patch = JSON.parse(options.body);
    return [];
  });
  const loaded = loadHandler('api/campaigns/[id].js', mocks);
  try {
    const res = responseRecorder();
    await loaded.handler({ method: 'PATCH', query: { id: 'campaign-5' }, headers: {} }, res);
    assert.equal('password_hash' in patch, false);
    assert.equal('recovery_hash' in patch, false);
    assert.equal('access_version' in patch, false);
  } finally { loaded.restore(); }
});

test('publicar la última sesión exige una campaña protegida', async () => {
  const mocks = apiMocks({}, async () => [{
    id: 'campaign-open',
    name: 'Abierta',
    password_hash: '',
    access_version: 1,
  }]);
  const loaded = loadHandler('api/campaigns/[id]/session-notification.js', mocks);
  try {
    const res = responseRecorder();
    await assert.rejects(
      loaded.handler({ method: 'POST', query: { id: 'campaign-open' }, headers: {} }, res),
      error => error.statusCode === 403 && error.message === 'DM protection required',
    );
  } finally { loaded.restore(); }
});

test('publicar la última sesión rechaza a quien no tenga acceso de DM', async () => {
  const mocks = apiMocks({}, async () => [{
    id: 'campaign-locked',
    name: 'Protegida',
    password_hash: 'hash:secreto',
    access_version: 2,
  }]);
  mocks.verifyUnlockToken = () => false;
  const loaded = loadHandler('api/campaigns/[id]/session-notification.js', mocks);
  try {
    const res = responseRecorder();
    await assert.rejects(
      loaded.handler({ method: 'POST', query: { id: 'campaign-locked' }, headers: {} }, res),
      error => error.statusCode === 401 && error.message === 'Campaign unlock required',
    );
  } finally { loaded.restore(); }
});

test('el DM desbloqueado puede publicar la última sesión sin modificar experiencia', async () => {
  const originalWebhook = process.env.DISCORD_SESSION_WEBHOOK_URL;
  const originalFetch = global.fetch;
  const reads = [];
  let discordRequest;
  process.env.DISCORD_SESSION_WEBHOOK_URL = 'https://discord.com/api/webhooks/test/token';
  global.fetch = async (url, options) => {
    discordRequest = { url, options };
    return { ok: true, status: 204 };
  };
  const mocks = apiMocks({}, async url => {
    reads.push(url);
    if (url.startsWith('/campaigns?')) return [{
      id: 'campaign-dm',
      name: 'Costa Perdida',
      system_id: 'dnd5e2024',
      password_hash: 'hash:secreto',
      access_version: 3,
    }];
    if (url.startsWith('/sessions?')) return [{
      id: 'session-7',
      number: 7,
      name: 'La torre',
      date: '2026-10-03',
      allocations: [{ characterId: 'char-1', characterName: 'Lyra', total: 350 }],
      total_awarded: 350,
    }];
    if (url.startsWith('/characters?')) return [{ id: 'char-1', name: 'Lyra', xp: 950, metadata: {} }];
    return [];
  });
  mocks.verifyUnlockToken = (_id, token, version) => token === 'dm-token' && version === 3;
  const loaded = loadHandler('api/campaigns/[id]/session-notification.js', mocks);
  try {
    const res = responseRecorder();
    await loaded.handler({
      method: 'POST',
      query: { id: 'campaign-dm' },
      headers: { authorization: 'Bearer dm-token' },
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.session.id, 'session-7');
    assert.equal(discordRequest.url, process.env.DISCORD_SESSION_WEBHOOK_URL);
    assert.equal(reads.filter(url => url.startsWith('/characters?')).length, 1);
    assert.equal(reads.some(url => url.includes('method=PATCH')), false);
  } finally {
    loaded.restore();
    global.fetch = originalFetch;
    if (originalWebhook === undefined) delete process.env.DISCORD_SESSION_WEBHOOK_URL;
    else process.env.DISCORD_SESSION_WEBHOOK_URL = originalWebhook;
  }
});
