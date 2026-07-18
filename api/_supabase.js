const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UNLOCK_SECRET = process.env.CAMPAIGN_UNLOCK_SECRET || SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD_HASH_PREFIX = "pbkdf2";
const PASSWORD_HASH_DIGEST = "sha256";
const PASSWORD_HASH_ITERATIONS = 210000;

function requireEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    error.statusCode = 500;
    throw error;
  }
}

async function supabaseFetch(path, options = {}) {
  requireEnv();
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || data?.hint || response.statusText);
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sendError(res, error) {
  sendJson(res, error.statusCode || 500, {
    error: error.message || "Unexpected error",
    details: error.details,
  });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function hashPassword(password) {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(String(password), salt, PASSWORD_HASH_ITERATIONS, 32, PASSWORD_HASH_DIGEST)
    .toString("hex");
  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_HASH_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return true;

  const [prefix, iterations, salt, hash] = String(storedHash).split("$");
  if (prefix === PASSWORD_HASH_PREFIX && iterations && salt && hash) {
    const candidate = crypto
      .pbkdf2Sync(String(password || ""), salt, Number(iterations), 32, PASSWORD_HASH_DIGEST)
      .toString("hex");
    return safeEqual(candidate, hash);
  }

  const legacyHash = crypto.createHash("sha256").update(String(password || ""), "utf8").digest("hex");
  return safeEqual(legacyHash, String(storedHash));
}

function signUnlockToken(campaignId) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8;
  const payload = `${campaignId}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", UNLOCK_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifyUnlockToken(campaignId, token = "") {
  const [tokenCampaignId, expiresAt, signature] = String(token).split(".");
  if (!tokenCampaignId || !expiresAt || !signature || tokenCampaignId !== campaignId) return false;
  if (Number(expiresAt) < Date.now()) return false;
  const payload = `${tokenCampaignId}.${expiresAt}`;
  const expected = crypto.createHmac("sha256", UNLOCK_SECRET).update(payload).digest("hex");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

module.exports = {
  getBearerToken,
  hashPassword,
  readBody,
  sendError,
  sendJson,
  signUnlockToken,
  supabaseFetch,
  verifyPassword,
  verifyUnlockToken,
};

function safeEqual(first, second) {
  const firstBuffer = Buffer.from(String(first));
  const secondBuffer = Buffer.from(String(second));
  return firstBuffer.length === secondBuffer.length && crypto.timingSafeEqual(firstBuffer, secondBuffer);
}
