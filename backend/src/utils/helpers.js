// 時間格式化函數
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// 計算時間差（秒）
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return Math.floor((end - start) / 1000);
};

// 計算金額
export const calculateAmount = (duration, hourlyRate) => {
  if (!duration || !hourlyRate) return 0;
  
  const hours = duration / 3600;
  return Math.round(hours * hourlyRate * 100) / 100; // 保留兩位小數
};

// 生成發票編號
export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  
  return `INV-${year}${month}${day}-${timestamp}`;
};

// 分頁輔助函數
export const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    skip: offset,
    take: limit
  };
};

// 日期範圍查詢
export const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: today
      };
    case 'thisWeek':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        start: startOfWeek,
        end: now
      };
    case 'lastWeek':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 7);
      return {
        start: lastWeekStart,
        end: lastWeekEnd
      };
    case 'thisMonth':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: startOfMonth,
        end: now
      };
    case 'lastMonth':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: lastMonthStart,
        end: lastMonthEnd
      };
    default:
      return {
        start: today,
        end: now
      };
  }
};

// 錯誤回應格式化
export const formatErrorResponse = (message, errors = null) => {
  return {
    success: false,
    message,
    ...(errors && { errors })
  };
};

// 成功回應格式化
export const formatSuccessResponse = (data, message = '操作成功') => {
  return {
    success: true,
    message,
    data
  };
};
