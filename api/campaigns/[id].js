const {
  getBearerToken,
  hashPassword,
  readBody,
  sendError,
  sendJson,
  supabaseFetch,
  verifyUnlockToken,
} = require("../_supabase");

function mapCampaign(row, unlocked) {
  return {
    id: row.id,
    name: row.name,
    dm: row.dm || "",
    systemId: row.system_id,
    system: row.system_name,
    description: row.description || "",
    theme: row.theme || "parchment",
    font: row.font || "classic",
    appearance: row.appearance || "light",
    color: row.color || "#9b4e35",
    banner: row.banner || "",
    passwordHash: row.protected && !unlocked ? "protected" : "",
    characters: [],
    sessions: [],
    createdAt: row.created_at,
  };
}

function mapCharacter(row) {
  return {
    id: row.id,
    name: row.name,
    player: row.player || "",
    className: row.class_name || "",
    xp: Number(row.xp || 0),
    color: row.color || "#b97a45",
  };
}

function mapSession(row) {
  return {
    id: row.id,
    number: row.number,
    date: row.date,
    name: row.name,
    pools: row.pools || {},
    notes: row.notes || {},
    historical: row.historical,
    allocations: row.allocations || [],
    totalAwarded: Number(row.total_awarded || 0),
    createdAt: row.created_at,
  };
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    const [summary] = await supabaseFetch(`/campaign_summaries?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!summary) return sendJson(res, 404, { error: "Campaign not found" });
    const unlocked = !summary.protected || verifyUnlockToken(id, getBearerToken(req));

    if (req.method === "PATCH") {
      if (!unlocked) return sendJson(res, 401, { error: "Campaign unlock required" });
      const body = await readBody(req);
      const passwordHash = body.keepPassword ? undefined : (body.password ? hashPassword(body.password) : "");
      const patch = {
        name: String(body.name || "").trim(),
        dm: String(body.dm || "").trim(),
        system_id: body.systemId || "dnd5e2024",
        system_name: body.system || "D&D 5e 2024",
        description: String(body.description || "").trim(),
        theme: body.theme || "parchment",
        font: body.font || "classic",
        appearance: body.appearance || "light",
        color: body.color || "#9b4e35",
        banner: body.banner || "",
        updated_at: new Date().toISOString(),
      };
      if (passwordHash !== undefined) patch.password_hash = passwordHash;
      await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      if (!unlocked) return sendJson(res, 401, { error: "Campaign unlock required" });
      await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method !== "GET") {
      res.setHeader("allow", "GET, PATCH, DELETE");
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const campaign = mapCampaign(summary, unlocked);

    const characters = await supabaseFetch(`/characters?campaign_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.asc`);
    campaign.characters = characters.map(mapCharacter);

    const sessions = await supabaseFetch(`/sessions?campaign_id=eq.${encodeURIComponent(id)}&select=*&order=date.desc`);
    campaign.sessions = unlocked ? sessions.map(mapSession) : sessions.slice(0, 4).map(mapSession);
    campaign.summaryOnly = !unlocked;

    return sendJson(res, 200, { campaign });
  } catch (error) {
    return sendError(res, error);
  }
};
