# Free Game Project Rules

## Project Context

這是一個私人使用的 DLsite 免費遊戲自動化 worker。

核心流程：

`4Gamers RSS → Article Parser → Gemini → Validation → DLsite → Claim → Discord Notification`

其他平台由其他 worker 負責，本 repository 不保留其他平台實作。

## Development Direction

本 repository 固定只支援：

- DLsite

目前 DLsite 已確認可以建立登入 storage state，但 Claim 尚未完成。

## Rules

1. 修改現有功能前，先理解目前實際行為與測試，不要無理由重寫。
2. 優先採簡單、可靠、容易維護的實作。
3. API Key、Discord Webhook、Cookie、Playwright storage state 等敏感資料絕對不能提交到 Git。
4. 自動領取必須驗證商品、免費資格與實際結果，不能把「按下按鈕」視為「領取成功」。
5. `CLAIM_DRY_RUN` 只能檢查流程，不得執行實際領取；`AUTO_CLAIM` 預設保持關閉。
6. Gemini 只負責資訊分析、分類與 URL 配對，不直接執行帳號操作。
7. 外部網站結構可能改變，Playwright 必須有 URL 驗證、狀態檢查、錯誤處理與結果回報。
8. 通知狀態與 Claim 狀態必須分離。
9. processed state 必須可持久化，並能在 GitHub Actions 執行後安全提交回 repository。
10. 不要把其他平台重新加回本 worker。
11. DLsite Claim 完成前，不得把登入成功當成領取成功。
12. 測試優先驗證行為與邊界案例，再進行結構性重構。

## Important Decisions

- Repository: tsai97216/free-game
- Default branch: main
- Worker scope: DLsite only
- Source: 4Gamers
- Browser automation: Playwright
- Runtime: GitHub Actions
- `AUTO_CLAIM=false` 為目前安全預設
