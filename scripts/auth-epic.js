import "dotenv/config";
import { chromium } from "playwright";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const storagePath = process.env.EPIC_STORAGE_STATE || "auth/epic.json";
const profilePath =
  process.env.EPIC_BROWSER_PROFILE ||
  path.join(os.tmpdir(), "free-game-epic-browser");

await fs.mkdir("auth", { recursive: true });
await fs.mkdir(profilePath, { recursive: true });

const context = await chromium.launchPersistentContext(profilePath, {
  channel: "chrome",
  headless: false,
  locale: "zh-TW",
});

const page = context.pages()[0] || await context.newPage();

await page.goto("https://store.epicgames.com/", {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});

console.log("已開啟獨立的 Google Chrome 登入環境。");
console.log("請在瀏覽器完成 Epic Games 正常登入。");
console.log("如果 Epic 要求 Cloudflare 驗證，請正常完成驗證。");
console.log("如果驗證完成後又反覆跳回驗證頁，請先不要一直重試，直接關閉瀏覽器並回到終端機。");
console.log("如果 Epic 要求 2FA，請正常完成驗證。");
console.log("確認已登入 Epic 帳號後，回到終端機按 Enter 保存登入狀態。");

process.stdin.setEncoding("utf8");
process.stdin.resume();
await new Promise((resolve) => process.stdin.once("data", resolve));

await context.storageState({ path: storagePath });
await context.close();

console.log("Epic Games 登入狀態已保存至 " + storagePath);
console.log("登入狀態檔案請勿提交到 Git。");
