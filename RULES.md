# Free Game Project Rules

## Project Context

這是一個私人使用的免費遊戲自動化專案，主要目標是將免費遊戲資訊的偵測、整理、通知，以及未來的平台自動領取整合在一起。

目前原始版本運行於 Google Apps Script，功能包含：

- 讀取 4Gamers RSS
- 篩選「限免／限時免費／紳士限免」文章
- 抓取文章 HTML
- 提取 Steam、Epic Games、DLsite 等商店連結
- 使用 Gemini 分析文章並整理遊戲資訊
- 使用 Steam API 查詢價格
- 透過 Discord Webhook 發送通知

新版本預計逐步改為 Node.js，並視需要使用 Playwright 實現瀏覽器自動化與免費遊戲領取。

## Development Direction

優先保留目前已驗證可正常運作的功能，再逐步移植與改善。

預期流程：

Source → Parser → Game Data → Platform → Claim → Notification

未來可能支援多個資訊來源與遊戲平台，但不要為了尚未存在的需求過度設計。

## Rules

1. 修改現有功能前，先理解目前實際行為，不要無理由重寫。
2. 新架構應保持簡單、容易維護，避免過度抽象。
3. API Key、Discord Webhook、Cookie、Playwright storage state 等敏感資料絕對不能提交到 Git。
4. 自動領取功能必須驗證商品、平台與領取結果，不能把「執行了操作」直接視為「領取成功」。
5. Gemini 負責資訊分析與配對，不應直接決定或執行高風險的帳號操作。
6. 外部網站的頁面結構可能改變，Playwright 操作應有適當的錯誤處理與失敗回報。
7. 修改後應盡量保留既有功能，除非明確決定移除。
8. 專案主要供本人與 AI 協作維護，不需要為開源社群增加不必要的文件或流程。
9. TODO.md 用來記錄目前待辦與未來規劃；已完成項目應適時清理或移動。
10. 如果需求存在多種合理方案，優先選擇簡單、可靠且符合目前專案規模的方案。

## Important Decisions

- Repository: tsai97216/free-game
- Default branch: main
- 原始 GAS 版本目前仍視為可參考的既有實作。
- 從 GAS 遷移到 Node.js / Playwright 應採漸進式方式，不一次重寫全部功能。
