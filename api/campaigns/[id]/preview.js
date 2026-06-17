const {
  sendError,
  supabaseFetch,
} = require("../../_supabase");

const DEFAULT_TITLE = "D20 Travesias | Archivo de Campanas";
const DEFAULT_DESCRIPTION = "Campanas, personajes, sesiones y bitacora compartida para tu mesa.";
const DEFAULT_IMAGE_PATH = "/campaigns/social-preview.png";

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  }[char]));
}

function getOrigin(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${req.headers.host}`;
}

function absoluteUrl(req, value) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${getOrigin(req)}${value.startsWith("/") ? value : `/${value}`}`;
}

function getPreviewImage(req, campaign) {
  const configured = process.env.SOCIAL_PREVIEW_IMAGE_URL || process.env.DISCORD_ICON_URL || "";
  if (configured) return absoluteUrl(req, configured);
  if (/^https?:\/\//i.test(campaign.banner || "")) return campaign.banner;
  return absoluteUrl(req, DEFAULT_IMAGE_PATH);
}

function sendHtml(res, html) {
  res.statusCode = 200;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=300, s-maxage=300");
  res.end(html);
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    const [campaign] = await supabaseFetch(`/campaign_summaries?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!campaign) {
      res.statusCode = 404;
      res.end("Campaign not found");
      return;
    }

    const origin = getOrigin(req);
    const title = campaign.name ? `${campaign.name} | D20 Travesias` : DEFAULT_TITLE;
    const description = campaign.description || `${campaign.character_count || 0} personajes, ${campaign.session_count || 0} sesiones y bitacora compartida.`;
    const image = getPreviewImage(req, campaign);
    const appUrl = `${origin}/campaigns/?campaign=${encodeURIComponent(campaign.id)}`;
    const system = campaign.system_name || "D20 Travesias";

    return sendHtml(res, `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(title)}</title>
  <meta name="description" content="${escapeHTML(description)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_CL">
  <meta property="og:site_name" content="D20 Travesias">
  <meta property="og:title" content="${escapeHTML(title)}">
  <meta property="og:description" content="${escapeHTML(description)}">
  <meta property="og:url" content="${escapeHTML(appUrl)}">
  <meta property="og:image" content="${escapeHTML(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHTML(`${campaign.name} - ${system}`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(title)}">
  <meta name="twitter:description" content="${escapeHTML(description)}">
  <meta name="twitter:image" content="${escapeHTML(image)}">
  <meta http-equiv="refresh" content="0; url=${escapeHTML(appUrl)}">
</head>
<body>
  <p><a href="${escapeHTML(appUrl)}">Abrir campana</a></p>
</body>
</html>`);
  } catch (error) {
    return sendError(res, error);
  }
};
