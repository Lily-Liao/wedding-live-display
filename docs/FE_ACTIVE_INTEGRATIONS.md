# 前端現用後端整合清單

> 供後端開發參考。列出前端目前實際呼叫的所有 API 端點與 WebSocket 訂閱。
> 最後更新：2026-02-21

---

## WebSocket 訂閱

連線端點由 `VITE_WS_URL` 環境變數決定（預設 `ws://localhost:8080/ws`）。

| 事件類型 | 使用元件 | 用途 |
|---------|---------|------|
| `message:new` | `WeddingWall.tsx` | 即時接收新賓客留言，顯示於留言牆 |
| `media:update` | `App.tsx` | 接收媒體方案變更，同步更新畫面 |

> ⚠️ `vote:update` 已不再訂閱。投票結果改由計時結束後呼叫 `GET /api/votes/options` 取得。

---

## REST API

Base URL 由 `VITE_API_URL` 環境變數決定（預設 `http://localhost:8080/api`）。

### 留言牆

| 方法 | 路徑 | 呼叫時機 | 使用元件 |
|-----|------|---------|---------|
| `GET` | `/api/messages` | 頁面載入 + 每 5 秒輪詢 | `WeddingWall.tsx` |

---

### 媒體方案

| 方法 | 路徑 | 呼叫時機 | 使用元件 |
|-----|------|---------|---------|
| `GET` | `/api/media/schemes` | 頁面初始化 | `App.tsx` |
| `POST` | `/api/media/schemes` | 新增方案 | `ControlPanel.tsx` |
| `PUT` | `/api/media/schemes/{id}/rename` | 重新命名方案 | `ControlPanel.tsx` |
| `DELETE` | `/api/media/schemes/{id}` | 刪除方案 | `ControlPanel.tsx` |
| `PUT` | `/api/media/schemes/live` | 切換應援牆播放方案 | `ControlPanel.tsx` |
| `POST` | `/api/media/schemes/{id}/items/presign` | 取得 R2 上傳預簽章 URL | `ControlPanel.tsx` |
| `PUT` | `/api/media/schemes/{id}/items/order` | 拖拽排序後更新順序 | `ControlPanel.tsx` |
| `PATCH` | `/api/media/schemes/{id}/items/{itemId}/visibility` | 切換素材顯示/隱藏 | `ControlPanel.tsx` |
| `DELETE` | `/api/media/schemes/{id}/items/{itemId}` | 刪除素材 | `ControlPanel.tsx` |

> **注意：** `PUT /api/media/schemes/{id}/pin` 前端已不再呼叫。釘選功能已改為純前端狀態。

---

### 互動投票

| 方法 | 路徑 | 呼叫時機 | 使用元件 |
|-----|------|---------|---------|
| `GET` | `/api/votes/options` | 頁面初始化 | `App.tsx` |
| `GET` | `/api/votes/options` | 計時結束 → 取得最終結果 | `InteractiveVoting.tsx` |
| `PATCH` | `/admin/voting-session/status` | 操作員按下開始投票（`status: "START"`）| `InteractiveVoting.tsx` |
| `PATCH` | `/admin/voting-session/status` | 計時結束（`status: "CLOSED"`）| `InteractiveVoting.tsx` |

> `PATCH /admin/voting-session/status` 的 Base URL 為 `http://localhost:8080`（不含 `/api`）。

---

### 幸運抽獎

| 方法 | 路徑 | 呼叫時機 | 使用元件 |
|-----|------|---------|---------|
| `GET` | `/api/v1/participants/eligible` | 進入抽獎頁面 + 每次抽獎/取消後刷新 | `LuckyDraw.tsx` |
| `GET` | `/api/v1/winners` | 進入抽獎頁面（還原已抽狀態） | `LuckyDraw.tsx` |
| `POST` | `/api/v1/winners` | 執行抽獎 | `LuckyDraw.tsx` |
| `DELETE` | `/api/v1/winners/{id}` | 取消單一得獎者（重新抽取） | `LuckyDraw.tsx` |
| `DELETE` | `/api/v1/winners` | 重設所有得獎記錄 | `LuckyDraw.tsx` |

---

## 非後端呼叫

| 目標 | 說明 |
|-----|------|
| `PUT {presignedUploadUrl}` | 直接上傳檔案至 Cloudflare R2，不經過後端 |

---

## 前端釘選機制（純前端，無 API）

應援牆的「釘選特定圖片」功能為純前端狀態（`pinnedMediaId: string | null`），不呼叫任何後端 API。操作員在控制台點選圖片的釘選按鈕即可固定顯示，切換方案時自動解除。
