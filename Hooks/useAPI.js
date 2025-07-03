import { useState, useEffect } from 'react';

// API 基礎 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 請求限制配置
const REQUEST_LIMITS = {
  maxRetries: 3,
  baseDelay: 2000, // 2秒 (增加基礎延遲)
  backoffMultiplier: 2,
  maxDelay: 30000, // 30秒 (增加最大延遲)
  maxConcurrentRequests: 3, // 最大並發請求數
  rateLimitDelay: 5000, // 429 錯誤的基礎等待時間 (5秒)
};

// 請求去重和限制
const requestCache = new Map();
const activeRequests = new Set();
let concurrentRequests = 0;

// 請求隊列
const requestQueue = [];
let isProcessingQueue = false;

// 延遲函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 清理過期的請求快取
const cleanupCache = () => {
  const now = Date.now();
  const maxAge = 60000; // 1分鐘
  
  for (const [key, value] of requestCache.entries()) {
    if (value.timestamp && now - value.timestamp > maxAge) {
      requestCache.delete(key);
    }
  }
};

// 處理請求隊列
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0 && concurrentRequests < REQUEST_LIMITS.maxConcurrentRequests) {
    const { resolve, reject, requestFn } = requestQueue.shift();
    concurrentRequests++;
    
    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      concurrentRequests--;
    }
  }
  
  isProcessingQueue = false;
  
  // 如果還有請求在隊列中，繼續處理
  if (requestQueue.length > 0) {
    setTimeout(processQueue, 100);
  }
};

// 添加請求到隊列
const queueRequest = (requestFn) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, requestFn });
    processQueue();
  });
};

// 通用 API 請求函數
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('timetracker_auth_token');
  const requestKey = `${options.method || 'GET'}_${endpoint}_${JSON.stringify(options.body || '')}`;
  
  console.log(`🌐 API 請求: ${options.method || 'GET'} ${endpoint}`, token ? '帶令牌' : '無令牌');
  
  // 如果沒有 token 且需要認證的端點，直接拋出錯誤
  if (!token && !endpoint.includes('/auth/') && !endpoint.includes('/health')) {
    console.error('🔒 未找到認證令牌，請先登入');
    throw new Error('未找到認證令牌，請先登入');
  }
  
  // 清理過期快取
  cleanupCache();
  
  // 檢查快取
  const cached = requestCache.get(requestKey);
  if (cached && cached.data) {
    console.log(`🔄 使用快取響應: ${requestKey}`);
    return cached.data;
  }
  
  // 防止重複請求
  if (activeRequests.has(requestKey)) {
    console.log(`🔄 等待重複請求完成: ${requestKey}`);
    // 等待現有請求完成
    while (activeRequests.has(requestKey)) {
      await delay(100);
    }
    const result = requestCache.get(requestKey);
    if (result && result.data) {
      return result.data;
    }
  }
  
  // 使用隊列管理併發請求
  return queueRequest(async () => {
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
          // 429 Too Many Requests - 需要更長的等待時間
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? 
            parseInt(retryAfter) * 1000 : 
            REQUEST_LIMITS.rateLimitDelay * Math.pow(2, attempt);
          console.warn(`⚠️ API 請求限制 (429)，等待 ${waitTime}ms 後重試`);
          await delay(waitTime);
          continue;
        }
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          if (response.status === 401) {
            // 401 錯誤 - 清除無效的令牌
            localStorage.removeItem('timetracker_auth_token');
            localStorage.removeItem('timetracker_user_data');
            localStorage.removeItem('timetracker_refresh_token');
            
            // 如果是認證相關的端點，直接拋出錯誤
            if (endpoint.includes('/auth/')) {
              errorMessage = '認證失敗，請檢查您的登入資訊';
            } else {
              errorMessage = '認證令牌已過期，請重新登入';
            }
          }
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // 無法解析 JSON，使用 HTTP 狀態信息
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // 快取響應
        requestCache.set(requestKey, {
          data,
          timestamp: Date.now()
        });
        
        activeRequests.delete(requestKey);
        return data;
        
      } catch (error) {
        lastError = error;
        
        // 如果是網絡錯誤，繼續重試
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.warn(`⚠️ 網絡錯誤，準備重試 (${attempt + 1}/${REQUEST_LIMITS.maxRetries}):`, error.message);
          continue;
        }
        
        // 其他錯誤直接拋出
        break;
      }
    }
    
    activeRequests.delete(requestKey);
    throw lastError;
  });
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
      
      // 確保使用正確的端點路徑
      console.log('正在請求活動計時...');
      const response = await apiRequest('/time-entries/active');
      console.log('活動計時響應:', response);
      
      if (response.success) {
        setActiveEntry(response.data);
        return { success: true, data: response.data };
      } else {
        // 沒有活動計時也是正常情況
        setActiveEntry(null);
        return { success: true, data: null };
      }
    } catch (err) {
      console.error('獲取活動計時失敗:', err);
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
