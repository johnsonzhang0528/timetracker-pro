import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-Clean.jsx'
import './styles-clean.css'

// 錯誤邊界組件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React 錯誤:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">應用程式遇到問題</h1>
            <p className="text-gray-600 mb-4">請重新整理頁面或聯絡技術支援</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 開發模式的性能監控
if (import.meta.env.DEV) {
  // 監控性能
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`📊 頁面載入時間: ${loadTime}ms`);
        
        if (loadTime > 3000) {
          console.warn('⚠️ 頁面載入時間較長，建議優化');
        }
      }, 0);
    });
  }
  
  // 記憶體使用監控
  if ('memory' in performance) {
    setInterval(() => {
      const memory = performance.memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576);
      const total = Math.round(memory.totalJSHeapSize / 1048576);
      
      if (used > 50) {  // 50MB
        console.warn(`🚨 記憶體使用量較高: ${used}MB / ${total}MB`);
      }
    }, 30000); // 每30秒檢查一次
  }
}

// 建立 React 根元素
const root = ReactDOM.createRoot(document.getElementById('root'));

// 渲染應用程式
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// 註冊 Service Worker (生產環境)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker 註冊成功:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Service Worker 註冊失敗:', error);
      });
  });
}

// 全域錯誤處理
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ 未處理的 Promise 拒絕:', event.reason);
  // 可以在這裡添加錯誤回報邏輯
});

// 開發模式下的快捷鍵
if (import.meta.env.DEV) {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + D: 顯示除錯資訊
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      console.group('🔍 TimeTracker Pro 除錯資訊');
      console.log('📱 環境:', import.meta.env.MODE);
      console.log('📊 Local Storage:', {
        projects: localStorage.getItem('timeTracker_projects'),
        entries: localStorage.getItem('timeTracker_entries'),
        currentTime: localStorage.getItem('timeTracker_currentTime'),
        isTracking: localStorage.getItem('timeTracker_isTracking')
      });
      console.log('🔧 使用者代理:', navigator.userAgent);
      console.log('📏 視窗尺寸:', `${window.innerWidth}x${window.innerHeight}`);
      console.groupEnd();
    }
    
    // Ctrl/Cmd + Shift + C: 清除所有資料
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      if (confirm('確定要清除所有本地資料嗎？此動作無法復原。')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  });
  
  console.log('🚀 TimeTracker Pro 開發模式已啟動');
  console.log('💡 快捷鍵: Ctrl+Shift+D (除錯資訊), Ctrl+Shift+C (清除資料)');
}
