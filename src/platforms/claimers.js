import { claimDlsite } from "./dlsite.js";

const claimers = {
  DLsite: claimDlsite,
};

export function getClaimer(platform) {
  return claimers[platform] || null;
}

export async function claimGame(game) {
  const platform = game?.platform;
  const claimer = getClaimer(platform);

  if (!claimer) {
    throw new Error(`Unsupported platform: ${platform || "unknown"}`);
  }

  return claimer(game);
}
