# 素材管理系統 — Backend API 規格

Base URL: `{API_BASE}/` (前端預設 `http://localhost:8080/api`)

---

## 共用型別

```typescript
interface MediaItem {
  id: string;       // 素材唯一識別碼
  url: string;      // 公開讀取 URL（R2 public URL）
  type: "image" | "video";
  visible: boolean; // 是否在輪播中顯示
}

interface MediaSchemeData {
  schemeIds: string[];                    // 方案名稱陣列，順序即顯示順序
  schemes: Record<string, MediaItem[]>;   // key = 方案名稱, value = 該方案的素材清單
}
```

---

## 1. 取得所有方案及素材

```
GET /media/schemes
```

**描述**: 頁面載入時呼叫，取回所有方案清單及每個方案底下的素材列表。

**Response** `200`

```json
{
  "schemeIds": ["婚禮主視覺", "迎賓"],
  "schemes": {
    "婚禮主視覺": [
      { "id": "m1", "url": "https://r2.example.com/photo1.jpg", "type": "image", "visible": true },
      { "id": "m2", "url": "https://r2.example.com/video1.mp4", "type": "video", "visible": false }
    ],
    "迎賓": []
  }
}
```

> `schemeIds` 陣列順序即為方案的顯示順序。

---

## 2. 新增方案

```
POST /media/schemes
```

**描述**: 建立一個新的空方案。

**Request Body**

```json
{ "name": "送客" }
```

**Response** `201`

```json
{
  "schemeId": "送客",
  "schemes": { /* 完整的 MediaSchemeData */ }
}
```

**錯誤處理**: 若 `name` 已存在，回 `409 Conflict`。

---

## 3. 重新命名方案

```
PUT /media/schemes/:id/rename
```

**描述**: 修改指定方案的名稱。方案底下的素材不受影響。

**Path Params**: `id` — 現有方案名稱（URL encoded）

**Request Body**

```json
{ "newName": "進場" }
```

**Response** `200`

```json
{ /* 完整的 MediaSchemeData */ }
```

**錯誤處理**: `newName` 已存在 → `409`；`id` 不存在 → `404`。

---

## 4. 刪除方案

```
DELETE /media/schemes/:id
```

**描述**: 刪除指定方案及其底下所有素材。若該方案正在直播中，前端已擋掉不會送出請求，但後端仍建議檢查。

**Path Params**: `id` — 方案名稱

**Response** `200`

```json
{ /* 完整的 MediaSchemeData（刪除後的最新狀態）*/ }
```

**錯誤處理**: `id` 不存在 → `404`；正在直播中的方案 → `400`。

---

## 5. 設定直播方案

```
PUT /media/schemes/live
```

**描述**: 切換目前在應援牆播放的方案。同一時間只有一個方案為 live。

**Request Body**

```json
{ "schemeId": "婚禮主視覺" }
```

**Response** `200`

```json
{ "ok": true }
```

**錯誤處理**: `schemeId` 不存在 → `404`。

---

## 6. 請求素材上傳用 Presigned URLs

```
POST /media/schemes/:id/items/presign
```

**描述**: 前端選好檔案後，先把檔案 metadata 送到後端。後端為每個檔案產生一組 R2 presigned PUT URL，同時預建對應的 `MediaItem` 記錄（含最終的公開讀取 URL）。前端收到後會直接 PUT binary 到 R2。

**Path Params**: `id` — 目標方案名稱

**Request Body**

```json
{
  "files": [
    { "name": "photo1.jpg", "type": "image/jpeg", "size": 2048000 },
    { "name": "intro.mp4", "type": "video/mp4", "size": 15000000 }
  ]
}
```

**Response** `200`

```json
{
  "items": [
    {
      "uploadUrl": "https://r2-bucket.example.com/uploads/abc123?X-Amz-Signature=...",
      "mediaItem": {
        "id": "abc123",
        "url": "https://pub.r2.example.com/abc123.jpg",
        "type": "image",
        "visible": true
      }
    },
    {
      "uploadUrl": "https://r2-bucket.example.com/uploads/def456?X-Amz-Signature=...",
      "mediaItem": {
        "id": "def456",
        "url": "https://pub.r2.example.com/def456.mp4",
        "type": "video",
        "visible": true
      }
    }
  ]
}
```

