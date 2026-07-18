const {
  sendError,
  supabaseFetch,
} = require("../../_supabase");

const DATA_IMAGE_PATTERN = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=\r\n]+)$/i;

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405;
      res.setHeader("allow", "GET, HEAD");
      res.end();
      return;
    }

    const { id } = req.query;
    const [campaign] = await supabaseFetch(`/campaign_summaries?id=eq.${encodeURIComponent(id)}&select=banner`);
    const match = String(campaign?.banner || "").match(DATA_IMAGE_PATTERN);
    if (!match) {
      res.statusCode = 404;
      res.end("Campaign cover not found");
      return;
    }

    const image = Buffer.from(match[2], "base64");
    res.statusCode = 200;
    res.setHeader("content-type", match[1].toLowerCase());
    res.setHeader("content-length", image.length);
    res.setHeader("cache-control", "public, max-age=300, s-maxage=300, stale-while-revalidate=86400");
    if (req.method === "HEAD") return res.end();
    return res.end(image);
  } catch (error) {
    return sendError(res, error);
  }
};
