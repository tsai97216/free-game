const httpUrl = /^https?:\/\//i;

export function normalizeGame(game) {
  if (!game || typeof game !== "object") return null;

  const normalized = {
    name: String(game.name || "").trim(),
    platform: String(game.platform || "").trim(),
    deadline: String(game.deadline || "未提供").trim(),
    genre: String(game.genre || "未提供").trim(),
    gameplay: String(game.gameplay || "未提供").trim(),
    rating: String(game.rating || "未提供").trim(),
    brief: String(game.brief || "").trim(),
    link: typeof game.link === "string" && httpUrl.test(game.link) ? game.link : "",
  };

  if (!normalized.name || normalized.name === "解析失敗") return null;
  return normalized;
}

export function isSupportedStoreUrl(url) {
  if (!url || !httpUrl.test(url)) return false;
  return (
    /^https:\/\/store\.steampowered\.com\//i.test(url) ||
    /^https:\/\/store\.epicgames\.com\//i.test(url) ||
    /^https:\/\/www\.dlsite\.com\//i.test(url) ||
    /^https:\/\/www\.gog\.com\/(?:en\/)?game\//i.test(url) ||
    /^https:\/\/store\.ubisoft\.com\//i.test(url)
  );
}
