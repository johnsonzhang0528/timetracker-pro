// 預設專案資料
export const DEFAULT_PROJECTS = [
  { 
    id: 1, 
    name: '網站設計專案', 
    client: 'ABC 公司', 
    rate: 1500, 
    color: '#3B82F6' 
  },
  { 
    id: 2, 
    name: '品牌設計', 
    client: 'XYZ 企業', 
    rate: 1800, 
    color: '#10B981' 
  },
];

// 修正預設時間記錄
export const DEFAULT_TIME_ENTRIES = [
  { 
    id: 1, 
    project: '網站設計專案', 
    client: 'ABC 公司', 
    date: '2025-06-29', 
    duration: 7200, 
    amount: 3000 
  },
  { 
    id: 2, 
    project: '品牌設計', // 修正：從 name 改為 project
    client: 'XYZ 企業', 
    date: '2025-06-28', 
    duration: 5400, 
    amount: 2700 
  },
];

// 頁籤定義
export const TABS = {
  TRACKER: 'tracker',
  PROJECTS: 'projects',
  REPORTS: 'reports',
  INVOICE: 'invoice',
  PROFILE: 'profile'  // 新增用戶設定頁籤
};

// 營業稅率
export const TAX_RATE = 0.05;

// 公司資訊 (發票用)
export const COMPANY_INFO = {
  name: '您的公司名稱',
  address: '台北市信義區信義路五段7號',
  phone: '02-1234-5678',
  email: 'email@company.com'
};

// 客戶資訊 (發票用)
export const CLIENT_INFO = {
  name: 'ABC 公司',
  address: '台北市中山區中山北路二段1號'
};

// 付款條件
export const PAYMENT_TERMS = '收到發票後 30 天內付款';

// 應用程式標題
export const APP_TITLE = 'TimeTracker Pro';

// 時間間隔 (毫秒)
export const TIMER_INTERVAL = 1000;

// 本地儲存鍵值
export const STORAGE_KEYS = {
  PROJECTS: 'timeTracker_projects',
  TIME_ENTRIES: 'timeTracker_entries',
  CURRENT_TIME: 'timeTracker_currentTime',
  IS_TRACKING: 'timeTracker_isTracking',
  SELECTED_PROJECT: 'timeTracker_selectedProject'
};

// 表單初始值
export const INITIAL_PROJECT_FORM = {
  name: '',
  client: '',
  rate: ''
};

// 響應式斷點 (與 Tailwind CSS 對應)
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px'
};

// 用戶系統相關常數
export const USER_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  BUSINESS: 'business'
};

export const PLAN_LIMITS = {
  [USER_PLANS.FREE]: {
    maxProjects: 1,
    maxClients: 3,
    reportDays: 7,
    cloudSync: false,
    advancedReports: false,
    invoiceExport: false
  },
  [USER_PLANS.PRO]: {
    maxProjects: -1, // 無限制
    maxClients: -1,
    reportDays: -1,
    cloudSync: true,
    advancedReports: true,
    invoiceExport: true
  },
  [USER_PLANS.BUSINESS]: {
    maxProjects: -1,
    maxClients: -1,
    reportDays: -1,
    cloudSync: true,
    advancedReports: true,
    invoiceExport: true,
    teamCollaboration: true,
    apiAccess: true
  }
};

// 認證相關常數
export const AUTH_CONFIG = {
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24小時
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7天
  PASSWORD_MIN_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5
};

// 同步相關常數
export const SYNC_CONSTANTS = {
  AUTO_SYNC_INTERVAL: 60000, // 60秒自動嘗試同步
  CONFLICT_STRATEGIES: {
    LOCAL: 'local',
    SERVER: 'server',
    MERGE: 'merge'
  },
  STORAGE_KEYS: {
    OFFLINE_OPERATIONS: 'timeTracker_offlineOperations',
    LAST_SYNC: 'timeTracker_lastSync',
    SYNC_STATUS: 'timeTracker_syncStatus'
  }
};