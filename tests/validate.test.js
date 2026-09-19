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

test("all intended platforms are retained", () => {
  assert.deepEqual(SUPPORTED_PLATFORMS, [
    "Steam",
    "GOG",
    "DLsite",
    "Epic Games",
    "Ubisoft Connect",
  ]);
});

test("normalizeGame rejects failed, temporary, uncertain, or unsupported AI results", () => {
  assert.equal(normalizeGame({ name: "解析失敗", availability: "永久加入" }), null);
  assert.equal(normalizeGame({ name: "Temporary Game", platform: "Steam", availability: "暫時遊玩" }), null);
  assert.equal(normalizeGame({ name: "Uncertain Game", platform: "Steam", availability: "不確定" }), null);
  assert.equal(normalizeGame({ name: "Switch Game", platform: "Nintendo Switch", availability: "永久加入" }), null);
});

test("normalizeGame requires explicit permanent availability", () => {
  assert.equal(normalizeGame({ name: "Missing Classification", platform: "Steam" }), null);
  assert.equal(
    normalizeGame({ name: "Permanent Game", platform: "Steam", availability: "永久加入" }).availability,
    "永久加入"
  );
});

test("normalizeGame canonicalizes supported platform aliases", () => {
  const game = normalizeGame({
    name: "Test Game",
    platform: "epic",
    availability: "永久加入",
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

test("processed state keeps article and game records separately", async () => {
  const path = new URL("../data/processed.json", import.meta.url);
  const raw = await fs.readFile(path, "utf8");
  const data = JSON.parse(raw);

  assert.ok(Array.isArray(data.articles));
  assert.ok(Array.isArray(data.games));
});


test("Steam claim helpers validate trusted URLs and offer states", async () => {
  const {
    isTrustedSteamUrl,
    isAlreadyOwnedText,
    isTemporaryOfferText,
    hasFreeOfferText,
    isClaimConfirmedText,
  } = await import("../src/platforms/steam.js");

  assert.equal(
    isTrustedSteamUrl("https://store.steampowered.com/app/123/test"),
    true
  );
  assert.equal(
    isTrustedSteamUrl("https://evil.example/https://store.steampowered.com/app/123"),
    false
  );
  assert.equal(
    isTrustedSteamUrl("http://store.steampowered.com/app/123/test"),
    false
  );
  assert.equal(isAlreadyOwnedText("You already own this game"), true);
  assert.equal(isTemporaryOfferText("Free Weekend"), true);
  assert.equal(isTemporaryOfferText("Free to Keep"), false);
  assert.equal(hasFreeOfferText("Free to Keep"), true);
  assert.equal(hasFreeOfferText("NT$ 299"), false);
  assert.equal(isClaimConfirmedText("The game has been added to your account"), true);
  assert.equal(isClaimConfirmedText("Please complete purchase"), false);
});


test("processed game state separates notification from claim result", async () => {
  const {
    markGameNotified,
    isGameProcessed,
    getGameClaimStatus,
    markGameClaimResult,
  } = await import("../src/core/processed.js");

  const game = {
    name: "State Test Game",
    platform: "Steam",
    link: "https://store.steampowered.com/app/999999/state-test/",
  };
  const articleUrl = "https://www.4gamers.com.tw/news/detail/state-test";

  assert.equal(await isGameProcessed(game, articleUrl), false);

  await markGameNotified(game, articleUrl);
  assert.equal(await isGameProcessed(game, articleUrl), true);
  assert.equal(await getGameClaimStatus(game, articleUrl), null);

  await markGameClaimResult(game, articleUrl, {
    status: "failed",
    message: "test failure",
  });

  assert.deepEqual(await getGameClaimStatus(game, articleUrl), {
    status: "failed",
    message: "test failure",
    updatedAt: await (async () => {
      const state = JSON.parse(
        await fs.readFile(new URL("../data/processed.json", import.meta.url), "utf8")
      );
      return state.games.find((entry) => entry.key.includes("state-test"))?.claim?.updatedAt;
    })(),
  });
});
