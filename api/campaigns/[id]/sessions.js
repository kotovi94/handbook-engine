const {
  getBearerToken,
  readBody,
  sendError,
  sendJson,
  supabaseFetch,
  verifyUnlockToken,
} = require("../../_supabase");
const { normalizeSessionPayload, PayloadValidationError } = require("../payloads.cjs");

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

async function applyAllocations(campaignId, allocations, direction) {
  for (const allocation of allocations || []) {
    const [character] = await supabaseFetch(`/characters?id=eq.${encodeURIComponent(allocation.characterId)}&campaign_id=eq.${encodeURIComponent(campaignId)}&select=id,xp,metadata`);
    if (!character) continue;
    const nextXp = Math.max(0, Number(character.xp || 0) + direction * Number(allocation.total || 0));
    const roundedXp = Math.round(nextXp * 100) / 100;
    const metadata = character.metadata && typeof character.metadata === "object" ? character.metadata : {};
    const characterDocument = metadata.characterDocument && typeof metadata.characterDocument === "object"
      ? {
        ...metadata.characterDocument,
        revision: Math.max(0, Number(metadata.characterDocument.revision || 0)) + 1,
        updatedAt: new Date().toISOString(),
        progression: {
          ...(metadata.characterDocument.progression || {}),
          xp: roundedXp,
        },
      }
      : null;
    await supabaseFetch(`/characters?id=eq.${encodeURIComponent(character.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        xp: roundedXp,
        ...(characterDocument ? { metadata: { ...metadata, characterDocument } } : {}),
        updated_at: new Date().toISOString(),
      }),
    });
  }
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    await requireUnlocked(req, id);

    if (req.method === "POST") {
      const body = await readBody(req);
      const payload = normalizeSessionPayload(body);
      await applyAllocations(id, payload.allocations || [], 1);
      const [session] = await supabaseFetch("/sessions?select=*", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          campaign_id: id,
          number: payload.number,
          date: payload.date,
          name: payload.name,
          pools: payload.pools,
          notes: payload.notes,
          historical: payload.historical,
          allocations: payload.allocations,
          total_awarded: payload.totalAwarded,
        }),
      });
      return sendJson(res, 201, { session });
    }

    if (req.method === "PATCH") {
      const body = await readBody(req);
      const payload = normalizeSessionPayload({ ...body, id: body.id }, { requireId: true });
      const [previous] = await supabaseFetch(`/sessions?id=eq.${encodeURIComponent(payload.id)}&campaign_id=eq.${encodeURIComponent(id)}&select=*`);
      if (!previous) return sendJson(res, 404, { error: "Session not found" });
      const previousTotals = new Map((previous.allocations || []).map(allocation => [allocation.characterId, Number(allocation.total || 0)]));
      const nextTotals = new Map((payload.allocations || []).map(allocation => [allocation.characterId, Number(allocation.total || 0)]));
      for (const characterId of new Set([...previousTotals.keys(), ...nextTotals.keys()])) {
        const delta = (nextTotals.get(characterId) || 0) - (previousTotals.get(characterId) || 0);
        if (delta) await applyAllocations(id, [{ characterId, total: delta }], 1);
      }
      const [session] = await supabaseFetch(`/sessions?id=eq.${encodeURIComponent(payload.id)}&campaign_id=eq.${encodeURIComponent(id)}&select=*`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({ number: payload.number, date: payload.date, name: payload.name, allocations: payload.allocations, total_awarded: payload.totalAwarded }),
      });
      return sendJson(res, 200, { session });
    }

    if (req.method === "DELETE") {
      const body = await readBody(req);
      const [session] = await supabaseFetch(`/sessions?id=eq.${encodeURIComponent(body.id)}&campaign_id=eq.${encodeURIComponent(id)}&select=*`);
      if (!session) return sendJson(res, 404, { error: "Session not found" });
      await applyAllocations(id, session.allocations || [], -1);
      await supabaseFetch(`/sessions?id=eq.${encodeURIComponent(body.id)}&campaign_id=eq.${encodeURIComponent(id)}`, {
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
