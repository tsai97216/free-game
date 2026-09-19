import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";

const dataDir = path.resolve("data");
const filePath = path.join(dataDir, "processed.json");

async function readState() {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);

    // Backward compatibility with the original article-URL array format.
    if (Array.isArray(data)) {
      return { articles: data, games: [] };
    }

    return {
      articles: Array.isArray(data?.articles) ? data.articles : [],
      games: Array.isArray(data?.games) ? data.games : [],
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

function gameKey(game) {
  const link = String(game?.link || "").trim().toLowerCase();
  const platform = String(game?.platform || "").trim().toLowerCase();
  const name = String(game?.name || "").trim().toLowerCase();

  return link || `${platform}::${name}`;
}

export async function isGameProcessed(game) {
  const key = gameKey(game);
  if (!key) return false;

  const state = await readState();
  return state.games.includes(key);
}

export async function markGameAsProcessed(game) {
  const key = gameKey(game);
  if (!key) return;

  const state = await readState();

  if (!state.games.includes(key)) {
    state.games.push(key);
  }

  await writeState(state);
}

export async function exportProcessedLinks() {
  const state = await readState();
  return state.articles;
}
