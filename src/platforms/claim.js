export const CLAIM_STATUS = {
  NOT_IMPLEMENTED: "not_implemented",
  READY: "ready",
  SUCCESS: "success",
  FAILED: "failed",
};

export function createClaimResult({
  status,
  platform,
  game,
  message = "",
}) {
  return {
    status,
    platform,
    game,
    message,
  };
}

export function createNotImplementedClaim(platform, game) {
  return createClaimResult({
    status: CLAIM_STATUS.NOT_IMPLEMENTED,
    platform,
    game,
    message: `${platform} 尚未實作自動領取`,
  });
}
