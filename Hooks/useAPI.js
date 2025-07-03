import { useState, useEffect } from 'react';

// API 基礎 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 請求限制配置
const REQUEST_LIMITS = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  backoffMultiplier: 2,
  maxDelay: 10000, // 10秒
};

// 請求去重和限制
const requestCache = new Map();
const activeRequests = new Set();

// 延遲函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 通用 API 請求函數
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('timetracker_auth_token');
  const requestKey = `${options.method || 'GET'}_${endpoint}_${JSON.stringify(options.body || '')}`;
  
  // 防止重複請求
  if (activeRequests.has(requestKey)) {
    console.log(`🔄 跳過重複請求: ${requestKey}`);
    return requestCache.get(requestKey);
  }
  
  activeRequests.add(requestKey);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  let lastError;
  
  for (let attempt = 0; attempt < REQUEST_LIMITS.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = Math.min(
          REQUEST_LIMITS.baseDelay * Math.pow(REQUEST_LIMITS.backoffMultiplier, attempt - 1),
          REQUEST_LIMITS.maxDelay
        );
        console.log(`⏳ 重試請求 (${attempt + 1}/${REQUEST_LIMITS.maxRetries})，延遲 ${delayMs}ms`);
        await delay(delayMs);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
      
      if (response.status === 429) {
        // 429 Too Many Requests - 需要重試
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : REQUEST_LIMITS.baseDelay * Math.pow(2, attempt);
        console.warn(`⚠️ API 請求限制，等待 ${waitTime}ms 後重試`);
        await delay(waitTime);
        continue;
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // 無法解析 JSON，使用 HTTP 狀態信息
        }
        
        // 如果不是 429 錯誤，直接拋出
        if (response.status !== 429) {
          throw new Error(errorMessage);
        }
      }
      
      const data = await response.json();
      const result = Promise.resolve(data);
      requestCache.set(requestKey, result);
      activeRequests.delete(requestKey);
      return data;
      
    } catch (error) {
      lastError = error;
      
      // 如果是網絡錯誤或 429 錯誤，繼續重試
      if (error.name === 'TypeError' || error.message.includes('429')) {
        console.warn(`⚠️ 請求失敗，準備重試 (${attempt + 1}/${REQUEST_LIMITS.maxRetries}):`, error.message);
        continue;
      }
      
      // 其他錯誤直接拋出
      activeRequests.delete(requestKey);
      throw error;
    }
  }
  
  // 所有重試都失敗了
  activeRequests.delete(requestKey);
  throw new Error(`請求失敗，已重試 ${REQUEST_LIMITS.maxRetries} 次: ${lastError.message}`);
};

// 專案管理 API Hook
export const useProjectAPI = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 獲取專案列表
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/projects');
      
      if (response.success) {
        setProjects(response.data.projects || []);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '獲取專案列表失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 創建專案
  const createProject = async (projectData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
      
      if (response.success) {
        // 更新本地專案列表
        setProjects(prev => [...prev, response.data]);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '創建專案失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 更新專案
  const updateProject = async (projectId, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (response.success) {
        // 更新本地專案列表
        setProjects(prev => prev.map(project => 
          project.id === projectId ? response.data : project
        ));
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '更新專案失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 刪除專案
  const deleteProject = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (response.success) {
        // 更新本地專案列表
        setProjects(prev => prev.filter(project => project.id !== projectId));
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || '刪除專案失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 獲取專案統計
  const getProjectStats = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/projects/${projectId}/stats`);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '獲取專案統計失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 初始化時載入專案
  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats,
    clearError: () => setError(null),
  };
};

// 時間追蹤 API Hook
export const useTimeTrackingAPI = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 獲取時間記錄
  const fetchTimeEntries = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams ? `/time-entries?${queryParams}` : '/time-entries';
      
      const response = await apiRequest(endpoint);
      
      if (response.success) {
        setTimeEntries(response.data.timeEntries || []);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '獲取時間記錄失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 開始計時
  const startTimer = async (projectId, description = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/time-entries/start', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          description,
        }),
      });
      
      if (response.success) {
        setActiveEntry(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '開始計時失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 停止計時
  const stopTimer = async (entryId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/time-entries/stop/${entryId}`, {
        method: 'POST',
      });
      
      if (response.success) {
        setActiveEntry(null);
        // 重新獲取時間記錄
        await fetchTimeEntries();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '停止計時失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 獲取當前活動的計時
  const getActiveTimer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/time-entries/active');
      
      if (response.success) {
        setActiveEntry(response.data);
        return { success: true, data: response.data };
      } else {
        // 沒有活動計時也是正常情況
        setActiveEntry(null);
        return { success: true, data: null };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 更新時間記錄
  const updateTimeEntry = async (entryId, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/time-entries/${entryId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (response.success) {
        // 更新本地時間記錄
        setTimeEntries(prev => prev.map(entry => 
          entry.id === entryId ? response.data : entry
        ));
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '更新時間記錄失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 刪除時間記錄
  const deleteTimeEntry = async (entryId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/time-entries/${entryId}`, {
        method: 'DELETE',
      });
      
      if (response.success) {
        // 更新本地時間記錄
        setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || '刪除時間記錄失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 初始化時載入數據
  useEffect(() => {
    fetchTimeEntries();
    getActiveTimer();
  }, []);

  return {
    timeEntries,
    activeEntry,
    loading,
    error,
    fetchTimeEntries,
    startTimer,
    stopTimer,
    getActiveTimer,
    updateTimeEntry,
    deleteTimeEntry,
    clearError: () => setError(null),
  };
};

// 客戶管理 API Hook
export const useClientAPI = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 獲取客戶列表
  const fetchClients = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams ? `/clients?${queryParams}` : '/clients';
      
      const response = await apiRequest(endpoint);
      
      if (response.success) {
        setClients(response.data.clients || []);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '獲取客戶列表失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 創建客戶
  const createClient = async (clientData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
      });
      
      if (response.success) {
        setClients(prev => [...prev, response.data]);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '創建客戶失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 更新客戶
  const updateClient = async (clientId, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/clients/${clientId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (response.success) {
        setClients(prev => prev.map(client => 
          client.id === clientId ? response.data : client
        ));
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '更新客戶失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 刪除客戶
  const deleteClient = async (clientId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/clients/${clientId}`, {
        method: 'DELETE',
      });
      
      if (response.success) {
        setClients(prev => prev.filter(client => client.id !== clientId));
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || '刪除客戶失敗');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 初始化時載入客戶
  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    clearError: () => setError(null),
  };
};

export default {
  useProjectAPI,
  useTimeTrackingAPI,
  useClientAPI,
};
