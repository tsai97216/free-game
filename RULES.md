# Free Game Project Rules

## Project Context

這是一個私人使用的免費遊戲自動化專案，目標是將免費遊戲資訊的偵測、整理、通知，以及未來的平台自動領取整合在一起。

原始版本運行於 Google Apps Script。Node.js 版本採漸進式遷移，不一次重寫全部功能。

## Development Direction

目前核心流程：

`4Gamers RSS → Article Parser → Gemini / Game Data → Validation → Platform → Claim → Discord Notification`

持久化狀態則獨立於通知與領取流程：

`processed.json → article state + game notification state + claim state`

目前預定支援的平台：

- Steam
- GOG
- DLsite
- Epic Games
- Ubisoft Connect

新增平台必須採增量方式加入，既有平台一定要保留。

專案目標是「可以永久加入帳號」的免費遊戲，不包含 Nintendo Switch 等只能暫時免費遊玩的活動，也不應把「限時免費遊玩」誤判成永久領取。

## Rules

1. 修改現有功能前，先理解目前實際行為與測試，不要無理由重寫。
2. 優先採簡單、可靠、容易維護的實作，避免為目前規模過度抽象。
3. API Key、Discord Webhook、Cookie、Playwright storage state 等敏感資料絕對不能提交到 Git。
4. 自動領取必須驗證商品、平台、免費資格與實際結果，不能把「按下按鈕」視為「領取成功」。
5. `CLAIM_DRY_RUN` 只能檢查流程，不得執行實際領取；`AUTO_CLAIM` 預設保持關閉。
6. Gemini 只負責資訊分析、分類與 URL 配對，不直接決定或執行帳號操作。
7. 外部網站結構可能改變，Playwright 必須有 URL 驗證、狀態檢查、錯誤處理與結果回報。
8. 通知狀態與 Claim 狀態必須分離。已通知不代表已領取，Claim 失敗也不應阻止必要的通知處理。
9. processed state 必須可持久化，並能在 GitHub Actions 執行後安全提交回 repository。
10. 修改後應保留既有功能，除非明確決定移除。
11. 新增平台時不得移除或覆蓋既有平台。
12. 不支援 Nintendo Switch 等暫時免費遊玩平台；不要因文章關鍵字而新增未規劃的平台。
13. GitHub Actions 的 push、schedule、workflow_dispatch 是不同觸發來源，驗證時必須分別確認，不可用一次手動執行代替排程驗證。
14. Actions 的執行狀態必須以實際 run/job 結果為準；工具查詢不到 run 時，不得推論成「沒有執行」。
15. TODO.md 只記錄尚未完成、需要驗證或未來規劃的工作；已完成項目應標記完成。
16. 測試優先驗證行為與邊界案例，再進行結構性重構。
17. 專案主要供本人與 AI 協作維護，不為開源社群增加不必要的文件或流程。

## Important Decisions

- Repository: tsai97216/free-game
- Default branch: main
- 原始 GAS 版本仍是行為參考基準。
- Node.js / Playwright 採漸進式遷移。
- 平台固定保留：Steam、GOG、DLsite、Epic Games、Ubisoft Connect。
- Bot 目前使用 GitHub Actions，預定每 10 分鐘執行一次。
- `AUTO_CLAIM=false` 為目前安全預設。
- Steam 與 Epic Games 目前已有基礎 Claim 流程，其餘平台先保留路由與安全 stub。
