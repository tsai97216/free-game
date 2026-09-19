# Free Game Architecture

## 1. Overview

本專案是私人使用的免費遊戲偵測與自動化工具，從 4Gamers RSS 發現免費遊戲文章，解析商店資訊，整理遊戲資料，發送 Discord 通知，並逐步加入平台自動領取。

目前採 Node.js + GitHub Actions，Playwright 用於需要瀏覽器操作的平台。

## 2. Runtime Flow

`4Gamers RSS`
→ `src/sources/fourgamers.js`
→ `src/core/article.js`
→ `src/core/ai.js`
→ `src/core/validate.js`
→ `src/platforms/`
→ `src/core/notify.js`
→ `data/processed.json`

Claim 流程與通知流程分離：

`Game`
→ `src/platforms/claimers.js`
→ 平台 Claimer
→ `ClaimResult`
→ `src/core/processed.js`

## 3. Main Modules

### Source

- `src/sources/fourgamers.js`
- 讀取 4Gamers RSS
- 篩選「限免／限時免費／紳士限免」
- 排除「限時免費遊玩」
- 解析文章並產生遊戲資料

### Core

- `src/core/article.js`: 抓取文章 HTML、OG Image、商店 URL、正文
- `src/core/ai.js`: Gemini 遊戲資訊分析與 URL 配對
- `src/core/validate.js`: 遊戲資料正規化與永久領取資格驗證
- `src/core/processed.js`: 文章、通知、Claim 狀態持久化
- `src/core/notify.js`: Discord Embed 通知

### Platforms

- `src/platforms/index.js`: 平台定義、URL 判斷、平台正規化
- `src/platforms/claim.js`: Claim 結果與狀態模型
- `src/platforms/claimers.js`: 平台 Claim 路由
- `src/platforms/steam.js`: Steam Playwright Claim 實作
- `src/platforms/epic.js`: Epic Games Playwright Claim 基礎流程

目前平台：

1. Steam
2. GOG
3. DLsite
4. Epic Games
5. Ubisoft Connect

Steam 與 Epic Games 已有基礎 Claim 流程，其餘平台保留平台定義與未實作 Claimer。

## 4. State Model

`data/processed.json` 分成：

- `articles`: 已處理文章
- `games`: 遊戲層級狀態

遊戲狀態包含：

- `key`
- `notified`
- `claim.status`
- `claim.message`
- `claim.updatedAt`

通知與 Claim 狀態必須獨立。

## 5. Automation

### Test

`.github/workflows/test.yml`

- main push
- pull request
- 執行 `npm test`

### Bot

`.github/workflows/bot.yml`

- main push（忽略僅由 `data/processed.json` 產生的 push，避免 Bot 自我觸發）
- workflow_dispatch
- 每 10 分鐘 schedule
- Node.js 20
- npm install
- Playwright Chromium
- 若設定 Epic Games storage state 則還原 Epic Games 登入狀態
- 還原 Steam storage state
- 執行 `npm start`
- 若 `processed.json` 有變更則 commit 回 main

目前：

- `AUTO_CLAIM=false`
- `CLAIM_DRY_RUN` 可用於 Steam 流程檢查
- schedule 與 push trigger 仍需以實際 Actions run 驗證

## 6. Security

敏感資料只允許存在 GitHub Secrets 或本機未提交檔案：

- `DISCORD_WEBHOOK_URL`
- `GEMINI_API_KEY`
- `STEAM_STORAGE_STATE_B64`

`auth/`、`.env`、storage state 等資料不得進 Git。

## 7. Design Principles

- 增量遷移，不一次重寫
- 平台擴充不破壞既有平台
- 通知與 Claim 解耦
- AI 負責分析，不直接操作帳號
- Claim 必須驗證結果
- 外部網站操作必須防禦性處理
- 優先可維護性，不追求不必要的複雜架構
