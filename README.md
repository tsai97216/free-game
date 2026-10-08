# Free Game Notifier

自動從 4Gamers RSS 找出限時免費遊戲，使用 Gemini 擷取遊戲資訊，再透過 Discord Webhook 發送通知。

## 流程
4Gamers RSS → 限免文章篩選 → 文章解析 → Gemini 辨識遊戲 → 商店連結驗證 → Steam 原價查詢 → Discord 通知 → 狀態保存

## 功能
- 每 15 分鐘自動檢查 4Gamers RSS
- 支援 Steam / Epic Games 商店連結
- 一篇文章可辨識多款限免遊戲
- Gemini 只負責分析內容與選擇候選商店連結，實際 URL 由程式驗證
- Steam 遊戲自動查詢台灣地區原價
- Discord Embed + 4Gamers / 商店頁按鈕
- 遊戲層級去重，避免同一款遊戲因不同文章重複通知
- 單款遊戲失敗時不影響同篇其他遊戲
- HTTP 錯誤與 Rate Limit 自動重試
- GitHub Actions 執行測試與通知
- processed state 持久化，避免 Workflow 重跑造成重複通知

## 設定
GitHub Actions Secrets：
- `DISCORD_WEBHOOK_URL`
- `GEMINI_API_KEY`

可選環境變數：
- `GEMINI_MODEL`，預設 `gemini-2.5-flash`

本專案只使用 Python 標準函式庫，不需要額外安裝套件。

## 執行
```text
PYTHONPATH=src python main.py
```

測試：
```text
PYTHONPATH=src python -m unittest discover -s tests -v
```

## GitHub Actions
Workflow 每 15 分鐘執行一次，也可以手動觸發。
測試通過後才會執行通知流程；成功更新的 `data/processed.json` 會由 GitHub Actions 自動提交回 repository。

## 專案結構
```text
.
├── .github/workflows/free-game.yml
├── data/
├── main.py
├── src/free_game/
│   ├── ai.py
│   ├── article.py
│   ├── config.py
│   ├── discord.py
│   ├── http.py
│   ├── models.py
│   ├── rss.py
│   ├── state.py
│   └── stores.py
└── tests/
```

## 原則
1. 寧可多通知，也不要因過度過濾而漏掉遊戲。
2. AI 負責理解文章，流程與外部 URL 由程式控制。
3. 外部服務失敗時盡量保留已成功處理的結果。
4. 敏感資訊只放在 GitHub Actions Secrets。
5. 維護簡單優先，不為了架構而架構。