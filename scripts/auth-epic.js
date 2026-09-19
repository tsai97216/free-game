import "dotenv/config";
import { chromium } from "playwright";
import { promises as fs } from "node:fs";

const storagePath = process.env.EPIC_STORAGE_STATE || "auth/epic.json";

await fs.mkdir("auth", { recursive: true });

console.log("即將開啟 Epic Games 登入頁。");
console.log("這個流程不會使用你的日常 Chrome Profile，也不會修改或接管現有 Chrome。");

const browser = await chromium.launch({
  channel: "chrome",
  headless: false,
});

const context = await browser.newContext({
  locale: "zh-TW",
});

const page = await context.newPage();

await page.goto("https://store.epicgames.com/", {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});

console.log("");
console.log("請在開啟的 Chrome 完成 Epic Games 登入。");
console.log("如果出現 Cloudflare，請正常完成驗證。");
console.log("如果 Cloudflare 驗證完成後仍然無限循環，請不要反覆操作，直接關閉瀏覽器並結束這次測試。");
console.log("如果成功進入 Epic 並確認帳號已登入，回到終端機按 Enter。");

process.stdin.setEncoding("utf8");
process.stdin.resume();
await new Promise((resolve) => process.stdin.once("data", resolve));

await context.storageState({ path: storagePath });
await browser.close();

console.log("Epic Games 登入狀態已保存至 " + storagePath);
console.log("請勿將此檔案提交到 Git。");
