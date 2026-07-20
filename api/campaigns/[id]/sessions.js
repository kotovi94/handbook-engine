const {
  getBearerToken,
  readBody,
  sendError,
  sendJson,
  supabaseFetch,
  verifyUnlockToken,
} = require("../../_supabase");

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
    const [character] = await supabaseFetch(`/characters?id=eq.${encodeURIComponent(allocation.characterId)}&campaign_id=eq.${encodeURIComponent(campaignId)}&select=id,xp`);
    if (!character) continue;
    const nextXp = Math.max(0, Number(character.xp || 0) + direction * Number(allocation.total || 0));
    await supabaseFetch(`/characters?id=eq.${encodeURIComponent(character.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ xp: Math.round(nextXp * 100) / 100, updated_at: new Date().toISOString() }),
    });
  }
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    await requireUnlocked(req, id);

    if (req.method === "POST") {
      const body = await readBody(req);
      await applyAllocations(id, body.allocations || [], 1);
      const [session] = await supabaseFetch("/sessions?select=*", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          campaign_id: id,
          number: Number(body.number || 1),
          date: body.date,
          name: String(body.name || "").trim(),
          pools: body.pools || {},
          notes: body.notes || {},
          historical: Boolean(body.historical),
          allocations: body.allocations || [],
          total_awarded: Number(body.totalAwarded || 0),
        }),
      });
      return sendJson(res, 201, { session });
    }

    if (req.method === "PATCH") {
      const body = await readBody(req);
      const [previous] = await supabaseFetch(`/sessions?id=eq.${encodeURIComponent(body.id)}&campaign_id=eq.${encodeURIComponent(id)}&select=*`);
      if (!previous) return sendJson(res, 404, { error: "Session not found" });
      const previousTotals = new Map((previous.allocations || []).map(allocation => [allocation.characterId, Number(allocation.total || 0)]));
      const nextTotals = new Map((body.allocations || []).map(allocation => [allocation.characterId, Number(allocation.total || 0)]));
      for (const characterId of new Set([...previousTotals.keys(), ...nextTotals.keys()])) {
        const delta = (nextTotals.get(characterId) || 0) - (previousTotals.get(characterId) || 0);
        if (delta) await applyAllocations(id, [{ characterId, total: delta }], 1);
      }
      const [session] = await supabaseFetch(`/sessions?id=eq.${encodeURIComponent(body.id)}&campaign_id=eq.${encodeURIComponent(id)}&select=*`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({ number: Number(body.number || previous.number || 1), date: body.date || previous.date, name: String(body.name || previous.name || "").trim(), allocations: body.allocations || [], total_awarded: Number(body.totalAwarded || 0) }),
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
    return sendError(res, error);
  }
};
