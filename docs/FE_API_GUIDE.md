# Wedding Interactive System — Frontend API Integration Guide

Base URL: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 通用格式

### 成功回應

```json
{
  "success": true,
  "message": "...",   // 部分 API 才有
  "data": { ... }     // 實際資料
}
```

### 錯誤回應

```json
{
  "success": false,
  "message": "錯誤訊息"
}
```

---

## WebSocket

### 連線

| 項目 | 值 |
|---|---|
| 端點 | `ws://localhost:8080/ws` |
| 協定 | STOMP over SockJS |

```js
// 使用 @stomp/stompjs + sockjs-client
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  onConnect: () => {
    // 訂閱留言牆
    client.subscribe('/topic/messages', (msg) => {
      const { type, payload } = JSON.parse(msg.body);
      // type === 'message:new'
    });

    // 訂閱投票
    client.subscribe('/topic/votes', (msg) => {
      const { type, payload } = JSON.parse(msg.body);
      // type === 'vote:update'
    });
  },
});
client.activate();
```

---

### 事件格式

所有 WebSocket 訊息的外層結構：

```json
{
  "type": "事件類型",
  "payload": { ... }
}
```

---

### `message:new` — 新留言

**Topic:** `/topic/messages`
**觸發時機:** 賓客透過 LINE 送出留言

```json
{
  "type": "message:new",
  "payload": {
    "id": "uuid",
    "name": "賓客LINE名稱",
    "content": "新娘超美！",
    "timestamp": 1708425600000   // Unix milliseconds
  }
}
```

---

### `vote:update` — 投票即時更新

**Topic:** `/topic/votes`
**觸發時機:** 任一賓客投票後

```json
{
  "type": "vote:update",
  "payload": {
    "options": [
      { "key": "A", "label": "Sea Blue",      "color": "#AAC6E6", "count": 12, "percentage": 40.0 },
      { "key": "B", "label": "Silver Gray",   "color": "#A7A2A2", "count": 8,  "percentage": 26.7 },
      { "key": "C", "label": "Caramel Brown", "color": "#BA8663", "count": 6,  "percentage": 20.0 },
      { "key": "D", "label": "Blossom Pink",  "color": "#F4BDE0", "count": 4,  "percentage": 13.3 }
    ],
    "totalVotes": 30
  }
}
```

> ⚠️ **前端不訂閱此事件。** 投票結果改由計時結束後呼叫 `GET /api/votes/options` 取得。

---

## REST API

---

### 1. 留言牆 Wedding Wall

#### `GET /api/messages` — 取得所有留言

**回應 `data`:**

```json
[
  {
    "id": "uuid",
    "name": "賓客名稱",
    "content": "新郎好帥！",
    "timestamp": 1708425600000
  }
]
```

---

### 2. 互動投票 Voting

#### `GET /api/votes/options` — 取得選項與票數統計

**回應 `data`:**

```json
{
  "options": [
    { "key": "A", "label": "Sea Blue",      "color": "#AAC6E6", "count": 0, "percentage": 0.0 },
    { "key": "B", "label": "Silver Gray",   "color": "#A7A2A2", "count": 0, "percentage": 0.0 },
    { "key": "C", "label": "Caramel Brown", "color": "#BA8663", "count": 0, "percentage": 0.0 },
    { "key": "D", "label": "Blossom Pink",  "color": "#F4BDE0", "count": 0, "percentage": 0.0 }
  ],
  "totalVotes": 0
}
```

> **呼叫時機：** 頁面初始化時（取得初始選項），以及**投票計時結束後**（取得最終結果）。前端不透過 WebSocket 接收即時票數更新。

---

#### `PATCH /admin/voting-session/status` — 切換投票狀態（Admin）

狀態流程（單向）：`WAITING` → `START` → `CLOSED`

**Request Body:**

```json
{ "status": "START" }
```

有效值：`WAITING` | `START` | `CLOSED`

**回應 `data`:**

```json
{
  "id": "uuid",
  "status": "START",
  "createdAt": "2026-02-20T10:00:00Z",
  "updatedAt": "2026-02-20T10:05:00Z"
}
```

---

### 3. 幸運抽獎 Lucky Draw

#### `GET /api/v1/participants/eligible` — 取得抽獎池名單

**回應 `data`:**

```json
{
  "data": [
    {
      "voteId": "uuid",
      "lineUserId": "Uxxxxxxxx",
      "lineDisplayName": "小明",
      "optionKey": "A"
    }
  ],
  "metadata": {
    "totalCount": 25,
    "updatedAt": "2026-02-20T10:00:00Z"
  }
}
```

---

#### `POST /api/v1/winners` — 執行抽獎

無 Request Body。抽出後自動從池中移除。

**回應 `data`:**

```json
{
  "id": "uuid",
  "lineUserId": "Uxxxxxxxx",
  "lineDisplayName": "小明",
  "optionKey": "A",
  "drawnAt": "2026-02-20T10:30:00Z",
  "isActive": true
}
```

---

#### `GET /api/v1/winners` — 取得所有中獎記錄

**回應 `data`:**

```json
[
  {
    "id": "uuid",
    "lineUserId": "Uxxxxxxxx",
    "lineDisplayName": "小明",
    "optionKey": "A",
    "drawnAt": "2026-02-20T10:30:00Z",
    "isActive": true   // false = 已取消資格
  }
]
```

