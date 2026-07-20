const {
  getBearerToken,
  readBody,
  sendError,
  sendJson,
  supabaseFetch,
  verifyUnlockToken,
} = require("../../_supabase");
const { normalizeCharacterPayload, PayloadValidationError } = require("../payloads.cjs");

async function requireUnlocked(req, campaignId) {
  const [campaign] = await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(campaignId)}&select=id,password_hash,access_version`);
  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }
  if (campaign.password_hash && !verifyUnlockToken(campaignId, getBearerToken(req), campaign.access_version)) {
    const error = new Error("Campaign unlock required");
    error.statusCode = 401;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    await requireUnlocked(req, id);

    if (req.method === "POST") {
      const body = await readBody(req);
      const payload = normalizeCharacterPayload(body);
      const [character] = await supabaseFetch("/characters?select=*", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          campaign_id: id,
          name: payload.name,
          player: payload.player,
          class_name: payload.className,
          xp: payload.xp,
          color: payload.color || "#b97a45",
          portrait: payload.portrait,
          notes: payload.notes,
          metadata: payload.metadata,
        }),
      });
      return sendJson(res, 201, { character });
    }

    if (req.method === "PATCH") {
      const body = await readBody(req);
      const payload = normalizeCharacterPayload({ ...body, id: body.id }, { requireId: true });
      const patch = {
        name: payload.name,
        player: payload.player,
        class_name: payload.className,
        xp: payload.xp,
        color: payload.color || "#b97a45",
        portrait: payload.portrait,
        updated_at: new Date().toISOString(),
      };
      if (body.notes !== undefined) patch.notes = payload.notes || {};
      if (body.metadata !== undefined) {
        patch.metadata = payload.metadata;
      }
      const [character] = await supabaseFetch(`/characters?id=eq.${encodeURIComponent(payload.id)}&campaign_id=eq.${encodeURIComponent(id)}&select=*`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify(patch),
      });
      return sendJson(res, 200, { character });
    }

    if (req.method === "DELETE") {
      const body = await readBody(req);
      await supabaseFetch(`/characters?id=eq.${encodeURIComponent(body.id)}&campaign_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return sendJson(res, 200, { ok: true });
    }

    res.setHeader("allow", "POST, PATCH, DELETE");
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const isPayloadValidationError = error && (
      error.name === "PayloadValidationError"
      || (typeof PayloadValidationError === "function" && error instanceof PayloadValidationError)
    );
    if (isPayloadValidationError) {
      console.error("[campaign_store_invalid_payload]", {
        route: req.url,
        method: req.method,
        campaignId: id,
        field: error.field,
        reason: error.reason,
        receivedKeys: Object.keys(await readBody(req).catch(() => ({}))).slice(0, 20),
      });
      return sendJson(res, 400, {
        error: "campaign_store_invalid_payload",
        field: error.field,
        reason: error.reason,
      });
    }
    return sendError(res, error);
  }
};
