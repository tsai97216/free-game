import test from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORTED_PLATFORMS,
  isSupportedPlatform,
  normalizePlatform,
} from "../src/platforms/index.js";
import { claimGame, getClaimer } from "../src/platforms/claimers.js";
import {
  CLAIM_STATUS,
  createClaimResult,
  isClaimStatus,
  shouldRetryClaim,
} from "../src/platforms/claim.js";

test("only DLsite is supported by this worker", () => {
  assert.deepEqual(SUPPORTED_PLATFORMS, ["DLsite"]);
  assert.equal(isSupportedPlatform("DLsite"), true);
  assert.equal(isSupportedPlatform("Steam"), false);
  assert.equal(isSupportedPlatform("Epic Games"), false);
  assert.equal(isSupportedPlatform("GOG"), false);
  assert.equal(isSupportedPlatform("Ubisoft Connect"), false);
  assert.equal(normalizePlatform("dlsite"), "DLsite");
  assert.equal(normalizePlatform("Steam"), "Steam");
  assert.equal(typeof getClaimer("DLsite"), "function");
  assert.equal(getClaimer("Steam"), null);
});

test("unsupported platforms cannot enter the claim flow", async () => {
  await assert.rejects(
    () => claimGame({
      name: "Test Game",
      platform: "Steam",
    }),
    /Unsupported platform/
  );
});

test("DLsite remains an explicit not-implemented claim until a safe claimer exists", async () => {
  const result = await claimGame({
    name: "Test Item",
    platform: "DLsite",
    link: "https://www.dlsite.com/maniax/work/=/product_id/RJ000000.html",
    availability: "永久加入",
  });

  assert.equal(result.status, CLAIM_STATUS.NOT_IMPLEMENTED);
  assert.equal(result.platform, "DLsite");
  assert.equal(result.game.name, "Test Item");
  assert.match(result.message, /尚未實作/);
});

test("claim statuses have explicit retry semantics", () => {
  assert.equal(isClaimStatus(CLAIM_STATUS.NOT_IMPLEMENTED), true);
  assert.equal(isClaimStatus(CLAIM_STATUS.READY), true);
  assert.equal(isClaimStatus(CLAIM_STATUS.SUCCESS), true);
  assert.equal(isClaimStatus(CLAIM_STATUS.FAILED), true);
  assert.equal(isClaimStatus("unknown"), false);

  assert.equal(shouldRetryClaim(CLAIM_STATUS.NOT_IMPLEMENTED), false);
  assert.equal(shouldRetryClaim(CLAIM_STATUS.READY), true);
  assert.equal(shouldRetryClaim(CLAIM_STATUS.SUCCESS), false);
  assert.equal(shouldRetryClaim(CLAIM_STATUS.FAILED), true);
});

test("claim results reject unknown statuses", () => {
  assert.throws(
    () => createClaimResult({
      status: "unknown",
      platform: "DLsite",
      game: {},
    }),
    /Unknown claim status/
  );
});
