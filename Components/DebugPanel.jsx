import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../Hooks/useAuth';
import { useAPIStatus } from '../contexts/APIContext';
import { Bug, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle, Monitor } from 'lucide-react';
import SystemTester from '../Utils/SystemTester';

const DebugPanel = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, checkAuthStatus } = useAuthContext();
  const { apiStatus, useAPI, error: apiError } = useAPIStatus();
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [systemInfo, setSystemInfo] = useState({});

  // 收集系統資訊
  useEffect(() => {
    if (isOpen) {
      const info = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        cookiesEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB,
        serviceWorker: 'serviceWorker' in navigator,
        webWorker: typeof Worker !== 'undefined',
        geolocation: 'geolocation' in navigator,
        notification: 'Notification' in window,
        performance: 'performance' in window,
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        } : null
      };
      setSystemInfo(info);
    }
  }, [isOpen]);

  // 執行系統測試
  const runSystemTests = async () => {
    setIsRunningTests(true);
    try {
      const tester = new SystemTester();
      const results = await tester.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('測試執行失敗:', error);
      setTestResults({
        passed: 0,
        failed: 1,
        warnings: 0,
        errors: [{ test: '測試執行', error: error.message }]
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  // 清除本地數據
  const clearLocalData = () => {
    if (confirm('確定要清除所有本地資料嗎？此動作無法復原。')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('本地資料已清除，頁面將重新載入');
      window.location.reload();
    }
  };

  // 測試 API 連接
  const testAPIConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        const data = await response.json();
        alert(`API 連接成功\\n狀態: ${data.status}\\n版本: ${data.version}`);
      } else {
        alert(`API 連接失敗\\n狀態碼: ${response.status}`);
      }
    } catch (error) {
      alert(`API 連接失敗\\n錯誤: ${error.message}`);
    }
  };

  // 匯出除錯資訊
  const exportDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      system: systemInfo,
      authentication: {
        isAuthenticated,
        user: user ? { id: user.id, email: user.email, name: user.name } : null
      },
      api: {
        status: apiStatus,
        useAPI,
        error: apiError
      },
      localStorage: {
        projects: localStorage.getItem('timetracker_projects'),
        entries: localStorage.getItem('timetracker_entries'),
        user: localStorage.getItem('timetracker_user_data'),
        token: localStorage.getItem('timetracker_auth_token') ? '***' : null
      },
      testResults
    };

    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetracker-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">系統除錯面板</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 快速操作 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={runSystemTests}
              disabled={isRunningTests}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunningTests ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunningTests ? '測試中...' : '執行測試'}
            </button>

            <button
              onClick={testAPIConnection}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Monitor className="w-4 h-4" />
              測試 API
            </button>

            <button
              onClick={clearLocalData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <XCircle className="w-4 h-4" />
              清除資料
            </button>

            <button
              onClick={exportDebugInfo}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Bug className="w-4 h-4" />
              匯出資訊
            </button>
          </div>

          {/* 測試結果 */}
          {testResults && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">測試結果</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>通過: {testResults.passed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>失敗: {testResults.failed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span>警告: {testResults.warnings}</span>
                </div>
              </div>
              
              {testResults.errors?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-800 mb-2">錯誤詳情：</h4>
                  <ul className="space-y-1 text-sm">
                    {testResults.errors.map((error, index) => (
                      <li key={index} className="text-red-700">
                        • {error.test}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 系統狀態 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">認證狀態</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>認證狀態:</span>
                  <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {isAuthenticated ? '已認證' : '未認證'}
                  </span>
                </div>
                {user && (
                  <>
                    <div className="flex justify-between">
                      <span>用戶名稱:</span>
                      <span>{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>電子郵件:</span>
                      <span>{user.email}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">API 狀態</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>API 模式:</span>
                  <span className={useAPI ? 'text-green-600' : 'text-yellow-600'}>
                    {useAPI ? '已啟用' : '本地模式'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>連接狀態:</span>
                  <span className={
                    apiStatus === 'success' ? 'text-green-600' :
                    apiStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }>
                    {apiStatus === 'success' ? '已連接' :
                     apiStatus === 'error' ? '錯誤' : '檢查中'}
                  </span>
                </div>
                {apiError && (
                  <div className="flex justify-between">
                    <span>錯誤:</span>
                    <span className="text-red-600 truncate">{apiError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 系統資訊 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">系統資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span>瀏覽器:</span>
                  <span className="truncate">{systemInfo.userAgent?.split(' ')[0] || 'Unknown'}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>語言:</span>
                  <span>{systemInfo.language}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>平台:</span>
                  <span>{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>螢幕解析度:</span>
                  <span>{systemInfo.screenResolution}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>視窗大小:</span>
                  <span>{systemInfo.viewportSize}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Local Storage:</span>
                  <span className={systemInfo.localStorage ? 'text-green-600' : 'text-red-600'}>
                    {systemInfo.localStorage ? '支援' : '不支援'}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Service Worker:</span>
                  <span className={systemInfo.serviceWorker ? 'text-green-600' : 'text-red-600'}>
                    {systemInfo.serviceWorker ? '支援' : '不支援'}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>線上狀態:</span>
                  <span className={systemInfo.onlineStatus ? 'text-green-600' : 'text-red-600'}>
                    {systemInfo.onlineStatus ? '線上' : '離線'}
                  </span>
                </div>
                {systemInfo.memory && (
                  <div className="flex justify-between mb-1">
                    <span>記憶體使用:</span>
                    <span className={systemInfo.memory.used > 50 ? 'text-yellow-600' : 'text-green-600'}>
                      {systemInfo.memory.used}MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 本地存儲資訊 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">本地存儲資訊</h3>
            <div className="space-y-2 text-sm">
              {['timetracker_projects', 'timetracker_entries', 'timetracker_user_data', 'timetracker_auth_token'].map(key => {
                const data = localStorage.getItem(key);
                return (
                  <div key={key} className="flex justify-between">
                    <span>{key.replace('timetracker_', '')}:</span>
                    <span className={data ? 'text-green-600' : 'text-gray-400'}>
                      {data ? (key.includes('token') ? '***' : `${data.length} 字符`) : '無資料'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
