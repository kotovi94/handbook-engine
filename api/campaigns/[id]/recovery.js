const crypto = require("crypto");
const {
  getBearerToken,
  hashPassword,
  readBody,
  sendError,
  sendJson,
  signUnlockToken,
  supabaseFetch,
  verifyPassword,
  verifyUnlockToken,
} = require("../../_supabase");

function createRecoveryCode() {
  const raw = crypto.randomBytes(9).toString("base64url").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("allow", "POST");
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const { id } = req.query;
    const body = await readBody(req);
    const [campaign] = await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(id)}&select=id,password_hash,recovery_hash,access_version`);
    if (!campaign) return sendJson(res, 404, { error: "Campaign not found" });

    if (body.action === "generate") {
      if (campaign.password_hash && !verifyUnlockToken(id, getBearerToken(req), campaign.access_version)) {
        return sendJson(res, 401, { error: "Campaign unlock required" });
      }
      const recoveryCode = createRecoveryCode();
      const accessVersion = Number(campaign.access_version || 1) + 1;
      await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ recovery_hash: hashPassword(recoveryCode), access_version: accessVersion, updated_at: new Date().toISOString() }),
      });
      return sendJson(res, 200, { recoveryCode, token: signUnlockToken(id, accessVersion) });
    }

    if (body.action === "reset") {
      if (!campaign.recovery_hash || !verifyPassword(String(body.recoveryCode || "").toUpperCase(), campaign.recovery_hash)) {
        return sendJson(res, 401, { error: "Invalid recovery code" });
      }
      const password = String(body.password || "");
      if (password.length < 4 || password.length > 80) return sendJson(res, 400, { error: "Invalid password length" });
      const recoveryCode = createRecoveryCode();
      const accessVersion = Number(campaign.access_version || 1) + 1;
      await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          password_hash: hashPassword(password),
          recovery_hash: hashPassword(recoveryCode),
          access_version: accessVersion,
          updated_at: new Date().toISOString(),
        }),
      });
      return sendJson(res, 200, { recoveryCode, token: signUnlockToken(id, accessVersion) });
    }

    return sendJson(res, 400, { error: "Invalid recovery action" });
  } catch (error) {
    return sendError(res, error);
  }
};
