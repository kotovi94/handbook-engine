const tokenKey = (campaignId) => `d20-travesias-unlock-${campaignId}`;

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || response.statusText);
  return data;
}

export const remoteStorage = {
  async listCampaigns() {
    return requestJson("/api/campaigns");
  },

  async createCampaign(campaign, password = "") {
    const data = await requestJson("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({ ...campaign, password }),
    });
    if (data.token && data.campaign?.id) localStorage.setItem(tokenKey(data.campaign.id), data.token);
    return data;
  },

  async updateCampaign(campaign, password = "", keepPassword = true) {
    const token = localStorage.getItem(tokenKey(campaign.id));
    const data = await requestJson(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ ...campaign, password, keepPassword }),
    });
    if (data.token) localStorage.setItem(tokenKey(campaign.id), data.token);
    if (!campaign.passwordHash) localStorage.removeItem(tokenKey(campaign.id));
    return data;
  },

  async deleteCampaign(campaignId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return requestJson(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  },

  async getCampaign(campaignId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return requestJson(`/api/campaigns/${campaignId}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  },

  async unlockCampaign(campaignId, password) {
    const data = await requestJson(`/api/campaigns/${campaignId}/unlock`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    localStorage.setItem(tokenKey(campaignId), data.token);
    return data;
  },

  lockCampaign(campaignId) {
    localStorage.removeItem(tokenKey(campaignId));
  },

  async generateRecoveryCode(campaignId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    const data = await requestJson(`/api/campaigns/${campaignId}/recovery`, {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ action: "generate" }),
    });
    if (data.token) localStorage.setItem(tokenKey(campaignId), data.token);
    return data;
  },

  async resetPassword(campaignId, recoveryCode, password) {
    const data = await requestJson(`/api/campaigns/${campaignId}/recovery`, {
      method: "POST",
      body: JSON.stringify({ action: "reset", recoveryCode, password }),
    });
    if (data.token) localStorage.setItem(tokenKey(campaignId), data.token);
    return data;
  },

  async saveCharacter(campaignId, character) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return requestJson(`/api/campaigns/${campaignId}/characters`, {
      method: character.id ? "PATCH" : "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(character),
    });
  },

  async deleteCharacter(campaignId, characterId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return requestJson(`/api/campaigns/${campaignId}/characters`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: characterId }),
    });
  },

  async saveSession(campaignId, session) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return requestJson(`/api/campaigns/${campaignId}/sessions`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(session),
    });
  },

  async updateSession(campaignId, session) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return requestJson(`/api/campaigns/${campaignId}/sessions`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(session),
    });
  },

  async deleteSession(campaignId, sessionId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return requestJson(`/api/campaigns/${campaignId}/sessions`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: sessionId }),
    });
  },

  async saveWorkspace(campaignId, workspace) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return requestJson(`/api/campaigns/${campaignId}/workspace`, {
      method: "PATCH",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ workspace }),
    });
  },
};
