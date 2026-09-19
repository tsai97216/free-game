# TODO

## Current

- [x] 建立 Node.js 專案基礎
- [x] 將 GAS 功能整理成可移植規格
- [x] 實作 4Gamers RSS 來源
- [x] 實作限免文章篩選
- [x] 排除「限時免費遊玩」等暫時免費活動
- [x] 實作文章 HTML 抓取與商店連結解析
- [x] 實作遊戲資訊解析與驗證
- [x] 實作 Discord 通知
- [x] 建立文章／遊戲層級去重
- [x] 建立通知狀態與領取狀態分離的持久化紀錄
- [x] 建立 GitHub Actions 基礎執行
- [ ] 確認 Node.js 版本與 GAS 實際行為一致

## AI

- [x] Gemini 遊戲資訊解析
- [x] 遊戲與商店 URL 配對
- [x] AI 解析失敗處理
- [x] 強化 AI 對平台與「永久領取／免費試玩」的判斷
- [ ] 持續改善多遊戲文章的平台／連結配對

## Claim / Playwright

- [x] 建立平台 Claim 介面與路由
- [x] 建立瀏覽器自動化基礎
- [x] 登入狀態管理
- [x] Steam 商品頁與免費資格確認
- [x] Steam URL、免費狀態、已擁有、領取成功判斷
- [x] Steam Claim 基礎單元測試
- [x] Steam dry-run 檢查流程
- [ ] 實際 Steam 領取流程測試
- [ ] 完整商品狀態確認
- [ ] 啟用並驗證 AUTO_CLAIM
- [ ] 完整領取結果驗證
- [ ] 失敗重試與錯誤回報

## Platforms

- [x] GOG Claim 基礎流程
- [ ] GOG 實際 Claim 流程測試
- [ ] DLsite Claim
- [x] Epic Games Claim 基礎流程
- [ ] 實際 Epic Games Claim 流程測試
- [ ] Epic Games 領取結果驗證
- [ ] Ubisoft Connect Claim

新增平台時必須保留既有平台，不得以新平台取代舊平台。

## Infrastructure

- [x] GitHub Actions workflow
- [x] Secrets 管理
- [x] Test workflow
- [x] Bot workflow 基本排程設定
- [ ] 確認 Bot workflow 的 push 觸發實際運作
- [ ] 確認 Bot 的 10 分鐘排程實際運作
- [ ] 日誌與錯誤通知
- [ ] 失敗後的自動重試
- [ ] 確認 processed state 在 Actions 中能穩定提交回 main

## Maintenance

- [ ] 清理與 GAS 行為不一致的邊界案例
- [ ] 持續補充平台與 Claim 測試
- [ ] 避免在尚未驗證需求前過度重構
