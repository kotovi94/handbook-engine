export const SESSION_PREPARATION_TOOL_TYPE = "session-preparation";

export function createSessionPreparation(campaign = {}, input = {}, createId = defaultId) {
  const now = new Date().toISOString();
  const latest = Math.max(0, ...(campaign.sessions || []).map((session) => Number(session.number) || 0));
  return normalizeSessionPreparation({
    id: input.id || createId(),
    type: "dmTool",
    toolType: SESSION_PREPARATION_TOOL_TYPE,
    title: input.title || `Sesión ${input.number || latest + 1}`,
    summary: input.previousSummary || "",
    status: input.status || "draft",
    visibility: { audience: "dm", state: input.status === "ready" ? "prepared" : "draft" },
    content: { format: "campaign-blocks-v1", plainText: input.dmNotes || "", blocks: [] },
    tags: ["sesión", "preparación"],
    data: { ...input, number: Number(input.number || latest + 1) },
    createdAt: now,
    updatedAt: now,
  });
}

export function normalizeSessionPreparation(value = {}) {
  const data = value.data && typeof value.data === "object" ? value.data : {};
  return {
    ...value,
    id: String(value.id || ""),
    toolType: SESSION_PREPARATION_TOOL_TYPE,
    title: String(value.title || `Sesión ${data.number || 1}`),
    summary: String(value.summary || data.previousSummary || ""),
    status: ["draft", "ready", "active", "completed"].includes(value.status) ? value.status : "draft",
    visibility: value.visibility || { audience: "dm", state: "draft" },
    content: value.content || { format: "campaign-blocks-v1", plainText: String(data.dmNotes || ""), blocks: [] },
    tags: Array.isArray(value.tags) ? value.tags : ["sesión", "preparación"],
    data: {
      number: Math.max(1, Number(data.number || 1)),
      date: String(data.date || ""),
      title: String(data.title || value.title || ""),
      previousSummary: String(data.previousSummary || value.summary || ""),
      participantIds: stringList(data.participantIds),
      scenes: String(data.scenes || ""),
      npcs: String(data.npcs || ""),
      encounters: String(data.encounters || ""),
      pendingRewards: String(data.pendingRewards || ""),
      dungeonToolIds: stringList(data.dungeonToolIds),
      dmNotes: String(data.dmNotes || value.content?.plainText || ""),
      objectives: String(data.objectives || ""),
      nextObjective: String(data.nextObjective || ""),
    },
  };
}

export function upsertSessionPreparation(dmTools = [], preparation) {
  const normalized = normalizeSessionPreparation(preparation);
  const index = dmTools.findIndex((tool) => tool.id === normalized.id);
  if (index < 0) return [...dmTools, normalized];
  return dmTools.map((tool, toolIndex) => toolIndex === index ? normalized : tool);
}

export function listSessionPreparations(dmTools = []) {
  return dmTools
    .filter((tool) => tool.toolType === SESSION_PREPARATION_TOOL_TYPE)
    .map(normalizeSessionPreparation)
    .sort((a, b) => b.data.number - a.data.number);
}

export function getLatestSessionSummary(campaign = {}) {
  const latest = [...(campaign.sessions || [])].sort((a, b) => Number(b.number || 0) - Number(a.number || 0))[0];
  if (!latest) return "Aún no hay una sesión anterior registrada.";
  return latest.publicSummary || latest.notes?.roleplay || latest.notes?.summary || latest.name || `Sesión ${latest.number}`;
}

function stringList(value) {
  return Array.isArray(value) ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))] : [];
}

function defaultId() {
  return globalThis.crypto?.randomUUID?.() || `session-preparation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
