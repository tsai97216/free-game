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

test("Epic Games claimer is registered", () => {
  assert.equal(typeof getClaimer("Epic Games"), "function");
});

test("Epic Games helpers validate trusted URLs and offer states", async () => {
  const {
    isTrustedEpicUrl,
    isEpicLoginUrl,
    hasEpicFreeOfferText,
    isEpicOwnedText,
    isEpicOrderSuccessText,
  } = await import("../src/platforms/epic.js");

  assert.equal(isTrustedEpicUrl("https://store.epicgames.com/p/test-game"), true);
  assert.equal(isTrustedEpicUrl("https://evil.example/store.epicgames.com/p/test"), false);
  assert.equal(isTrustedEpicUrl("http://store.epicgames.com/p/test-game"), false);
  assert.equal(isEpicLoginUrl("https://www.epicgames.com/id/login"), true);
  assert.equal(hasEpicFreeOfferText("Base Game Free"), true);
  assert.equal(hasEpicFreeOfferText("US$ 29.99"), false);
  assert.equal(isEpicOwnedText("In Library"), true);
  assert.equal(isEpicOrderSuccessText("Order Confirmation"), true);
});

test("unimplemented platform remains a safe stub", async () => {
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
