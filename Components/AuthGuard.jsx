import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../Hooks/useAuth';
import { useAPIStatus } from '../contexts/APIContext';
import { AlertCircle, Wifi, WifiOff, RefreshCw, LogIn } from 'lucide-react';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, checkAuthStatus, user, login, logout } = useAuthContext();
  const { apiStatus, useAPI, error: apiError, retryAPI } = useAPIStatus();
  const [showAuthError, setShowAuthError] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // 檢查認證狀態
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (useAPI) {
          // 如果使用 API 模式，檢查認證狀態
          await checkAuthStatus();
        }
      } catch (error) {
        console.error('認證檢查失敗:', error);
        setShowAuthError(true);
      } finally {
        setAuthCheckComplete(true);
      }
    };

    checkAuth();
  }, [useAPI, checkAuthStatus]);

  // 處理 API 連接錯誤
  const handleAPIError = () => {
    if (apiError && apiError.includes('401')) {
      // 認證錯誤，清除令牌並要求重新登入
      logout();
      setShowAuthError(true);
    }
  };

  useEffect(() => {
    handleAPIError();
  }, [apiError]);

  // 認證錯誤通知
  const AuthErrorNotification = () => (
    <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-red-800 mb-1">認證錯誤</h4>
          <p className="text-sm text-red-600 mb-3">
            您的認證令牌已過期或無效，請重新登入。
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                logout();
                setShowAuthError(false);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              <LogIn className="w-3 h-3" />
              重新登入
            </button>
            <button
              onClick={() => setShowAuthError(false)}
              className="px-3 py-1 text-red-600 text-sm border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // API 狀態指示器
  const APIStatusIndicator = () => (
    <div className="fixed bottom-4 right-4 z-40">
      {apiStatus === 'success' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <Wifi className="w-4 h-4" />
          API 連接正常
        </div>
      )}
      
      {(apiStatus === 'error' || apiStatus === 'offline') && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          <WifiOff className="w-4 h-4" />
          <span>離線模式</span>
          <button
            onClick={retryAPI}
            className="ml-2 p-1 hover:bg-yellow-100 rounded"
            title="重試連接"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}
      
      {apiStatus === 'loading' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <RefreshCw className="w-4 h-4 animate-spin" />
          檢查 API 連接...
        </div>
      )}
    </div>
  );

  // 載入中狀態
  if (!authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">檢查認證狀態...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {showAuthError && <AuthErrorNotification />}
      <APIStatusIndicator />
    </>
  );
};

export default AuthGuard;
