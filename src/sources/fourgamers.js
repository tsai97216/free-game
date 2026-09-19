import { XMLParser } from "fast-xml-parser";
import { config } from "../config.js";
import {
  isProcessed,
  markAsProcessed,
  isGameProcessed,
  markGameNotified,
  getGameClaimStatus,
  markGameClaimResult,
  getPendingClaimGames,
} from "../core/processed.js";
import { parseArticle } from "../core/article.js";
import { getGeminiSummary } from "../ai/gemini.js";
import { sendGameToDiscord } from "../notification/discord.js";
import { normalizeGame } from "../core/validate.js";
import { claimGame } from "../platforms/claimers.js";
import { CLAIM_STATUS } from "../platforms/claim.js";

const includeKeyword = /限免|限時免費|紳士限免/;
const excludedKeyword = /限時免費遊玩/;

export function shouldProcessTitle(title) {
  return includeKeyword.test(title) && !excludedKeyword.test(title);
}

async function retryPendingClaims() {
  if (!(config.autoClaim || config.claimDryRun)) return;

  const pending = await getPendingClaimGames();

  for (const entry of pending) {
    try {
      const result = await claimGame(entry.game);
      await markGameClaimResult(entry.game, entry.articleUrl, result);

      console.log(
        `Claim retry: ${entry.game.name} [${entry.game.platform || "unknown"}] -> ${result.status}: ${result.message}`
      );
    } catch (error) {
      console.error(
        `Claim retry failed for ${entry.game.name || "unknown"}:`,
        error
      );
    }
  }
}

export async function checkUpdates() {
  const shouldAttemptClaim = config.autoClaim || config.claimDryRun;

  await retryPendingClaims();

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

        const notified = await isGameProcessed(game, entryUrl);
        if (!notified) {
          await sendGameToDiscord(game, entryUrl, article.imageUrl);
          await markGameNotified(game, entryUrl);
        }

        if (shouldAttemptClaim) {
          const previousClaim = await getGameClaimStatus(game, entryUrl);
          if (previousClaim?.status === CLAIM_STATUS.SUCCESS) continue;

          const result = await claimGame(game);
          await markGameClaimResult(game, entryUrl, result);

          console.log(
            `Claim result: ${game.name} [${game.platform || "unknown"}] -> ${result.status}: ${result.message}`
          );
        }
      }

      await markAsProcessed(entryUrl);
    } catch (error) {
      console.error(`Failed to process ${entryUrl}:`, error);
    }
  }
}
