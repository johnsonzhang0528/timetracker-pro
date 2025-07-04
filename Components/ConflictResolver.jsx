import React, { useState, useEffect } from 'react';
import { useAPIStatus } from '../contexts/APIContext';
import { offlineSync, SYNC_STATUS } from '../Utils/OfflineSync';
import { SYNC_CONSTANTS } from '../Constants';

const ConflictResolver = () => {
  const { syncStatus, syncProgress, triggerSync } = useAPIStatus();
  const [conflicts, setConflicts] = useState([]);
  const [selectedResolutions, setSelectedResolutions] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  
  // 獲取衝突數據並打開對話框
  useEffect(() => {
    if (syncStatus === SYNC_STATUS.CONFLICT) {
      // 獲取當前衝突
      const currentConflicts = offlineSync.getConflicts();
      setConflicts(currentConflicts);
      
      // 初始化所有衝突的默認解決方式為"使用本地"
      const initialResolutions = {};
      currentConflicts.forEach(conflict => {
        initialResolutions[conflict.id] = SYNC_CONSTANTS.CONFLICT_STRATEGIES.LOCAL;
      });
      setSelectedResolutions(initialResolutions);
      
      // 打開對話框
      setIsOpen(true);
    }
  }, [syncStatus]);
  
  // 處理URL hash變化
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#conflicts') {
        setIsOpen(true);
      } else if (isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    // 初始檢查
    if (window.location.hash === '#conflicts') {
      setIsOpen(true);
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isOpen]);
  
  // 如果沒有衝突或不顯示，返回null
  if (!isOpen || conflicts.length === 0) {
    return null;
  }
  
  // 解決所有衝突
  const resolveAllConflicts = async () => {
    for (const conflict of conflicts) {
      await offlineSync.resolveConflict(
        conflict.id, 
        selectedResolutions[conflict.id]
      );
    }
    
    // 關閉對話框
    setIsOpen(false);
    
    // 清除URL hash
    window.location.hash = '';
    
    // 觸發重新同步
    setTimeout(() => {
      triggerSync();
    }, 500);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">資料衝突解決</h2>
        <p className="text-gray-600 mb-6">
          在同步過程中發現 {conflicts.length} 個資料衝突。
          請選擇如何解決每個衝突。
        </p>
        
        {conflicts.map(conflict => (
          <div key={conflict.id} className="mb-6 border-b pb-4">
            <h3 className="font-semibold mb-2">{conflict.dataType} 衝突</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded p-3">
                <h4 className="text-sm font-medium mb-2">本地資料 (離線時修改)</h4>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(conflict.localData, null, 2)}
                </pre>
              </div>
              
              <div className="border rounded p-3">
                <h4 className="text-sm font-medium mb-2">伺服器資料</h4>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(conflict.serverData, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="mt-3 flex items-center">
              <span className="text-sm mr-3">解決方式:</span>
              <select 
                value={selectedResolutions[conflict.id]} 
                onChange={(e) => setSelectedResolutions({
                  ...selectedResolutions,
                  [conflict.id]: e.target.value
                })}
                className="text-sm border rounded px-2 py-1"
              >
                <option value={SYNC_CONSTANTS.CONFLICT_STRATEGIES.LOCAL}>使用本地資料</option>
                <option value={SYNC_CONSTANTS.CONFLICT_STRATEGIES.SERVER}>使用伺服器資料</option>
                <option value={SYNC_CONSTANTS.CONFLICT_STRATEGIES.MERGE}>合併資料</option>
              </select>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end space-x-3 mt-4">
          <button 
            onClick={() => {
              setIsOpen(false);
              window.location.hash = '';
            }}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button 
            onClick={resolveAllConflicts}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            應用解決方案
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolver;
