# TODO

## DLsite

- [x] 建立 DLsite 平台 URL 辨識
- [x] 建立 DLsite 登入 storage state 流程
- [x] GitHub Actions 還原 DLsite 登入狀態
- [ ] 確認 4Gamers DLsite 免費商品文章與連結格式
- [ ] 實作 DLsite 商品頁狀態判斷
- [ ] 實作 DLsite Claim
- [ ] 實作 DLsite 領取成功驗證
- [ ] 實際 DLsite Claim 測試
- [ ] 完整領取結果驗證
- [ ] 失敗重試與錯誤回報

## Infrastructure

- [x] GitHub Actions workflow
- [x] Secrets 管理
- [x] Test workflow
- [x] Bot workflow 基本排程設定
- [ ] 確認 Bot workflow 的 push 觸發實際運作
- [ ] 確認 Bot 的 10 分鐘排程實際運作
- [ ] 日誌與錯誤通知
- [ ] 確認 processed state 在 Actions 中能穩定提交回 main

## Maintenance

- [ ] 持續補充 DLsite Claim 測試
- [ ] 避免在尚未驗證需求前過度重構
