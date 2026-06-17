const {
  getBearerToken,
  readBody,
  sendError,
  sendJson,
  supabaseFetch,
  verifyUnlockToken,
} = require("../../_supabase");

async function requireUnlocked(req, campaignId) {
  const [campaign] = await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(campaignId)}&select=id,password_hash`);
  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }
  if (campaign.password_hash && !verifyUnlockToken(campaignId, getBearerToken(req))) {
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
      const [character] = await supabaseFetch("/characters?select=*", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          campaign_id: id,
          name: String(body.name || "").trim(),
          player: body.player || "",
          class_name: body.className || "",
          xp: Number(body.xp || 0),
          color: body.color || "#b97a45",
          portrait: body.portrait || "",
        }),
      });
      return sendJson(res, 201, { character });
    }

    if (req.method === "PATCH") {
      const body = await readBody(req);
      const [character] = await supabaseFetch(`/characters?id=eq.${encodeURIComponent(body.id)}&campaign_id=eq.${encodeURIComponent(id)}&select=*`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          name: String(body.name || "").trim(),
          player: body.player || "",
          class_name: body.className || "",
          xp: Number(body.xp || 0),
          color: body.color || "#b97a45",
          portrait: body.portrait || "",
          updated_at: new Date().toISOString(),
        }),
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
    return sendError(res, error);
  }
};
