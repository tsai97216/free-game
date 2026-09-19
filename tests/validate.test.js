import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGame, isSupportedStoreUrl } from "../src/core/validate.js";
import { shouldProcessTitle } from "../src/sources/fourgamers.js";

test("normalizeGame rejects failed AI results", () => {
  assert.equal(normalizeGame({ name: "解析失敗" }), null);
});

test("normalizeGame keeps a valid game", () => {
  const game = normalizeGame({
    name: "Test Game",
    platform: "Epic Games",
    link: "https://store.epicgames.com/en-US/p/test-game",
  });

  assert.equal(game.name, "Test Game");
  assert.equal(game.platform, "Epic Games");
  assert.equal(game.link, "https://store.epicgames.com/en-US/p/test-game");
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
