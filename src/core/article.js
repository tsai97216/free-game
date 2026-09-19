import * as cheerio from "cheerio";

export async function parseArticle(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Article request failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const imageUrl = $('meta[property="og:image"]').attr("content") || "";
  const storeLinks = [];

  $("a[href], img[src]").each((_, element) => {
    const raw = $(element).attr("href") || $(element).attr("src");
    if (!raw) return;

    try {
      const url = new URL(raw, "https://www.4gamers.com.tw");
      const value = url.toString();

      const supported =
        /^https:\/\/store\.steampowered\.com\/(?:app|widget)\/\d+/i.test(value) ||
        /^https:\/\/store\.epicgames\.com\//i.test(value) ||
        /^https:\/\/www\.dlsite\.com\//i.test(value);

      if (!supported) return;

      let normalized = value;
      const steamWidget = normalized.match(
        /^https:\/\/store\.steampowered\.com\/widget\/(\d+)/i
      );
      if (steamWidget) {
        normalized = `https://store.steampowered.com/app/${steamWidget[1]}/`;
      }

      if (!storeLinks.includes(normalized)) storeLinks.push(normalized);
    } catch {
      // Ignore malformed links.
    }
  });

  const text = $("body").text().replace(/\s+/g, " ").trim();

  return {
    imageUrl,
    storeLinks,
    text: text.slice(0, 3800),
  };
}
