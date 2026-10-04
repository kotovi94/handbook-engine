const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

const DEFAULT_WEBHOOK_NAME = "D20 Travesías";
const MAX_FIELDS_PER_EMBED = 25;
const MAX_EMBEDS = 10;

function asFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(asFiniteNumber(value));
}

function formatSessionDate(value) {
  if (!value) return "Fecha no indicada";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function escapeDiscordText(value) {
  return String(value || "")
    .replace(/([\\`*_{}\[\]()<>#+\-.!|])/g, "\\$1")
    .replace(/@(everyone|here)/gi, "@\u200b$1")
    .trim();
}

function getXpLevel(xp) {
  let level = 1;
  XP_THRESHOLDS.forEach((threshold, index) => {
    if (asFiniteNumber(xp) >= threshold) level = index + 1;
  });
  return Math.min(level, 20);
}

function readCharacterLevel(metadata) {
  const candidates = [
    metadata?.characterDocument?.builder?.level,
    metadata?.characterDocument?.level,
    metadata?.level,
  ];
  const level = candidates.map(Number).find(value => Number.isInteger(value) && value >= 1 && value <= 20);
  return level || null;
}

function getLevelProgress({ previousXp = 0, totalXp = 0, currentLevel = null } = {}) {
  const total = Math.max(0, asFiniteNumber(totalXp));
  const previous = Math.max(0, asFiniteNumber(previousXp));
  const eligibleLevel = getXpLevel(total);
  const baseLevel = currentLevel || getXpLevel(previous);

  if (eligibleLevel > baseLevel) {
    return {
      canLevelUp: true,
      eligibleLevel,
      text: `🆙 Tiene experiencia suficiente para subir a **nivel ${eligibleLevel}**.`,
    };
  }

  const displayedLevel = Math.max(baseLevel, eligibleLevel);
  if (displayedLevel >= 20) {
    return { canLevelUp: false, eligibleLevel: 20, remaining: 0, text: "🏆 Alcanzó el nivel máximo." };
  }

  const nextLevel = displayedLevel + 1;
  const remaining = Math.max(0, XP_THRESHOLDS[displayedLevel] - total);
  return {
    canLevelUp: false,
    eligibleLevel: displayedLevel,
    nextLevel,
    remaining,
    text: `Le faltan **${formatNumber(remaining)} PX** para llegar a **nivel ${nextLevel}**.`,
  };
}

function buildCharacterField(character, systemId) {
  const name = escapeDiscordText(character.name || character.characterName || "Personaje").slice(0, 256);
  const unit = systemId === "cyberpunkRed" ? "PP" : "PX";
  const lines = [
    `Ganó: **${formatNumber(character.awarded)} ${unit}**`,
    `Total acumulado: **${formatNumber(character.totalXp)} ${unit}**`,
  ];
  if (systemId === "dnd5e2024" || !systemId) {
    lines.push(getLevelProgress(character).text);
  }
  return { name, value: lines.join("\n").slice(0, 1024), inline: false };
}

function buildSessionWebhookPayload({ campaign = {}, session = {}, characters = [] } = {}) {
  const systemId = campaign.system_id || campaign.systemId || "dnd5e2024";
  const unit = systemId === "cyberpunkRed" ? "PP" : "PX";
  const sessionName = escapeDiscordText(session.name || "Sesión sin nombre");
  const campaignName = escapeDiscordText(campaign.name || "Campaña");
  const sessionNumber = asFiniteNumber(session.number, 1);
  const totalAwarded = session.total_awarded ?? session.totalAwarded
    ?? characters.reduce((total, character) => total + asFiniteNumber(character.awarded), 0);
  const fields = characters.map(character => buildCharacterField(character, systemId));
  const embeds = [];

  for (let index = 0; index < Math.max(1, Math.ceil(fields.length / MAX_FIELDS_PER_EMBED)); index += 1) {
    if (index >= MAX_EMBEDS) break;
    const embed = {
      color: 0x9b4e35,
      title: index === 0
        ? `✨ Experiencia registrada · Sesión #${sessionNumber}`
        : `Personajes · Sesión #${sessionNumber} (continuación)`,
      fields: fields.slice(index * MAX_FIELDS_PER_EMBED, (index + 1) * MAX_FIELDS_PER_EMBED),
    };
    if (index === 0) {
      embed.description = [
        `**${sessionName}**`,
        `Campaña: **${campaignName}**`,
        `Fecha de la sesión: **${escapeDiscordText(formatSessionDate(session.date))}**`,
        `Experiencia total entregada: **${formatNumber(totalAwarded)} ${unit}**`,
      ].join("\n");
      embed.footer = { text: `${characters.length} personaje${characters.length === 1 ? "" : "s"} recibió${characters.length === 1 ? "" : "ron"} experiencia` };
      embed.timestamp = new Date().toISOString();
    }
    embeds.push(embed);
  }

  if (fields.length > MAX_FIELDS_PER_EMBED * MAX_EMBEDS) {
    embeds[MAX_EMBEDS - 1].footer = { text: `Se muestran los primeros ${MAX_FIELDS_PER_EMBED * MAX_EMBEDS} personajes.` };
  }

  const payload = {
    username: process.env.DISCORD_WEBHOOK_NAME || DEFAULT_WEBHOOK_NAME,
    allowed_mentions: { parse: [] },
    embeds,
  };
  if (process.env.DISCORD_ICON_URL) payload.avatar_url = process.env.DISCORD_ICON_URL;
  return payload;
}

async function sendSessionDiscordNotification(data, options = {}) {
  const webhookUrl = options.webhookUrl || process.env.DISCORD_SESSION_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { sent: false, reason: "not_configured" };
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new Error("Fetch is not available for the Discord webhook");

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = setTimeout(() => controller?.abort(), options.timeoutMs || 5000);
  try {
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildSessionWebhookPayload(data)),
      ...(controller ? { signal: controller.signal } : {}),
    });
    if (!response.ok) {
      throw new Error(`Discord webhook responded with status ${response.status}`);
    }
    return { sent: true };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  XP_THRESHOLDS,
  buildSessionWebhookPayload,
  formatSessionDate,
  getLevelProgress,
  readCharacterLevel,
  sendSessionDiscordNotification,
};
