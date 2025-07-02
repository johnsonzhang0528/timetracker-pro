import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PROJECTS, DEFAULT_TIME_ENTRIES, TIMER_INTERVAL, STORAGE_KEYS, INITIAL_PROJECT_FORM } from '../Constants';
import { generateRandomColor, validateProject, calculateEarnings } from '../Utils/helpers';

// 時間追蹤主要邏輯 Hook
export const useTimeTracker = () => {
  // 計時器狀態
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // 數據狀態
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  
  // UI 狀態
  const [activeTab, setActiveTab] = useState('tracker');
  const [showToast, setShowToast] = useState(null);

  // 初始化數據載入
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const savedEntries = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
      const savedSelectedProject = localStorage.getItem(STORAGE_KEYS.SELECTED_PROJECT);
      const savedCurrentTime = localStorage.getItem(STORAGE_KEYS.CURRENT_TIME);
      const savedIsTracking = localStorage.getItem(STORAGE_KEYS.IS_TRACKING);

      // 載入專案數據
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        if (parsedProjects.length > 0) {
          setProjects(parsedProjects);
          
          // 設定選中的專案
          if (savedSelectedProject) {
            const parsedSelected = JSON.parse(savedSelectedProject);
            const foundProject = parsedProjects.find(p => p.id === parsedSelected.id);
            if (foundProject) {
              setSelectedProject(foundProject);
            } else {
              setSelectedProject(parsedProjects[0]);
            }
          } else {
            setSelectedProject(parsedProjects[0]);
          }
        } else {
          // 如果沒有儲存的專案，使用預設專案
          setProjects(DEFAULT_PROJECTS);
          setSelectedProject(DEFAULT_PROJECTS[0]);
        }
      } else {
        // 首次使用，設定預設專案
        setProjects(DEFAULT_PROJECTS);
        setSelectedProject(DEFAULT_PROJECTS[0]);
      }

      // 載入時間記錄
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
        setTimeEntries(parsedEntries);
      } else {
        setTimeEntries(DEFAULT_TIME_ENTRIES);
      }

      // 恢復計時狀態（如果用戶在計時中關閉了瀏覽器）
      if (savedIsTracking === 'true' && savedCurrentTime) {
        setIsTracking(true);
        setCurrentTime(parseInt(savedCurrentTime));
        displayToast('已恢復您的計時狀態', 'info');
      }

    } catch (error) {
      console.error('載入本地儲存資料時發生錯誤:', error);
      // 發生錯誤時使用預設數據
      setProjects(DEFAULT_PROJECTS);
      setSelectedProject(DEFAULT_PROJECTS[0]);
      setTimeEntries(DEFAULT_TIME_ENTRIES);
      displayToast('數據載入失敗，已重置為預設狀態', 'error');
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

  // 計時器邏輯
  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, TIMER_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // 開始計時 - 增強版
  const startTracking = useCallback(() => {
    if (!selectedProject) {
      displayToast('請先選擇一個專案', 'error');
      return;
    }
    
    setIsTracking(true);
    displayToast(`開始追蹤「${selectedProject.name}」`, 'success');
    
    // 記錄用戶行為
    trackUserAction('start_tracking', { 
      project: selectedProject.name,
      client: selectedProject.client 
    });
  }, [selectedProject]);

  // 暫停計時 - 增強版
  const pauseTracking = useCallback(() => {
    setIsTracking(false);
    displayToast('計時已暫停', 'info');
    trackUserAction('pause_tracking', { duration: currentTime });
  }, [currentTime]);

  // 停止計時並儲存記錄 - 增強版
  const stopTracking = useCallback(() => {
    if (currentTime > 0 && selectedProject) {
      const amount = calculateEarnings(currentTime, selectedProject.rate);
      const newEntry = {
        id: Date.now(),
        project: selectedProject.name,
        client: selectedProject.client,
        date: new Date().toISOString().split('T')[0],
        duration: currentTime,
        amount
      };
      
      setTimeEntries(prev => [newEntry, ...prev]);
      displayToast(`工作記錄已儲存！收入 NT$ ${amount.toLocaleString()}`, 'success');
      
      trackUserAction('stop_tracking', { 
        duration: currentTime,
        amount: amount,
        project: selectedProject.name 
      });
    } else {
      displayToast('沒有記錄到工作時間', 'info');
    }
    
    setIsTracking(false);
    setCurrentTime(0);
  }, [currentTime, selectedProject]);

  // 用戶行為追蹤
  const trackUserAction = (action, metadata = {}) => {
    try {
      const userActions = JSON.parse(localStorage.getItem('user_actions') || '[]');
      userActions.push({
        action,
        timestamp: new Date().toISOString(),
        ...metadata
      });
      // 只保留最近100個動作
      localStorage.setItem('user_actions', JSON.stringify(userActions.slice(-100)));
    } catch (error) {
      console.error('記錄用戶行為失敗:', error);
    }
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
    
    // 操作函數
    startTracking,
    pauseTracking,
    stopTracking,
    setSelectedProject,
    setActiveTab,
    setProjects,
    setTimeEntries,
    displayToast,
    hideToast,
    loadInitialData
  };
};

// 本地儲存 Hook - 修復版
export const useLocalStorage = (projects, timeEntries, currentTime, isTracking, selectedProject) => {
  // 儲存專案數據
  useEffect(() => {
    try {
      if (projects.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      }
    } catch (error) {
      console.error('儲存專案資料時發生錯誤:', error);
    }
  }, [projects]);

  // 儲存時間記錄
  useEffect(() => {
    try {
      if (timeEntries.length > 0) {
        localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(timeEntries));
      }
    } catch (error) {
      console.error('儲存時間記錄時發生錯誤:', error);
    }
  }, [timeEntries]);

  // 儲存計時狀態
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, currentTime.toString());
      localStorage.setItem(STORAGE_KEYS.IS_TRACKING, isTracking.toString());
    } catch (error) {
      console.error('儲存計時狀態時發生錯誤:', error);
    }
  }, [currentTime, isTracking]);

  // 儲存選中專案
  useEffect(() => {
    try {
      if (selectedProject) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_PROJECT, JSON.stringify(selectedProject));
      }
    } catch (error) {
      console.error('儲存選中專案時發生錯誤:', error);
    }
  }, [selectedProject]);
};