import { createNotImplementedClaim } from "./claim.js";
import { SUPPORTED_PLATFORMS } from "./index.js";
import { claimSteam } from "./steam.js";

const claimers = {
  Steam: claimSteam,
};

for (const platform of SUPPORTED_PLATFORMS) {
  if (!claimers[platform]) {
    claimers[platform] = async (game) =>
      createNotImplementedClaim(platform, game);
  }
}

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
