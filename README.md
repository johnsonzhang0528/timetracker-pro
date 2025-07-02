# TimeTracker Pro

智能時間追蹤與計費工具

## 專案結構

```
TimeTracker Pro/
├── 📄 App.jsx                  # 主應用程式
├── 📄 main.jsx                 # 應用程式入口點
├── 📄 index.html               # HTML 模板
├── 📄 styles.css               # 主要樣式文件
├── 🎨 tailwind.config.js       # Tailwind CSS 配置
├── ⚙️ vite.config.js           # Vite 構建配置
├── 📦 package.json             # 依賴和腳本
├── 🧩 Components/              # React 組件
│   ├── TimeTracker.jsx         # 時間追蹤器
│   ├── ProjectManager.jsx      # 專案管理
│   ├── Reports.jsx             # 報表分析
│   ├── Invoice.jsx             # 發票生成
│   ├── Navigation.jsx          # 導航組件
│   └── Toast.jsx               # 通知組件
├── 🔧 Hooks/                   # 自定義 React Hooks
│   └── useTimeTracker.js       # 時間追蹤邏輯
├── 🛠️ Utils/                   # 工具函數
│   └── helpers.js              # 格式化和計算函數
└── ⚙️ Constants/               # 常數定義
    └── index.js                # 應用程式常數
```

## 功能特色

- ⏱️ **時間追蹤** - 精準計時與自動收入計算
- 📊 **專案管理** - 客戶與專案資訊管理
- 📈 **報表分析** - 多維度數據統計
- 🧾 **發票生成** - 專業發票自動生成
- � **用戶系統** - 安全登入與個人化設定
- �📱 **響應式設計** - 完美支援各種設備
- 💾 **資料同步** - 雲端儲存與跨裝置同步

## 用戶系統功能

### 認證功能

- 📝 **用戶註冊** - 快速建立個人帳戶
- 🔐 **安全登入** - JWT 認證機制
- 🔒 **密碼重設** - 郵件驗證流程
- 🎯 **演示帳號** - 快速體驗功能 (demo@timetracker.pro / demo123)

### 個人化設定

- 👤 **個人資料管理** - 姓名、聯絡資訊設定
- ⚙️ **工作環境設定** - 時區、貨幣、工作時間
- 🔔 **通知偏好** - 提醒間隔、通知開關
- 🎨 **介面主題** - 明亮/暗黑模式切換

### 方案管理

- 🆓 **免費版** - 基礎功能，單一專案
- 💎 **Pro 版** - 無限專案，進階報表，雲端同步
- 🏢 **商業版** - 團隊協作，API 存取

## 開發命令

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build

# 代碼檢查
npm run lint
```

## 技術棧

- **前端框架**: React 18
- **構建工具**: Vite
- **樣式系統**: Tailwind CSS
- **圖標庫**: Lucide React
- **認證系統**: JWT 模擬認證
- **狀態管理**: React Context + Hooks
- **資料存儲**: localStorage (本地開發) → 未來雲端同步

## 快速開始

### 演示帳號

- **帳號**: `demo@timetracker.pro`
- **密碼**: `demo123`

### 安裝與運行

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 瀏覽器訪問
http://localhost:3000
```

## 開發狀態

### ✅ 已完成功能

- 🎯 **核心時間追蹤** - 計時器、專案管理、報表分析
- 👤 **用戶認證系統** - 登入、註冊、用戶設定
- 📱 **響應式設計** - 完美支援手機、平板、桌面
- 🎨 **現代化 UI** - 美觀的界面設計和動畫效果
- 🔐 **安全性** - JWT 認證機制（模擬）

### 🚧 開發中功能

- ☁️ **雲端同步** - 後端 API 開發
- 💳 **付費系統** - 訂閱管理和計費
- 🔔 **推播通知** - PWA 功能增強

## 授權

MIT License