---

#### `DELETE /api/v1/winners/{id}` — 取消中獎資格

棄權時使用。該賓客**不會**重新回到抽獎池。

**Path Param:** `id` — 中獎記錄的 UUID

**回應:** `{ "success": true, "message": "Winner cancelled successfully", "data": null }`

---

#### `DELETE /api/v1/winners` — 重設所有得獎記錄

清除本輪所有得獎者，用於重設抽獎。

**回應:** `{ "success": true, "data": null }`

---

### 4. 媒體方案 Media Schemes

#### `GET /api/media/schemes` — 取得所有方案

**回應 `data`:**

```json
[
  {
    "id": "uuid",
    "name": "婚禮精選",
    "isLive": true,
    "isPinned": false,
    "sortOrder": 0,
    "createdAt": "2026-02-20T09:00:00Z",
    "updatedAt": "2026-02-20T09:00:00Z",
    "items": [
      {
        "id": "uuid",
        "fileKey": "schemes/uuid/uuid/photo.jpg",
        "readUrl": "https://pub-xxx.r2.dev/schemes/uuid/uuid/photo.jpg",
        "fileName": "photo.jpg",
        "contentType": "image/jpeg",
        "fileSize": 204800,
        "sortOrder": 0,
        "isVisible": true,
        "createdAt": "2026-02-20T09:05:00Z"
      }
    ]
  }
]
```

> `readUrl` 可直接放入 `<img src>` 或影片 `<source src>`，永久有效。

---

#### `POST /api/media/schemes` — 新增方案

**Request Body:**

```json
{ "name": "婚禮精選" }
```

**回應 `data`:** 同上方 scheme 物件，`items` 為空陣列。
**HTTP Status:** `201 Created`

---

#### `PUT /api/media/schemes/{id}/rename` — 重新命名方案

**Request Body:** `{ "name": "新名稱" }`

**回應 `data`:** 更新後的 scheme 物件

---

#### `DELETE /api/media/schemes/{id}` — 刪除方案

刪除方案及其所有素材（含 R2 檔案）。**正在 live 的方案無法刪除。**

---

#### `PUT /api/media/schemes/live` — 設定 Live 方案

同一時間只有一個方案為 live。

**Request Body:**

```json
{ "schemeId": "uuid" }
```

---

#### `PUT /api/media/schemes/{id}/pin` — 釘選／取消釘選（⚠️ 前端已棄用）

> ⚠️ **前端不再呼叫此 API。** 釘選功能已改為純前端狀態（`pinnedMediaId: string | null`），在 ControlPanel 點擊個別圖片的釘選按鈕即可固定顯示，無需 API。

---

#### `POST /api/media/schemes/{id}/items/presign` — 上傳素材（取得預簽章 URL）

**Step 1 — 取得 URL**

**Request Body:**

```json
{
  "fileName": "photo.jpg",
  "contentType": "image/jpeg",
  "fileSize": 204800
}
```

**回應 `data`:**

```json
{
  "itemId": "uuid",
  "uploadUrl": "https://xxx.r2.cloudflarestorage.com/...?X-Amz-Signature=...（60分鐘有效）",
  "fileKey": "schemes/uuid/uuid/photo.jpg",
  "readUrl": "https://pub-xxx.r2.dev/schemes/uuid/uuid/photo.jpg",
  "fileName": "photo.jpg",
  "expiresInSeconds": 3600
}
```

**Step 2 — 直接 PUT 上傳到 R2**

```js
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },  // 必須與 Step 1 的 contentType 一致
  body: file,
});
// 200 OK → 上傳完成，readUrl 即可使用
```

> `readUrl` 在 Step 1 回傳時就已永久有效，不需等上傳完成才取得。

---

#### `PUT /api/media/schemes/{id}/items/order` — 調整素材排序

**Request Body:**

```json
{
  "itemIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

傳入完整的素材 UUID 陣列，順序即為新的排列。

---

#### `PATCH /api/media/schemes/{id}/items/{itemId}/visibility` — 切換可見性

**Request Body:** `{ "visible": false }`

隱藏後不刪除檔案，`isVisible: false` 的素材不出現在輪播中。

---

#### `DELETE /api/media/schemes/{id}/items/{itemId}` — 刪除素材

從方案移除素材，同時刪除 R2 上的對應檔案。

---

## 快速參考

| 功能 | 方式 | 端點 |
|---|---|---|
| 初始載入留言 | REST | `GET /api/messages` |
| 即時接收新留言 | WebSocket | `/topic/messages` → `message:new` |
| 初始載入票數 | REST | `GET /api/votes/options` |
| 投票結束取得最終結果 | REST | `GET /api/votes/options` |
| 開始／結束投票 | REST | `PATCH /admin/voting-session/status` |
| 查看抽獎池 | REST | `GET /api/v1/participants/eligible` |
| 執行抽獎 | REST | `POST /api/v1/winners` |
| 取得所有中獎記錄 | REST | `GET /api/v1/winners` |
| 重設所有得獎記錄 | REST | `DELETE /api/v1/winners` |
| 取得媒體清單（含圖片 URL）| REST | `GET /api/media/schemes` |
| 上傳圖片／影片 | REST × 2 | `POST presign` → `PUT {uploadUrl}` |
