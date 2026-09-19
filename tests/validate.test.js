import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { normalizeGame, isSupportedStoreUrl } from "../src/core/validate.js";
import {
  isSupportedPlatform,
  normalizePlatform,
  SUPPORTED_PLATFORMS,
} from "../src/platforms/index.js";
import { shouldProcessTitle } from "../src/sources/fourgamers.js";

test("only DLsite is supported", () => {
  assert.deepEqual(SUPPORTED_PLATFORMS, ["DLsite"]);
  assert.equal(isSupportedPlatform("DLsite"), true);
  assert.equal(isSupportedPlatform("Steam"), false);
  assert.equal(isSupportedPlatform("GOG"), false);
  assert.equal(isSupportedPlatform("Epic Games"), false);
  assert.equal(isSupportedPlatform("Ubisoft Connect"), false);
});

test("normalizeGame rejects failed, temporary, uncertain, or unsupported AI results", () => {
  assert.equal(normalizeGame({ name: "解析失敗", availability: "永久加入" }), null);
  assert.equal(normalizeGame({ name: "Temporary Game", platform: "DLsite", availability: "暫時遊玩" }), null);
  assert.equal(normalizeGame({ name: "Uncertain Game", platform: "DLsite", availability: "不確定" }), null);
  assert.equal(normalizeGame({ name: "Steam Game", platform: "Steam", availability: "永久加入" }), null);
});

test("normalizeGame requires explicit permanent availability", () => {
  assert.equal(normalizeGame({ name: "Missing Classification", platform: "DLsite" }), null);
  assert.equal(
    normalizeGame({ name: "Permanent DLsite Item", platform: "DLsite", availability: "永久加入" }).platform,
    "DLsite"
  );
});

test("normalizeGame canonicalizes DLsite aliases", () => {
  const game = normalizeGame({
    name: "Test DLsite Item",
    platform: "dlsite",
    availability: "永久加入",
    link: "https://www.dlsite.com/maniax/work/=/product_id/RJ000000.html",
  });

  assert.equal(game.name, "Test DLsite Item");
  assert.equal(game.platform, "DLsite");
});

test("store URL validation accepts only DLsite", () => {
  assert.equal(isSupportedStoreUrl("https://www.dlsite.com/maniax/work/=/product_id/RJ000000.html"), true);
  assert.equal(isSupportedStoreUrl("https://store.steampowered.com/app/123/"), false);
  assert.equal(isSupportedStoreUrl("https://store.epicgames.com/en-US/p/test"), false);
  assert.equal(isSupportedStoreUrl("https://www.gog.com/game/test-game"), false);
  assert.equal(isSupportedStoreUrl("https://store.ubisoft.com/test-game"), false);
  assert.equal(isSupportedStoreUrl("https://example.com/"), false);
});

test("4Gamers title filter excludes temporary free-play articles", () => {
  assert.equal(shouldProcessTitle("本週限時免費遊戲"), true);
  assert.equal(shouldProcessTitle("限時免費遊玩：某款遊戲"), false);
  assert.equal(shouldProcessTitle("一般遊戲新聞"), false);
});

test("processed state keeps article and game records separately", async () => {
  const path = new URL("../data/processed.json", import.meta.url);
  const raw = await fs.readFile(path, "utf8");
  const data = JSON.parse(raw);

  assert.ok(Array.isArray(data.articles));
  assert.ok(Array.isArray(data.games));
});
