import { config } from "../config.js";

export async function getSteamPriceByName(gameName) {
  if (!gameName || gameName === "未知遊戲") return "";

  try {
    const url =
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=${encodeURIComponent(config.steamLanguage)}&cc=${config.steamCountry}`;

    const response = await fetch(url);
    if (!response.ok) return "";

    const data = await response.json();
    const price = data?.items?.[0]?.price;

    if (!price || typeof price.initial !== "number") return "";
    return `NT$ ${price.initial / 100}`;
  } catch (error) {
    console.error("Steam API error:", error);
    return "";
  }
}
