// TimeTracker Pro API 客戶端
import { API_CONFIG, log } from '../config/api';
import { offlineSync, OPERATION_TYPE, DATA_TYPE } from './OfflineSync';

// API客戶端基礎類
class ApiClient {
  constructor(baseURL, networkDetector) {
    this.baseURL = baseURL || API_CONFIG.baseURL;
    this.networkDetector = networkDetector;
    this.enabledOfflineMode = API_CONFIG.features.offlineMode;
    
    // 初始化資源客戶端
    this.projects = new ProjectsClient(this);
    this.timeEntries = new TimeEntriesClient(this);
    this.clients = new ClientsClient(this);
    this.userSettings = new UserSettingsClient(this);
  }

  // 檢查網絡連接
  isOnline() {
    // 首先使用 networkDetector（如果有的話）
    if (this.networkDetector && typeof this.networkDetector.isOnline === 'function') {
      return this.networkDetector.isOnline();
    }
    
    // 否則，使用瀏覽器的 navigator.onLine
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  // 設置離線模式啟用狀態
  setOfflineModeEnabled(enabled) {
    this.enabledOfflineMode = enabled;
  }

  // 判斷是否可以離線操作
  canOperateOffline() {
    return this.enabledOfflineMode && !this.isOnline();
  }

  // 通用請求方法
  async request(endpoint, options = {}) {
    const token = localStorage.getItem(API_CONFIG.storage.TOKEN);
    
    // 檢查網絡連接
    if (!this.isOnline()) {
      if (!this.enabledOfflineMode) {
        throw new Error('網絡連接不可用，且離線模式未啟用');
      }
      
      // 如果是 GET 請求，可能是要獲取數據，這無法在離線模式下進行
      if (!options.method || options.method === 'GET') {
        throw new Error('網絡連接不可用，無法獲取數據');
      }
      
      // 這裡可以記錄離線操作，但實際應該在資源客戶端中處理
      log.warn('網絡連接不可用，將以離線模式運行');
      throw new Error('網絡連接不可用，已切換到離線模式');
    }
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, defaultOptions);
      
      // 處理 Token 過期情況 (401 錯誤)
      if (response.status === 401 && token) {
        // 嘗試使用刷新令牌
        const refreshToken = localStorage.getItem(API_CONFIG.storage.REFRESH_TOKEN);
        
        if (refreshToken && endpoint !== '/auth/refresh') {
          try {
            log.info('令牌已過期，嘗試刷新...');
            
            // 呼叫刷新令牌 API
            const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              
              // 更新令牌
              localStorage.setItem(API_CONFIG.storage.TOKEN, refreshData.data.accessToken);
              
              if (refreshData.data.refreshToken) {
                localStorage.setItem(API_CONFIG.storage.REFRESH_TOKEN, refreshData.data.refreshToken);
              }
              
              log.info('令牌刷新成功，重試原始請求');
              
              // 使用新令牌重試原始請求
              const retryOptions = {
                ...defaultOptions,
                headers: {
                  ...defaultOptions.headers,
                  Authorization: `Bearer ${refreshData.data.accessToken}`,
                },
              };
              
              const retryResponse = await fetch(`${this.baseURL}${endpoint}`, retryOptions);
              
              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
              }
              
              return await retryResponse.json();
            } else {
              // 刷新失敗，清除認證資料
              log.warn('令牌刷新失敗，清除認證資料');
              localStorage.removeItem(API_CONFIG.storage.TOKEN);
              localStorage.removeItem(API_CONFIG.storage.USER);
              localStorage.removeItem(API_CONFIG.storage.REFRESH_TOKEN);
              
              throw new Error('令牌已過期且無法刷新，請重新登入');
            }
          } catch (refreshError) {
            log.error('令牌刷新過程中出錯:', refreshError);
            throw new Error('令牌已過期');
          }
        } else {
          // 沒有刷新令牌
          log.warn('令牌已過期且無刷新令牌，需要重新登入');
          throw new Error('令牌已過期');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      // 處理網絡錯誤
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // 網絡錯誤，可能是連接中斷
        log.error('API請求網絡錯誤:', error);
        
        if (this.enabledOfflineMode) {
          log.warn('網絡連接中斷，將切換到離線模式');
          // 通知網絡狀態變化
          if (this.networkDetector) {
            this.networkDetector.setOnlineStatus(false);
          }
        }
      }
      
      throw error;
    }
  }

  // 同步離線操作
  async syncOfflineOperations() {
    if (!this.isOnline()) {
      return { success: false, message: '網絡連接不可用，無法同步' };
    }
    
    try {
      const result = await offlineSync.syncAll(this);
      return { 
        success: result.success, 
        message: `同步完成：${result.synced} 成功，${result.failed} 失敗，${result.conflicts} 衝突`,
        details: result
      };
    } catch (error) {
      return { success: false, message: `同步過程中發生錯誤: ${error.message}` };
    }
  }
}

