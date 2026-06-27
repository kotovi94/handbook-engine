const {
  hashPassword,
  readBody,
  sendError,
  sendJson,
  supabaseFetch,
} = require("./_supabase");

function toCampaign(row, latestSessionNumber = 0) {
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
    passwordHash: row.protected ? "protected" : "",
    characters: [],
    sessions: [],
    characterCount: row.character_count || 0,
    sessionCount: row.session_count || 0,
    latestSessionNumber: Number(row.latest_session_number || latestSessionNumber || 0),
    totalAwarded: Number(row.total_awarded || 0),
    createdAt: row.created_at,
  };
}

async function getLatestSessionNumbers(campaignIds) {
  if (!campaignIds.length) return new Map();
  const ids = campaignIds.map(id => encodeURIComponent(id)).join(",");
  const rows = await supabaseFetch(`/sessions?campaign_id=in.(${ids})&select=campaign_id,number`);
  return rows.reduce((map, row) => {
    const number = Number(row.number || 0);
    map.set(row.campaign_id, Math.max(map.get(row.campaign_id) || 0, number));
    return map;
  }, new Map());
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await supabaseFetch("/campaign_summaries?select=*&order=created_at.desc");
      const latestSessionNumbers = await getLatestSessionNumbers(rows.map(row => row.id));
      return sendJson(res, 200, { campaigns: rows.map(row => toCampaign(row, latestSessionNumbers.get(row.id))) });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const passwordHash = body.password ? hashPassword(body.password) : "";
      const [campaign] = await supabaseFetch("/campaigns?select=*", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
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
          password_hash: passwordHash,
        }),
      });
      return sendJson(res, 201, { campaign: { id: campaign.id } });
    }

    res.setHeader("allow", "GET, POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendError(res, error);
  }
};
