import test from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORTED_PLATFORMS,
  isSupportedPlatform,
} from "../src/platforms/index.js";
import {
  CLAIM_STATUS,
  createNotImplementedClaim,
} from "../src/platforms/claim.js";
import {
  claimGame,
  getClaimer,
} from "../src/platforms/claimers.js";

test("claim architecture retains every supported platform", () => {
  assert.deepEqual(SUPPORTED_PLATFORMS, [
    "Steam",
    "GOG",
    "DLsite",
    "Epic Games",
    "Ubisoft Connect",
  ]);

  for (const platform of SUPPORTED_PLATFORMS) {
    assert.equal(isSupportedPlatform(platform), true);
    assert.equal(typeof getClaimer(platform), "function");
  }
});

test("Steam claimer is registered", () => {
  assert.equal(typeof getClaimer("Steam"), "function");
});

test("claimers are safe stubs until platform automation is implemented", async () => {
  const result = await claimGame({
    name: "Test Game",
    platform: "Ubisoft Connect",
  });

  assert.equal(result.status, CLAIM_STATUS.NOT_IMPLEMENTED);
  assert.equal(result.platform, "Ubisoft Connect");
});

test("unsupported platforms cannot enter the claim flow", async () => {
  await assert.rejects(
    () => claimGame({
      name: "Switch Game",
      platform: "Nintendo Switch",
    }),
    /Unsupported platform/
  );
});

test("claim result keeps success and failure statuses available", () => {
  assert.equal(CLAIM_STATUS.SUCCESS, "success");
  assert.equal(CLAIM_STATUS.FAILED, "failed");
  assert.equal(
    createNotImplementedClaim("GOG", { name: "Test Game" }).status,
    CLAIM_STATUS.NOT_IMPLEMENTED
  );
});
