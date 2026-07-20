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
