const {
  readBody,
  sendError,
  sendJson,
  signUnlockToken,
  supabaseFetch,
  verifyPassword,
} = require("../../_supabase");

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    if (req.method !== "POST") {
      res.setHeader("allow", "POST");
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = await readBody(req);
    const [campaign] = await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(id)}&select=id,password_hash`);
    if (!campaign) return sendJson(res, 404, { error: "Campaign not found" });
    if (!campaign.password_hash) return sendJson(res, 200, { token: signUnlockToken(id) });
    if (!verifyPassword(body.password || "", campaign.password_hash)) {
      return sendJson(res, 401, { error: "Invalid password" });
    }

    return sendJson(res, 200, { token: signUnlockToken(id) });
  } catch (error) {
    return sendError(res, error);
  }
};
