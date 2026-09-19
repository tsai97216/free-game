# Free Game Architecture

## 1. Overview

本專案是私人使用的 DLsite 免費遊戲偵測與自動化 worker。

流程：

`4Gamers RSS`
→ `src/sources/fourgamers.js`
→ `src/core/article.js`
→ `src/ai/gemini.js`
→ `src/core/validate.js`
→ `src/platforms/`
→ `src/notification/discord.js`

Claim 狀態獨立保存於：

`data/processed.json`

## 2. Scope

本 repository **只負責 DLsite**。

其他平台（Steam、GOG、Epic Games、Ubisoft Connect 等）由其他 worker 負責，本 repository 不再保留其平台模組、登入設定或 Claim 流程。

## 3. Main Modules

### Source

- `src/sources/fourgamers.js`
- 讀取 4Gamers RSS
- 篩選限免文章
- 解析文章並取得 DLsite 連結

### AI

- `src/ai/gemini.js`
- 從文章內容與候選連結中辨識 DLsite 免費商品
- 只回傳 DLsite
- 不執行帳號操作

### Core

- `src/core/article.js`: 抓取文章 HTML、OG Image、DLsite 商店 URL、正文
- `src/core/validate.js`: 商品資料正規化與永久取得資格驗證
- `src/core/processed.js`: 文章、通知與 Claim 狀態持久化
- `src/notification/discord.js`: Discord 通知

### Platform

- `src/platforms/index.js`: DLsite URL 與平台正規化
- `src/platforms/claim.js`: Claim 結果模型
- `src/platforms/claimers.js`: DLsite Claim 路由
- `scripts/auth-dlsite.js`: 建立 DLsite Playwright storage state

目前 DLsite Claim 尚未完成；現階段已確認登入流程可行。

## 4. State Model

`data/processed.json` 分成：

- `articles`: 已處理文章
- `games`: 商品層級通知與 Claim 狀態

通知與 Claim 狀態必須分離。

## 5. Automation

GitHub Actions：

- push
- workflow_dispatch
- 每 10 分鐘執行一次

執行前會從 GitHub Secret 還原：

`DLSITE_STORAGE_STATE_B64`

目前 `AUTO_CLAIM=false`。

## 6. Security

敏感資料只允許存在 GitHub Secrets 或本機未提交檔案：

- `DISCORD_WEBHOOK_URL`
- `GEMINI_API_KEY`
- `DLSITE_STORAGE_STATE_B64`

`auth/`、`.env`、storage state 等資料不得進 Git。