// 專案資源客戶端
class ProjectsClient {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.endpoint = '/projects';
  }

  // 獲取所有專案
  async getAll() {
    try {
      const response = await this.apiClient.request(this.endpoint);
      return response.data.projects || [];
    } catch (error) {
      log.error('獲取專案列表失敗:', error);
      throw error;
    }
  }

  // 獲取單個專案
  async getById(id) {
    try {
      const response = await this.apiClient.request(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      log.error(`獲取專案 ${id} 失敗:`, error);
      throw error;
    }
  }

  // 創建專案
  async create(projectData) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        const tempId = `temp_${Date.now()}`;
        const projectWithId = { ...projectData, id: tempId, createdAt: new Date().toISOString() };
        offlineSync.recordOperation(OPERATION_TYPE.CREATE, DATA_TYPE.PROJECT, projectWithId);
        
        return { 
          success: true, 
          data: projectWithId, 
          message: '專案已在離線模式下創建，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(this.endpoint, {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error('創建專案失敗:', error);
      throw error;
    }
  }

  // 更新專案
  async update(id, projectData) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        offlineSync.recordOperation(OPERATION_TYPE.UPDATE, DATA_TYPE.PROJECT, projectData, id);
        
        return { 
          success: true, 
          data: { ...projectData, id }, 
          message: '專案已在離線模式下更新，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(`${this.endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData)
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error(`更新專案 ${id} 失敗:`, error);
      throw error;
    }
  }

  // 刪除專案
  async delete(id) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        offlineSync.recordOperation(OPERATION_TYPE.DELETE, DATA_TYPE.PROJECT, {}, id);
        
        return { 
          success: true, 
          message: '專案已在離線模式下刪除，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(`${this.endpoint}/${id}`, {
        method: 'DELETE'
      });
      
      return { success: true, message: response.message || '專案已刪除' };
    } catch (error) {
      log.error(`刪除專案 ${id} 失敗:`, error);
      throw error;
    }
  }
}

// 時間記錄資源客戶端
class TimeEntriesClient {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.endpoint = '/time-entries';
  }

  // 獲取所有時間記錄
  async getAll(query = {}) {
    try {
      const queryString = Object.entries(query)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
        
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      const response = await this.apiClient.request(endpoint);
      
      return response.data.timeEntries || [];
    } catch (error) {
      log.error('獲取時間記錄列表失敗:', error);
      throw error;
    }
  }

  // 獲取單個時間記錄
  async getById(id) {
    try {
      const response = await this.apiClient.request(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      log.error(`獲取時間記錄 ${id} 失敗:`, error);
      throw error;
    }
  }

  // 創建時間記錄
  async create(timeEntryData) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        const tempId = `temp_${Date.now()}`;
        const entryWithId = { 
          ...timeEntryData, 
          id: tempId, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        offlineSync.recordOperation(OPERATION_TYPE.CREATE, DATA_TYPE.TIME_ENTRY, entryWithId);
        
        return { 
          success: true, 
          data: entryWithId, 
          message: '時間記錄已在離線模式下創建，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(this.endpoint, {
        method: 'POST',
        body: JSON.stringify(timeEntryData)
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error('創建時間記錄失敗:', error);
      throw error;
    }
  }

  // 更新時間記錄
  async update(id, timeEntryData) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        offlineSync.recordOperation(OPERATION_TYPE.UPDATE, DATA_TYPE.TIME_ENTRY, timeEntryData, id);
        
        return { 
          success: true, 
          data: { ...timeEntryData, id, updatedAt: new Date().toISOString() }, 
          message: '時間記錄已在離線模式下更新，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(`${this.endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(timeEntryData)
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error(`更新時間記錄 ${id} 失敗:`, error);
      throw error;
    }
  }

  // 刪除時間記錄
  async delete(id) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        offlineSync.recordOperation(OPERATION_TYPE.DELETE, DATA_TYPE.TIME_ENTRY, {}, id);
        
        return { 
          success: true, 
          message: '時間記錄已在離線模式下刪除，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(`${this.endpoint}/${id}`, {
        method: 'DELETE'
      });
      
      return { success: true, message: response.message || '時間記錄已刪除' };
    } catch (error) {
      log.error(`刪除時間記錄 ${id} 失敗:`, error);
      throw error;
    }
  }

  // 開始計時
  async startTimer(projectId, description = '') {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：創建一個帶有開始時間的記錄
        const now = new Date();
        const timerData = {
          projectId,
          description,
          startTime: now.toISOString(),
          endTime: null
        };
        
        return await this.create(timerData);
      }
      
      // 在線模式：使用專門的 API
      const response = await this.apiClient.request(`${this.endpoint}/start`, {
        method: 'POST',
        body: JSON.stringify({ projectId, description })
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error('開始計時失敗:', error);
      throw error;
    }
  }

  // 停止計時
  async stopTimer(timerId) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：更新現有的記錄，設置結束時間
        const now = new Date();
        
        return await this.update(timerId, {
          endTime: now.toISOString()
        });
      }
      
      // 在線模式：使用專門的 API
      const response = await this.apiClient.request(`${this.endpoint}/stop/${timerId}`, {
        method: 'POST'
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error(`停止計時 ${timerId} 失敗:`, error);
      throw error;
    }
  }

  // 獲取當前活動的計時器
  async getActiveTimer() {
    try {
      const response = await this.apiClient.request(`${this.endpoint}/active`);
      return response.data;
    } catch (error) {
      log.error('獲取活動計時器失敗:', error);
      throw error;
    }
  }
}

