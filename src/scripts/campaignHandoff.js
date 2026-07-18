export const campaignHandoffStorageKey = "handbook-engine-campaign-handoff-v1";

export function queueCampaignHandoff(handoff) {
  if (!canUseStorage()) return false;
  window.localStorage.setItem(campaignHandoffStorageKey, JSON.stringify({
    ...handoff,
    queuedAt: new Date().toISOString(),
  }));
  return true;
}

export function readCampaignHandoff() {
  if (!canUseStorage()) return null;

  try {
    return JSON.parse(window.localStorage.getItem(campaignHandoffStorageKey) || "null");
  } catch {
    return null;
  }
}

export function clearCampaignHandoff() {
  if (canUseStorage()) {
    window.localStorage.removeItem(campaignHandoffStorageKey);
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}
