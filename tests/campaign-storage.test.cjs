const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { normalizeCharacterPayload } = require('../api/campaigns/payloads.cjs');
const {
  buildSessionWebhookPayload,
  buildProgressBar,
  getLevelProgress,
  getXpProgressDetails,
  prepareSessionWebhookMessage,
  sendSessionDiscordNotification,
} = require('../api/campaigns/discord.cjs');
const { characterSnapshots } = require('../api/campaigns/[id]/session-notification.js');

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

test('crea un aviso de Discord con resumen de sesión y progreso de cada personaje', () => {
  const payload = buildSessionWebhookPayload({
    campaign: { name: 'La Costa Perdida', color: '#713b87', system_id: 'dnd5e2024' },
    session: { number: 7, name: 'La torre sumergida', date: '2026-10-03', total_awarded: 700 },
    characters: [
      { name: 'Lyra', className: 'Barda', player: 'Ana', color: '#b97a45', portrait: 'https://cdn.example.com/lyra.png', awarded: 350, previousXp: 600, totalXp: 950, currentLevel: 2 },
      { name: 'Borin', awarded: 350, previousXp: 1000, totalXp: 1350, currentLevel: 3 },
    ],
  });

  assert.equal(payload.allowed_mentions.parse.length, 0);
  assert.match(payload.embeds[0].title, /Sesión #7/);
  assert.match(payload.embeds[0].description, /La Costa Perdida/);
  assert.match(payload.embeds[0].fields[2].value, /700 PX/);
  assert.equal(payload.embeds.length, 3);
  assert.match(payload.embeds[1].title, /SUBE A NIVEL 3/);
  assert.match(payload.embeds[1].description, /Barda.*Jugador: Ana/);
  assert.match(payload.embeds[1].description, /▰▰▰▰▰▰▰▰▰▰/);
  assert.equal(payload.embeds[1].thumbnail.url, 'https://cdn.example.com/lyra.png');
  assert.match(payload.embeds[2].title, /Nivel 3/);
  assert.match(payload.embeds[2].description, /1\.350 \/ 2\.700 PX/);
  assert.match(payload.embeds[2].description, /1\.350 PX.*nivel 4/);
});

test('calcula el aviso de subida y lo que falta para el siguiente nivel', () => {
  assert.deepEqual(getLevelProgress({ previousXp: 850, totalXp: 925 }), {
    canLevelUp: true,
    eligibleLevel: 3,
    text: '🆙 Tiene experiencia suficiente para subir a **nivel 3**.',
  });
  const progress = getLevelProgress({ previousXp: 925, totalXp: 1200, currentLevel: 3 });
  assert.equal(progress.canLevelUp, false);
  assert.equal(progress.nextLevel, 4);
  assert.equal(progress.remaining, 1500);
});

test('dibuja una barra proporcional entre el nivel actual y el siguiente', () => {
  const progress = getXpProgressDetails({ previousXp: 6000, totalXp: 6390, currentLevel: 4 });
  assert.equal(progress.nextLevel, 5);
  assert.equal(progress.remaining, 110);
  assert.equal(Math.round(progress.percent), 97);
  assert.equal(buildProgressBar(progress.percent), '▰▰▰▰▰▰▰▰▰▱');
});

test('convierte retratos guardados como datos en adjuntos de Discord', () => {
  const tinyPng = Buffer.from('portrait').toString('base64');
  const message = prepareSessionWebhookMessage({
    session: { number: 2, name: 'Retratos', date: '2026-10-03', totalAwarded: 300 },
    characters: [{ name: 'Lyra', portrait: `data:image/png;base64,${tinyPng}`, awarded: 300, previousXp: 0, totalXp: 300 }],
  });
  assert.equal(message.attachments.length, 1);
  assert.equal(message.attachments[0].filename, 'personaje-1.png');
  assert.equal(message.payload.embeds[1].thumbnail.url, 'attachment://personaje-1.png');
});

test('envía el aviso por webhook sin permitir menciones de Discord', async () => {
  let request;
  const result = await sendSessionDiscordNotification({
    session: { number: 1, name: '@everyone', date: '2026-10-03', totalAwarded: 300 },
    characters: [{ name: '@here', awarded: 300, previousXp: 0, totalXp: 300 }],
  }, {
    webhookUrl: 'https://discord.com/api/webhooks/test/token',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 204 };
    },
  });

  assert.equal(result.sent, true);
  assert.equal(request.url, 'https://discord.com/api/webhooks/test/token');
  const body = JSON.parse(request.options.body);
  assert.deepEqual(body.allowed_mentions, { parse: [] });
  assert.doesNotMatch(body.embeds[0].title, /@everyone/);
  assert.doesNotMatch(body.embeds[1].title, /@here/);
});

test('reconstruye los totales de la última sesión sin volver a aplicar experiencia', () => {
  const snapshots = characterSnapshots({
    allocations: [{ characterId: 'char-1', characterName: 'Lyra', total: 350 }],
  }, [{
    id: 'char-1',
    name: 'Lyra',
    player: 'Ana',
    class_name: 'Barda',
    portrait: 'https://cdn.example.com/lyra.png',
    color: '#b97a45',
    xp: 950,
    metadata: { characterDocument: { builder: { level: 2 } } },
  }]);

  assert.deepEqual(snapshots, [{
    characterId: 'char-1',
    name: 'Lyra',
    player: 'Ana',
    className: 'Barda',
    portrait: 'https://cdn.example.com/lyra.png',
    color: '#b97a45',
    awarded: 350,
    previousXp: 600,
    totalXp: 950,
    currentLevel: 2,
  }]);
});
