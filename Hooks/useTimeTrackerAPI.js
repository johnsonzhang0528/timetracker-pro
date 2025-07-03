import { useState, useEffect, useCallback } from 'react';
import { TIMER_INTERVAL } from '../Constants';
import { calculateEarnings } from '../Utils/helpers';
import { useProjectAPI, useTimeTrackingAPI, useClientAPI } from './useAPI';
import { useAuthContext } from './useAuth';

// 時間追蹤主要邏輯 Hook (API 整合版)
export const useTimeTrackerAPI = () => {
  // 認證上下文
  const { isAuthenticated } = useAuthContext();
  
  // API Hooks
  const projectAPI = useProjectAPI();
  const timeAPI = useTimeTrackingAPI();
  const clientAPI = useClientAPI();
  
  // 計時器狀態
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // 數據狀態
  const [selectedProject, setSelectedProject] = useState(null);
  
  // UI 狀態
  const [activeTab, setActiveTab] = useState('tracker');
  const [showToast, setShowToast] = useState(null);

  // 從 API Hook 中獲取數據
  const projects = projectAPI.projects;
  const timeEntries = timeAPI.timeEntries;
  const clients = clientAPI.clients;
  const activeEntry = timeAPI.activeEntry;

  // 檢查是否有 API 加載中的狀態
  const isLoading = projectAPI.loading || timeAPI.loading || clientAPI.loading;
  const hasError = projectAPI.error || timeAPI.error || clientAPI.error;

  // 初始化數據載入
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // 監聽活動計時狀態
  useEffect(() => {
    if (activeEntry) {
      setIsTracking(true);
      setSelectedProject(projects.find(p => p.id === activeEntry.projectId) || null);
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

  const loadInitialData = async () => {
    try {
      // 使用去重的請求載入所有數據
      const loadPromises = [];
      
      // 避免重複載入
      if (projects.length === 0) {
        loadPromises.push(projectAPI.fetchProjects());
      }
      if (timeEntries.length === 0) {
        loadPromises.push(timeAPI.fetchTimeEntries());
      }
      if (!activeEntry) {
        loadPromises.push(timeAPI.getActiveTimer());
      }
      if (clients.length === 0) {
        loadPromises.push(clientAPI.fetchClients());
      }
      
      // 只執行需要的請求
      if (loadPromises.length > 0) {
        await Promise.allSettled(loadPromises);
        displayToast('數據載入完成', 'success');
      }
    } catch (error) {
      console.error('載入數據時發生錯誤:', error);
      displayToast('數據載入失敗', 'error');
    }
  };

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
    
    if (isTracking) {
      displayToast('已經在計時中', 'warning');
      return;
    }
    
    try {
      const result = await timeAPI.startTimer(selectedProject.id, '');
      
      if (result.success) {
        displayToast(`開始追蹤「${selectedProject.name}」`, 'success');
        trackUserAction('start_tracking', { 
          project: selectedProject.name,
          projectId: selectedProject.id
        });
      } else {
        displayToast(result.message || '開始計時失敗', 'error');
      }
    } catch (error) {
      console.error('開始計時失敗:', error);
      displayToast('開始計時失敗', 'error');
    }
  }, [selectedProject, isTracking, timeAPI]);

  // 暫停計時 - API 版本 (暫時停止但不保存記錄)
  const pauseTracking = useCallback(async () => {
    if (!activeEntry) {
      displayToast('沒有活動的計時記錄', 'error');
      return;
    }
    
    try {
      const result = await timeAPI.stopTimer(activeEntry.id);
      
      if (result.success) {
        displayToast('計時已暫停', 'info');
        trackUserAction('pause_tracking', { duration: currentTime });
      } else {
        displayToast(result.message || '暫停計時失敗', 'error');
      }
    } catch (error) {
      console.error('暫停計時失敗:', error);
      displayToast('暫停計時失敗', 'error');
    }
  }, [activeEntry, currentTime, timeAPI]);

  // 停止計時並儲存記錄 - API 版本
  const stopTracking = useCallback(async () => {
    if (!activeEntry) {
      displayToast('沒有活動的計時記錄', 'error');
      return;
    }
    
    try {
      const result = await timeAPI.stopTimer(activeEntry.id);
      
      if (result.success) {
        const amount = calculateEarnings(currentTime, selectedProject?.hourlyRate || 0);
        displayToast(`工作記錄已儲存！收入 NT$ ${amount.toLocaleString()}`, 'success');
        
        trackUserAction('stop_tracking', { 
          duration: currentTime,
          amount: amount,
          project: selectedProject?.name
        });
        
        // 重新載入時間記錄
        await timeAPI.fetchTimeEntries();
      } else {
        displayToast(result.message || '停止計時失敗', 'error');
      }
    } catch (error) {
      console.error('停止計時失敗:', error);
      displayToast('停止計時失敗', 'error');
    }
  }, [activeEntry, currentTime, selectedProject, timeAPI]);

  // 創建專案 - API 版本
  const createProject = useCallback(async (projectData) => {
    try {
      const result = await projectAPI.createProject(projectData);
      
      if (result.success) {
        displayToast(`專案「${projectData.name}」創建成功`, 'success');
        
        // 如果這是第一個專案，自動選擇它
        if (projects.length === 0) {
          setSelectedProject(result.data);
        }
        
        trackUserAction('create_project', { 
          projectName: projectData.name,
          client: projectData.clientId
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
    }
  }, [projectAPI, projects.length]);

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

  // 用戶行為追蹤（可以擴展為真實的分析）
  const trackUserAction = (action, data = {}) => {
    console.log('📊 用戶行為:', { action, data, timestamp: new Date().toISOString() });
    // 在實際應用中，這裡可以發送到分析服務
  };

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
    
    // API 錯誤處理
    clearErrors: () => {
      projectAPI.clearError();
      timeAPI.clearError();
      clientAPI.clearError();
    }
  };
};

export default useTimeTrackerAPI;
