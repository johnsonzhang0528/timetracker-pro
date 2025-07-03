// TimeTracker Pro API 配置
export const API_CONFIG = {
  // 是否啟用 API 模式（true = 使用真實 API，false = 使用本地存儲）
  useAPI: import.meta.env.VITE_USE_API === 'true' || false,
  
  // API 基礎 URL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // 是否啟用調試模式
  debug: import.meta.env.VITE_DEBUG_API === 'true' || import.meta.env.DEV,
  
  // API 請求超時時間（毫秒）
  timeout: 10000,
  
  // 重試配置
  retry: {
    attempts: 3,
    delay: 1000, // 初始延遲
  },
  
  // 本地存儲鍵值
  storage: {
    TOKEN: 'timetracker_auth_token',
    USER: 'timetracker_user_data',
    REFRESH_TOKEN: 'timetracker_refresh_token',
  },
  
  // 功能開關
  features: {
    // 是否啟用離線模式
    offlineMode: false,
    
    // 是否啟用數據同步
    dataSync: true,
    
    // 是否啟用推播通知
    notifications: false,
    
    // 是否啟用自動備份
    autoBackup: true,
  }
};

// 環境檢查
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// API 狀態枚舉
export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  OFFLINE: 'offline',
};

// 錯誤類型
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  UNKNOWN: 'unknown',
};

// 日誌配置
export const LOG_CONFIG = {
  level: isDevelopment ? 'debug' : 'error',
  enableConsole: isDevelopment,
  enableRemote: isProduction,
};

// 檢查 API 是否可用
export const checkAPIAvailability = async () => {
  if (!API_CONFIG.useAPI) {
    return { available: false, reason: 'API mode disabled' };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_CONFIG.baseURL}/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return { 
        available: true, 
        status: data.status,
        version: data.version,
        environment: data.environment
      };
    } else {
      return { 
        available: false, 
        reason: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    return { 
      available: false, 
      reason: error.name === 'AbortError' ? 'Timeout' : error.message 
    };
  }
};

// 日誌函數
export const log = {
  debug: (...args) => {
    if (LOG_CONFIG.level === 'debug' && LOG_CONFIG.enableConsole) {
      console.log('🔍 [DEBUG]', ...args);
    }
  },
  
  info: (...args) => {
    if (LOG_CONFIG.enableConsole) {
      console.log('ℹ️ [INFO]', ...args);
    }
  },
  
  warn: (...args) => {
    if (LOG_CONFIG.enableConsole) {
      console.warn('⚠️ [WARN]', ...args);
    }
  },
  
  error: (...args) => {
    if (LOG_CONFIG.enableConsole) {
      console.error('❌ [ERROR]', ...args);
    }
    
    // 在生產環境中可以發送到錯誤追蹤服務
    if (LOG_CONFIG.enableRemote && isProduction) {
      // 發送到錯誤追蹤服務（如 Sentry）
    }
  },
};

export default API_CONFIG;
