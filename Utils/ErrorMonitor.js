/**
 * 錯誤監控和效能分析工具
 */

class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.performanceMetrics = [];
    this.maxErrors = 100; // 最多保留 100 個錯誤記錄
    this.maxMetrics = 50; // 最多保留 50 個效能記錄
    
    this.init();
  }

  // 初始化監控
  init() {
    // 監控全域錯誤
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // 監控 Promise 拒絕
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        reason: event.reason,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // 監控資源載入錯誤
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.logError({
          type: 'resource',
          message: `Failed to load: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }
    }, true);

    // 監控網絡狀態
    window.addEventListener('online', () => {
      this.logMetric({
        type: 'network',
        status: 'online',
        timestamp: new Date().toISOString()
      });
    });

    window.addEventListener('offline', () => {
      this.logMetric({
        type: 'network',
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    });

    // 監控頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      this.logMetric({
        type: 'visibility',
        state: document.visibilityState,
        timestamp: new Date().toISOString()
      });
    });

    console.log('🔍 錯誤監控系統已啟動');
  }

  // 記錄錯誤
  logError(error) {
    this.errors.unshift({
      id: Date.now() + Math.random(),
      ...error
    });

    // 限制錯誤記錄數量
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // 輸出到控制台
    console.error('🚨 錯誤監控:', error);

    // 嚴重錯誤立即通知
    if (this.isCriticalError(error)) {
      this.notifyUser('系統發生嚴重錯誤，請重新整理頁面或聯絡技術支援');
    }
  }

  // 記錄效能指標
  logMetric(metric) {
    this.performanceMetrics.unshift({
      id: Date.now() + Math.random(),
      ...metric
    });

    // 限制效能記錄數量
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(0, this.maxMetrics);
    }

    console.info('📊 效能監控:', metric);
  }

  // 判斷是否為嚴重錯誤
  isCriticalError(error) {
    const criticalPatterns = [
      /chunk.*failed/i,
      /loading.*failed/i,
      /network.*error/i,
      /fetch.*failed/i,
      /cannot.*read.*property/i,
      /is not a function/i
    ];

    return criticalPatterns.some(pattern => 
      pattern.test(error.message || error.reason?.message || '')
    );
  }

  // 通知用戶
  notifyUser(message) {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md';
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-2xl">⚠️</div>
        <div class="flex-1">
          <div class="font-semibold mb-1">系統錯誤</div>
          <div class="text-sm">${message}</div>
          <button class="mt-2 text-xs underline hover:no-underline" onclick="this.parentElement.parentElement.parentElement.remove()">
            關閉
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // 10秒後自動移除
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // 監控 API 請求
  monitorFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.logMetric({
          type: 'api',
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: Math.round(endTime - startTime),
          timestamp: new Date().toISOString()
        });

        // 記錄 API 錯誤
        if (!response.ok) {
          this.logError({
            type: 'api',
            message: `API request failed: ${response.status} ${response.statusText}`,
            url: typeof url === 'string' ? url : url.url,
            method: args[1]?.method || 'GET',
            status: response.status,
            timestamp: new Date().toISOString()
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.logError({
          type: 'api',
          message: `Network error: ${error.message}`,
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          duration: Math.round(endTime - startTime),
          timestamp: new Date().toISOString()
        });

        throw error;
      }
    };
  }

  // 監控頁面載入效能
  monitorPagePerformance() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.timing;
          const navigation = performance.getEntriesByType('navigation')[0];
          
          const metrics = {
            type: 'page',
            loadTime: perfData.loadEventEnd - perfData.navigationStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
            firstPaint: navigation?.loadEventEnd || 0,
            timestamp: new Date().toISOString()
          };

          this.logMetric(metrics);

          // 警告載入時間過長
          if (metrics.loadTime > 3000) {
            console.warn('⚠️ 頁面載入時間較長:', metrics.loadTime + 'ms');
          }
        }, 0);
      });
    }
  }

  // 監控記憶體使用
  monitorMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        
        this.logMetric({
          type: 'memory',
          used: usedMB,
          total: Math.round(memory.totalJSHeapSize / 1048576),
          limit: Math.round(memory.jsHeapSizeLimit / 1048576),
          timestamp: new Date().toISOString()
        });

        // 警告記憶體使用過高
        if (usedMB > 100) {
          console.warn('⚠️ 記憶體使用量較高:', usedMB + 'MB');
        }
      }, 30000); // 每30秒檢查一次
    }
  }

  // 獲取錯誤統計
  getErrorStats() {
    const errorTypes = {};
    const errorUrls = {};
    
    this.errors.forEach(error => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      if (error.url) {
        errorUrls[error.url] = (errorUrls[error.url] || 0) + 1;
      }
    });

    return {
      total: this.errors.length,
      types: errorTypes,
      urls: errorUrls,
      recent: this.errors.slice(0, 10)
    };
  }

  // 獲取效能統計
  getPerformanceStats() {
    const metricTypes = {};
    
    this.performanceMetrics.forEach(metric => {
      metricTypes[metric.type] = (metricTypes[metric.type] || 0) + 1;
    });

    // 計算平均 API 回應時間
    const apiMetrics = this.performanceMetrics.filter(m => m.type === 'api' && m.duration);
    const avgApiTime = apiMetrics.length > 0 
      ? Math.round(apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length)
      : 0;

    return {
      total: this.performanceMetrics.length,
      types: metricTypes,
      avgApiResponseTime: avgApiTime,
      recent: this.performanceMetrics.slice(0, 10)
    };
  }

  // 匯出監控報告
  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: this.getErrorStats(),
      performance: this.getPerformanceStats(),
      system: {
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return report;
  }

  // 清除記錄
  clear() {
    this.errors = [];
    this.performanceMetrics = [];
    console.log('🧹 監控記錄已清除');
  }

  // 啟動完整監控
  startFullMonitoring() {
    this.monitorFetch();
    this.monitorPagePerformance();
    this.monitorMemory();
    console.log('🔍 完整監控系統已啟動');
  }
}

// 全域錯誤監控實例
const errorMonitor = new ErrorMonitor();

// 在開發模式下啟動完整監控
if (window.location.hostname === 'localhost') {
  errorMonitor.startFullMonitoring();
  
  // 將監控器暴露到全域
  window.errorMonitor = errorMonitor;
  
  console.log('💡 開發模式：使用 window.errorMonitor 查看監控數據');
}

export default ErrorMonitor;
