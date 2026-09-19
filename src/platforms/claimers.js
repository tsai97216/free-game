import { createNotImplementedClaim } from "./claim.js";

const claimers = {
  DLsite: async (game) => createNotImplementedClaim("DLsite", game),
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
