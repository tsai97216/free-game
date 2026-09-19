import { chromium } from "playwright";
import { config } from "../config.js";
import { CLAIM_STATUS, createClaimResult } from "./claim.js";

const storageState = process.env.EPIC_STORAGE_STATE || "auth/epic.json";
const EPIC_HOSTS = new Set(["store.epicgames.com", "www.epicgames.com"]);

export function isTrustedEpicUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && EPIC_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function isEpicLoginUrl(value) {
  try {
    const url = new URL(value);
    return //id/login|/login/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function hasEpicFreeOfferText(text) {
  const value = String(text || "");
  return /\bfree\b|免費|0\.00|0,00/i.test(value);
}

export function isEpicOwnedText(text) {
  const value = String(text || "");
  return /in library|in your library|已在.*收藏庫|已在.*庫|owned|已擁有/i.test(value);
}

export function isEpicOrderSuccessText(text) {
  const value = String(text || "");
  return /order confirmation|order confirmed|thank you for your purchase|已下單|訂單.*完成|購買成功|已加入.*收藏庫/i.test(value);
}

function failed(game, message) {
  return createClaimResult({
    status: CLAIM_STATUS.FAILED,
    platform: "Epic Games",
    game,
    message,
  });
}

async function bodyText(page) {
  return page.locator("body").innerText().catch(() => "");
}

async function clickTextButton(page, patterns) {
  const candidates = page.locator("button, a, [role='button']");
  const count = await candidates.count().catch(() => 0);

  for (let i = 0; i < count; i += 1) {
    const candidate = candidates.nth(i);
    const text = await candidate.innerText().catch(() => "");
    if (patterns.some((pattern) => pattern.test(text))) {
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        return true;
      }
    }
  }

  return false;
}

export async function claimEpic(game) {
  if (!game?.link) {
    return failed(game, "缺少 Epic Games 商品網址");
  }

  if (!isTrustedEpicUrl(game.link)) {
    return failed(game, "商品網址不是受信任的 Epic Games 商店網址");
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      storageState,
      locale: "zh-TW",
    });
    const page = await context.newPage();

    await page.goto(game.link, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (isEpicLoginUrl(page.url())) {
      return failed(game, "Epic Games 尚未登入，請先建立 storage state");
    }

    const initialText = await bodyText(page);

    if (isEpicOwnedText(initialText)) {
      return createClaimResult({
        status: CLAIM_STATUS.SUCCESS,
        platform: "Epic Games",
        game,
        message: "Epic Games 已確認遊戲在帳號收藏庫中",
      });
    }

    if (!hasEpicFreeOfferText(initialText)) {
      return failed(game, "未確認 Epic Games 商品目前可免費取得");
    }

    const getButton = page
      .locator("button, a, [role='button']")
      .filter({ hasText: /^\s*(get|取得|獲取|免費取得)\s*$/i })
      .first();

    if (!(await getButton.count())) {
      return failed(game, "已確認 Epic Games 商品可能免費，但未找到明確的 Get／取得按鈕");
    }

    if (config.claimDryRun) {
      return createClaimResult({
        status: CLAIM_STATUS.READY,
        platform: "Epic Games",
        game,
        message: "Dry run：已開啟 Epic Games 商品頁並確認免費，未執行領取操作",
      });
    }

    await getButton.click();
    await page.waitForTimeout(1500);

    const afterGetText = await bodyText(page);

    if (isEpicLoginUrl(page.url())) {
      return failed(game, "Epic Games 要求重新登入或驗證");
    }

    if (isEpicOwnedText(afterGetText)) {
      return createClaimResult({
        status: CLAIM_STATUS.SUCCESS,
        platform: "Epic Games",
        game,
        message: "Epic Games 已確認遊戲加入帳號",
      });
    }

    const checkoutClicked = await clickTextButton(page, [
      /^place order$/i,
      /^下單$/i,
      /^訂單$/i,
      /^購買$/i,
      /^完成訂單$/i,
    ]);

    if (checkoutClicked) {
      await page.waitForTimeout(2000);
    }

    const confirmationText = await bodyText(page);

    if (isEpicOrderSuccessText(confirmationText) || isEpicOwnedText(confirmationText)) {
      return createClaimResult({
        status: CLAIM_STATUS.SUCCESS,
        platform: "Epic Games",
        game,
        message: "已確認 Epic Games 訂單完成並加入帳號",
      });
    }

    if (/two-factor|2fa|雙重驗證|verification code|驗證碼/i.test(confirmationText)) {
      return failed(game, "Epic Games 要求雙重驗證，無法在目前流程中自動完成");
    }

    return createClaimResult({
      status: CLAIM_STATUS.READY,
      platform: "Epic Games",
      game,
      message: "已確認免費商品並進入領取流程，但尚未確認訂單完成",
    });
  } catch (error) {
    return failed(game, `Epic Games 頁面操作失敗：${error.message}`);
  } finally {
    await browser.close();
  }
}
