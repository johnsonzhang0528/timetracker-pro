import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_CONFIG, checkAPIAvailability, log, API_STATUS } from '../config/api';
import { networkDetector, apiClient } from '../Utils/ApiClient';
import { offlineSync, SYNC_STATUS } from '../Utils/OfflineSync';

// API 狀態上下文
const APIContext = createContext(null);

// API 狀態 Provider
export const APIProvider = ({ children }) => {
  const [apiStatus, setApiStatus] = useState(API_STATUS.IDLE);
  const [apiInfo, setApiInfo] = useState(null);
  const [useAPI, setUseAPI] = useState(API_CONFIG.useAPI);
  const [error, setError] = useState(null);
  
  // 同步狀態
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [syncProgress, setSyncProgress] = useState({ synced: 0, failed: 0, conflicts: 0 });

  // 檢查 API 狀態
  const checkAPI = async () => {
    if (!API_CONFIG.useAPI) {
      log.info('API 模式已禁用，使用本地存儲模式');
      setApiStatus(API_STATUS.OFFLINE);
      setUseAPI(false);
      return;
    }

    log.info('檢查 API 可用性...');
    setApiStatus(API_STATUS.LOADING);
    setError(null);

    try {
      const result = await checkAPIAvailability();
      
      if (result.available) {
        log.info('API 可用:', result);
        setApiStatus(API_STATUS.SUCCESS);
        setApiInfo(result);
        setUseAPI(true);
        setError(null);
      } else {
        log.warn('API 不可用:', result.reason);
        setApiStatus(API_STATUS.OFFLINE);
        setUseAPI(false);
        setError(result.reason);
      }
    } catch (err) {
      log.error('API 檢查失敗:', err);
      setApiStatus(API_STATUS.ERROR);
      setUseAPI(false);
      setError(err.message);
    }
  };

  // 強制切換到本地模式
  const forceLocalMode = () => {
    log.info('強制切換到本地存儲模式');
    setApiStatus(API_STATUS.OFFLINE);
    setUseAPI(false);
    setError('手動切換到本地模式');
  };

  // 重試 API 連接
  const retryAPI = () => {
    log.info('重試 API 連接');
    checkAPI();
  };

  // 手動觸發同步
  const triggerSync = async () => {
    if (!apiClient.isOnline()) {
      return { success: false, message: '網路連接不可用，無法同步' };
    }
    
    try {
      return await apiClient.syncOfflineOperations();
    } catch (error) {
      return { success: false, message: `同步失敗: ${error.message}` };
    }
  };

  // 初始化時檢查 API
  useEffect(() => {
    checkAPI();
  }, []);

  // 監聽網路狀態變化
  useEffect(() => {
    const handleNetworkChange = (isOnline) => {
      log.info(`網路狀態變化: ${isOnline ? '在線' : '離線'}`);
      
      if (isOnline) {
        // 網路恢復時嘗試切換到API模式
        checkAPI();
      } else {
        // 網路斷開時切換到離線模式
        setApiStatus(API_STATUS.OFFLINE);
        setUseAPI(false);
        setError('網路連接中斷');
      }
    };
    
    networkDetector.addListener(handleNetworkChange);
    return () => networkDetector.removeListener(handleNetworkChange);
  }, []);

  // 監聽同步狀態變化
  useEffect(() => {
    const handleSyncStatusChange = (status, data) => {
      setSyncStatus(status);
      if (data) {
        setSyncProgress(data);
      }
    };
    
    offlineSync.addSyncListener(handleSyncStatusChange);
    return () => offlineSync.removeSyncListener(handleSyncStatusChange);
  }, []);

  // 定期檢查 API 狀態（僅在錯誤狀態下）
  useEffect(() => {
    if (apiStatus === API_STATUS.ERROR || apiStatus === API_STATUS.OFFLINE) {
      const interval = setInterval(() => {
        if (API_CONFIG.useAPI) {
          log.debug('定期檢查 API 狀態...');
          checkAPI();
        }
      }, 30000); // 每 30 秒檢查一次

      return () => clearInterval(interval);
    }
  }, [apiStatus]);

  const value = {
    // 狀態
    apiStatus,
    apiInfo,
    useAPI,
    error,
    
    // 同步狀態
    syncStatus,
    syncProgress,
    
    // 操作
    checkAPI,
    forceLocalMode,
    retryAPI,
    triggerSync,
    
    // 配置
    config: API_CONFIG,
  };

  return (
    <APIContext.Provider value={value}>
      {children}
    </APIContext.Provider>
  );
};

// 使用 API 狀態的 Hook
export const useAPIStatus = () => {
  const context = useContext(APIContext);
  if (!context) {
    throw new Error('useAPIStatus must be used within an APIProvider');
  }
  return context;
};

// API 狀態指示器組件
export const APIStatusIndicator = () => {
  const { apiStatus, apiInfo, error, retryAPI } = useAPIStatus();
  
  if (apiStatus === API_STATUS.SUCCESS) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#166534'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: '#22c55e',
          borderRadius: '50%'
        }} />
        API 在線 {apiInfo?.version && `(v${apiInfo.version})`}
      </div>
    );
  }
  
  if (apiStatus === API_STATUS.ERROR || apiStatus === API_STATUS.OFFLINE) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#991b1b'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: '#ef4444',
          borderRadius: '50%'
        }} />
        離線模式
        <button
          onClick={retryAPI}
          style={{
            marginLeft: '8px',
            padding: '2px 6px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          重試
        </button>
      </div>
    );
  }
  
  if (apiStatus === API_STATUS.LOADING) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#fffbeb',
        border: '1px solid #fed7aa',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#9a3412'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: '#f59e0b',
          borderRadius: '50%',
          animation: 'pulse 1s infinite'
        }} />
        檢查中...
      </div>
    );
  }
  
  return null;
};

// CSS 動畫
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

export default APIProvider;
