import { useState, useEffect, useCallback, useRef } from 'react';
import { TIMER_INTERVAL } from '../Constants';
import { calculateEarnings } from '../Utils/helpers';
import { useProjectAPI, useTimeTrackingAPI, useClientAPI } from './useAPI';
import { useAuthContext } from './useAuth';
import { useAPIStatus } from '../contexts/APIContext';
import { apiClient } from '../Utils/ApiClient';
import { offlineSync, SYNC_STATUS } from '../Utils/OfflineSync';

// 時間追蹤主要邏輯 Hook (API 整合版)
export const useTimeTrackerAPI = () => {
  // 認證上下文
  const { isAuthenticated } = useAuthContext();
  
  // API Hooks
  const projectAPI = useProjectAPI();
  const timeAPI = useTimeTrackingAPI();
  const clientAPI = useClientAPI();
  
  // API 狀態
  const { useAPI, syncStatus, syncProgress } = useAPIStatus();
  
  // 用戶行為追蹤（可以擴展為真實的分析）
  const trackUserAction = (action, data = {}) => {
    console.log('📊 用戶行為:', { action, data, timestamp: new Date().toISOString() });
    // 在實際應用中，這裡可以發送到分析服務
  };
  
  // 計時器狀態
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // 數據狀態
  const [selectedProject, setSelectedProject] = useState(null);
  
  // UI 狀態
  const [activeTab, setActiveTab] = useState('tracker');
  const [showToast, setShowToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // 防止重複載入的標記
  const dataLoadingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  // 從 API Hook 中獲取數據
  const projects = projectAPI.projects;
  const timeEntries = timeAPI.timeEntries;
  const clients = clientAPI.clients;
  const activeEntry = timeAPI.activeEntry;

  // 檢查是否有 API 加載中的狀態 - 使用我們自己的 loading 狀態或 API hooks 的 loading 狀態
  const isLoading = loading || projectAPI.loading || timeAPI.loading || clientAPI.loading;
  const hasError = projectAPI.error || timeAPI.error || clientAPI.error;

  // 初始化數據載入 - 使用 useCallback 防止重複創建
  const loadInitialData = useCallback(async () => {
    // 防止重複載入
    if (dataLoadingRef.current || initialLoadDoneRef.current) {
      console.log('🔄 跳過重複的數據載入');
      return;
    }
    
    dataLoadingRef.current = true;
    
    try {
      console.log('🔍 開始初始化數據載入...');
      
      // 首先檢查活動計時 - 這是最優先的
      if (!activeEntry && !timeAPI.loading) {
        console.log('📌 優先檢查活動計時狀態');
        try {
          await timeAPI.getActiveTimer();
        } catch (error) {
          console.warn('獲取活動計時失敗，但將繼續載入其他數據:', error);
        }
      }
      
      // 使用去重的請求載入所有數據
      const loadPromises = [];
      
      // 避免重複載入 - 更嚴格的檢查
      if (projects.length === 0 && !projectAPI.loading) {
        loadPromises.push(projectAPI.fetchProjects());
      }
      if (timeEntries.length === 0 && !timeAPI.loading) {
        loadPromises.push(timeAPI.fetchTimeEntries());
      }
      if (clients.length === 0 && !clientAPI.loading) {
        loadPromises.push(clientAPI.fetchClients());
      }
      
      // 只執行需要的請求
      if (loadPromises.length > 0) {
        console.log(`📡 載入 ${loadPromises.length} 個 API 請求`);
        await Promise.allSettled(loadPromises);
        displayToast('數據載入完成', 'success');
      }
      
      initialLoadDoneRef.current = true;
    } catch (error) {
      console.error('載入數據時發生錯誤:', error);
      displayToast('數據載入失敗', 'error');
    } finally {
      dataLoadingRef.current = false;
    }
  }, [projects.length, timeEntries.length, activeEntry, clients.length, 
      projectAPI.loading, timeAPI.loading, clientAPI.loading]);

  // 初始化數據載入 - 只在認證狀態改變時執行
  useEffect(() => {
    if (isAuthenticated && !initialLoadDoneRef.current) {
      loadInitialData();
    }
  }, [isAuthenticated, loadInitialData]);

  // 監聽活動計時狀態
  useEffect(() => {
    if (activeEntry) {
      setIsTracking(true);
      // 使用 String 比較確保正確匹配專案 ID
      const matchedProject = projects.find(p => String(p.id) === String(activeEntry.projectId)) || null;
      console.log('🔍 活動計時關聯專案:', {
        activeEntryProjectId: activeEntry.projectId,
        matchedProject: matchedProject ? `${matchedProject.id} - ${matchedProject.name}` : 'null'
      });
      setSelectedProject(matchedProject);
      setStartTime(new Date(activeEntry.startTime));
      
      // 計算已經過的時間
      const elapsed = Math.floor((Date.now() - new Date(activeEntry.startTime)) / 1000);
      setCurrentTime(elapsed);
    } else {
      setIsTracking(false);
      setCurrentTime(0);
      setStartTime(null);
    }
  }, [activeEntry, projects]);

  // Toast 通知函數
  const displayToast = (message, type = 'success') => {
    setShowToast({ message, type, id: Date.now() });
  };

  // 關閉 Toast
  const hideToast = () => {
    setShowToast(null);
  };

  // 計時器邏輯 - 只有在確實有活動計時時才運行
  useEffect(() => {
    let interval;
    if (isTracking && activeEntry) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeEntry.startTime)) / 1000);
        setCurrentTime(elapsed);
      }, TIMER_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [isTracking, activeEntry]);

  // 開始計時 - API 版本
  const startTracking = useCallback(async () => {
    if (!selectedProject) {
      displayToast('請先選擇一個專案', 'error');
      return;
    }
    
    // 檢查是否已經有活動的計時 - 同時檢查 isTracking 和 activeEntry
    if (isTracking || activeEntry) {
      displayToast('已有正在進行的計時，請先停止', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      
      // 使用 apiClient 進行操作 - 它會處理離線情況
      const result = await apiClient.timeEntries.startTimer(selectedProject.id, '');
      
      if (result.success) {
        if (result.offline) {
          // 離線模式處理
          timeAPI.setActiveEntry(result.data);
          displayToast(`開始追蹤「${selectedProject.name}」(離線模式)`, 'info');
        } else {
          // 在線模式處理
          timeAPI.setActiveEntry(result.data);
          displayToast(`開始追蹤「${selectedProject.name}」`, 'success');
        }
        
        trackUserAction('start_tracking', { 
          project: selectedProject.name,
          projectId: selectedProject.id,
          offline: !!result.offline
        });
        
        return result;
      } else {
        displayToast(result.message || '開始計時失敗', 'error');
        return result;
      }
    } catch (error) {
      console.error('開始計時失敗:', error);
      displayToast('開始計時失敗', 'error');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [selectedProject, isTracking, activeEntry, timeAPI, displayToast, trackUserAction]);

  // 暫停計時 - API 版本 (暫時停止但不保存記錄)
  const pauseTracking = useCallback(async () => {
    if (!activeEntry) {
      displayToast('沒有活動的計時記錄', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // 使用 apiClient 進行操作
      const result = await apiClient.timeEntries.stopTimer(activeEntry.id);
      
      if (result.success) {
        if (result.offline) {
          // 離線模式處理
          displayToast('計時已暫停 (離線模式)', 'info');
        } else {
          displayToast('計時已暫停', 'info');
        }
        
        // 設置活動計時為 null
        timeAPI.setActiveEntry(null);
        
        trackUserAction('pause_tracking', { 
          duration: currentTime,
          offline: !!result.offline
        });
        
        return result;
      } else {
        displayToast(result.message || '暫停計時失敗', 'error');
        return result;
      }
    } catch (error) {
      console.error('暫停計時失敗:', error);
      displayToast('暫停計時失敗', 'error');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [activeEntry, currentTime, displayToast, trackUserAction]);

  // 停止計時並儲存記錄 - API 版本
  const stopTracking = useCallback(async () => {
    if (!activeEntry) {
      displayToast('沒有活動的計時記錄', 'error');
      return;
    }
    
    try {
      setLoading(true);
      console.log('停止計時中...', activeEntry.id);
      
      // 使用 apiClient 進行操作
      const result = await apiClient.timeEntries.stopTimer(activeEntry.id);
      
      if (result.success) {
        const amount = calculateEarnings(currentTime, selectedProject?.hourlyRate || selectedProject?.rate || 0);
        console.log('停止計時，計算收入:', {
          currentTime,
          hourlyRate: selectedProject?.hourlyRate,
          rate: selectedProject?.rate,
          effectiveRate: selectedProject?.hourlyRate || selectedProject?.rate || 0,
          calculatedAmount: amount
        });
        
        // 立即將新的時間記錄添加到現有記錄中
        const newTimeEntry = result.data;
        if (newTimeEntry) {
          console.log('新添加的時間記錄:', newTimeEntry);
          // 直接更新 timeEntries 狀態，確保最新記錄立即顯示在 UI 中
          try {
            timeAPI.setTimeEntries(prev => {
              // 檢查這條記錄是否已經存在
              const exists = prev.some(entry => entry.id === newTimeEntry.id);
              if (exists) {
                console.log('此記錄已存在，僅更新');
                return prev.map(entry => entry.id === newTimeEntry.id ? newTimeEntry : entry);
              } else {
                console.log('添加新記錄到時間條目列表');
                return [newTimeEntry, ...prev];
              }
            });
          } catch (err) {
            console.error('更新時間條目狀態時出錯:', err);
          }
        }
        
        if (result.offline) {
          // 離線模式
          displayToast(`工作記錄已儲存！收入 NT$ ${amount.toLocaleString()} (離線模式)`, 'info');
        } else {
          displayToast(`工作記錄已儲存！收入 NT$ ${amount.toLocaleString()}`, 'success');
        }
        
        trackUserAction('stop_tracking', { 
          duration: currentTime,
          amount: amount,
          project: selectedProject?.name,
          offline: !!result.offline
        });
        
        // 設置活動計時為 null
        timeAPI.setActiveEntry(null);
        
        // 為了確保數據一致性，異步重新載入所有時間記錄
        console.log('重新載入所有時間記錄...');
        setTimeout(async () => {
          try {
            const entriesResult = await timeAPI.fetchTimeEntries();
            console.log('重新載入後的所有時間記錄:', entriesResult?.data?.timeEntries?.length || '無資料');
          } catch (error) {
            console.error('重新載入時間記錄失敗:', error);
          }
        }, 500);
        
        return result;
      } else {
        displayToast(result.message || '停止計時失敗', 'error');
        return result;
      }
    } catch (error) {
      console.error('停止計時失敗:', error);
      displayToast('停止計時失敗', 'error');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [activeEntry, currentTime, selectedProject, timeAPI]);

  // 創建專案 - API 版本
  const createProject = useCallback(async (projectData) => {
    try {
      setLoading(true);
      
      // 使用 apiClient 進行操作
      const result = await apiClient.projects.create(projectData);
      
      if (result.success) {
        if (result.offline) {
          // 離線模式處理
          displayToast(`專案「${projectData.name}」創建成功 (離線模式)`, 'info');
        } else {
          displayToast(`專案「${projectData.name}」創建成功`, 'success');
        }
        
        // 如果這是第一個專案，自動選擇它
        if (projects.length === 0) {
          setSelectedProject(result.data);
        }
        
        trackUserAction('create_project', { 
          projectName: projectData.name,
          client: projectData.clientId,
          offline: !!result.offline
        });
        
        return result;
      } else {
        displayToast(result.message || '創建專案失敗', 'error');
        return result;
      }
    } catch (error) {
      console.error('創建專案失敗:', error);
      displayToast('創建專案失敗', 'error');
      return { success: false, message: '創建專案失敗' };
    } finally {
      setLoading(false);
    }
  }, [projects.length, displayToast, trackUserAction]);

  // 更新專案 - API 版本
  const updateProject = useCallback(async (projectId, updates) => {
    try {
      const result = await projectAPI.updateProject(projectId, updates);
      
      if (result.success) {
        displayToast('專案更新成功', 'success');
        
        // 如果更新的是當前選中的專案，更新選中狀態
        if (selectedProject?.id === projectId) {
          setSelectedProject(result.data);
        }
        
        trackUserAction('update_project', { 
          projectId,
          updates: Object.keys(updates)
        });
        
        return result;
      } else {
        displayToast(result.message || '更新專案失敗', 'error');
        return result;
      }
    } catch (error) {
      console.error('更新專案失敗:', error);
      displayToast('更新專案失敗', 'error');
      return { success: false, message: '更新專案失敗' };
    }
  }, [projectAPI, selectedProject]);

  // 刪除專案 - API 版本
  const deleteProject = useCallback(async (projectId) => {
    try {
      const result = await projectAPI.deleteProject(projectId);
      
      if (result.success) {
        displayToast('專案刪除成功', 'success');
        
        // 如果刪除的是當前選中的專案，選擇其他專案
        if (selectedProject?.id === projectId) {
          const remainingProjects = projects.filter(p => p.id !== projectId);
          setSelectedProject(remainingProjects[0] || null);
        }
        
        trackUserAction('delete_project', { projectId });
        
        return result;
      } else {
        displayToast(result.message || '刪除專案失敗', 'error');
        return result;
      }
    } catch (error) {
      console.error('刪除專案失敗:', error);
      displayToast('刪除專案失敗', 'error');
      return { success: false, message: '刪除專案失敗' };
    }
  }, [projectAPI, selectedProject, projects]);

  // 創建客戶 - API 版本
  const createClient = useCallback(async (clientData) => {
    try {
      const result = await clientAPI.createClient(clientData);
      
      if (result.success) {
        displayToast(`客戶「${clientData.name}」創建成功`, 'success');
        trackUserAction('create_client', { clientName: clientData.name });
        return result;
      } else {
        displayToast(result.message || '創建客戶失敗', 'error');
        return result;
      }
    } catch (error) {
      console.error('創建客戶失敗:', error);
      displayToast('創建客戶失敗', 'error');
      return { success: false, message: '創建客戶失敗' };
    }
  }, [clientAPI]);

  // 計算統計數據
  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = getWeekDateRange();
    const thisMonth = getMonthDateRange();
    
    const todayEntries = timeEntries.filter(entry => entry.date === today);
    const weekEntries = timeEntries.filter(entry => 
      entry.date >= thisWeek.start && entry.date <= thisWeek.end
    );
    const monthEntries = timeEntries.filter(entry => 
      entry.date >= thisMonth.start && entry.date <= thisMonth.end
    );
    
    return {
      today: {
        time: todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0),
        earnings: todayEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
        entries: todayEntries.length
      },
      week: {
        time: weekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0),
        earnings: weekEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
        entries: weekEntries.length
      },
      month: {
        time: monthEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0),
        earnings: monthEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
        entries: monthEntries.length
      }
    };
  }, [timeEntries]);

  // 輔助函數：獲取本週日期範圍
  const getWeekDateRange = () => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };

  // 輔助函數：獲取本月日期範圍
  const getMonthDateRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };

  // 停止當前計時並開始新的計時 - 便利函數
  const stopAndStartTracking = useCallback(async (projectId) => {
    if (!activeEntry) {
      displayToast('沒有活動的計時記錄，無需先停止', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // 先停止當前計時
      const stopResult = await apiClient.timeEntries.stopTimer(activeEntry.id);
      
      if (stopResult.success) {
        // 停止成功，現在開始新的計時
        const project = projectId || selectedProject?.id;
        
        if (!project) {
          displayToast('請先選擇一個專案', 'error');
          return { success: false, message: '請先選擇一個專案' };
        }
        
        // 使用 apiClient 進行操作 - 它會處理離線情況
        const startResult = await apiClient.timeEntries.startTimer(project, '');
        
        if (startResult.success) {
          if (startResult.offline) {
            // 離線模式處理
            timeAPI.setActiveEntry(startResult.data);
            displayToast(`停止先前計時並開始追蹤新專案 (離線模式)`, 'info');
          } else {
            // 在線模式處理
            timeAPI.setActiveEntry(startResult.data);
            displayToast(`停止先前計時並開始追蹤新專案`, 'success');
          }
          
          trackUserAction('switch_tracking', { 
            fromProject: activeEntry.projectId,
            toProject: project,
            offline: !!startResult.offline
          });
          
          return startResult;
        } else {
          displayToast(startResult.message || '開始新計時失敗', 'error');
          return startResult;
        }
      } else {
        displayToast(stopResult.message || '停止當前計時失敗', 'error');
        return stopResult;
      }
    } catch (error) {
      console.error('切換計時失敗:', error);
      displayToast('切換計時失敗', 'error');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [activeEntry, selectedProject, timeAPI, displayToast, trackUserAction]);

  return {
    // 計時器狀態
    isTracking,
    currentTime,
    
    // 數據狀態
    projects,
    selectedProject,
    timeEntries,
    
    // UI 狀態
    activeTab,
    showToast,
    
    // 操作函數 - 保持與 useTimeTracker 一致
    startTracking,
    pauseTracking,
    stopTracking,
    stopAndStartTracking, // 新增的輔助函數
    setSelectedProject,
    setActiveTab,
    setProjects: () => {}, // API 版本通過 API 操作更新
    setTimeEntries: () => {}, // API 版本通過 API 操作更新
    displayToast,
    hideToast,
    loadInitialData,
    
    // 額外的 API 功能
    createProject,
    updateProject,
    deleteProject,
    createClient,
    refreshData: loadInitialData,
    getStats,
    
    // 載入狀態（額外提供）
    isLoading,
    hasError,
    clients,
    activeEntry,
    
    // 同步狀態
    syncStatus,
    syncProgress,
    
    // API 錯誤處理
    clearErrors: () => {
      projectAPI.clearError();
      timeAPI.clearError();
      clientAPI.clearError();
    }
  };
};

export default useTimeTrackerAPI;
