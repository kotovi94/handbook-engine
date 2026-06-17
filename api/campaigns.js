const {
  hashPassword,
  readBody,
  sendError,
  sendJson,
  supabaseFetch,
} = require("./_supabase");

function toCampaign(row) {
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
    totalAwarded: Number(row.total_awarded || 0),
    createdAt: row.created_at,
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await supabaseFetch("/campaign_summaries?select=*&order=created_at.desc");
      return sendJson(res, 200, { campaigns: rows.map(toCampaign) });
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
