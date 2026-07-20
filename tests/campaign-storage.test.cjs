const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { normalizeCharacterPayload } = require('../api/campaigns/payloads.cjs');

function loadHandlerWithStub(relativePath, stub) {
  const modulePath = path.resolve(__dirname, relativePath);
  const original = require.cache[modulePath];
  delete require.cache[modulePath];
  const Module = require('module');
  const originalLoad = Module._load;
  const payloadsStub = {
    normalizeCharacterPayload: require('../api/campaigns/payloads.cjs').normalizeCharacterPayload,
    normalizeSessionPayload: require('../api/campaigns/payloads.cjs').normalizeSessionPayload,
    PayloadValidationError: require('../api/campaigns/payloads.cjs').PayloadValidationError,
  };
  Module._load = function(request, parent, isMain) {
    if (request === '../../_supabase' || request === '../../_supabase.js') {
      return stub;
    }
    if (request === '../payloads.cjs' || request === '../payloads') {
      return payloadsStub;
    }
    return originalLoad.apply(this, arguments);
  };
  const handler = require(modulePath);
  Module._load = originalLoad;
  if (original) require.cache[modulePath] = original;
  return handler;
}

test('normaliza personajes modernos con xp cero y retrato de ImageStore', () => {
  const payload = normalizeCharacterPayload({
    name: 'Katlego Mbatha',
    player: 'Mansotaco',
    className: 'Corpo',
    xp: 0,
    portrait: 'image-store://portraits/katlego',
  });

  assert.equal(payload.name, 'Katlego Mbatha');
  assert.equal(payload.player, 'Mansotaco');
  assert.equal(payload.className, 'Corpo');
  assert.equal(payload.xp, 0);
  assert.equal(payload.portrait, 'image-store://portraits/katlego');
  assert.deepEqual(payload.imageIds, []);
  assert.deepEqual(payload.linkIds, []);
  assert.deepEqual(payload.relatedIds, []);
});

test('acepta personajes heredados con role, pp e image', () => {
  const payload = normalizeCharacterPayload({
    id: 'old-1',
    name: 'Aldo',
    player: 'Mina',
    role: 'Explorador',
    pp: 15,
    image: 'https://cdn.example.com/old.png',
  });

  assert.equal(payload.className, 'Explorador');
  assert.equal(payload.xp, 15);
  assert.equal(payload.portrait, 'https://cdn.example.com/old.png');
});

test('la ruta de personajes usa POST para crear y PATCH para editar', async () => {
  const calls = [];
  const stubSupabase = {
    getBearerToken: () => 'token',
    readBody: async (req) => req.body,
    sendError: (_res, error) => ({ error }),
    sendJson: (res, statusCode, body) => {
      res.statusCode = statusCode;
      res.body = body;
    },
    supabaseFetch: async (...args) => {
      calls.push(args);
      return [{}];
    },
    verifyUnlockToken: () => true,
  };

  const handler = loadHandlerWithStub('../api/campaigns/[id]/characters.js', stubSupabase);

  const createRes = { setHeader() {}, end() {} };
  await handler({ method: 'POST', query: { id: 'camp-1' }, body: { name: 'Katlego', className: 'Corpo', xp: 0 } }, createRes);
  const createCall = calls.find(call => call[1]?.method);
  assert.ok(createCall);
  assert.equal(createCall[1].method, 'POST');
  assert.equal(createRes.statusCode, 201);

  const editRes = { setHeader() {}, end() {} };
  await handler({ method: 'PATCH', query: { id: 'camp-1' }, body: { id: 'char-1', name: 'Katlego', className: 'Corpo', xp: 0 } }, editRes);
  const editCall = calls.findLast(call => call[1]?.method);
  assert.ok(editCall);
  assert.equal(editCall[1].method, 'PATCH');
  assert.equal(editRes.statusCode, 200);
});

test('la ruta de sesiones usa POST para crear y PATCH para editar', async () => {
  const calls = [];
  const stubSupabase = {
    getBearerToken: () => 'token',
    readBody: async (req) => req.body,
    sendError: (_res, error) => ({ error }),
    sendJson: (res, statusCode, body) => {
      res.statusCode = statusCode;
      res.body = body;
    },
    supabaseFetch: async (...args) => {
      calls.push(args);
      return [{}];
    },
    verifyUnlockToken: () => true,
  };

  const handler = loadHandlerWithStub('../api/campaigns/[id]/sessions.js', stubSupabase);

  const createRes = { setHeader() {}, end() {} };
  await handler({ method: 'POST', query: { id: 'camp-1' }, body: { number: 1, name: 'Sesión 1', allocations: [] } }, createRes);
  const createSessionCall = calls.find(call => call[1]?.method);
  assert.ok(createSessionCall);
  assert.equal(createSessionCall[1].method, 'POST');
  assert.equal(createRes.statusCode, 201);

  const editRes = { setHeader() {}, end() {} };
  await handler({ method: 'PATCH', query: { id: 'camp-1' }, body: { id: 'session-1', number: 2, name: 'Sesión 2', allocations: [] } }, editRes);
  const editSessionCall = calls.findLast(call => call[1]?.method);
  assert.ok(editSessionCall);
  assert.equal(editSessionCall[1].method, 'PATCH');
  assert.equal(editRes.statusCode, 200);
});
