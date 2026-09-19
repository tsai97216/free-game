import * as cheerio from "cheerio";
import { isSupportedStoreUrl } from "../platforms/index.js";

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

      if (!isSupportedStoreUrl(value)) return;
      if (!storeLinks.includes(value)) storeLinks.push(value);
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
