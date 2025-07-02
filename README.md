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
- 📱 **響應式設計** - 完美支援各種設備
- 💾 **本地存儲** - 資料本地保存

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
- **資料存儲**: localStorage

## 授權

MIT License
