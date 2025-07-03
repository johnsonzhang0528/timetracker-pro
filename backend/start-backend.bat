@echo off
echo 🔧 啟動 TimeTracker Pro 後端服務器...
echo.

cd /d "%~dp0"

echo 📊 檢查 Node.js 版本...
node --version
echo.

echo 🗄️ 生成 Prisma 客戶端...
npx prisma generate
echo.

echo 🌱 執行資料庫遷移...
npx prisma migrate dev --name init
echo.

echo 🌱 填入種子資料...
npm run db:seed
echo.

echo 🚀 啟動開發服務器...
npm run dev
