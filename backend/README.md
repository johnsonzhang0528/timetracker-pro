# TimeTracker Pro 後端 API

智能時間追蹤與計費工具的後端服務

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境設定

複製環境變數範例檔案並設定：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定以下變數：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/timetracker_pro"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

### 3. 資料庫設定

```bash
# 生成 Prisma 客戶端
npm run db:generate

# 執行資料庫遷移
npm run db:migrate

# (可選) 填入種子資料
npm run db:seed
```

### 4. 啟動開發服務器

```bash
npm run dev
```

服務器將在 `http://localhost:5000` 啟動

## API 文檔

### 認證 API

#### 用戶註冊

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "使用者名稱"
}
```

#### 用戶登入

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 刷新令牌

```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### 驗證令牌

```
GET /api/auth/verify
Authorization: Bearer your-access-token
```

### 用戶管理 API

#### 獲取用戶資料

```
GET /api/users/profile
Authorization: Bearer your-access-token
```

#### 更新用戶資料

```
PUT /api/users/profile
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "name": "新的使用者名稱",
  "avatar": "頭像 URL"
}
```

#### 獲取用戶設定

```
GET /api/users/settings
Authorization: Bearer your-access-token
```

#### 更新用戶設定

```
PUT /api/users/settings
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "timezone": "Asia/Taipei",
  "currency": "TWD",
  "hourlyRate": 500,
  "workingHours": {
    "start": "09:00",
    "end": "18:00"
  }
}
```

### 專案管理 API

#### 獲取專案列表

```
GET /api/projects?page=1&limit=10&status=ACTIVE
Authorization: Bearer your-access-token
```

#### 創建專案

```
POST /api/projects
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "name": "專案名稱",
  "description": "專案描述",
  "clientId": "客戶 ID",
  "hourlyRate": 500,
  "color": "#3B82F6"
}
```

#### 更新專案

```
PUT /api/projects/:id
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "name": "更新的專案名稱",
  "status": "COMPLETED"
}
```

### 時間追蹤 API

#### 開始計時

```
POST /api/time-entries/start
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "projectId": "專案 ID",
  "description": "工作描述"
}
```

#### 停止計時

```
POST /api/time-entries/stop/:id
Authorization: Bearer your-access-token
```

#### 獲取當前計時狀態

```
GET /api/time-entries/active
Authorization: Bearer your-access-token
```

#### 獲取時間記錄

```
GET /api/time-entries?page=1&limit=10&projectId=專案ID
Authorization: Bearer your-access-token
```

### 客戶管理 API

#### 獲取客戶列表

```
GET /api/clients?page=1&limit=10&search=搜尋關鍵字
Authorization: Bearer your-access-token
```

#### 創建客戶

```
POST /api/clients
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "name": "客戶名稱",
  "email": "client@example.com",
  "company": "公司名稱",
  "phone": "電話號碼",
  "address": "地址"
}
```

### 發票管理 API

#### 獲取發票列表

```
GET /api/invoices?page=1&limit=10&status=DRAFT
Authorization: Bearer your-access-token
```

#### 創建發票

```
POST /api/invoices
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "clientId": "客戶 ID",
  "title": "發票標題",
  "description": "發票描述",
  "items": [
    {
      "description": "項目描述",
      "quantity": 1,
      "rate": 500
    }
  ],
  "tax": 25,
  "issueDate": "2023-07-01",
  "dueDate": "2023-07-31"
}
```

#### 從時間記錄生成發票

```
POST /api/invoices/generate-from-time-entries
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "clientId": "客戶 ID",
  "timeEntryIds": ["時間記錄 ID1", "時間記錄 ID2"],
  "title": "發票標題",
  "issueDate": "2023-07-01"
}
```

### 報表 API

#### 獲取時間統計

```
GET /api/reports/time-stats?period=thisWeek&projectId=專案ID
Authorization: Bearer your-access-token
```

#### 獲取收入統計

```
GET /api/reports/income-stats?period=thisMonth
Authorization: Bearer your-access-token
```

#### 獲取專案效率報表

```
GET /api/reports/project-efficiency?period=thisMonth
Authorization: Bearer your-access-token
```

## 資料庫結構

### 主要實體關係

- **User** (用戶)

  - 1:1 → UserSettings (用戶設定)
  - 1:N → Project (專案)
  - 1:N → Client (客戶)
  - 1:N → TimeEntry (時間記錄)
  - 1:N → Invoice (發票)

- **Project** (專案)

  - N:1 → Client (客戶)
  - 1:N → TimeEntry (時間記錄)

- **Invoice** (發票)
  - N:1 → Client (客戶)
  - 1:N → InvoiceItem (發票項目)

## 部署

### 使用 Docker

```bash
# 建立映像
docker build -t timetracker-backend .

# 執行容器
docker run -p 5000:5000 --env-file .env timetracker-backend
```

### 環境變數

生產環境需要設定以下環境變數：

- `DATABASE_URL`: PostgreSQL 連接字串
- `JWT_SECRET`: JWT 密鑰
- `JWT_REFRESH_SECRET`: 刷新令牌密鑰
- `NODE_ENV`: 設定為 `production`
- `FRONTEND_URL`: 前端網站 URL

## 開發指南

### 添加新 API 端點

1. 在 `src/routes/` 目錄下創建或修改路由檔案
2. 在 `src/middleware/validation.js` 中添加資料驗證
3. 更新 `src/server.js` 中的路由註冊
4. 添加相應的測試

### 資料庫遷移

```bash
# 創建新的遷移
npx prisma migrate dev --name migration_name

# 重置資料庫
npx prisma migrate reset
```

### 日誌管理

日誌檔案位於 `logs/` 目錄：

- `error.log`: 錯誤日誌
- `combined.log`: 所有日誌

## 安全性

- 使用 JWT 進行身份驗證
- 密碼使用 bcrypt 加密
- 實施速率限制
- 使用 Helmet 設定安全標頭
- 輸入驗證和清理

## 錯誤處理

API 使用統一的錯誤回應格式：

```json
{
  "success": false,
  "message": "錯誤訊息",
  "errors": [
    {
      "field": "欄位名稱",
      "message": "具體錯誤訊息"
    }
  ]
}
```

## 授權

MIT License
