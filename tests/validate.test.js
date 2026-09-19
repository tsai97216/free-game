import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGame, isSupportedStoreUrl } from "../src/core/validate.js";

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

test("store URL validation accepts supported stores", () => {
  assert.equal(isSupportedStoreUrl("https://store.epicgames.com/en-US/p/test"), true);
  assert.equal(isSupportedStoreUrl("https://store.steampowered.com/app/123/"), true);
  assert.equal(isSupportedStoreUrl("https://www.dlsite.com/"), true);
  assert.equal(isSupportedStoreUrl("https://example.com/"), false);
});
