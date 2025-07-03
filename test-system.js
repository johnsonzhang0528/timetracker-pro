#!/usr/bin/env node
/**
 * TimeTracker Pro 系統測試腳本
 * 自動化測試前後端整合、API 連接、核心功能等
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// 測試配置
const config = {
  backend: {
    url: 'http://localhost:5000',
    healthEndpoint: '/health',
    apiHealthEndpoint: '/api/health'
  },
  frontend: {
    url: 'http://localhost:3000',
    buildPath: 'dist'
  },
  timeout: 5000,
  retries: 3
};

// 測試結果統計
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// 日誌函數
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}📋 ${msg}${colors.reset}\n`)
};

// 測試函數
async function runTest(testName, testFn) {
  try {
    log.info(`執行測試: ${testName}`);
    await testFn();
    log.success(`${testName} - 通過`);
    testResults.passed++;
    return true;
  } catch (error) {
    log.error(`${testName} - 失敗: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    return false;
  }
}

// HTTP 請求函數
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    timeout: config.timeout,
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

// 1. 檢查環境配置
async function testEnvironmentConfig() {
  log.section('環境配置檢查');
  
  // 檢查 .env 文件
  await runTest('前端 .env 檔案存在', () => {
    if (!fs.existsSync('.env')) {
      throw new Error('前端 .env 檔案不存在');
    }
  });
  
  await runTest('後端 .env 檔案存在', () => {
    if (!fs.existsSync('backend/.env')) {
      throw new Error('後端 .env 檔案不存在');
    }
  });
  
  // 檢查關鍵環境變數
  await runTest('環境變數配置', () => {
    const frontendEnv = fs.readFileSync('.env', 'utf-8');
    const backendEnv = fs.readFileSync('backend/.env', 'utf-8');
    
    if (!frontendEnv.includes('VITE_API_URL')) {
      throw new Error('前端缺少 VITE_API_URL 配置');
    }
    
    if (!backendEnv.includes('JWT_SECRET')) {
      throw new Error('後端缺少 JWT_SECRET 配置');
    }
  });
}

// 2. 檢查依賴包
async function testDependencies() {
  log.section('依賴包檢查');
  
  await runTest('前端依賴包', () => {
    if (!fs.existsSync('node_modules')) {
      throw new Error('前端依賴包未安裝，請執行 npm install');
    }
  });
  
  await runTest('後端依賴包', () => {
    if (!fs.existsSync('backend/node_modules')) {
      throw new Error('後端依賴包未安裝，請執行 cd backend && npm install');
    }
  });
}

// 3. 檢查關鍵檔案
async function testCoreFiles() {
  log.section('核心檔案檢查');
  
  const criticalFiles = [
    'App.jsx',
    'main.jsx',
    'Components/Auth.jsx',
    'Components/TimeTracker.jsx',
    'Components/AuthGuard.jsx',
    'contexts/APIContext.jsx',
    'Hooks/useAuth.js',
    'config/api.js',
    'backend/src/server.js',
    'backend/schema.prisma'
  ];
  
  for (const file of criticalFiles) {
    await runTest(`檔案存在: ${file}`, () => {
      if (!fs.existsSync(file)) {
        throw new Error(`關鍵檔案不存在: ${file}`);
      }
    });
  }
}

// 4. 檢查後端服務
async function testBackendHealth() {
  log.section('後端服務檢查');
  
  await runTest('後端健康檢查', async () => {
    try {
      const response = await makeRequest(`${config.backend.url}${config.backend.healthEndpoint}`);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`後端健康檢查失敗: ${data.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('後端服務未啟動，請確認服務運行在 http://localhost:5000');
      }
      throw error;
    }
  });
  
  await runTest('API 健康檢查', async () => {
    const response = await makeRequest(`${config.backend.url}${config.backend.apiHealthEndpoint}`);
    const data = await response.json();
    
    if (!data.service || !data.version) {
      throw new Error('API 健康檢查回應格式不正確');
    }
  });
}

// 5. 檢查資料庫
async function testDatabase() {
  log.section('資料庫檢查');
  
  await runTest('SQLite 資料庫檔案', () => {
    if (!fs.existsSync('backend/dev.db')) {
      throw new Error('SQLite 資料庫檔案不存在，請執行 cd backend && npm run db:migrate');
    }
  });
  
  await runTest('Prisma 結構檔案', () => {
    const schemaContent = fs.readFileSync('backend/schema.prisma', 'utf-8');
    if (!schemaContent.includes('model User')) {
      throw new Error('Prisma 結構檔案缺少 User 模型');
    }
  });
}

// 6. 檢查 API 端點
async function testAPIEndpoints() {
  log.section('API 端點檢查');
  
  const endpoints = [
    { path: '/api/auth/register', method: 'POST', name: '用戶註冊' },
    { path: '/api/auth/login', method: 'POST', name: '用戶登入' },
    { path: '/api/projects', method: 'GET', name: '專案列表' },
    { path: '/api/time-entries', method: 'GET', name: '時間記錄' }
  ];
  
  for (const endpoint of endpoints) {
    await runTest(`API 端點: ${endpoint.name}`, async () => {
      try {
        const response = await fetch(`${config.backend.url}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined
        });
        
        // 檢查端點是否回應（即使是錯誤回應也算正常）
        if (!response) {
          throw new Error(`端點 ${endpoint.path} 無回應`);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error(`無法連接到端點 ${endpoint.path}`);
        }
        // 其他錯誤（如 400, 401 等）是正常的，表示端點存在
      }
    });
  }
}

// 7. 檢查前端建置
async function testFrontendBuild() {
  log.section('前端建置檢查');
  
  await runTest('前端建置測試', () => {
    try {
      log.info('執行前端建置...');
      execSync('npm run build', { stdio: 'pipe' });
      
      if (!fs.existsSync('dist')) {
        throw new Error('建置失敗，dist 目錄不存在');
      }
      
      if (!fs.existsSync('dist/index.html')) {
        throw new Error('建置失敗，index.html 不存在');
      }
      
      log.success('前端建置成功');
    } catch (error) {
      throw new Error(`前端建置失敗: ${error.message}`);
    }
  });
}

// 8. 效能基準測試
async function testPerformance() {
  log.section('效能基準測試');
  
  await runTest('後端回應時間', async () => {
    const start = Date.now();
    await makeRequest(`${config.backend.url}${config.backend.healthEndpoint}`);
    const responseTime = Date.now() - start;
    
    if (responseTime > 1000) {
      log.warning(`後端回應時間較長: ${responseTime}ms`);
      testResults.warnings++;
    }
    
    log.info(`後端回應時間: ${responseTime}ms`);
  });
  
  await runTest('前端資源大小', () => {
    if (fs.existsSync('dist')) {
      const stats = fs.statSync('dist/index.html');
      const size = stats.size;
      
      if (size > 1024 * 1024) { // 1MB
        log.warning(`前端 HTML 檔案較大: ${Math.round(size / 1024)}KB`);
        testResults.warnings++;
      }
      
      log.info(`前端 HTML 大小: ${Math.round(size / 1024)}KB`);
    }
  });
}

// 主測試函數
async function runAllTests() {
  console.log(`${colors.cyan}🚀 TimeTracker Pro 系統測試開始${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    await testEnvironmentConfig();
    await testDependencies();
    await testCoreFiles();
    await testBackendHealth();
    await testDatabase();
    await testAPIEndpoints();
    await testFrontendBuild();
    await testPerformance();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // 測試結果總結
    console.log(`\n${colors.cyan}📊 測試結果總結${colors.reset}`);
    console.log(`${colors.green}✅ 通過: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}❌ 失敗: ${testResults.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️ 警告: ${testResults.warnings}${colors.reset}`);
    console.log(`⏱️ 執行時間: ${duration}秒`);
    
    if (testResults.errors.length > 0) {
      console.log(`\n${colors.red}❌ 錯誤詳情:${colors.reset}`);
      testResults.errors.forEach(({ test, error }) => {
        console.log(`   • ${test}: ${error}`);
      });
    }
    
    // 建議
    console.log(`\n${colors.cyan}💡 建議:${colors.reset}`);
    if (testResults.failed === 0) {
      console.log(`${colors.green}🎉 所有測試通過！系統準備就緒。${colors.reset}`);
    } else {
      console.log(`${colors.yellow}🔧 請修復上述錯誤後重新執行測試。${colors.reset}`);
    }
    
    if (testResults.warnings > 0) {
      console.log(`${colors.yellow}⚠️ 建議檢查警告項目以優化效能。${colors.reset}`);
    }
    
  } catch (error) {
    log.error(`測試執行失敗: ${error.message}`);
    process.exit(1);
  }
}

// 執行測試
runAllTests().catch(console.error);
