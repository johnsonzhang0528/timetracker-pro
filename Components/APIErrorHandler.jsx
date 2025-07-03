import React, { useState, useEffect } from 'react';
import { useAPIStatus } from '../contexts/APIContext';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const APIErrorHandler = ({ children }) => {
  const { apiStatus, error, retryAPI, useAPI } = useAPIStatus();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // 自動重試邏輯
  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 5000; // 5秒

    if (apiStatus === 'error' && retryCount < maxRetries && !isRetrying) {
      const timer = setTimeout(() => {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        console.log(`🔄 自動重試 API 連接 (${retryCount + 1}/${maxRetries})`);
        
        retryAPI().finally(() => {
          setIsRetrying(false);
        });
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [apiStatus, retryCount, isRetrying, retryAPI]);

  // 重置重試計數
  useEffect(() => {
    if (apiStatus === 'success') {
      setRetryCount(0);
    }
  }, [apiStatus]);

  // 手動重試
  const handleManualRetry = () => {
    setIsRetrying(true);
    setRetryCount(0);
    retryAPI().finally(() => {
      setIsRetrying(false);
    });
  };

  // 如果不使用 API，直接渲染子組件
  if (!useAPI) {
    return children;
  }

  return (
    <>
      {children}
      
      {/* API 狀態通知 */}
      {(apiStatus === 'error' || apiStatus === 'offline') && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800 mb-1">
                  API 連接問題
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  {error || '無法連接到服務器，已切換到離線模式'}
                </p>
                
                {retryCount > 0 && (
                  <p className="text-xs text-yellow-600 mb-3">
                    已自動重試 {retryCount} 次
                  </p>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRetry}
                    disabled={isRetrying}
                    className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                    {isRetrying ? '重試中...' : '重試連接'}
                  </button>
                  
                  <span className="text-xs text-yellow-600">
                    數據已在本地保存
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 連接成功通知 */}
      {apiStatus === 'success' && retryCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800 mb-1">
                  連接已恢復
                </h4>
                <p className="text-sm text-green-700">
                  API 連接已成功恢復，數據將自動同步
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default APIErrorHandler;
