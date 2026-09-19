import "dotenv/config";
import { chromium } from "playwright";
import { promises as fs } from "node:fs";

const storagePath = process.env.EPIC_STORAGE_STATE || "auth/epic.json";

await fs.mkdir("auth", { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  locale: "zh-TW",
});
const page = await context.newPage();

await page.goto("https://store.epicgames.com/", {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});

console.log("請在開啟的瀏覽器完成 Epic Games 正常登入。");
console.log("如果 Epic 要求 2FA，請正常完成驗證。");
console.log("確認已登入後回到終端機按 Enter 保存登入狀態。");

process.stdin.setEncoding("utf8");
process.stdin.resume();
await new Promise((resolve) => process.stdin.once("data", resolve));

await context.storageState({ path: storagePath });
await browser.close();

console.log("Epic Games 登入狀態已保存至 " + storagePath);
console.log("請勿將此檔案提交到 Git。");
