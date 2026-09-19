import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";

const dataDir = path.resolve("data");
const filePath = path.join(dataDir, "processed.json");

async function readState() {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      return { articles: data, games: [] };
    }

    const games = Array.isArray(data?.games) ? data.games : [];

    return {
      articles: Array.isArray(data?.articles) ? data.articles : [],
      games: games.map((game) =>
        typeof game === "string"
          ? { key: game, notified: true, claim: null }
          : {
              key: String(game?.key || ""),
              notified: game?.notified === true,
              claim: game?.claim || null,
            }
      ).filter((game) => game.key),
    };
  } catch (error) {
    if (error.code === "ENOENT") return { articles: [], games: [] };
    throw error;
  }
}

async function writeState(state) {
  await fs.mkdir(dataDir, { recursive: true });

  const articles = state.articles.slice(-config.processedLimit);
  const games = state.games.slice(-config.processedLimit * 5);

  await fs.writeFile(
    filePath,
    JSON.stringify({ articles, games }, null, 2) + "\n"
  );
}

export async function isProcessed(link) {
  const state = await readState();
  return state.articles.includes(link);
}

export async function markAsProcessed(link) {
  const state = await readState();

  if (!state.articles.includes(link)) {
    state.articles.push(link);
  }

  await writeState(state);
}

function gameKey(game, articleUrl = "") {
  const link = String(game?.link || "").trim().toLowerCase();
  const platform = String(game?.platform || "").trim().toLowerCase();
  const name = String(game?.name || "").trim().toLowerCase();
  const article = String(articleUrl || "").trim().toLowerCase();

  return `${article}::${link || `${platform}::${name}`}`;
}

function findGame(state, game, articleUrl = "") {
  const key = gameKey(game, articleUrl);
  if (!key) return { key: "", game: null };

  return {
    key,
    game: state.games.find((entry) => entry.key === key) || null,
  };
}

export async function isGameProcessed(game, articleUrl = "") {
  const state = await readState();
  return Boolean(findGame(state, game, articleUrl).game?.notified);
}

export async function markGameAsProcessed(game, articleUrl = "") {
  return markGameNotified(game, articleUrl);
}

export async function markGameNotified(game, articleUrl = "") {
  const state = await readState();
  const { key, game: existing } = findGame(state, game, articleUrl);
  if (!key) return;

  if (existing) {
    existing.notified = true;
  } else {
    state.games.push({ key, notified: true, claim: null });
  }

  await writeState(state);
}

export async function getGameClaimStatus(game, articleUrl = "") {
  const state = await readState();
  return findGame(state, game, articleUrl).game?.claim || null;
}

export async function markGameClaimResult(game, articleUrl = "", result) {
  const state = await readState();
  const { key, game: existing } = findGame(state, game, articleUrl);
  if (!key) return;

  const entry = existing || { key, notified: false, claim: null };
  entry.claim = {
    status: String(result?.status || "unknown"),
    message: String(result?.message || ""),
    updatedAt: new Date().toISOString(),
  };

  if (!existing) state.games.push(entry);
  await writeState(state);
}

export async function exportProcessedLinks() {
  const state = await readState();
  return state.articles;
}
