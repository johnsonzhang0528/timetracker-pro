import React, { useState, useEffect, useCallback } from 'react';
import { useProjectAPI } from '../Hooks/useAPI';
import { useAPIStatus } from '../contexts/APIContext';
import { apiClient } from '../Utils/ApiClient';
import { offlineSync } from '../Utils/OfflineSync';
import Toast from './Toast';
import { API_CONFIG } from '../config/api';

const ProjectManager = () => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    hourlyRate: '',
    estimatedHours: '',
    status: 'active'
  });
  const [showToast, setShowToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 自己管理 projects 狀態
  const [projects, setProjects] = useState([]);
  
  // 使用 API Hooks，取得 API 功能但不使用 API 的 projects 狀態
  const { loading, error, fetchProjects, createProject, updateProject, deleteProject } = useProjectAPI();
  const { useAPI, apiStatus } = useAPIStatus();
  
  // 計算專案總時數和收益
  const calculateProjectTotals = useCallback(async () => {
    console.log('正在計算專案總時數和收益...');
    try {
      // 從 localStorage 取得時間記錄
      const timeEntriesJson = localStorage.getItem('timetracker-time-entries');
      if (!timeEntriesJson) {
        console.log('沒有時間記錄，跳過計算');
        return;
      }
      
      const timeEntries = JSON.parse(timeEntriesJson);
      console.log(`取得 ${timeEntries.length} 筆時間記錄`);
      
      // 計算每個專案的總時數和收益
      const projectTotals = {};
      
      timeEntries.forEach(entry => {
        const projectId = entry.projectId || (entry.project && entry.project.id);
        console.log('處理時間記錄:', {
          entry: entry,
          projectId: projectId,
          duration: entry.duration,
          amount: entry.amount
        });
        
        if (!projectId) {
          console.log('跳過無專案ID的記錄:', entry);
          return;
        }
        
        if (!projectTotals[projectId]) {
          projectTotals[projectId] = { totalHours: 0, totalEarnings: 0 };
        }
        
        // 累加時數 (秒數轉小時)
        const hours = entry.duration ? entry.duration / 3600 : 0;
        projectTotals[projectId].totalHours += hours;
        
        // 累加收益
        projectTotals[projectId].totalEarnings += entry.amount || 0;
        
        console.log(`專案 ${projectId} 累計:`, {
          hours: projectTotals[projectId].totalHours,
          earnings: projectTotals[projectId].totalEarnings
        });
      });
      
      console.log('專案總計:', projectTotals);
      
      // 更新專案狀態 - 每次都重新載入專案列表以確保最新狀態
      const savedProjects = localStorage.getItem('timetracker-projects');
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects);
          console.log('重新載入專案列表進行統計計算:', parsedProjects.length);
          
          const updatedProjects = parsedProjects.map(project => {
            const totals = projectTotals[project.id];
            if (totals) {
              console.log(`更新專案 ${project.name} 統計:`, {
                hours: totals.totalHours,
                earnings: totals.totalEarnings
              });
              return {
                ...project,
                totalHours: totals.totalHours,
                totalEarnings: totals.totalEarnings
              };
            }
            return {
              ...project,
              totalHours: project.totalHours || 0,
              totalEarnings: project.totalEarnings || 0
            };
          });
          
          // 更新專案狀態
          setProjects(updatedProjects);
          
          console.log('專案統計計算完成，已更新專案列表');
        } catch (err) {
          console.error('重新載入專案失敗:', err);
        }
      } else {
        console.log('沒有找到專案列表，跳過統計計算');
      }
      
    } catch (err) {
      console.error('計算專案總時數和收益失敗:', err);
    }
  }, []); // 空依賴項，因為函數內部直接從 localStorage 讀取所有數據
  
  // 載入儲存的專案
  useEffect(() => {
    // 檢查認證狀態
    const token = localStorage.getItem('timetracker_auth_token');
    console.log('認證狀態檢查:', {
      token: token ? '存在' : '不存在',
      useAPI,
      apiStatus
    });
    
    // 首先先載入本地專案，確保畫面有內容顯示
    try {
      const savedProjects = localStorage.getItem('timetracker-projects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        console.log('初始載入本地專案:', parsedProjects.length);
        setProjects(parsedProjects);
      }
    } catch (err) {
      console.error('載入本地專案失敗:', err);
    }
    
    // 如果啟用 API，再嘗試從 API 載入
    if (useAPI) {
      // 從 API 載入專案
      fetchProjects().then((apiProjects) => {
        console.log('從 API 載入的專案:', apiProjects?.length || 0);
        
        // 只有當 API 返回的專案不為空時，才用它更新狀態
        if (apiProjects && apiProjects.length > 0) {
          setProjects(apiProjects);
          
          // 確保 API 中的專案也反映到 localStorage 中
          try {
            localStorage.setItem('timetracker-projects', JSON.stringify(apiProjects));
            console.log('API 專案已同步到本地儲存');
          } catch (err) {
            console.error('同步 API 專案到 localStorage 失敗:', err);
          }
        }
      }).catch(err => {
        console.error('從 API 載入專案失敗:', err);
      });
    } else {
      // 從 localStorage 載入專案 (作為備份)
      const savedProjects = localStorage.getItem('timetracker-projects');
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects);
          // 設置本地專案狀態
          console.log('從 localStorage 載入專案 (備份):', parsedProjects.length);
          setProjects(parsedProjects);
        } catch (err) {
          console.error('解析本地專案時出錯:', err);
        }
      }
    }
  }, [useAPI, fetchProjects]);
  
  // 監聽時間記錄的更新
  useEffect(() => {
    // 監聽 localStorage 的變更
    const handleStorageChange = (event) => {
      if (event.key === 'timetracker-time-entries') {
        console.log('偵測到時間記錄變更，重新計算專案總時數和收益');
        // 使用 setTimeout 確保 localStorage 已經完全更新
        setTimeout(() => {
          calculateProjectTotals();
        }, 100);
      }
    };
    
    // 監聽自定義事件
    const handleTimeEntryUpdated = () => {
      console.log('收到時間記錄更新事件，重新計算專案總時數和收益');
      // 使用 setTimeout 確保狀態已經更新
      setTimeout(() => {
        calculateProjectTotals();
      }, 100);
    };
    
    // 監聽專案統計更新事件
    const handleProjectStatsUpdate = () => {
      console.log('收到專案統計更新事件，立即重新計算');
      setTimeout(() => {
        calculateProjectTotals();
      }, 50);
    };
    
    // 註冊事件監聽
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('timeentry_updated', handleTimeEntryUpdated);
    window.addEventListener('project_stats_update', handleProjectStatsUpdate);
    
    // 初始計算（延遲執行，確保組件完全載入）
    const initialCalculation = setTimeout(() => {
      calculateProjectTotals();
    }, 500);
    
    // 每 30 秒更新一次
    const intervalId = setInterval(() => {
      console.log('定期重新計算專案統計...');
      calculateProjectTotals();
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('timeentry_updated', handleTimeEntryUpdated);
      window.removeEventListener('project_stats_update', handleProjectStatsUpdate);
      clearTimeout(initialCalculation);
      clearInterval(intervalId);
    };
  }, []); // 移除依賴，避免重複註冊

  // 獲取表單數據的狀態
  const [formState, setFormState] = useState({
    lastOperation: null,
    lastData: null,
    lastResult: null
  });

  const handleAddProject = async () => {
    if (newProject.name.trim()) {
      // 準備專案數據 - 嚴格按照後端 schema 和驗證規則
      const projectData = {
        name: newProject.name.trim(),
        description: newProject.description ? newProject.description.trim() : '',
        hourlyRate: parseFloat(newProject.hourlyRate) || 0,
        // 後端接受 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED' 以及其小寫版本
        status: (newProject.status || 'active').toUpperCase(),
        color: '#3B82F6' // 添加預設顏色欄位
      };
      
      console.log('DEBUG: 發送專案創建請求，資料:', JSON.stringify(projectData, null, 2));
      setFormState({
        lastOperation: 'add',
        lastData: projectData,
        lastResult: null
      });
      
      try {
        // 使用 API 創建專案
        if (useAPI) {
          console.log('DEBUG: 發送專案創建請求，資料:', JSON.stringify(projectData, null, 2));
          const result = await createProject(projectData);
          console.log('DEBUG: API 回應結果:', result);
          
          setFormState(prev => ({ ...prev, lastResult: result }));
          
          if (result.success) {
            // 更新本地狀態
            setProjects(prev => {
              const updatedProjects = [...prev, result.data];
              
              // 同時更新 localStorage
              try {
                localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
                console.log('📦 新專案同步保存到 localStorage，總數:', updatedProjects.length);
              } catch (err) {
                console.error('保存專案到 localStorage 失敗:', err);
              }
              
              return updatedProjects;
            });
            
            setShowToast({
              type: 'success',
              message: '專案新增成功！'
            });
          } else {
            throw new Error(result.message || '專案創建失敗');
          }
        } else {
          // 使用本地儲存
          const project = {
            id: Date.now(),
            ...projectData,
            totalHours: 0,
            createdAt: new Date().toISOString()
          };
          
          // 更新本地狀態
          setProjects(prev => {
            const updatedProjects = [...prev, project];
            
            // 同時更新 localStorage
            try {
              localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
              console.log('📦 新專案保存到 localStorage，總數:', updatedProjects.length);
            } catch (err) {
              console.error('保存專案到 localStorage 失敗:', err);
            }
            
            return updatedProjects;
          });
          
          setShowToast({
            type: 'info',
            message: '專案已儲存到本地（離線模式）'
          });
        }
      } catch (error) {
        console.error('新增專案失敗:', error);
        
        // 使用新的錯誤處理函數獲取更詳細的錯誤信息
        const errorMessage = error.response ? handleAPIError(error) : error.message;
        
        setShowToast({
          type: 'error',
          message: `新增專案失敗: ${errorMessage}`
        });
        
        // 嘗試使用本地儲存作為備份
        if (useAPI) {
          console.log('API 新增失敗，嘗試本地儲存作為備份');
          addProjectLocally();
        }
      }
      
      // 重置表單
      setNewProject({
        name: '',
        description: '',
        hourlyRate: '',
        estimatedHours: '',
        status: 'active'
      });
      setIsAddingProject(false);
    }
  };

  // 添加一個直接使用本地存儲的備用函數
  const addProjectLocally = () => {
    if (newProject.name.trim()) {
      try {
        const project = {
          id: Date.now(),
          name: newProject.name.trim(),
          description: newProject.description ? newProject.description.trim() : '',
          hourlyRate: parseFloat(newProject.hourlyRate) || 0,
          estimatedHours: parseFloat(newProject.estimatedHours) || 0,
          status: newProject.status || 'active',
          totalHours: 0,
          createdAt: new Date().toISOString(),
          color: '#3B82F6'
        };
        
        console.log('📝 準備本地新增專案:', project);
        
        // 更新本地狀態
        setProjects(prev => {
          console.log('原有專案數:', prev.length);
          const updatedProjects = [...prev, project];
          console.log('新專案數:', updatedProjects.length);
          
          // 同時存儲到 localStorage
          try {
            localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
            console.log('📝 本地新增專案完成，目前總數:', updatedProjects.length);
          } catch (err) {
            console.error('本地保存專案失敗:', err);
          }
          
          return updatedProjects;
        });
        
        setNewProject({
          name: '',
          description: '',
          hourlyRate: '',
          estimatedHours: '',
          status: 'active'
        });
        
        setIsAddingProject(false);
        
        setShowToast({
          type: 'success',
          message: '專案已新增到本地存儲'
        });
        
        // 為了確保 UI 已更新，我們在短暫延遲後再次檢查
        setTimeout(() => {
          const savedProjects = localStorage.getItem('timetracker-projects');
          if (savedProjects) {
            const count = JSON.parse(savedProjects).length;
            console.log(`🔍 驗證: 本地儲存現有 ${count} 個專案`);
          }
        }, 500);
        
        return true;
      } catch (err) {
        console.error('本地新增專案失敗:', err);
        setShowToast({
          type: 'error',
          message: `本地儲存失敗: ${err.message}`
        });
        return false;
      }
    }
    return false;
  };

  const handleDeleteProject = async (projectId) => {
    if (confirm('確定要刪除這個專案嗎？')) {
      try {
        if (useAPI) {
          // 使用 API 刪除專案
          const result = await deleteProject(projectId);
          if (result.success) {
            // 更新本地狀態
            setProjects(prev => {
              const updatedProjects = prev.filter(p => p.id !== projectId);
              
              // 同時更新 localStorage
              try {
                localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
                console.log('📦 從 localStorage 同步刪除專案:', projectId);
              } catch (err) {
                console.error('清理 localStorage 專案失敗:', err);
              }
              
              return updatedProjects;
            });
            
            setShowToast({
              type: 'success',
              message: '專案已成功刪除'
            });
          } else {
            throw new Error(result.message || '刪除專案失敗');
          }
        } else {
          // 從本地儲存刪除
          setProjects(prev => {
            const updatedProjects = prev.filter(p => p.id !== projectId);
            
            // 同時更新 localStorage
            try {
              localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
              console.log('📦 從 localStorage 刪除專案:', projectId);
            } catch (err) {
              console.error('清理 localStorage 專案失敗:', err);
            }
            
            return updatedProjects;
          });
          
          setShowToast({
            type: 'info',
            message: '專案已從本地刪除（離線模式）'
          });
        }
      } catch (error) {
        console.error('刪除專案失敗:', error);
        setShowToast({
          type: 'error',
          message: `刪除專案失敗: ${error.message}`
        });
      }
    }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      if (useAPI) {
        // 使用 API 更新專案狀態
        const result = await updateProject(projectId, { status: newStatus.toUpperCase() });
        if (result.success) {
          // 更新本地狀態
          setProjects(prev => {
            const updatedProjects = prev.map(p => 
              p.id === projectId ? { ...p, status: newStatus } : p
            );
            
            // 同時更新 localStorage
            try {
              localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
              console.log('📦 專案狀態同步更新到 localStorage');
            } catch (err) {
              console.error('更新 localStorage 專案狀態失敗:', err);
            }
            
            return updatedProjects;
          });
          
          setShowToast({
            type: 'success',
            message: '專案狀態已更新'
          });
        } else {
          throw new Error(result.message || '更新專案狀態失敗');
        }
      } else {
        // 直接更新本地狀態
        setProjects(prev => {
          const updatedProjects = prev.map(p => 
            p.id === projectId ? { ...p, status: newStatus } : p
          );
          
          // 同時更新 localStorage
          try {
            localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
            console.log('📦 專案狀態已更新到 localStorage（離線模式）');
          } catch (err) {
            console.error('更新 localStorage 專案狀態失敗:', err);
          }
          
          return updatedProjects;
        });
        
        setShowToast({
          type: 'info',
          message: '專案狀態已在本地更新（離線模式）'
        });
      }
    } catch (error) {
      console.error('更新專案狀態失敗:', error);
      setShowToast({
        type: 'error',
        message: `更新專案狀態失敗: ${error.message}`
      });
    }
  };

  // 同步本地專案到後端資料庫
  const syncLocalProjectsToAPI = async () => {
    if (!useAPI) {
      setShowToast({
        type: 'error',
        message: 'API 模式未啟用，無法同步'
      });
      return;
    }
    
    try {
      setIsSyncing(true);
      
      // 獲取本地儲存的專案
      const savedProjects = localStorage.getItem('timetracker-projects');
      if (!savedProjects) {
        setShowToast({
          type: 'info',
          message: '沒有找到本地專案數據'
        });
        setIsSyncing(false);
        return;
      }
      
      const localProjects = JSON.parse(savedProjects);
      if (localProjects.length === 0) {
        setShowToast({
          type: 'info',
          message: '本地沒有專案可同步'
        });
        setIsSyncing(false);
        return;
      }
      
      // 獲取當前 API 中的專案列表
      const apiProjects = await fetchProjects();
      
      // 比較並同步
      let synced = 0;
      let errors = 0;
      let newApiProjects = [];
      
      // 同步每一個本地專案
      for (const localProject of localProjects) {
        // 檢查此專案是否已存在於 API 中 (基於名稱)
        const existingProject = apiProjects.find(p => p.name === localProject.name);
        
        try {
          if (existingProject) {
            // 更新現有專案
            const updateData = {
              description: localProject.description || '',
              hourlyRate: parseFloat(localProject.hourlyRate) || 0,
              status: localProject.status.toUpperCase() || 'ACTIVE'
            };
            
            console.log(`更新 API 中的專案 "${localProject.name}"`, updateData);
            const result = await updateProject(existingProject.id, updateData);
            
            if (result.success) {
              newApiProjects.push(result.data);
              synced++;
            } else {
              errors++;
            }
          } else {
            // 創建新專案
            const createData = {
              name: localProject.name,
              description: localProject.description || '',
              hourlyRate: parseFloat(localProject.hourlyRate) || 0,
              status: localProject.status.toUpperCase() || 'ACTIVE',
              color: localProject.color || '#3B82F6'
            };
            
            console.log(`創建新專案 "${localProject.name}"`, createData);
            const result = await createProject(createData);
            
            if (result.success) {
              newApiProjects.push(result.data);
              synced++;
            } else {
              errors++;
            }
          }
        } catch (err) {
          console.error(`同步專案 "${localProject.name}" 失敗:`, err);
          errors++;
        }
      }
      
      // 完成後更新專案列表
      if (newApiProjects.length > 0) {
        setProjects(newApiProjects);
        localStorage.setItem('timetracker-projects', JSON.stringify(newApiProjects));
        console.log('同步完成，更新專案列表:', newApiProjects.length);
      } else {
        await fetchProjects(); // 再次從 API 獲取最新資料
      }
      
      setShowToast({
        type: errors === 0 ? 'success' : 'warning',
        message: `同步完成：${synced} 個專案成功${errors > 0 ? `，${errors} 個失敗` : ''}`
      });
    } catch (error) {
      console.error('同步專案失敗:', error);
      setShowToast({
        type: 'error',
        message: `同步失敗: ${error.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { text: '進行中', class: 'status-active' },
      completed: { text: '已完成', class: 'status-completed' },
      paused: { text: '暫停', class: 'status-paused' }
    };
    return statusMap[status] || statusMap.active;
  };

  const calculateProgress = (project) => {
    if (!project || !project.estimatedHours || project.estimatedHours === 0) return 0;
    const totalHours = project.totalHours || 0;
    return Math.min((totalHours / project.estimatedHours) * 100, 100);
  };

  // 處理 API 錯誤響應的函數
  const handleAPIError = (error) => {
    console.error('API 錯誤:', error);
    
    // 檢查是否有詳細的驗證錯誤
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      
      // 檢查詳細的錯誤信息
      if (errorData.details) {
        const errorDetails = errorData.details;
        let errorMessage = '資料驗證失敗:\n';
        
        // 收集具體的錯誤原因
        const fieldErrors = {};
        
        errorDetails.forEach(detail => {
          errorMessage += `- ${detail.field}: ${detail.message}\n`;
          fieldErrors[detail.field] = detail.message;
        });
        
        // 添加具體的問題解決建議
        if (fieldErrors.status) {
          errorMessage += '\n狀態欄位必須是: ACTIVE, COMPLETED, PAUSED, CANCELLED (全大寫)';
        }
        
        if (fieldErrors.hourlyRate) {
          errorMessage += '\n時薪必須是正數';
        }
        
        if (fieldErrors.color && fieldErrors.color.includes('pattern')) {
          errorMessage += '\n顏色格式必須是: #RRGGBB 或 #RGB';
        }
        
        return errorMessage;
      } else if (errorData.message) {
        return errorData.message;
      }
    }
    
    // 返回通用錯誤消息
    return error.message || '未知錯誤';
  };

  // 測試函數：檢查認證狀態並嘗試請求
  const testAuthentication = async () => {
    const token = localStorage.getItem('timetracker_auth_token');
    console.log('當前認證令牌:', token);
    
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      const data = await response.json();
      console.log('認證驗證結果:', {
        status: response.status,
        ok: response.ok,
        data
      });
      
      setShowToast({
        type: response.ok ? 'success' : 'error',
        message: response.ok 
          ? '認證有效，用戶 ID: ' + data.user?.id
          : '認證無效: ' + data.message
      });
    } catch (error) {
      console.error('認證測試失敗:', error);
      setShowToast({
        type: 'error',
        message: `認證測試失敗: ${error.message}`
      });
    }
  };

  // 強制從 localStorage 重新載入專案
  const forceReloadProjects = async () => {
    try {
      const savedProjects = localStorage.getItem('timetracker-projects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        console.log('強制重新載入本地專案:', parsedProjects.length);
        setProjects(parsedProjects);
        
        // 重新計算專案總時數和收益
        setTimeout(() => {
          calculateProjectTotals();
        }, 100);
        
        setShowToast({
          type: 'info',
          message: `已重新載入 ${parsedProjects.length} 個本地專案`
        });
      } else {
        console.log('本地儲存中沒有專案');
        setProjects([]);
        
        setShowToast({
          type: 'warning',
          message: '本地儲存中沒有專案'
        });
      }
      
      // 如果 API 可用，也嘗試重新載入 API 專案
      if (useAPI) {
        try {
          const apiProjects = await fetchProjects();
          if (apiProjects && apiProjects.length > 0) {
            console.log('從 API 重新載入專案:', apiProjects.length);
            setProjects(apiProjects);
            
            // 更新本地儲存
            localStorage.setItem('timetracker-projects', JSON.stringify(apiProjects));
            
            setShowToast({
              type: 'success',
              message: `從 API 載入了 ${apiProjects.length} 個專案`
            });
            
            // 重新計算專案總時數和收益
            setTimeout(() => {
              calculateProjectTotals();
            }, 100);
          }
        } catch (err) {
          console.error('從 API 重新載入失敗:', err);
        }
      }
    } catch (err) {
      console.error('重新載入專案失敗:', err);
      
      setShowToast({
        type: 'error',
        message: `重新載入失敗: ${err.message}`
      });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>專案管理</h1>
        <div className="header-actions">
          <button 
            className="btn btn-text"
            onClick={() => {
              forceReloadProjects();
              
              // 檢查是否有時間記錄
              const timeEntriesJson = localStorage.getItem('timetracker-time-entries');
              if (timeEntriesJson) {
                const timeEntries = JSON.parse(timeEntriesJson);
                if (timeEntries.length > 0) {
                  console.log(`有 ${timeEntries.length} 筆時間記錄`);
                  // 提示用戶有時間記錄
                  setTimeout(() => {
                    setShowToast({
                      type: 'info',
                      message: `有 ${timeEntries.length} 筆時間記錄，請稍等片刻讓系統更新專案時間與收益`
                    });
                  }, 1000);
                }
              }
            }}
          >
            🔄 重新載入
          </button>

          <button 
            className="btn btn-text"
            onClick={() => {
              console.log('手動重新計算專案統計');
              calculateProjectTotals();
              setShowToast({
                type: 'info',
                message: '正在重新計算專案統計...'
              });
            }}
          >
            📊 重新計算統計
          </button>
          
          {useAPI && (
            <>
              <button 
                className="btn btn-text"
                onClick={testAuthentication}
              >
                測試認證
              </button>
              
              <button 
                className={`btn btn-secondary ${isSyncing ? 'loading' : ''}`}
                onClick={syncLocalProjectsToAPI}
                disabled={isSyncing || loading}
              >
                {isSyncing ? '同步中...' : '同步本地專案'}
              </button>
            </>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddingProject(true)}
            disabled={loading}
          >
            + 新增專案
          </button>
        </div>
      </div>

      {/* API 狀態指示器 */}
      {useAPI && (
        <div className="api-status">
          <div className={`status-indicator ${apiStatus ? 'online' : 'offline'}`}>
            {apiStatus ? '線上模式' : '離線模式'}
          </div>
        </div>
      )}

      {/* 載入中指示器 */}
      {loading && (
        <div className="loading-indicator">載入專案中...</div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-message">
          <p>載入專案時發生錯誤: {error}</p>
          <button className="btn btn-small" onClick={fetchProjects}>重試</button>
        </div>
      )}

      {/* 統計卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">總專案數</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {projects.filter(p => p.status === 'active').length}
          </div>
          <div className="stat-label">進行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {projects.filter(p => p.status === 'completed').length}
          </div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ${projects.reduce((sum, p) => sum + (p.totalHours * p.hourlyRate), 0).toFixed(0)}
          </div>
          <div className="stat-label">總收益</div>
        </div>
      </div>

      {/* 新增專案表單 */}
      {isAddingProject && (
        <div className="form-container">
          <div className="form-header">
            <h3>新增專案</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAddingProject(false)}
            >
              ✕ 關閉
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>專案名稱 *</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                placeholder="輸入專案名稱"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>時薪 (NT$)</label>
              <input
                type="number"
                value={newProject.hourlyRate}
                onChange={(e) => setNewProject({...newProject, hourlyRate: e.target.value})}
                placeholder="800"
                className="form-input"
                min="0"
                step="50"
              />
            </div>

            <div className="form-group">
              <label>預估時數</label>
              <input
                type="number"
                value={newProject.estimatedHours}
                onChange={(e) => setNewProject({...newProject, estimatedHours: e.target.value})}
                placeholder="40"
                className="form-input"
                min="0"
                step="0.5"
              />
            </div>

            <div className="form-group">
              <label>專案狀態</label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                className="form-select"
              >
                <option value="active">🟢 進行中</option>
                <option value="paused">🟡 暫停</option>
                <option value="completed">✅ 已完成</option>
              </select>
            </div>

            <div className="form-group form-group-full">
              <label>專案描述</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="詳細描述專案內容、目標和需求..."
                rows="4"
                className="form-textarea"
              />
            </div>

            <div className="form-actions form-group-full">
              <button 
                className="btn btn-secondary"
                onClick={() => setIsAddingProject(false)}
                type="button"
              >
                取消
              </button>
              
              {useAPI && (
                <button 
                  className="btn btn-outline"
                  onClick={addProjectLocally}
                  type="button"
                >
                  本地儲存
                </button>
              )}
              
              <button 
                className="btn btn-primary"
                onClick={handleAddProject}
                type="button"
              >
                新增專案
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 專案列表 */}
      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>還沒有專案</h3>
            <p>點擊上方「新增專案」按鈕來建立第一個專案</p>
          </div>
        ) : (
          projects.map(project => {
            const statusInfo = getStatusBadge(project.status);
            const progress = calculateProgress(project);
            
            // 安全處理日期
            let createdDate = '未知日期';
            try {
              if (project.createdAt) {
                createdDate = new Date(project.createdAt).toLocaleDateString('zh-TW');
              }
            } catch (err) {
              console.error('日期格式錯誤:', err);
            }
            
            return (
              <div key={project.id} className="project-card">
                <div className="project-card-top">
                  <div className={`status-indicator status-${project.status}`}></div>
                  <div className="project-header">
                    <h3 className="project-title">{project.name}</h3>
                    <div className={`status-badge ${statusInfo.class}`}>
                      {statusInfo.text}
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                </div>
                
                <div className="project-card-content">
                  <div className="project-stats">
                    <div className="project-stat">
                      <div className="stat-icon">💰</div>
                      <span className="stat-label">時薪</span>
                      <span className="stat-value">${project.hourlyRate || 0}</span>
                    </div>
                    <div className="project-stat">
                      <div className="stat-icon">⏱️</div>
                      <span className="stat-label">已工作</span>
                      <span className="stat-value">{(project.totalHours || 0).toFixed(1)}h</span>
                    </div>
                    <div className="project-stat">
                      <div className="stat-icon">📊</div>
                      <span className="stat-label">預估</span>
                      <span className="stat-value">{project.estimatedHours || 0}h</span>
                    </div>
                    <div className="project-stat">
                      <div className="stat-icon">💵</div>
                      <span className="stat-label">收益</span>
                      <span className="stat-value">${project.totalEarnings ? project.totalEarnings.toFixed(0) : ((project.totalHours || 0) * (project.hourlyRate || 0)).toFixed(0)}</span>
                    </div>
                  </div>
                  
                  {project.estimatedHours > 0 && (
                    <div className="progress-container">
                      <div className="progress-label">
                        <span>進度</span>
                        <span>{(progress || 0).toFixed(0)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill progress-fill-${project.status}`}
                          style={{ width: `${progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="project-card-footer">
                  <div className="project-date">
                    <span className="date-icon">📅</span>
                    <span>建立於 {createdDate}</span>
                  </div>
                  <div className="project-actions">
                    <select
                      value={project.status}
                      onChange={(e) => handleStatusChange(project.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="active">進行中</option>
                      <option value="paused">暫停</option>
                      <option value="completed">已完成</option>
                    </select>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 調試專案資料 */}
      <div className="debug-info" style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px', fontSize: '12px' }}>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            調試資訊: 專案數據 ({projects.length})
          </summary>
          <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(projects, null, 2)}
          </pre>
          <div style={{ marginTop: '10px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
            <h4>本地儲存</h4>
            <button 
              className="btn btn-small"
              onClick={() => {
                const savedProjects = localStorage.getItem('timetracker-projects');
                if (savedProjects) {
                  console.log('本地專案數據:', JSON.parse(savedProjects));
                  alert(`本地儲存中有 ${JSON.parse(savedProjects).length} 個專案`);
                } else {
                  console.log('本地儲存中沒有專案');
                  alert('本地儲存中沒有專案');
                }
              }}
            >
              查看本地儲存
            </button>
            
            <button 
              className="btn btn-small"
              onClick={() => {
                localStorage.removeItem('timetracker-projects');
                alert('已清空本地專案儲存');
                forceReloadProjects();
              }}
              style={{ marginLeft: '10px' }}
            >
              清空本地儲存
            </button>
            
            <button 
              className="btn btn-small"
              onClick={() => {
                calculateProjectTotals();
                alert('已重新計算專案時間和收益');
              }}
              style={{ marginLeft: '10px' }}
            >
              重新計算時間和收益
            </button>
          </div>
          
          {formState.lastOperation && (
            <div style={{ marginTop: '10px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              <h4>最近操作</h4>
              <p>操作: {formState.lastOperation}</p>
              <details>
                <summary>提交數據</summary>
                <pre>{JSON.stringify(formState.lastData, null, 2)}</pre>
              </details>
              {formState.lastResult && (
                <details>
                  <summary>API 回應</summary>
                  <pre>{JSON.stringify(formState.lastResult, null, 2)}</pre>
                </details>
              )}
            </div>
          )}
        </details>
      </div>

      {/* Toast 訊息 */}
      {showToast && (
        <Toast 
          type={showToast.type} 
          message={showToast.message}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
};

export default ProjectManager;
