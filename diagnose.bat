@echo off
echo 🔍 TimeTracker Pro 快速診斷...
echo.

echo 📊 檢查 Node.js 版本...
node --version
echo.

echo 🗄️ 檢查後端資料庫狀態...
cd /d "%~dp0backend"
npx prisma db push --accept-data-loss
echo.

echo 🌱 重新填入種子資料...
npm run db:seed
echo.

echo 🧪 測試後端 API 連接...
curl -X GET http://localhost:5000/api/health
echo.

echo 🧪 測試演示帳號登入...
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"demo@timetracker.pro\",\"password\":\"demo123\"}"
echo.

echo ✅ 診斷完成！
echo 如果看到 JSON 回應，表示後端正常運作
echo 請檢查 API 測試工具或前端應用
echo.
pause
