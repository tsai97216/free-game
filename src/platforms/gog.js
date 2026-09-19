import { chromium } from "playwright";
import { config } from "../config.js";
import { CLAIM_STATUS, createClaimResult } from "./claim.js";

const storageState = config.gogStorageState;
const GOG_HOSTS = new Set(["www.gog.com", "gog.com"]);

export function isTrustedGogUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && GOG_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function isGogLoginUrl(value) {
  try {
    const url = new URL(value);
    return /login|signin/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function hasGogFreeOfferText(text) {
  const value = String(text || "");
  return /free|免費|0\.00|0,00/i.test(value);
}

export function isGogOwnedText(text) {
  const value = String(text || "");
  return /in library|already in.*library|已在.*收藏庫|已在.*庫|owned|已擁有/i.test(value);
}

function failed(game, message) {
  return createClaimResult({
    status: CLAIM_STATUS.FAILED,
    platform: "GOG",
    game,
    message,
  });
}

async function bodyText(page) {
  return page.locator("body").innerText().catch(() => "");
}

async function findGogAction(page) {
  const candidates = page.locator("button, a, [role='button']");
  const count = await candidates.count().catch(() => 0);
  const patterns = [
    /add to library/i,
    /get it for free/i,
    /get for free/i,
    /add to collection/i,
    /dodaj do biblioteki/i,
    /dodaj do kolekcji/i,
    /dodaj za darmo/i,
    /dodaj do konta/i,
    /加入收藏庫/i,
    /加入庫/i,
    /免費取得/i,
    /免費獲取/i,
  ];

  for (let i = 0; i < count; i += 1) {
    const candidate = candidates.nth(i);
    const text = await candidate.innerText().catch(() => "");
    if (patterns.some((pattern) => pattern.test(text)) &&
        await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }

  return null;
}

export async function claimGog(game) {
  if (!game?.link) return failed(game, "缺少 GOG 商品網址");
  if (!isTrustedGogUrl(game.link)) {
    return failed(game, "商品網址不是受信任的 GOG 商店網址");
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

    if (isGogLoginUrl(page.url())) {
      return failed(game, "GOG 尚未登入，請先建立 storage state");
    }

    const initialText = await bodyText(page);

    if (isGogOwnedText(initialText)) {
      return createClaimResult({
        status: CLAIM_STATUS.SUCCESS,
        platform: "GOG",
        game,
        message: "GOG 已確認遊戲在帳號收藏庫中",
      });
    }

    if (!hasGogFreeOfferText(initialText)) {
      return failed(game, "未確認 GOG 商品目前可免費取得");
    }

    const action = await findGogAction(page);
    if (!action) {
      return failed(game, "已確認 GOG 商品可能免費，但未找到明確的加入收藏庫按鈕");
    }

    if (config.claimDryRun) {
      return createClaimResult({
        status: CLAIM_STATUS.READY,
        platform: "GOG",
        game,
        message: "Dry run：已開啟 GOG 商品頁並確認免費，未執行領取操作",
      });
    }

    await action.click();
    await page.waitForTimeout(2000);

    const afterText = await bodyText(page);

    if (isGogLoginUrl(page.url())) {
      return failed(game, "GOG 要求重新登入或驗證");
    }

    if (isGogOwnedText(afterText)) {
      return createClaimResult({
        status: CLAIM_STATUS.SUCCESS,
        platform: "GOG",
        game,
        message: "GOG 已確認遊戲加入帳號",
      });
    }

    return createClaimResult({
      status: CLAIM_STATUS.READY,
      platform: "GOG",
      game,
      message: "已確認免費商品並執行加入收藏庫操作，但尚未確認帳號已擁有",
    });
  } catch (error) {
    return failed(game, `GOG 頁面操作失敗：${error.message}`);
  } finally {
    await browser.close();
  }
}