**後端實作重點**:

1. 為每個檔案產生唯一 ID
2. 用 R2 S3-compatible SDK 產生 presigned PUT URL（建議 expiry 10 分鐘）
3. 將 `MediaItem` 記錄存入 DB，`url` 為該物件的公開讀取 URL
4. 將新素材插入該方案的素材清單

> 前端拿到 `uploadUrl` 後會 `PUT` file binary 並帶 `Content-Type` header。

---

## 7. 調整素材排序

```
PUT /media/schemes/:id/items/order
```

**描述**: 前端拖拽排序完成後，送出新的排序結果。`itemIds` 陣列順序即為排序後的順序。

**Path Params**: `id` — 方案名稱

**Request Body**

```json
{
  "itemIds": ["m2", "m1", "m3"]
}
```

**Response** `200`

```json
[
  { "id": "m2", "url": "...", "type": "image", "visible": true },
  { "id": "m1", "url": "...", "type": "video", "visible": true },
  { "id": "m3", "url": "...", "type": "image", "visible": false }
]
```

---

## 8. 切換素材可見性

```
PATCH /media/schemes/:id/items/:itemId/visibility
```

**描述**: 控制單一素材是否出現在輪播中。`visible: false` 的素材不會在應援牆顯示，但仍保留在方案裡。

**Path Params**: `id` — 方案名稱、`itemId` — 素材 ID

**Request Body**

```json
{ "visible": false }
```

**Response** `200`

```json
{ "id": "m1", "url": "...", "type": "image", "visible": false }
```

---

## 9. 刪除素材

```
DELETE /media/schemes/:id/items/:itemId
```

**描述**: 永久刪除指定素材。建議後端同時刪除 R2 上的檔案。

**Path Params**: `id` — 方案名稱、`itemId` — 素材 ID

**Response** `200`

```json
{ "ok": true }
```

---

## 10. 釘選素材

```
PUT /media/schemes/:id/pin
```

**描述**: 釘選某個素材，使應援牆固定顯示該素材而不輪播。傳 `null` 取消釘選恢復輪播。每個方案同時只能釘選一個素材。

> ⚠️ **前端已棄用此端點。** 釘選功能已改為純前端狀態，不再呼叫此 API。如需後端同步釘選狀態，需重新接入。

**Path Params**: `id` — 方案名稱

**Request Body**

```json
{ "mediaId": "m1" }
```

或取消釘選：

```json
{ "mediaId": null }
```

**Response** `200`

```json
{ "ok": true }
```

---

## 11. 更新顯示設定

```
PUT /display/settings
```

**描述**: 調整應援牆的全域顯示參數。所有欄位皆為 optional，只更新有傳的欄位。

**Request Body**（部分更新）

```json
{
  "showWallMessages": true,
  "slideshowSpeed": 8,
  "messageScrollSpeed": 40
}
```

| 欄位 | 型別 | 說明 |
|------|------|------|
| `showWallMessages` | `boolean` | 是否顯示留言牆 overlay |
| `slideshowSpeed` | `number` | 輪播間隔秒數（範圍 3–30） |
| `messageScrollSpeed` | `number` | 留言滾動速度秒數（範圍 10–100） |

**Response** `200`

```json
{ "ok": true }
```

---

## 共用錯誤格式

所有錯誤統一回傳：

```json
{
  "error": "Scheme not found",
  "code": "NOT_FOUND"
}
```

| HTTP Status | 使用情境 |
|-------------|---------|
| `400` | 參數不合法、不允許的操作（如刪除直播中方案） |
| `404` | 方案或素材 ID 不存在 |
| `409` | 名稱衝突（新增 / 重命名） |
| `500` | 伺服器內部錯誤 |
