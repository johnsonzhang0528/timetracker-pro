import React from 'react';
import { useAPIStatus } from '../contexts/APIContext';
import { SYNC_STATUS } from '../Utils/OfflineSync';

const SyncStatusIndicator = () => {
  const { syncStatus, syncProgress, triggerSync } = useAPIStatus();
  
  // 如果沒有待同步或正在同步的操作，不顯示
  if (syncStatus === SYNC_STATUS.IDLE || syncStatus === SYNC_STATUS.SUCCESS) {
    return null;
  }
  
  return (
    <div className="fixed bottom-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center gap-3">
        {syncStatus === SYNC_STATUS.PENDING && (
          <>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-700">有待同步的操作</span>
            <button 
              onClick={triggerSync}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              立即同步
            </button>
          </>
        )}
        
        {syncStatus === SYNC_STATUS.SYNCING && (
          <>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm text-gray-700">
              正在同步資料... 
              {syncProgress.synced > 0 && `(${syncProgress.synced}已同步)`}
            </span>
          </>
        )}
        
        {syncStatus === SYNC_STATUS.ERROR && (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-700">
              同步失敗 ({syncProgress.failed}個錯誤)
            </span>
            <button 
              onClick={triggerSync}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              重試
            </button>
          </>
        )}
        
        {syncStatus === SYNC_STATUS.CONFLICT && (
          <>
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-700">
              發現資料衝突 ({syncProgress.conflicts}個衝突)
            </span>
            <button 
              onClick={() => window.location.href = '#conflicts'}
              className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
            >
              查看衝突
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
