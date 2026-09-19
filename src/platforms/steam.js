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
    if (!freeTextDetected) {
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

    return createClaimResult({
      status: CLAIM_STATUS.READY,
      platform: "Steam",
      game,
      message: `已開啟 Steam 商品頁：${title || currentUrl}`,
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
