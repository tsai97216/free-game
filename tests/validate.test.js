import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeGame,
  isSupportedStoreUrl,
} from "../src/core/validate.js";
import {
  isSupportedPlatform,
  normalizePlatform,
  SUPPORTED_PLATFORMS,
} from "../src/platforms/index.js";
import { shouldProcessTitle } from "../src/sources/fourgamers.js";

test("all intended platforms are retained", () => {
  assert.deepEqual(SUPPORTED_PLATFORMS, [
    "Steam",
    "GOG",
    "DLsite",
    "Epic Games",
    "Ubisoft Connect",
  ]);
});

test("normalizeGame rejects failed or unsupported AI results", () => {
  assert.equal(normalizeGame({ name: "解析失敗" }), null);
  assert.equal(normalizeGame({ name: "Switch Game", platform: "Nintendo Switch" }), null);
});

test("normalizeGame rejects unsupported platforms", () => {
  assert.equal(normalizeGame({ name: "Switch Game", platform: "Nintendo Switch" }), null);
});

test("normalizeGame canonicalizes supported platform aliases", () => {
  const game = normalizeGame({
    name: "Test Game",
    platform: "epic",
    link: "https://store.epicgames.com/en-US/p/test-game",
  });

  assert.equal(game.name, "Test Game");
  assert.equal(game.platform, "Epic Games");
});

test("platform helpers recognize supported platforms", () => {
  assert.equal(isSupportedPlatform("Steam"), true);
  assert.equal(isSupportedPlatform("GOG"), true);
  assert.equal(isSupportedPlatform("DLsite"), true);
  assert.equal(isSupportedPlatform("Epic Games"), true);
  assert.equal(isSupportedPlatform("Ubisoft Connect"), true);
  assert.equal(isSupportedPlatform("Nintendo Switch"), false);
  assert.equal(normalizePlatform("ubisoft"), "Ubisoft Connect");
});

test("store URL validation accepts all supported stores", () => {
  assert.equal(isSupportedStoreUrl("https://store.epicgames.com/en-US/p/test"), true);
  assert.equal(isSupportedStoreUrl("https://store.steampowered.com/app/123/"), true);
  assert.equal(isSupportedStoreUrl("https://www.dlsite.com/"), true);
  assert.equal(isSupportedStoreUrl("https://www.gog.com/game/test-game"), true);
  assert.equal(isSupportedStoreUrl("https://www.gog.com/en/game/test-game"), true);
  assert.equal(isSupportedStoreUrl("https://store.ubisoft.com/test-game"), true);
  assert.equal(isSupportedStoreUrl("https://example.com/"), false);
  assert.equal(isSupportedStoreUrl("https://www.nintendo.com/us/store/products/test/"), false);
});

test("4Gamers title filter excludes temporary free-play articles", () => {
  assert.equal(shouldProcessTitle("本週限時免費遊戲"), true);
  assert.equal(shouldProcessTitle("限時免費遊玩：某款 Switch 遊戲"), false);
  assert.equal(shouldProcessTitle("一般遊戲新聞"), false);
});
