const {
  createRecoveryCode,
  getBearerToken,
  hashPassword,
  readBody,
  sendError,
  sendJson,
  signUnlockToken,
  supabaseFetch,
  verifyUnlockToken,
} = require("../_supabase");

function mapCampaign(row, unlocked, latestSessionNumber = 0) {
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
    recoveryConfigured: Boolean(row.recovery_configured),
    characters: [],
    sessions: [],
    sessionCount: row.session_count || 0,
    latestSessionNumber: Number(row.latest_session_number || latestSessionNumber || 0),
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
    portrait: row.portrait || "",
    notes: row.notes || {},
    metadata: row.metadata || {},
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

function isMissingWorkspaceTable(error) {
  return String(error?.message || "").includes("campaign_workspaces")
    || String(error?.details?.message || "").includes("campaign_workspaces");
}

async function getCampaignWorkspace(campaignId) {
  try {
    const [row] = await supabaseFetch(`/campaign_workspaces?campaign_id=eq.${encodeURIComponent(campaignId)}&select=workspace`);
    return row?.workspace && typeof row.workspace === "object" ? row.workspace : {};
  } catch (error) {
    if (isMissingWorkspaceTable(error)) return {};
    throw error;
  }
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    const [summary] = await supabaseFetch(`/campaign_summaries?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!summary) return sendJson(res, 404, { error: "Campaign not found" });
    const unlocked = !summary.protected || verifyUnlockToken(id, getBearerToken(req), summary.access_version);

    if (req.method === "PATCH") {
      if (!unlocked) return sendJson(res, 401, { error: "Campaign unlock required" });
      const body = await readBody(req);
      const password = String(body.password || "");
      if (!body.keepPassword && password && (password.length < 4 || password.length > 80)) {
        return sendJson(res, 400, { error: "Invalid password length" });
      }
      const passwordHash = body.keepPassword ? undefined : (password ? hashPassword(password) : "");
      const recoveryCode = passwordHash ? createRecoveryCode() : "";
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
      if (passwordHash !== undefined) {
        patch.recovery_hash = recoveryCode ? hashPassword(recoveryCode) : "";
        patch.access_version = Number(summary.access_version || 1) + 1;
      }
      await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const response = { ok: true };
      if (passwordHash) {
        response.recoveryCode = recoveryCode;
        response.token = signUnlockToken(id, patch.access_version);
      }
      return sendJson(res, 200, response);
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

    const [latestSession] = await supabaseFetch(`/sessions?campaign_id=eq.${encodeURIComponent(id)}&select=number&order=number.desc&limit=1`);
    const campaign = mapCampaign(summary, unlocked, latestSession?.number);

    const characters = await supabaseFetch(`/characters?campaign_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.asc`);
    campaign.characters = characters.map(mapCharacter);

    const sessions = await supabaseFetch(`/sessions?campaign_id=eq.${encodeURIComponent(id)}&select=*&order=date.desc`);
    campaign.sessions = unlocked ? sessions.map(mapSession) : sessions.slice(0, 4).map(mapSession);
    campaign.workspace = unlocked ? await getCampaignWorkspace(id) : {};
    campaign.summaryOnly = !unlocked;

    return sendJson(res, 200, { campaign });
  } catch (error) {
    return sendError(res, error);
  }
};
