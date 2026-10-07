# TODO

目前重寫已完成核心架構，CI 測試與實際 Workflow 均已成功。

## 已完成

### 核心流程
- [x] 4Gamers RSS 取得與解析
- [x] 限免文章篩選
- [x] 文章 HTML 取得與內容解析
- [x] OG Image 取得
- [x] Steam / Epic 商店連結擷取
- [x] Steam Widget URL 正規化
- [x] Gemini 遊戲資訊辨識
- [x] 多款遊戲辨識與商店連結配對
- [x] Steam 價格查詢
- [x] Discord Embed 發送
- [x] 已處理狀態儲存
- [x] 遊戲層級去重
- [x] 單款遊戲失敗時保留其他成功結果

### AI
- [x] Gemini JSON 輸出
- [x] Gemini 回傳資料驗證
- [x] 商店連結由程式驗證並映射，不直接信任 AI URL
- [x] Markdown Code Block 清理
- [x] JSON 異常處理
- [x] 多款遊戲與候選商店連結配對

### 穩定性
- [x] HTTP Retry
- [x] HTTP Rate Limit 基本處理
- [x] RSS / 文章 / Gemini / Steam / Discord 錯誤隔離
- [x] 部分成功狀態保存
- [x] Discord Mention 關閉
- [x] Secrets 不進 Git
- [x] GitHub Actions 自動測試
- [x] Workflow 實際執行成功

### 測試
- [x] RSS / 文章解析基礎測試
- [x] Steam URL / 價格測試
- [x] Epic 不觸發 Steam 查價
- [x] Gemini JSON / Store Index 測試
- [x] Discord Payload 測試
- [x] State / 去重測試
- [x] 部分失敗測試

---

## 待處理

### 1. 實際資料驗證
- [ ] 確認實際 4Gamers 限免文章能正確抓到
- [ ] 確認單款遊戲通知內容正確
- [ ] 確認同篇多款遊戲通知內容正確
- [ ] 確認 Steam / Epic 平台判斷正確
- [ ] 確認免費期限、遊戲名稱與商店連結正確
- [ ] 確認 Discord Embed 實際顯示正常

### 2. AI 正確性
- [ ] 避免 Gemini 漏判遊戲後直接將文章標記為已處理
- [ ] 改善平台判斷，盡量由程式根據商店 URL 確認
- [ ] 改善遊戲名稱與商店連結的配對可靠性
- [ ] 評估是否需要分階段 AI 分析
- [ ] 評估 Token / API 使用量

### 3. State
- [ ] 改善 processed state 的排序與保留邏輯
- [ ] 處理 state JSON 損壞時的安全行為
- [ ] 確認 GitHub Actions 寫回 state 的長期行為
- [ ] 評估是否需要更好的持久化方式

### 4. Article Parser
- [ ] 檢查複雜 HTML / 巢狀 script、style 等情況
- [ ] 評估更多商店連結形式
- [ ] 確認文章內容去重是否會誤刪重要文字

### 5. Steam
- [ ] 進一步降低搜尋結果誤配的可能
- [ ] 改善非 ASCII 遊戲名稱的比對
- [ ] 確認 Steam API 異常時的通知行為

### 6. Workflow / 維護
- [ ] 確認排程長期穩定執行
- [ ] 評估 state commit 造成的 Git 歷史雜訊
- [ ] 補充 README
- [ ] 更新架構文件
- [ ] 移除確認不再需要的舊版 Code.gs
- [ ] 清理過時的 TODO / 設定說明

---

## 最後驗收

- [ ] 實際收到一次正確的限免 Discord 通知
- [ ] 實際驗證多款遊戲文章
- [ ] 實際驗證重複文章不重複通知
- [ ] 實際驗證失敗後重跑可以補發未完成的遊戲
- [ ] 確認長期排程與 state 正常
- [ ] 完成 README / 文件整理

## 原則

1. 功能不能倒退。
2. AI 只負責理解文章，流程與網址由程式控制。
3. 外部資料一律驗證後再使用。
4. 單一遊戲或 API 失敗，不應讓已成功的結果消失。
5. API Key 與 Discord Webhook 絕不進 Git。
6. 先確保實際通知正確，再做額外優化。
7. 不為了架構而架構，維護簡單優先。
