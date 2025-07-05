import React, { useState, useEffect } from 'react';
import Navigation from './Components/Navigation';
import TimeTracker from './Components/TimeTracker';
import ProjectManager from './Components/ProjectManager';
import Reports from './Components/Reports';
import Invoice from './Components/Invoice';
import Auth from './Components/Auth';
import UserProfile from './Components/UserProfile';
import AuthGuard from './Components/AuthGuard';
import DebugPanel from './Components/DebugPanel';
import SyncStatusIndicator from './Components/SyncStatusIndicator';
import ConflictResolver from './Components/ConflictResolver';
import { useTimeTracker, useLocalStorage } from './Hooks/useTimeTracker';
import { useTimeTrackerAPI } from './Hooks/useTimeTrackerAPI';
import { useAuthContext } from './Hooks/useAuth';
import { useAPIStatus } from './contexts/APIContext';
import { API_CONFIG } from './config/api';
import { TABS, SYNC_CONSTANTS } from './Constants';
import { apiClient } from './Utils/ApiClient';
import { offlineSync } from './Utils/OfflineSync';

const App = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const { useAPI, syncStatus } = useAPIStatus();
  
  // 調試信息
  console.log('🏠 App 組件渲染 - 認證狀態:', {
    isAuthenticated,
    authLoading,
    user: user ? user.name : 'null',
    useAPI,
    API_CONFIG_useAPI: API_CONFIG.useAPI,
    syncStatus
  });
  
  // 根據 API 配置選擇使用的 Hook（避免同時初始化兩個 Hook）
  const timeTrackerHook = useAPI ? useTimeTrackerAPI() : useTimeTracker();
  
  // 使用自定義 Hooks
  const {
    isTracking,
    currentTime,
    projects,
    selectedProject,
    timeEntries,
    activeTab,
    showToast,
    startTracking,
    pauseTracking,
    stopTracking,
    stopAndStartTracking,
    setSelectedProject: originalSetSelectedProject,
    setActiveTab,
    setProjects,
    hideToast,
    activeEntry
  } = timeTrackerHook;
  
  // 重新載入時間記錄的函數（不執行停止計時邏輯）
  const reloadTimeEntries = async () => {
    console.log('重新載入時間記錄');
    try {
      // 首先從 localStorage 讀取最新記錄
      const localEntriesJson = localStorage.getItem('timetracker-time-entries');
      const localEntries = localEntriesJson ? JSON.parse(localEntriesJson) : [];
      
      // 如果使用 API 模式，則嘗試合併 API 數據
      if (useAPI && timeTrackerHook.timeAPI) {
        console.log('通過 API 重新載入時間記錄');
        const apiResult = await timeTrackerHook.timeAPI.fetchTimeEntries();
        console.log('API 重新載入結果:', apiResult);
        
        if (apiResult && apiResult.success && apiResult.data) {
          const apiEntries = apiResult.data.timeEntries || [];
          
          // 合併本地和 API 數據，避免覆蓋最新的本地記錄
          const mergedEntries = [...localEntries];
          
          // 只添加 API 中有但本地沒有的記錄
          apiEntries.forEach(apiEntry => {
            const existsInLocal = localEntries.some(localEntry => 
              localEntry.id === apiEntry.id
            );
            if (!existsInLocal) {
              mergedEntries.push(apiEntry);
            }
          });
          
          // 按時間排序
          mergedEntries.sort((a, b) => {
            const timeA = new Date(a.startTime || a.date);
            const timeB = new Date(b.startTime || b.date);
            return timeB - timeA;
          });
          
          console.log('合併後重新載入記錄數量:', mergedEntries.length);
          
          // 更新 localStorage 和狀態
          localStorage.setItem('timetracker-time-entries', JSON.stringify(mergedEntries));
          timeTrackerHook.setTimeEntries(mergedEntries);
        }
      } else {
        // 非 API 模式，直接使用本地記錄
        if (localEntries.length > 0) {
          console.log('從 localStorage 重新載入記錄數量:', localEntries.length);
          timeTrackerHook.setTimeEntries(localEntries);
        }
      }
    } catch (error) {
      console.error('重新載入時間記錄失敗:', error);
    }
  };

  // 包裝 stopTracking 函數以確保在計時結束後立即刷新 timeEntries
  const wrappedStopTracking = async () => {
    console.log('包裝的 stopTracking 函數被調用', { 
      isTracking, 
      activeEntry
    });
    try {
      // 在執行操作前先獲取舊數據作為參考
      const beforeOperationJson = localStorage.getItem('timetracker-time-entries');
      const beforeOperationEntries = beforeOperationJson ? JSON.parse(beforeOperationJson) : [];
      console.log('操作前 localStorage 中的記錄數量:', beforeOperationEntries.length);
      
      // 只有當實際正在計時時才執行 stopTracking
      let result = { success: true };
      if (isTracking) {
        console.log('正在執行停止計時操作', { activeEntry });
        
        // 嘗試檢查 localStorage 中的活動計時記錄
        try {
          const activeEntryJson = localStorage.getItem('timetracker_active_entry');
          if (activeEntryJson) {
            const storedEntry = JSON.parse(activeEntryJson);
            console.log('從 localStorage 讀取到的活動計時記錄:', storedEntry);
          }
        } catch (e) {
          console.warn('讀取 localStorage 中的活動計時記錄失敗:', e);
        }
        
        // 調用原始的 stopTracking 函數
        result = await stopTracking();
        console.log('停止計時結果:', result);
        
        // 停止計時成功後，立即清除本地狀態，確保狀態一致性
        if (result && result.success) {
          console.log('停止計時成功，清除本地計時狀態');
          localStorage.removeItem('timetracker_active_entry');
          localStorage.removeItem('timetracker_is_tracking');
          localStorage.removeItem('timetracker_paused_entry');
          localStorage.removeItem('timetracker_resumed');
        }
      } else {
        console.log('沒有活動計時，將進行手動刷新操作');
      }
      
      // 強制重新獲取最新記錄
      console.log('準備重新獲取最新記錄');
      
      // 首先確保從 localStorage 獲取最新記錄並更新狀態
      try {
        const entriesJson = localStorage.getItem('timetracker-time-entries');
        if (entriesJson) {
          const localEntries = JSON.parse(entriesJson);
          console.log('從 localStorage 讀取到的最新記錄數量:', localEntries.length);
          
          // 檢查是否有新記錄
          const hasNewEntries = localEntries.length > beforeOperationEntries.length;
          console.log('檢測到新記錄:', hasNewEntries);
          
          if (localEntries.length > 0) {
            // 立即更新 timeEntries 狀態
            console.log('立即更新本地 timeEntries 狀態');
            timeTrackerHook.setTimeEntries(localEntries);
            
            // 觸發自定義事件，通知其他組件更新
            window.dispatchEvent(new Event('timeentry_updated'));
            
            // 為了確保專案管理頁面能收到更新，額外觸發一個專案統計更新事件
            setTimeout(() => {
              console.log('觸發專案統計更新事件');
              window.dispatchEvent(new Event('project_stats_update'));
              window.dispatchEvent(new Event('storage', { key: 'timetracker-time-entries' }));
            }, 200);
            
            // 再次額外觸發，確保專案管理頁面能收到更新
            setTimeout(() => {
              console.log('再次觸發專案統計更新事件');
              window.dispatchEvent(new Event('project_stats_update'));
            }, 500);
          }
        }
      } catch (error) {
        console.error('從 localStorage 獲取記錄時出錯:', error);
      }
      
      // 延遲 API 刷新，避免立即覆蓋本地更新的數據
      if (useAPI && timeTrackerHook.timeAPI) {
        // 使用較長的延遲，讓本地狀態先穩定
        setTimeout(async () => {
          try {
            console.log('延遲通過 API 獲取最新時間記錄');
            
            // 在 API 刷新前，先保存當前的本地記錄
            const currentLocalEntries = JSON.parse(localStorage.getItem('timetracker-time-entries') || '[]');
            
            const apiResult = await timeTrackerHook.timeAPI.fetchTimeEntries();
            console.log('API 刷新結果:', apiResult);
            
            // API 刷新後，合併本地和 API 數據，確保不丟失最新記錄
            if (apiResult && apiResult.success && apiResult.data) {
              const apiEntries = apiResult.data.timeEntries || [];
              
              // 合併數據：優先保留本地的最新記錄
              const mergedEntries = [...currentLocalEntries];
              
              // 只添加 API 中有但本地沒有的記錄
              apiEntries.forEach(apiEntry => {
                const existsInLocal = currentLocalEntries.some(localEntry => 
                  localEntry.id === apiEntry.id
                );
                if (!existsInLocal) {
                  mergedEntries.push(apiEntry);
                }
              });
              
              // 按時間排序
              mergedEntries.sort((a, b) => {
                const timeA = new Date(a.startTime || a.date);
                const timeB = new Date(b.startTime || b.date);
                return timeB - timeA;
              });
              
              console.log('合併後的記錄數量:', mergedEntries.length);
              
              // 更新 localStorage 和狀態
              localStorage.setItem('timetracker-time-entries', JSON.stringify(mergedEntries));
              timeTrackerHook.setTimeEntries(mergedEntries);
            }
          } catch (err) {
            console.error('延遲 API 刷新失敗:', err);
          }
        }, 2000); // 2秒延遲，確保本地狀態穩定
      }
      
      return result;
    } catch (error) {
      console.error('停止計時或刷新操作失敗:', error);
      return { success: false, message: error.message };
    }
  };
  
  // 包裝 setSelectedProject 函數以添加調試日誌
  const setSelectedProject = (project) => {
    console.log('選擇專案:', {
      project,
      id: project?.id,
      name: project?.name,
      hourlyRate: project?.rate,
      rate: project?.rate,
      effectiveRate: project?.rate || project?.hourlyRate
    });
    originalSetSelectedProject(project);
  };

  // 專案管理狀態
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ 
    name: '', 
    client: '', 
    rate: '', 
    color: '#3b82f6' 
  });
  const [formErrors, setFormErrors] = useState({});
  
  // 除錯面板狀態
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 離線同步初始化和自動同步
  useEffect(() => {
    if (isAuthenticated && API_CONFIG.features.offlineMode) {
      console.log('🔄 離線同步功能已初始化');
      
      // 如果有未同步的操作且當前在線，嘗試自動同步
      if (apiClient.isOnline() && API_CONFIG.features.dataSync) {
        (async () => {
          const pendingOps = offlineSync.getPendingOperations();
          if (pendingOps.length > 0) {
            console.log(`🔄 發現 ${pendingOps.length} 個待同步操作，嘗試自動同步`);
            await apiClient.syncOfflineOperations();
          }
        })();
      }
    }
  }, [isAuthenticated]);

  // 定期同步檢查
  useEffect(() => {
    if (isAuthenticated && API_CONFIG.features.offlineMode && API_CONFIG.features.dataSync) {
      // 每分鐘檢查一次未同步的操作
      const syncInterval = setInterval(() => {
        if (apiClient.isOnline()) {
          const pendingOps = offlineSync.getPendingOperations();
          if (pendingOps.length > 0) {
            console.log(`🔄 定期同步：發現 ${pendingOps.length} 個待同步操作`);
            apiClient.syncOfflineOperations();
          }
        }
      }, SYNC_CONSTANTS.AUTO_SYNC_INTERVAL);
      
      return () => clearInterval(syncInterval);
    }
  }, [isAuthenticated]);

  // 開發模式快捷鍵
  useEffect(() => {
    if (API_CONFIG.debug) {
      const handleKeyDown = (e) => {
        // Ctrl/Cmd + Shift + D: 開啟除錯面板
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          setShowDebugPanel(true);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // 新增專案函數
  const addProject = () => {
    const errors = {};
    
    if (!newProject.name?.trim()) {
      errors.name = '專案名稱為必填';
    }
    
    if (!newProject.client?.trim()) {
      errors.client = '客戶名稱為必填';
    }
    
    if (!newProject.rate || newProject.rate <= 0) {
      errors.rate = '請輸入有效的時薪';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const project = {
      id: Date.now(),
      name: newProject.name.trim(),
      client: newProject.client.trim(),
      rate: parseInt(newProject.rate),
      color: newProject.color
    };
    
    setProjects(prev => [...prev, project]);
    
    // 如果是第一個專案，設為選中狀態
    if (!selectedProject) {
      setSelectedProject(project);
    }
    
    // 重置表單
    setNewProject({ name: '', client: '', rate: '', color: '#3b82f6' });
    setFormErrors({});
    setShowNewProject(false);
  };

  // 刪除專案函數
  const deleteProject = (projectId) => {
    if (window.confirm('確定要刪除此專案嗎？')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      
      // 如果刪除的是當前選中的專案，選擇第一個專案
      if (selectedProject?.id === projectId) {
        setSelectedProject(updatedProjects[0] || null);
      }
    }
  };

  // 監聽 timeEntries 變化
  useEffect(() => {
    console.log('🔄 時間記錄更新:', timeEntries.length);
    if (timeEntries.length > 0) {
      console.log('最新記錄:', timeEntries[0]);
    }
  }, [timeEntries]);

  // 啟用本地儲存
  useLocalStorage(projects, timeEntries, currentTime, isTracking, selectedProject);

  // 認證載入中顯示
  if (authLoading) {
    console.log('⏳ App 組件 - 認證載入中');
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // 未登入時顯示認證頁面
  if (!isAuthenticated) {
    console.log('🚪 App 組件 - 顯示認證頁面，isAuthenticated =', isAuthenticated);
    return (
      <AuthGuard>
        <Auth onAuthSuccess={() => {
          console.log('🎯 onAuthSuccess 回調被調用');
          console.log('🔄 設置 activeTab 為 TRACKER');
          setActiveTab(TABS.TRACKER);
        }} />
      </AuthGuard>
    );
  }

  console.log('✅ App 組件 - 用戶已認證，顯示主應用，當前頁面:', activeTab);

  // 渲染當前頁面內容
  const renderCurrentTab = () => {
    switch (activeTab) {
      case TABS.TRACKER:
        return (
          <TimeTracker
            isTracking={isTracking}
            currentTime={currentTime}
            projects={projects}
            selectedProject={selectedProject}
            timeEntries={timeEntries}
            onStartTracking={startTracking}
            onPauseTracking={pauseTracking}
            onStopTracking={wrappedStopTracking}
            onStopAndStartTracking={stopAndStartTracking}
            onProjectChange={setSelectedProject}
            setActiveTab={setActiveTab}
          />
        );
      
      case TABS.PROJECTS:
        return (
          <ProjectManager
            projects={projects}
            showNewProject={showNewProject}
            setShowNewProject={setShowNewProject}
            newProject={newProject}
            setNewProject={setNewProject}
            formErrors={formErrors}
            onAddProject={addProject}
            onDeleteProject={deleteProject}
          />
        );
      
      case TABS.REPORTS:
        return <Reports timeEntries={timeEntries} projects={projects} />;
      
      case TABS.INVOICE:
        return <Invoice timeEntries={timeEntries} projects={projects} />;
      
      case TABS.PROFILE:
        return <UserProfile />;
      
      default:
        return (
          <TimeTracker
            isTracking={isTracking}
            currentTime={currentTime}
            projects={projects}
            selectedProject={selectedProject}
            timeEntries={timeEntries}
            onStartTracking={startTracking}
            onPauseTracking={pauseTracking}
            onStopTracking={wrappedStopTracking}
            onStopAndStartTracking={stopAndStartTracking}
            onProjectChange={setSelectedProject}
            onReloadTimeEntries={reloadTimeEntries}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <AuthGuard>
      <div className="app">
        {/* 導航組件 */}
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isTracking={isTracking}
        />
        
        {/* 主要內容區域 */}
        <main className="main">
          <div className="container">
            {renderCurrentTab()}
          </div>
        </main>

        {/* Toast 通知 */}
        {showToast && (
          <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                showToast.type === 'success' ? 'bg-green-500' : 
                showToast.type === 'error' ? 'bg-red-500' : 
                'bg-blue-500'
              }`}></div>
              <span className="text-sm text-gray-700">{showToast.message}</span>
              <button 
                onClick={hideToast}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 同步狀態指示器 */}
        {API_CONFIG.features.offlineMode && <SyncStatusIndicator />}
        
        {/* 衝突解決器 */}
        {API_CONFIG.features.offlineMode && <ConflictResolver />}

        {/* 底部安全區域 */}
        <div className="safe-area desktop-hidden"></div>
        
        {/* 除錯面板 */}
        {showDebugPanel && (
          <DebugPanel 
            isOpen={showDebugPanel} 
            onClose={() => setShowDebugPanel(false)} 
          />
        )}
        
        {/* 無障礙輔助 */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isTracking ? '計時器正在運行' : '計時器已停止'}
        </div>
        
        {/* 開發模式提示 */}
        {API_CONFIG.debug && (
          <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs opacity-75">
            按 Ctrl+Shift+D 開啟除錯面板
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

export default App;
