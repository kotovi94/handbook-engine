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

function asWorkspace(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

async function readWorkspace(campaignId) {
  const [row] = await supabaseFetch(`/campaign_workspaces?campaign_id=eq.${encodeURIComponent(campaignId)}&select=workspace,updated_at`);
  return {
    workspace: asWorkspace(row?.workspace),
    updatedAt: row?.updated_at || "",
  };
}

async function saveWorkspace(campaignId, workspace) {
  const [row] = await supabaseFetch("/campaign_workspaces?on_conflict=campaign_id&select=workspace,updated_at", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      campaign_id: campaignId,
      workspace: asWorkspace(workspace),
      updated_at: new Date().toISOString(),
    }),
  });
  return {
    workspace: asWorkspace(row?.workspace),
    updatedAt: row?.updated_at || "",
  };
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    await requireUnlocked(req, id);

    if (req.method === "GET") {
      return sendJson(res, 200, await readWorkspace(id));
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const body = await readBody(req);
      const workspace = asWorkspace(body.workspace || body);
      return sendJson(res, 200, await saveWorkspace(id, workspace));
    }

    res.setHeader("allow", "GET, PATCH, PUT");
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendError(res, error);
  }
};
