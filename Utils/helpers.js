// 時間格式化函數
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 計算收入
export const calculateEarnings = (duration, rate) => {
  return Math.round((duration / 3600) * rate);
};

// 產生隨機顏色
export const generateRandomColor = () => {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`;
};

// 格式化貨幣
export const formatCurrency = (amount) => {
  // 處理 null, undefined, 或非數字的情況
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'NT$ 0';
  }
  
  // 確保 amount 是數字
  const numAmount = Number(amount);
  return `NT$ ${numAmount.toLocaleString()}`;
};

// 計算總收入
export const calculateTotalEarnings = (timeEntries) => {
  if (!timeEntries || timeEntries.length === 0) {
    return 0;
  }
  
  return timeEntries.reduce((sum, entry) => {
    const amount = entry.amount || 0;
    return sum + amount;
  }, 0);
};

// 計算總工作時數
export const calculateTotalHours = (timeEntries) => {
  return timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600;
};

// 產生發票編號
export const generateInvoiceNumber = () => {
  return `INV-${Date.now().toString().slice(-6)}`;
};

// 格式化日期
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-TW');
};

// 驗證專案資料
export const validateProject = (project) => {
  const errors = {};
  
  if (!project.name?.trim()) {
    errors.name = '專案名稱為必填';
  }
  
  if (!project.client?.trim()) {
    errors.client = '客戶名稱為必填';
  }
  
  if (!project.rate || project.rate <= 0) {
    errors.rate = '請輸入有效的時薪';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// 根據專案名稱過濾時間記錄
export const getProjectEntries = (timeEntries, projectName) => {
  return timeEntries.filter(entry => entry.project === projectName);
};

// 計算專案統計
export const calculateProjectStats = (timeEntries, projectName) => {
  const projectEntries = getProjectEntries(timeEntries, projectName);
  const totalHours = calculateTotalHours(projectEntries);
  const totalEarnings = calculateTotalEarnings(projectEntries);
  
  return {
    entries: projectEntries,
    totalHours,
    totalEarnings,
    entryCount: projectEntries.length
  };
};