import {
  isSupportedPlatform,
  isSupportedStoreUrl,
  normalizePlatform,
} from "../platforms/index.js";

const httpUrl = /^https?:\/\//i;

export function normalizeGame(game) {
  if (!game || typeof game !== "object") return null;

  const normalized = {
    name: String(game.name || "").trim(),
    platform: normalizePlatform(game.platform),
    deadline: String(game.deadline || "未提供").trim(),
    genre: String(game.genre || "未提供").trim(),
    gameplay: String(game.gameplay || "未提供").trim(),
    rating: String(game.rating || "未提供").trim(),
    brief: String(game.brief || "").trim(),
    link: typeof game.link === "string" && httpUrl.test(game.link) ? game.link : "",
  };

  if (!normalized.name || normalized.name === "解析失敗") return null;
  if (normalized.platform && !isSupportedPlatform(normalized.platform)) return null;

  return normalized;
}

export { isSupportedStoreUrl };
