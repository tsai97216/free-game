import test from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORTED_PLATFORMS,
  isSupportedPlatform,
  normalizePlatform,
} from "../src/platforms/index.js";
import { claimGame, getClaimer } from "../src/platforms/claimers.js";

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
