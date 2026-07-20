const tokenKey = (campaignId) => `d20-travesias-unlock-${campaignId}`;

async function request(path, options = {}) {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  const validToken = typeof token === 'string' ? token.trim() : '';

  const headers = {
    'content-type': 'application/json',
    ...(validToken ? { authorization: `Bearer ${validToken}` } : {}),
    ...(customHeaders || {}),
  };

  const response = await fetch(path, {
    ...fetchOptions,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload && (payload.error || payload.message) ? (payload.error || payload.message) : response.statusText;
    const requestError = new Error(message || 'Request failed');
    requestError.status = response.status;
    requestError.payload = payload;
    throw requestError;
  }

  return payload || {};
}

export const remoteStorage = {
  async listCampaigns() {
    return request("/api/campaigns");
  },

  async createCampaign(campaign, password = "") {
    const data = await request("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({ ...campaign, password }),
    });
    if (data.token && data.campaign?.id) localStorage.setItem(tokenKey(data.campaign.id), data.token);
    return data;
  },

  async updateCampaign(campaign, password = "", keepPassword = true) {
    const token = localStorage.getItem(tokenKey(campaign.id));
    const data = await request(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ ...campaign, password, keepPassword }),
    });
    if (data.token) localStorage.setItem(tokenKey(campaign.id), data.token);
    if (!campaign.passwordHash) localStorage.removeItem(tokenKey(campaign.id));
    return data;
  },

  async deleteCampaign(campaignId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return request(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
      token,
    });
  },

  async getCampaign(campaignId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return request(`/api/campaigns/${campaignId}`, { token });
  },

  async unlockCampaign(campaignId, password) {
    const data = await request(`/api/campaigns/${campaignId}/unlock`, {
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
    const data = await request(`/api/campaigns/${campaignId}/recovery`, {
      method: "POST",
      token,
      body: JSON.stringify({ action: "generate" }),
    });
    if (data.token) localStorage.setItem(tokenKey(campaignId), data.token);
    return data;
  },

  async resetPassword(campaignId, recoveryCode, password) {
    const data = await request(`/api/campaigns/${campaignId}/recovery`, {
      method: "POST",
      body: JSON.stringify({ action: "reset", recoveryCode, password }),
    });
    if (data.token) localStorage.setItem(tokenKey(campaignId), data.token);
    return data;
  },

  async saveCharacter(campaignId, character, options = {}) {
    const token = localStorage.getItem(tokenKey(campaignId));
    const isNew = Boolean(options.isNew);
    const path = `/api/campaigns/${campaignId}/characters`;
    return request(path, {
      method: isNew ? "POST" : "PATCH",
      token,
      body: JSON.stringify(character),
    });
  },

  async deleteCharacter(campaignId, characterId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return request(`/api/campaigns/${campaignId}/characters`, {
      method: "DELETE",
      token,
      body: JSON.stringify({ id: characterId }),
    });
  },

  async saveSession(campaignId, session, options = {}) {
    const token = localStorage.getItem(tokenKey(campaignId));
    const isNew = Boolean(options.isNew);
    const path = `/api/campaigns/${campaignId}/sessions`;
    return request(path, {
      method: isNew ? "POST" : "PATCH",
      token,
      body: JSON.stringify(session),
    });
  },

  async updateSession(campaignId, session) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return request(`/api/campaigns/${campaignId}/sessions`, {
      method: "PATCH",
      token,
      body: JSON.stringify(session),
    });
  },

  async deleteSession(campaignId, sessionId) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return request(`/api/campaigns/${campaignId}/sessions`, {
      method: "DELETE",
      token,
      body: JSON.stringify({ id: sessionId }),
    });
  },

  async saveWorkspace(campaignId, workspace) {
    const token = localStorage.getItem(tokenKey(campaignId));
    return request(`/api/campaigns/${campaignId}/workspace`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ workspace }),
    });
  },
};
