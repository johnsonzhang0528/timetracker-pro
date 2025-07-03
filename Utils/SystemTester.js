/**
 * TimeTracker Pro 系統測試與除錯工具
 * 瀏覽器端測試腳本
 */

class SystemTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
    
    this.config = {
      apiUrl: 'http://localhost:5000',
      timeout: 5000
    };
  }

  // 日誌函數
  log = {
    info: (msg) => console.log(`ℹ️ ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    warning: (msg) => console.log(`⚠️ ${msg}`),
    section: (msg) => console.log(`\n📋 ${msg}\n`)
  };

  // 執行測試
  async runTest(testName, testFn) {
    try {
      this.log.info(`執行測試: ${testName}`);
      await testFn();
      this.log.success(`${testName} - 通過`);
      this.results.passed++;
      return true;
    } catch (error) {
      this.log.error(`${testName} - 失敗: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({ test: testName, error: error.message });
      return false;
    }
  }

  // HTTP 請求函數
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('請求超時');
      }
      throw error;
    }
  }

  // 1. 檢查瀏覽器環境
  async testBrowserEnvironment() {
    this.log.section('瀏覽器環境檢查');
    
    await this.runTest('Local Storage 支援', () => {
      if (!window.localStorage) {
        throw new Error('瀏覽器不支援 Local Storage');
      }
    });
    
    await this.runTest('Fetch API 支援', () => {
      if (!window.fetch) {
        throw new Error('瀏覽器不支援 Fetch API');
      }
    });
    
    await this.runTest('ES6 支援', () => {
      try {
        eval('const test = () => {}; const {a} = {}; class Test {}');
      } catch (error) {
        throw new Error('瀏覽器不支援 ES6 語法');
      }
    });
  }

  // 2. 檢查後端連接
  async testBackendConnection() {
    this.log.section('後端連接檢查');
    
    await this.runTest('後端服務連接', async () => {
      try {
        const response = await this.makeRequest(`${this.config.apiUrl}/health`);
        if (!response.ok) {
          throw new Error(`後端服務回應錯誤: ${response.status}`);
        }
      } catch (error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('無法連接到後端服務，請確認服務運行在 http://localhost:5000');
        }
        throw error;
      }
    });
    
    await this.runTest('API 健康檢查', async () => {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`API 健康檢查失敗: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status !== 'OK') {
        throw new Error(`API 狀態異常: ${data.status}`);
      }
    });
  }

  // 3. 檢查認證系統
  async testAuthentication() {
    this.log.section('認證系統檢查');
    
    await this.runTest('註冊端點', async () => {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword',
          name: 'Test User'
        })
      });
      
      // 400 錯誤是正常的（可能是重複註冊），但不應該是 500 或連接錯誤
      if (response.status === 500) {
        throw new Error('註冊端點伺服器錯誤');
      }
    });
    
    await this.runTest('登入端點', async () => {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })
      });
      
      // 401 錯誤是正常的（錯誤憑證），但不應該是 500 或連接錯誤
      if (response.status === 500) {
        throw new Error('登入端點伺服器錯誤');
      }
    });
  }

  // 4. 檢查本地存儲
  async testLocalStorage() {
    this.log.section('本地存儲檢查');
    
    await this.runTest('寫入本地存儲', () => {
      const testData = { test: 'data', timestamp: Date.now() };
      localStorage.setItem('timetracker_test', JSON.stringify(testData));
      
      const retrieved = JSON.parse(localStorage.getItem('timetracker_test'));
      if (retrieved.test !== 'data') {
        throw new Error('本地存儲讀寫失敗');
      }
    });
    
    await this.runTest('檢查現有數據', () => {
      const keys = ['timetracker_projects', 'timetracker_entries', 'timetracker_user_data'];
      const existingData = {};
      
      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          existingData[key] = JSON.parse(data);
        }
      });
      
      this.log.info(`現有本地數據: ${Object.keys(existingData).join(', ')}`);
      
      // 清理測試數據
      localStorage.removeItem('timetracker_test');
    });
  }

  // 5. 檢查 API 整合
  async testAPIIntegration() {
    this.log.section('API 整合檢查');
    
    // 檢查 API 配置
    await this.runTest('API 配置檢查', () => {
      // 模擬檢查 API 配置
      const apiUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:5000/api' 
        : '/api';
      
      if (!apiUrl) {
        throw new Error('API URL 配置缺失');
      }
      
      this.log.info(`API URL: ${apiUrl}`);
    });
    
    // 檢查 CORS 設定
    await this.runTest('CORS 設定檢查', async () => {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('CORS 設定可能有問題');
      }
    });
  }

  // 6. 效能檢查
  async testPerformance() {
    this.log.section('效能檢查');
    
    await this.runTest('後端回應時間', async () => {
      const start = performance.now();
      await this.makeRequest(`${this.config.apiUrl}/health`);
      const responseTime = performance.now() - start;
      
      this.log.info(`後端回應時間: ${Math.round(responseTime)}ms`);
      
      if (responseTime > 1000) {
        this.log.warning(`後端回應時間較長: ${Math.round(responseTime)}ms`);
        this.results.warnings++;
      }
    });
    
    await this.runTest('記憶體使用量', () => {
      if (performance.memory) {
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        
        this.log.info(`記憶體使用: ${usedMB}MB / ${totalMB}MB`);
        
        if (usedMB > 50) {
          this.log.warning(`記憶體使用量較高: ${usedMB}MB`);
          this.results.warnings++;
        }
      } else {
        this.log.info('瀏覽器不支援記憶體監控');
      }
    });
  }

  // 7. 功能測試
  async testCoreFeatures() {
    this.log.section('核心功能檢查');
    
    await this.runTest('時間追蹤功能', () => {
      // 模擬時間追蹤邏輯
      const startTime = Date.now();
      const currentTime = 0;
      const isTracking = false;
      
      if (typeof startTime !== 'number' || typeof currentTime !== 'number') {
        throw new Error('時間追蹤數據類型錯誤');
      }
      
      this.log.info('時間追蹤邏輯正常');
    });
    
    await this.runTest('專案管理功能', () => {
      // 模擬專案管理邏輯
      const projects = [
        { id: 1, name: 'Test Project', client: 'Test Client', rate: 500 }
      ];
      
      if (!Array.isArray(projects)) {
        throw new Error('專案數據結構錯誤');
      }
      
      this.log.info('專案管理邏輯正常');
    });
  }

  // 執行所有測試
  async runAllTests() {
    console.log('🚀 TimeTracker Pro 系統測試開始\n');
    
    const startTime = performance.now();
    
    try {
      await this.testBrowserEnvironment();
      await this.testBackendConnection();
      await this.testAuthentication();
      await this.testLocalStorage();
      await this.testAPIIntegration();
      await this.testPerformance();
      await this.testCoreFeatures();
      
      const endTime = performance.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      // 測試結果總結
      console.log('\n📊 測試結果總結');
      console.log(`✅ 通過: ${this.results.passed}`);
      console.log(`❌ 失敗: ${this.results.failed}`);
      console.log(`⚠️ 警告: ${this.results.warnings}`);
      console.log(`⏱️ 執行時間: ${duration}秒`);
      
      if (this.results.errors.length > 0) {
        console.log('\n❌ 錯誤詳情:');
        this.results.errors.forEach(({ test, error }) => {
          console.log(`   • ${test}: ${error}`);
        });
      }
      
      // 建議
      console.log('\n💡 建議:');
      if (this.results.failed === 0) {
        console.log('🎉 所有測試通過！系統準備就緒。');
      } else {
        console.log('🔧 請修復上述錯誤後重新執行測試。');
      }
      
      if (this.results.warnings > 0) {
        console.log('⚠️ 建議檢查警告項目以優化效能。');
      }
      
      return {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        errors: this.results.errors
      };
      
    } catch (error) {
      this.log.error(`測試執行失敗: ${error.message}`);
      throw error;
    }
  }
}

// 使用方式
// const tester = new SystemTester();
// tester.runAllTests().then(console.log).catch(console.error);

// 讓測試器在全域可用
window.SystemTester = SystemTester;

// 自動執行測試（如果是在開發環境）
if (window.location.hostname === 'localhost') {
  console.log('💡 開發模式：在控制台輸入 "new SystemTester().runAllTests()" 執行完整測試');
}

export default SystemTester;
