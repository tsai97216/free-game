import { chromium } from "playwright";
import { config } from "../config.js";
import { CLAIM_STATUS, createClaimResult } from "./claim.js";

const storageState = process.env.STEAM_STORAGE_STATE || "auth/steam.json";
const STEAM_HOST = "store.steampowered.com";

export function isTrustedSteamUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === STEAM_HOST;
  } catch {
    return false;
  }
}

export function isAlreadyOwnedText(text) {
  return /already own|已在.*收藏庫|已在.*庫|in your library/i.test(String(text || ""));
}

export function isTemporaryOfferText(text) {
  return /demo|試玩|trial|免費試用|free weekend|free play/i.test(String(text || ""));
}

export function hasFreeOfferText(text) {
  return /\bfree\b|免費/i.test(String(text || ""));
}

export function isClaimConfirmedText(text) {
  return /added to your account|已加入.*帳號|已加入.*庫|in your library|已在.*收藏庫|in library/i.test(
    String(text || "")
  );
}

function failed(game, message) {
  return createClaimResult({
    status: CLAIM_STATUS.FAILED,
    platform: "Steam",
    game,
    message,
  });
}

export async function claimSteam(game) {
  if (!game?.link) {
    return failed(game, "缺少 Steam 商品網址");
  }

  if (!isTrustedSteamUrl(game.link)) {
    return failed(game, "商品網址不是受信任的 Steam 商店網址");
  }

  const gameUrl = new URL(game.link);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      storageState,
    });
    const page = await context.newPage();

    await page.goto(gameUrl.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const currentUrl = page.url();
    const title = await page.title();

    if (/login|signin/i.test(currentUrl)) {
      return failed(game, "Steam 尚未登入，請先建立 storage state");
    }

    const purchasePanel = page.locator("#game_area_purchase, .game_area_purchase_game").first();
    const purchaseText = (await purchasePanel.count())
      ? await purchasePanel.innerText().catch(() => "")
      : "";
    const alreadyOwnedText = await page
      .locator(".game_area_already_owned")
      .innerText()
      .catch(() => "");

    if (isAlreadyOwnedText(alreadyOwnedText)) {
      return createClaimResult({
        status: CLAIM_STATUS.SUCCESS,
        platform: "Steam",
        game,
        message: "Steam 已確認遊戲在帳號收藏庫中",
      });
    }

    if (isTemporaryOfferText(purchaseText)) {
      return failed(game, "Steam 頁面顯示為試玩／Demo／Trial，未進行領取");
    }

    const freeTextDetected = hasFreeOfferText(purchaseText);
    const purchaseDisabled = await page
      .locator(
        ".game_area_purchase_game input:disabled, .game_area_purchase_game button:disabled"
      )
      .count()
      .catch(() => 0);

    if (!freeTextDetected || purchaseDisabled > 0) {
      return failed(game, "未確認 Steam 商品目前可免費取得");
    }

    const addToAccountButton = page
      .locator(
        [
          "#game_area_purchase .btn_green_steamui",
          ".game_area_purchase_game .btn_green_steamui",
          ".game_area_purchase_game a.btn_green_steamui",
          ".game_area_purchase_game button.btn_green_steamui",
        ].join(", ")
      )
      .filter({ hasText: /add to account|加入帳號|加入帳戶/i })
      .first();

    if (config.claimDryRun) {
      return createClaimResult({
        status: CLAIM_STATUS.READY,
        platform: "Steam",
        game,
        message: "Dry run：已開啟 Steam 商品頁並確認可免費取得，未執行領取操作",
      });
    }

    if (!(await addToAccountButton.count())) {
      return createClaimResult({
        status: CLAIM_STATUS.READY,
        platform: "Steam",
        game,
        message: `已確認可免費取得，但尚未找到明確的「加入帳號」按鈕：${title || currentUrl}`,
      });
    }

    await addToAccountButton.click();
    await page.waitForTimeout(1500);

    const confirmationText = await page.locator("body").innerText().catch(() => "");
    const successDetected =
      isClaimConfirmedText(confirmationText) ||
      isAlreadyOwnedText(
        await page.locator(".game_area_already_owned").innerText().catch(() => "")
      );

    if (!successDetected) {
      return failed(game, "已嘗試領取，但尚未確認遊戲已加入帳號");
    }

    return createClaimResult({
      status: CLAIM_STATUS.SUCCESS,
      platform: "Steam",
      game,
      message: "已確認遊戲加入 Steam 帳號",
    });
  } catch (error) {
    return failed(game, `Steam 頁面操作失敗：${error.message}`);
  } finally {
    await browser.close();
  }
}

export async function getSteamPriceByName(gameName) {
  if (!gameName || gameName === "未知遊戲") return "";

  try {
    const url =
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=${encodeURIComponent(config.steamLanguage)}&cc=${config.steamCountry}`;

    const response = await fetch(url);
    if (!response.ok) return "";

    const data = await response.json();
    const price = data?.items?.[0]?.price;

    if (!price || typeof price.initial !== "number") return "";
    return `NT$ ${price.initial / 100}`;
  } catch (error) {
    console.error("Steam API error:", error);
    return "";
  }
}