// 客戶資源客戶端
class ClientsClient {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.endpoint = '/clients';
  }

  // 獲取所有客戶
  async getAll() {
    try {
      const response = await this.apiClient.request(this.endpoint);
      return response.data.clients || [];
    } catch (error) {
      log.error('獲取客戶列表失敗:', error);
      throw error;
    }
  }

  // 獲取單個客戶
  async getById(id) {
    try {
      const response = await this.apiClient.request(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      log.error(`獲取客戶 ${id} 失敗:`, error);
      throw error;
    }
  }

  // 創建客戶
  async create(clientData) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        const tempId = `temp_${Date.now()}`;
        const clientWithId = { 
          ...clientData, 
          id: tempId, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        offlineSync.recordOperation(OPERATION_TYPE.CREATE, DATA_TYPE.CLIENT, clientWithId);
        
        return { 
          success: true, 
          data: clientWithId, 
          message: '客戶已在離線模式下創建，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(this.endpoint, {
        method: 'POST',
        body: JSON.stringify(clientData)
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error('創建客戶失敗:', error);
      throw error;
    }
  }

  // 更新客戶
  async update(id, clientData) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        offlineSync.recordOperation(OPERATION_TYPE.UPDATE, DATA_TYPE.CLIENT, clientData, id);
        
        return { 
          success: true, 
          data: { ...clientData, id, updatedAt: new Date().toISOString() }, 
          message: '客戶已在離線模式下更新，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(`${this.endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(clientData)
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error(`更新客戶 ${id} 失敗:`, error);
      throw error;
    }
  }

  // 刪除客戶
  async delete(id) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        offlineSync.recordOperation(OPERATION_TYPE.DELETE, DATA_TYPE.CLIENT, {}, id);
        
        return { 
          success: true, 
          message: '客戶已在離線模式下刪除，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(`${this.endpoint}/${id}`, {
        method: 'DELETE'
      });
      
      return { success: true, message: response.message || '客戶已刪除' };
    } catch (error) {
      log.error(`刪除客戶 ${id} 失敗:`, error);
      throw error;
    }
  }
}

// 用戶設定資源客戶端
class UserSettingsClient {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.endpoint = '/users/settings';
  }

  // 獲取用戶設定
  async get() {
    try {
      const response = await this.apiClient.request(this.endpoint);
      return response.data;
    } catch (error) {
      log.error('獲取用戶設定失敗:', error);
      throw error;
    }
  }

  // 更新用戶設定
  async update(settingsData) {
    try {
      if (this.apiClient.canOperateOffline()) {
        // 離線模式：記錄操作
        offlineSync.recordOperation(
          OPERATION_TYPE.UPDATE, 
          DATA_TYPE.USER_SETTING, 
          settingsData
        );
        
        return { 
          success: true, 
          data: { ...settingsData, updatedAt: new Date().toISOString() }, 
          message: '用戶設定已在離線模式下更新，將在連線恢復時同步',
          offline: true
        };
      }
      
      // 在線模式：直接 API 請求
      const response = await this.apiClient.request(this.endpoint, {
        method: 'PUT',
        body: JSON.stringify(settingsData)
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      log.error('更新用戶設定失敗:', error);
      throw error;
    }
  }
}

// 網絡狀態監測器
export class NetworkDetector {
  constructor() {
    this.online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = [];
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  // 添加狀態變化監聽器
  addListener(listener) {
    this.listeners.push(listener);
  }

  // 移除狀態變化監聽器
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // 通知所有監聽器
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.online);
      } catch (error) {
        log.error('網絡狀態監聽器執行錯誤', error);
      }
    });
  }

  // 處理網絡連線
  handleOnline() {
    log.info('網絡連接已恢復');
    this.online = true;
    this.notifyListeners();
  }

  // 處理網絡斷線
  handleOffline() {
    log.info('網絡連接已斷開');
    this.online = false;
    this.notifyListeners();
  }

  // 獲取當前網絡狀態
  isOnline() {
    return this.online;
  }

  // 手動設置在線狀態（用於測試）
  setOnlineStatus(status) {
    if (this.online !== status) {
      this.online = status;
      this.notifyListeners();
    }
  }
}

// 創建單例
export const networkDetector = new NetworkDetector();
export const apiClient = new ApiClient(API_CONFIG.baseURL, networkDetector);

// 自動同步功能
networkDetector.addListener(async (isOnline) => {
  if (isOnline && API_CONFIG.features.dataSync) {
    log.info('網絡已恢復連接，嘗試同步離線數據');
    try {
      await apiClient.syncOfflineOperations();
    } catch (error) {
      log.error('自動同步離線數據失敗:', error);
    }
  }
});

export default apiClient;
