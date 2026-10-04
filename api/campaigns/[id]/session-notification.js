const {
  getBearerToken,
  sendError,
  sendJson,
  supabaseFetch,
  verifyUnlockToken,
} = require("../../_supabase");
const { readCharacterLevel, sendSessionDiscordNotification } = require("../discord.cjs");

async function requireDmAccess(req, campaignId) {
  const [campaign] = await supabaseFetch(`/campaigns?id=eq.${encodeURIComponent(campaignId)}&select=id,name,color,system_id,system_name,password_hash,access_version`);
  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }
  if (!campaign.password_hash) {
    const error = new Error("DM protection required");
    error.statusCode = 403;
    throw error;
  }
  if (!verifyUnlockToken(campaignId, getBearerToken(req), campaign.access_version)) {
    const error = new Error("Campaign unlock required");
    error.statusCode = 401;
    throw error;
  }
  return campaign;
}

function characterSnapshots(session, characters) {
  const byId = new Map((characters || []).map(character => [character.id, character]));
  return (session.allocations || []).map(allocation => {
    const character = byId.get(allocation.characterId);
    const awarded = Number(allocation.total || 0);
    const totalXp = Number(character?.xp ?? awarded);
    return {
      characterId: allocation.characterId,
      name: allocation.characterName || character?.name || "Personaje",
      player: character?.player || "",
      className: character?.class_name || "",
      portrait: character?.portrait || "",
      color: character?.color || "",
      awarded,
      previousXp: Math.max(0, totalXp - awarded),
      totalXp,
      currentLevel: readCharacterLevel(character?.metadata),
    };
  });
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    if (req.method !== "POST") {
      res.setHeader("allow", "POST");
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const campaign = await requireDmAccess(req, id);
    const [session] = await supabaseFetch(`/sessions?campaign_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc,number.desc&limit=1`);
    if (!session) return sendJson(res, 404, { error: "No sessions found" });

    const characters = await supabaseFetch(`/characters?campaign_id=eq.${encodeURIComponent(id)}&select=id,name,player,class_name,xp,portrait,color,metadata`);
    const result = await sendSessionDiscordNotification({
      campaign,
      session,
      characters: characterSnapshots(session, characters),
    });
    if (!result.sent) {
      return sendJson(res, 503, { error: "Discord webhook is not configured" });
    }

    return sendJson(res, 200, {
      ok: true,
      session: { id: session.id, number: session.number, name: session.name },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports.characterSnapshots = characterSnapshots;
