import "dotenv/config";
import { chromium } from "playwright";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import process from "node:process";

const storagePath = process.env.EPIC_STORAGE_STATE || "auth/epic.json";
const profilePath = process.env.EPIC_BROWSER_PROFILE || "auth/epic-browser";
const debugPort = Number(process.env.EPIC_DEBUG_PORT || 9222);

await fs.mkdir("auth", { recursive: true });

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA
    ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
].filter(Boolean);

let chromePath = null;
for (const candidate of chromeCandidates) {
  try {
    await fs.access(candidate);
    chromePath = candidate;
    break;
  } catch {}
}

if (!chromePath) {
  throw new Error("找不到 Google Chrome。請安裝 Chrome，或設定 CHROME_PATH。");
}

const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profilePath}`,
    "--no-first-run",
    "--no-default-browser-check",
    "https://store.epicgames.com/",
  ],
  { detached: true, stdio: "ignore" },
);

chrome.unref();

let browser;
for (let i = 0; i < 30; i += 1) {
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);
    break;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

if (!browser) {
  throw new Error(`無法連接 Chrome DevTools。請確認連接埠 ${debugPort} 沒有被其他程式占用。`);
}

const contexts = browser.contexts();
const context = contexts[0];
const page = context.pages()[0] || await context.newPage();

console.log("這次開啟的是一般 Google Chrome，不是 Playwright 自己啟動的 Chromium。");
console.log("請在瀏覽器完成 Epic Games 登入。");
console.log("如果 Epic 要求 Cloudflare 驗證，請正常完成驗證。");
console.log("如果驗證成功後仍反覆跳回驗證頁，先不要一直重試。");
console.log("如果 Epic 要求 2FA，請正常完成驗證。");
console.log("確認已登入 Epic 帳號後，回到終端機按 Enter 保存登入狀態。");

process.stdin.setEncoding("utf8");
process.stdin.resume();
await new Promise((resolve) => process.stdin.once("data", resolve));

await context.storageState({ path: storagePath });
await browser.close();

console.log("Epic Games 登入狀態已保存至 " + storagePath);
console.log("請勿將此檔案或 auth/epic-browser 提交到 Git。");
