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
