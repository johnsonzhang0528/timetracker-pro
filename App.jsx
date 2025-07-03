import React, { useState } from 'react';
import Navigation from './Components/Navigation';
import TimeTracker from './Components/TimeTracker';
import ProjectManager from './Components/ProjectManager';
import Reports from './Components/Reports';
import Invoice from './Components/Invoice';
import Auth from './Components/Auth';
import UserProfile from './Components/UserProfile';
import { useTimeTracker, useLocalStorage } from './Hooks/useTimeTracker';
import { useTimeTrackerAPI } from './Hooks/useTimeTrackerAPI';
import { useAuthContext } from './Hooks/useAuth';
import { useAPIStatus } from './contexts/APIContext';
import { API_CONFIG } from './config/api';
import { TABS } from './Constants';

const App = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const { useAPI } = useAPIStatus();
  
  // 調試信息
  console.log('🏠 App 組件渲染 - 認證狀態:', {
    isAuthenticated,
    authLoading,
    user: user ? user.name : 'null',
    useAPI,
    API_CONFIG_useAPI: API_CONFIG.useAPI
  });
  
  // 根據 API 配置選擇使用的 Hook（避免同時初始化兩個 Hook）
  const timeTrackerHook = useAPI ? useTimeTrackerAPI() : useTimeTracker();
  
  // 使用自定義 Hooks
  const {
    isTracking,
    currentTime,
    projects,
    selectedProject,
    timeEntries,
    activeTab,
    showToast,
    startTracking,
    pauseTracking,
    stopTracking,
    setSelectedProject,
    setActiveTab,
    setProjects,
    hideToast
  } = timeTrackerHook;

  // 專案管理狀態
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ 
    name: '', 
    client: '', 
    rate: '', 
    color: '#3b82f6' 
  });
  const [formErrors, setFormErrors] = useState({});

  // 新增專案函數
  const addProject = () => {
    const errors = {};
    
    if (!newProject.name?.trim()) {
      errors.name = '專案名稱為必填';
    }
    
    if (!newProject.client?.trim()) {
      errors.client = '客戶名稱為必填';
    }
    
    if (!newProject.rate || newProject.rate <= 0) {
      errors.rate = '請輸入有效的時薪';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const project = {
      id: Date.now(),
      name: newProject.name.trim(),
      client: newProject.client.trim(),
      rate: parseInt(newProject.rate),
      color: newProject.color
    };
    
    setProjects(prev => [...prev, project]);
    
    // 如果是第一個專案，設為選中狀態
    if (!selectedProject) {
      setSelectedProject(project);
    }
    
    // 重置表單
    setNewProject({ name: '', client: '', rate: '', color: '#3b82f6' });
    setFormErrors({});
    setShowNewProject(false);
  };

  // 刪除專案函數
  const deleteProject = (projectId) => {
    if (window.confirm('確定要刪除此專案嗎？')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      
      // 如果刪除的是當前選中的專案，選擇第一個專案
      if (selectedProject?.id === projectId) {
        setSelectedProject(updatedProjects[0] || null);
      }
    }
  };

  // 啟用本地儲存
  useLocalStorage(projects, timeEntries, currentTime, isTracking, selectedProject);

  // 認證載入中顯示
  if (authLoading) {
    console.log('⏳ App 組件 - 認證載入中');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 未登入時顯示認證頁面
  if (!isAuthenticated) {
    console.log('🚪 App 組件 - 顯示認證頁面，isAuthenticated =', isAuthenticated);
    return <Auth onAuthSuccess={() => {
      console.log('🎯 onAuthSuccess 回調被調用');
      console.log('🔄 設置 activeTab 為 TRACKER');
      setActiveTab(TABS.TRACKER);
    }} />;
  }

  console.log('✅ App 組件 - 用戶已認證，顯示主應用，當前頁面:', activeTab);

  // 渲染當前頁面內容
  const renderCurrentTab = () => {
    switch (activeTab) {
      case TABS.TRACKER:
        return (
          <TimeTracker
            isTracking={isTracking}
            currentTime={currentTime}
            projects={projects}
            selectedProject={selectedProject}
            timeEntries={timeEntries}
            onStartTracking={startTracking}
            onPauseTracking={pauseTracking}
            onStopTracking={stopTracking}
            onProjectChange={setSelectedProject}
            setActiveTab={setActiveTab}
          />
        );
      
      case TABS.PROJECTS:
        return (
          <ProjectManager
            projects={projects}
            showNewProject={showNewProject}
            setShowNewProject={setShowNewProject}
            newProject={newProject}
            setNewProject={setNewProject}
            formErrors={formErrors}
            onAddProject={addProject}
            onDeleteProject={deleteProject}
          />
        );
      
      case TABS.REPORTS:
        return <Reports timeEntries={timeEntries} projects={projects} />;
      
      case TABS.INVOICE:
        return <Invoice timeEntries={timeEntries} projects={projects} />;
      
      case TABS.PROFILE:
        return <UserProfile />;
      
      default:
        return (
          <TimeTracker
            isTracking={isTracking}
            currentTime={currentTime}
            projects={projects}
            selectedProject={selectedProject}
            timeEntries={timeEntries}
            onStartTracking={startTracking}
            onPauseTracking={pauseTracking}
            onStopTracking={stopTracking}
            onProjectChange={setSelectedProject}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="app">
      {/* 導航組件 */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isTracking={isTracking}
      />
      
      {/* 主要內容區域 */}
      <main className="main">
        <div className="container">
          {renderCurrentTab()}
        </div>
      </main>

      {/* Toast 通知 */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 fade-in">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              showToast.type === 'success' ? 'bg-green-500' : 
              showToast.type === 'error' ? 'bg-red-500' : 
              'bg-blue-500'
            }`}></div>
            <span className="text-sm text-gray-700">{showToast.message}</span>
            <button 
              onClick={hideToast}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 底部安全區域 */}
      <div className="safe-area desktop-hidden"></div>
      
      {/* 無障礙輔助 */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isTracking ? '計時器正在運行' : '計時器已停止'}
      </div>
    </div>
  );
};

export default App;
