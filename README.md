# 歲月敬好 × 共度玗生 — 婚禮直播顯示系統

婚禮現場投影用 React SPA，提供四種模式：應援媒體牆、互動投票、幸運抽獎、系統控制台。

## 快速開始

**前置需求:** Node.js 18+

```bash
# 安裝依賴
npm install

# 複製環境變數範本並填入後端 URL
cp .env.example .env

# 啟動開發伺服器（port 3000）
npm run dev
```

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `VITE_API_URL` | 後端 REST API base URL | `http://localhost:8080/api` |
| `VITE_WS_URL` | 後端 WebSocket URL | `ws://localhost:8080/ws` |

> `.env` 已加入 `.gitignore`，請勿提交至版本控制。參考 `.env.example`。

## 四種模式

| 模式 | 說明 |
|------|------|
| 應援牆 | 全螢幕媒體輪播 + 賓客留言滾動牆 |
| 互動投票 | QR Code 掃碼投票，計時結束後顯示結果 |
| 幸運抽獎 | 從投票參與者中抽出得獎者 |
| 系統控制 | 管理媒體方案、上傳素材、調整顯示設定 |

## 開發指令

```bash
npm run dev      # 開發伺服器
npm run build    # 正式建置
npm run preview  # 預覽正式版
```

## 技術架構

- **Framework:** React + TypeScript (Vite)
- **Styling:** Tailwind CSS (CDN)
- **API:** REST (`apiService.ts`) + WebSocket (`wsService.ts`)
- **後端文件:** 參見 `docs/FE_API_GUIDE.md`
