export const CLAIM_STATUS = {
  NOT_IMPLEMENTED: "not_implemented",
  READY: "ready",
  SUCCESS: "success",
  FAILED: "failed",
};

const KNOWN_STATUSES = new Set(Object.values(CLAIM_STATUS));

export function isClaimStatus(status) {
  return KNOWN_STATUSES.has(status);
}

export function shouldRetryClaim(status) {
  return status === CLAIM_STATUS.READY || status === CLAIM_STATUS.FAILED;
}

export function createClaimResult({
  status,
  platform,
  game,
  message = "",
}) {
  if (!isClaimStatus(status)) {
    throw new Error(`Unknown claim status: ${status || "empty"}`);
  }

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
