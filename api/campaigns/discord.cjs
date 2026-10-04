const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

const DEFAULT_WEBHOOK_NAME = "D20 Travesías";
const MAX_EMBEDS = 10;
const MAX_CHARACTER_CARDS = MAX_EMBEDS - 1;
const PROGRESS_SEGMENTS = 10;
const DEFAULT_COLOR = 0x9b4e35;
const LEVEL_UP_COLOR = 0x57f287;
const MAX_PORTRAIT_BYTES = 5 * 1024 * 1024;

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

function parseEmbedColor(value, fallback = DEFAULT_COLOR) {
  const normalized = String(value || "").trim().replace(/^#/, "");
  return /^[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized, 16) : fallback;
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

function getXpProgressDetails(character = {}) {
  const totalXp = Math.max(0, asFiniteNumber(character.totalXp));
  const previousXp = Math.max(0, asFiniteNumber(character.previousXp));
  const currentLevel = character.currentLevel || getXpLevel(previousXp);
  const status = getLevelProgress(character);
  const displayedLevel = status.canLevelUp ? currentLevel : Math.max(currentLevel, status.eligibleLevel);
  const nextLevel = status.canLevelUp ? status.eligibleLevel : status.nextLevel;
  const currentThreshold = XP_THRESHOLDS[Math.max(0, displayedLevel - 1)] || 0;
  const nextThreshold = XP_THRESHOLDS[Math.max(0, nextLevel - 1)] ?? totalXp;
  const distance = Math.max(1, nextThreshold - currentThreshold);
  const percent = status.canLevelUp
    ? 100
    : Math.max(0, Math.min(100, ((totalXp - currentThreshold) / distance) * 100));
  return { ...status, currentLevel: displayedLevel, nextLevel, currentThreshold, nextThreshold, percent, totalXp };
}

function buildProgressBar(percent) {
  const normalized = Math.max(0, Math.min(100, asFiniteNumber(percent)));
  const filled = normalized >= 100 ? PROGRESS_SEGMENTS : Math.floor(normalized / (100 / PROGRESS_SEGMENTS));
  return `${"▰".repeat(filled)}${"▱".repeat(PROGRESS_SEGMENTS - filled)}`;
}

function portraitAttachment(portrait, index) {
  const source = String(portrait || "").trim();
  if (/^https:\/\//i.test(source)) return { url: source, attachment: null };
  const match = source.match(/^data:image\/(png|jpe?g|webp|gif);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return { url: "", attachment: null };
  const extension = match[1].toLowerCase().replace("jpeg", "jpg");
  const mimeType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;
  const data = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!data.length || data.length > MAX_PORTRAIT_BYTES) return { url: "", attachment: null };
  const filename = `personaje-${index + 1}.${extension}`;
  return { url: `attachment://${filename}`, attachment: { filename, mimeType, data } };
}

function characterSubtitle(character) {
  return [
    character.className || character.class_name,
    character.player ? `Jugador: ${character.player}` : "",
  ].filter(Boolean).map(escapeDiscordText).join(" · ");
}

function buildCharacterEmbed(character, systemId, index) {
  const name = escapeDiscordText(character.name || character.characterName || "Personaje").slice(0, 180);
  const unit = systemId === "cyberpunkRed" ? "PP" : "PX";
  const awarded = asFiniteNumber(character.awarded);
  const total = Math.max(0, asFiniteNumber(character.totalXp));
  const subtitle = characterSubtitle(character);
  const portrait = portraitAttachment(character.portrait, index);
  const embed = {
    color: parseEmbedColor(character.color),
    title: `🛡️ ${name}`,
    description: [
      subtitle ? `*${subtitle}*` : "",
      `**+${formatNumber(awarded)} ${unit}** en esta sesión`,
      `Total acumulado: **${formatNumber(total)} ${unit}**`,
    ].filter(Boolean).join("\n"),
  };

  if (systemId === "dnd5e2024" || !systemId) {
    const progress = getXpProgressDetails(character);
    const percent = Math.round(progress.percent);
    embed.color = progress.canLevelUp ? LEVEL_UP_COLOR : parseEmbedColor(character.color);
    embed.title = progress.canLevelUp
      ? `⬆️ ${name} · ¡SUBE A NIVEL ${progress.eligibleLevel}!`
      : `🛡️ ${name} · Nivel ${progress.currentLevel}`;
    embed.description = [
      subtitle ? `*${subtitle}*` : "",
      `**+${formatNumber(awarded)} PX** en esta sesión`,
      progress.canLevelUp ? "🎉 **¡SUBIDA DE NIVEL DISPONIBLE!**" : "",
      `\`${buildProgressBar(progress.percent)}\` **${percent}%**`,
      `**${formatNumber(total)} / ${formatNumber(progress.nextThreshold)} PX**`,
      progress.canLevelUp
        ? `Ya puede subir a **nivel ${progress.eligibleLevel}**.`
        : `Faltan **${formatNumber(progress.remaining)} PX** para nivel ${progress.nextLevel}.`,
    ].filter(Boolean).join("\n");
  }

  if (portrait.url) embed.thumbnail = { url: portrait.url };
  return { embed, attachment: portrait.attachment };
}

function prepareSessionWebhookMessage({ campaign = {}, session = {}, characters = [] } = {}) {
  const systemId = campaign.system_id || campaign.systemId || "dnd5e2024";
  const unit = systemId === "cyberpunkRed" ? "PP" : "PX";
  const sessionName = escapeDiscordText(session.name || "Sesión sin nombre");
  const campaignName = escapeDiscordText(campaign.name || "Campaña");
  const sessionNumber = asFiniteNumber(session.number, 1);
  const totalAwarded = session.total_awarded ?? session.totalAwarded
    ?? characters.reduce((total, character) => total + asFiniteNumber(character.awarded), 0);
  const visibleCharacters = characters.slice(0, MAX_CHARACTER_CARDS);
  const characterCards = visibleCharacters.map((character, index) => buildCharacterEmbed(character, systemId, index));
  const attachments = characterCards.map(card => card.attachment).filter(Boolean);
  const header = {
    color: parseEmbedColor(campaign.color),
    title: `🎲 Sesión #${sessionNumber} · ${sessionName}`.slice(0, 256),
    description: `**${campaignName}**\nReparto de experiencia completado`,
    fields: [
      { name: "📅 Fecha", value: escapeDiscordText(formatSessionDate(session.date)), inline: true },
      { name: "👥 Grupo", value: `${characters.length} personaje${characters.length === 1 ? "" : "s"}`, inline: true },
      { name: `✨ ${unit} repartidos`, value: `**${formatNumber(totalAwarded)} ${unit}**`, inline: true },
    ],
    footer: {
      text: characters.length > visibleCharacters.length
        ? `D20 Travesías · Se muestran ${visibleCharacters.length} de ${characters.length} personajes`
        : "D20 Travesías · La aventura continúa",
    },
    timestamp: new Date().toISOString(),
  };
  if (/^https:\/\//i.test(process.env.DISCORD_ICON_URL || "")) {
    header.thumbnail = { url: process.env.DISCORD_ICON_URL };
  }

  const payload = {
    username: process.env.DISCORD_WEBHOOK_NAME || DEFAULT_WEBHOOK_NAME,
    allowed_mentions: { parse: [] },
    embeds: [header, ...characterCards.map(card => card.embed)],
  };
  if (process.env.DISCORD_ICON_URL) payload.avatar_url = process.env.DISCORD_ICON_URL;
  return { payload, attachments };
}

function buildSessionWebhookPayload(data) {
  return prepareSessionWebhookMessage(data).payload;
}

async function sendSessionDiscordNotification(data, options = {}) {
  const webhookUrl = options.webhookUrl || process.env.DISCORD_SESSION_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { sent: false, reason: "not_configured" };
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new Error("Fetch is not available for the Discord webhook");

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = setTimeout(() => controller?.abort(), options.timeoutMs || 5000);
  try {
    const message = prepareSessionWebhookMessage(data);
    let body = JSON.stringify(message.payload);
    let headers = { "content-type": "application/json" };
    if (message.attachments.length && typeof FormData === "function" && typeof Blob === "function") {
      const form = new FormData();
      form.append("payload_json", JSON.stringify(message.payload));
      message.attachments.forEach((attachment, index) => {
        form.append(`files[${index}]`, new Blob([attachment.data], { type: attachment.mimeType }), attachment.filename);
      });
      body = form;
      headers = {};
    }
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers,
      body,
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
  buildProgressBar,
  formatSessionDate,
  getLevelProgress,
  getXpProgressDetails,
  prepareSessionWebhookMessage,
  readCharacterLevel,
  sendSessionDiscordNotification,
};
