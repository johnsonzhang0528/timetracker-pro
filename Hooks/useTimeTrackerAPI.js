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
  
  // 用於計時器暫停恢復的引用
  const pausedTimeRef = useRef(null);
  const pauseTimeOffsetRef = useRef(0);

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
      
      // 將活動的計時記錄保存到 localStorage，以便重新載入頁面時恢復
      localStorage.setItem('timetracker_active_entry', JSON.stringify(activeEntry));
      
      setSelectedProject(matchedProject);
      setStartTime(new Date(activeEntry.startTime));
      
      // 計算已經過的時間
      const elapsed = Math.floor((Date.now() - new Date(activeEntry.startTime)) / 1000);
      setCurrentTime(elapsed);
    } else {
      setIsTracking(false);
      setCurrentTime(0);
      setStartTime(null);
      
      // 清除 localStorage 中的所有計時相關記錄
      localStorage.removeItem('timetracker_active_entry');
      localStorage.removeItem('timetracker_is_tracking');
      localStorage.removeItem('timetracker_paused_entry');
      localStorage.removeItem('timetracker_resumed');
      
      console.log('已清除所有本地計時狀態');
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
      // 檢查是否從暫停恢復，如果是，使用保存的currentTime作為基礎時間
      const wasResumed = localStorage.getItem('timetracker_resumed');
      
      if (wasResumed) {
        // 從暫停中恢復的計時，我們需要使用儲存的時間值
        const resumedData = JSON.parse(wasResumed);
        pausedTimeRef.current = resumedData.resumedAt;
        pauseTimeOffsetRef.current = resumedData.currentTime;
        
        // 使用暫停時的計時作為基準，並添加恢復後的時間
        interval = setInterval(() => {
          const resumedTime = pauseTimeOffsetRef.current;
          const elapsedSinceResume = Math.floor((Date.now() - new Date(pausedTimeRef.current)) / 1000);
          setCurrentTime(resumedTime + elapsedSinceResume);
        }, TIMER_INTERVAL);
        
        // 清除恢復標記，但保留偏移值以繼續正確計時
        localStorage.removeItem('timetracker_resumed');
      } else {
        // 正常計時，直接從 startTime 計算
        interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - new Date(activeEntry.startTime)) / 1000);
          setCurrentTime(elapsed);
        }, TIMER_INTERVAL);
      }
    }
    
    return () => clearInterval(interval);
  }, [isTracking, activeEntry]);

  // 開始計時 - API 版本
  const startTracking = useCallback(async () => {
    // 檢查是否有暫停的計時
    const pausedEntryJson = localStorage.getItem('timetracker_paused_entry');
    
    if (pausedEntryJson) {
      try {
        const pausedEntry = JSON.parse(pausedEntryJson);
        
        // 如果有暫停的計時，恢復它
        console.log('找到暫停的計時記錄，準備恢復:', pausedEntry);
        
        // 選擇之前暫停的項目
        const pausedProject = projects.find(p => p.id === pausedEntry.projectId);
        if (pausedProject && pausedProject.id !== selectedProject?.id) {
          setSelectedProject(pausedProject);
          console.log('已選擇暫停時的專案:', pausedProject.name);
        }
        
        // 恢復計時狀態，記錄恢復時間和暫停時的時間
        setCurrentTime(pausedEntry.currentTime || 0);
        setIsTracking(true);
        
        // 存儲恢復時間和暫停時的當前時間，用於後續計算
        localStorage.setItem('timetracker_resumed', JSON.stringify({
          resumedAt: new Date().toISOString(),
          currentTime: pausedEntry.currentTime || 0,
          pausedAt: pausedEntry.pausedAt
        }));
        
        // 清除暫停的計時記錄
        localStorage.removeItem('timetracker_paused_entry');
        
        displayToast(`已恢復「${pausedProject?.name || '未知專案'}」的計時`, 'success');
        
        trackUserAction('resume_tracking', { 
          project: pausedProject?.name,
          projectId: pausedEntry.projectId,
          duration: pausedEntry.currentTime
        });
        
        return { success: true, resumed: true };
      } catch (error) {
        console.error('恢復暫停計時失敗:', error);
        localStorage.removeItem('timetracker_paused_entry');
      }
    }
    
    // 如果沒有暫停的計時，或恢復失敗，則開始新計時
    if (!selectedProject) {
      displayToast('請先選擇一個專案', 'error');
      return { success: false, message: '請先選擇一個專案' };
    }
    
    // 檢查是否已經有活動的計時，但不是簡單的 isTracking 檢查
    // 因為可能存在本地狀態與後端狀態不一致的情況
    const localActiveEntry = localStorage.getItem('timetracker_active_entry');
    const localIsTracking = localStorage.getItem('timetracker_is_tracking') === 'true';
    
    if (isTracking || localIsTracking || localActiveEntry) {
      console.log('檢測到已有活動計時:', { isTracking, localIsTracking, hasLocalActiveEntry: !!localActiveEntry });
      
      // 如果本地狀態顯示正在計時，但應用狀態不一致，嘗試修復
      if ((localIsTracking || localActiveEntry) && !isTracking) {
        console.log('本地狀態與應用狀態不一致，嘗試修復');
        
        // 嘗試獲取後端活動計時狀態
        try {
          const activeTimerResult = await timeAPI.getActiveTimer();
          if (activeTimerResult.success && activeTimerResult.data) {
            // 同步狀態
            timeAPI.setActiveEntry(activeTimerResult.data);
            console.log('已同步後端活動計時狀態');
          } else {
            // 後端沒有活動計時，清除本地狀態
            localStorage.removeItem('timetracker_active_entry');
            localStorage.removeItem('timetracker_is_tracking');
            console.log('已清除不一致的本地狀態');
          }
        } catch (err) {
          console.warn('無法獲取後端活動計時狀態:', err);
        }
      }
      
      // 再次檢查是否仍有活動計時
      if (isTracking || timeAPI.activeEntry) {
        const errorMessage = '已有正在進行的計時，請先停止';
        displayToast(errorMessage, 'warning');
        return { success: false, message: errorMessage };
      }
    }
    
    try {
      setLoading(true);
      console.log('嘗試開始計時:', { selectedProject: selectedProject.name, projectId: selectedProject.id });
      
      // 使用 apiClient 進行操作 - 它會處理離線情況
      const result = await apiClient.timeEntries.startTimer(selectedProject.id, '');
      
      if (result.success) {
        console.log('開始計時成功:', result);
        
        // 更新活動計時狀態
        timeAPI.setActiveEntry(result.data);
        
        // 記錄到本地儲存
        localStorage.setItem('timetracker_is_tracking', 'true');
        
        if (result.offline) {
          // 離線模式處理
          displayToast(`開始追蹤「${selectedProject.name}」(離線模式)`, 'info');
        } else {
          // 在線模式處理
          displayToast(`開始追蹤「${selectedProject.name}」`, 'success');
        }
        
        trackUserAction('start_tracking', { 
          project: selectedProject.name,
          projectId: selectedProject.id,
          offline: !!result.offline
        });
        
        return result;
      } else {
        console.error('開始計時失敗:', result);
        displayToast(result.message || '開始計時失敗', 'error');
        return result;
      }
    } catch (error) {
      console.error('開始計時失敗:', error);
      displayToast(error.message || '開始計時失敗', 'error');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [selectedProject, projects, isTracking, timeAPI.activeEntry, setSelectedProject, setCurrentTime, setIsTracking, timeAPI, displayToast, trackUserAction]);

  // 暫停計時 - API 版本 (暫時停止但不保存記錄)
  const pauseTracking = useCallback(async () => {
    if (!activeEntry) {
      displayToast('沒有活動的計時記錄', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // 保存當前計時記錄而不實際停止
      // 先存下當前活動記錄的資訊
      const pausedEntry = { ...activeEntry };
      
      // 暫停計時，但不保存到服務器，只更新本地狀態
      setIsTracking(false);
      
      // 儲存當前的暫停資訊到本地存儲中
      localStorage.setItem('timetracker_paused_entry', JSON.stringify({
        entryId: pausedEntry.id,
        projectId: pausedEntry.projectId,
        description: pausedEntry.description || '',
        startTime: pausedEntry.startTime,
        pausedAt: new Date().toISOString(),
        currentTime: currentTime,
      }));

      // 保留 activeEntry，只改變 isTracking 狀態，不調用 setActiveEntry(null)
      // 這樣在恢復時可以繼續使用同一個計時
      
      displayToast('計時已暫停 (可以稍後繼續)', 'info');
      
      trackUserAction('pause_tracking', { 
        duration: currentTime,
        projectId: pausedEntry.projectId,
        paused: true
      });
      
      return { success: true, paused: true };
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
    // 詳細檢查 activeEntry
    console.log('檢查 activeEntry:', {
      exists: !!activeEntry,
      id: activeEntry?.id,
      startTime: activeEntry?.startTime,
      endTime: activeEntry?.endTime,
      projectId: activeEntry?.projectId
    });
    
    let currentActiveEntry = activeEntry;
    
    if (!currentActiveEntry) {
      // 嘗試從 localStorage 獲取活動的計時記錄
      try {
        const activeEntryJson = localStorage.getItem('timetracker_active_entry');
        if (activeEntryJson) {
          const storedActiveEntry = JSON.parse(activeEntryJson);
          console.log('從 localStorage 找到活動計時記錄:', storedActiveEntry);
          if (storedActiveEntry.id) {
            // 暫時設置活動計時記錄
            timeAPI.setActiveEntry(storedActiveEntry);
            currentActiveEntry = storedActiveEntry;
            console.log('從 localStorage 設置了活動計時記錄');
          } else {
            displayToast('活動計時記錄缺少 ID', 'error');
            return { success: false, message: '活動計時記錄缺少 ID' };
          }
        } else {
          // 如果 localStorage 中也沒有活動計時記錄，嘗試查詢API
          try {
            console.log('嘗試從API獲取活動計時記錄');
            const activeTimerResult = await timeAPI.getActiveTimer();
            if (activeTimerResult.success && activeTimerResult.data) {
              currentActiveEntry = activeTimerResult.data;
              timeAPI.setActiveEntry(currentActiveEntry);
              console.log('從API獲取並設置了活動計時記錄:', currentActiveEntry);
            } else {
              displayToast('沒有活動的計時記錄', 'error');
              return { success: false, message: '沒有活動的計時記錄' };
            }
          } catch (apiErr) {
            console.error('從API獲取活動計時記錄失敗:', apiErr);
            displayToast('沒有活動的計時記錄', 'error');
            return { success: false, message: '沒有活動的計時記錄' };
          }
        }
      } catch (err) {
        console.error('嘗試從 localStorage 獲取活動計時記錄失敗:', err);
        displayToast('沒有活動的計時記錄', 'error');
        return { success: false, message: '沒有活動的計時記錄' };
      }
    }
    
    // 再次檢查 activeEntry (可能已通過上述代碼設置)
    if (!currentActiveEntry?.id) {
      displayToast('活動計時記錄缺少 ID', 'error');
      console.error('活動計時記錄缺少 ID:', currentActiveEntry);
      return { success: false, message: '活動計時記錄缺少 ID' };
    }
    
    try {
      setLoading(true);
      console.log('停止計時中...', currentActiveEntry.id);
      
      // 使用 apiClient 進行操作
      const result = await apiClient.timeEntries.stopTimer(currentActiveEntry.id);
      
      console.log('停止計時結果:', result);
      
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
        
        // 清除所有計時相關的本地存儲
        localStorage.removeItem('timetracker_paused_entry');
        localStorage.removeItem('timetracker_resumed');
        localStorage.removeItem('timetracker_active_entry');
        localStorage.removeItem('timetracker_is_tracking');
        
        // 重置計時器引用
        pausedTimeRef.current = null;
        pauseTimeOffsetRef.current = 0;
        
        // 設置活動計時為 null
        timeAPI.setActiveEntry(null);
          
          // 保存到 localStorage 時觸發 storage 事件以通知其他組件更新
          try {
            // 先獲取已有的時間記錄
            const existingEntriesJson = localStorage.getItem('timetracker-time-entries');
            const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
            
            // 確保新記錄不會重複添加
            const isDuplicate = existingEntries.some(entry => 
              entry.id === newTimeEntry.id || 
              (entry.startTime === newTimeEntry.startTime && entry.endTime === newTimeEntry.endTime)
            );
            
            if (!isDuplicate) {
              // 添加新記錄
              existingEntries.unshift(newTimeEntry);
              
              // 重新保存
              localStorage.setItem('timetracker-time-entries', JSON.stringify(existingEntries));
              
              console.log('成功將新記錄保存到 localStorage:', {
                newEntry: newTimeEntry,
                totalEntries: existingEntries.length
              });
            } else {
              console.log('發現重複記錄，未添加到 localStorage');
            }
            
            // 不論如何都觸發更新事件
            window.dispatchEvent(new Event('timeentry_updated'));
            
            // 額外嘗試：直接更新 timeEntries 狀態
            setTimeout(() => {
              console.log('延遲更新 timeEntries 狀態');
              if (timeAPI && typeof timeAPI.setTimeEntries === 'function') {
                timeAPI.setTimeEntries([...existingEntries]);
              }
            }, 200);
          } catch (err) {
            console.error('保存時間記錄到本地儲存失敗:', err);
          }
          
          // 注意：移除自動重新載入，避免覆蓋剛添加的新記錄
          // 讓 App.jsx 的 wrappedStopTracking 來處理後續的數據同步
          console.log('停止計時完成，新記錄已添加到本地狀態');
        
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
    
    // API 引用 - 允許直接訪問 API Hooks 以進行更高級操作
    projectAPI,
    timeAPI,
    clientAPI,
    
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
    setProjects: (projects) => {
      if (projectAPI && typeof projectAPI.setProjects === 'function') {
        projectAPI.setProjects(projects);
      }
    },
    setTimeEntries: (entriesOrUpdater) => {
      if (timeAPI && typeof timeAPI.setTimeEntries === 'function') {
        console.log('API Hook: 更新時間記錄');
        if (typeof entriesOrUpdater === 'function') {
          timeAPI.setTimeEntries(entriesOrUpdater);
        } else {
          timeAPI.setTimeEntries(() => entriesOrUpdater);
        }
      }
    },
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
