import { createNotImplementedClaim } from "./claim.js";
import { SUPPORTED_PLATFORMS } from "./index.js";

const claimers = Object.fromEntries(
  SUPPORTED_PLATFORMS.map((platform) => [
    platform,
    async (game) => createNotImplementedClaim(platform, game),
  ])
);

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
