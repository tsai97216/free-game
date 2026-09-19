import { XMLParser } from "fast-xml-parser";
import { config } from "../config.js";
import { isProcessed, markAsProcessed } from "../core/processed.js";
import { parseArticle } from "../core/article.js";
import { getGeminiSummary } from "../ai/gemini.js";
import { sendGameToDiscord } from "../notification/discord.js";
import { normalizeGame } from "../core/validate.js";

const includeKeyword = /限免|限時免費|紳士限免/;
const excludedKeyword = /限時免費遊玩/;

export function shouldProcessTitle(title) {
  return includeKeyword.test(title) && !excludedKeyword.test(title);
}

export async function checkUpdates() {
  const response = await fetch(config.rssUrl);
  if (!response.ok) {
    throw new Error(`RSS request failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => name === "item",
  });

  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item || [];

  for (const item of [...items].reverse()) {
    const entryUrl = String(item.link || "").trim();
    const title = String(item.title || "").trim();

    if (!entryUrl || !shouldProcessTitle(title) || await isProcessed(entryUrl)) continue;

    try {
      const article = await parseArticle(entryUrl);
      const games = await getGeminiSummary(article.text, article.storeLinks);

      for (const rawGame of games) {
        const game = normalizeGame(rawGame);
        if (!game) continue;
        await sendGameToDiscord(game, entryUrl, article.imageUrl);
      }

      await markAsProcessed(entryUrl);
    } catch (error) {
      console.error(`Failed to process ${entryUrl}:`, error);
    }
  }
}
