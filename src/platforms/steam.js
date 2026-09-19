import { chromium } from "playwright";
import { config } from "../config.js";
import { CLAIM_STATUS, createClaimResult } from "./claim.js";

const storageState = process.env.STEAM_STORAGE_STATE || "auth/steam.json";

export async function claimSteam(game) {
  if (!game?.link) {
    return createClaimResult({
      status: CLAIM_STATUS.FAILED,
      platform: "Steam",
      game,
      message: "缺少 Steam 商品網址",
    });
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      storageState,
    });
    const page = await context.newPage();

    await page.goto(game.link, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const currentUrl = page.url();
    const title = await page.title();

    if (/login|signin/i.test(currentUrl)) {
      return createClaimResult({
        status: CLAIM_STATUS.FAILED,
        platform: "Steam",
        game,
        message: "Steam 尚未登入，請先建立 storage state",
      });
    }

    const purchasePanel = page.locator("#game_area_purchase, .game_area_purchase_game").first();
    const purchaseText = (await purchasePanel.count())
      ? await purchasePanel.innerText().catch(() => "")
      : "";
    const pageText = await page.locator("body").innerText().catch(() => "");
    const combinedText = purchaseText + "\n" + pageText;

    if (/demo|試玩|trial|免費試用/i.test(combinedText)) {
      return createClaimResult({
        status: CLAIM_STATUS.FAILED,
        platform: "Steam",
        game,
        message: "Steam 頁面顯示為試玩／Demo／Trial，未進行領取",
      });
    }

    const freeTextDetected = /free|免費/i.test(purchaseText);
    const purchaseDisabled = await page
      .locator(".game_area_purchase_game input:disabled, .game_area_purchase_game button:disabled")
      .count()
      .catch(() => 0);

    if (!freeTextDetected || purchaseDisabled > 0) {
      return createClaimResult({
        status: CLAIM_STATUS.FAILED,
        platform: "Steam",
        game,
        message: "未確認 Steam 商品目前可免費取得",
      });
    }

    if (/login|signin/i.test(currentUrl)) {
      return createClaimResult({
        status: CLAIM_STATUS.FAILED,
        platform: "Steam",
        game,
        message: "Steam 尚未登入，請先建立 storage state",
      });
    }

    const addToAccountButton = page
      .locator(
        [
          "#game_area_purchase .btn_green_steamui",
          ".game_area_purchase_game .btn_green_steamui",
          ".game_area_purchase_game a.btn_green_steamui",
        ].join(", ")
      )
      .filter({ hasText: /free|免費|play game|開始遊戲|加入/i })
      .first();

    if (!(await addToAccountButton.count())) {
      return createClaimResult({
        status: CLAIM_STATUS.READY,
        platform: "Steam",
        game,
        message: `已確認可免費取得，但尚未找到安全的領取按鈕：${title || currentUrl}`,
      });
    }

    await addToAccountButton.click();

    await page.waitForTimeout(1500);

    const confirmationText = await page.locator("body").innerText().catch(() => "");
    const successDetected =
      /added to your account|已加入.*帳號|已加入.*庫|in your library|已在你的收藏庫/i.test(
        confirmationText
      ) ||
      /已在收藏庫|in library/i.test(
        (await page.locator(".game_area_already_owned").innerText().catch(() => ""))
      );

    if (!successDetected) {
      return createClaimResult({
        status: CLAIM_STATUS.FAILED,
        platform: "Steam",
        game,
        message: "已嘗試領取，但尚未確認遊戲已加入帳號",
      });
    }

    return createClaimResult({
      status: CLAIM_STATUS.SUCCESS,
      platform: "Steam",
      game,
      message: "已確認遊戲加入 Steam 帳號",
    });
  } catch (error) {
    return createClaimResult({
      status: CLAIM_STATUS.FAILED,
      platform: "Steam",
      game,
      message: `Steam 頁面操作失敗：${error.message}`,
    });
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
