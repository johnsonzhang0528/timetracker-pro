@echo off
echo 🚀 啟動 TimeTracker Pro 開發環境...
echo.

echo 📊 檢查 Node.js 版本...
node --version
echo.

echo 🔧 啟動後端服務器...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "start-backend.bat"
echo ✅ 後端服務器正在啟動... (http://localhost:5000)
echo.

echo ⏳ 等待後端啟動完成...
timeout /t 5 /nobreak >nul
echo.

echo 🎨 啟動前端開發服務器...
cd /d "%~dp0"
start "Frontend Server" cmd /k "npm run dev"
echo ✅ 前端服務器正在啟動... (http://localhost:3000)
echo.

echo 🌟 TimeTracker Pro 開發環境已啟動！
echo 📱 前端: http://localhost:3000
echo 🔧 後端: http://localhost:5000
echo 🧪 API 測試: api-test.html
echo.
echo 按任意鍵關閉此窗口...
pause >nul
