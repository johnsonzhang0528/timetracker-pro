import React, { useState } from 'react';
import Navigation from './Components/Navigation-Modern';
import TimeTracker from './Components/TimeTracker-Modern';
import ProjectManager from './Components/ProjectManager-Modern';
import Reports from './Components/Reports-RWD';
import Invoice from './Components/Invoice-RWD';
import Toast from './Components/Toast-RWD';
import { useTimeTracker, useLocalStorage } from './Hooks/useTimeTracker';
import { TABS } from './Constants';

const App = () => {
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
    setTimeEntries,
    hideToast
  } = useTimeTracker();

  // 專案管理狀態
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', rate: '', color: '#3B82F6' });
  const [formErrors, setFormErrors] = useState({});

  // 新增專案函數 - 增強版
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
      color: newProject.color || '#3B82F6'
    };
    
    setProjects(prev => [...prev, project]);
    
    // 如果是第一個專案，設為選中狀態
    if (!selectedProject) {
      setSelectedProject(project);
    }
    
    // 重置表單
    setNewProject({ name: '', client: '', rate: '', color: '#3B82F6' });
    setFormErrors({});
    setShowNewProject(false);
  };

  // 刪除專案函數 - 增強版
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
        return <Reports timeEntries={timeEntries} />;
      
      case TABS.INVOICE:
        return <Invoice timeEntries={timeEntries} />;
      
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-100 to-blue-100 opacity-50 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-indigo-50 to-cyan-50 opacity-30 blur-3xl"></div>
      </div>

      {/* 主容器 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 導航組件 */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* 主要內容區域 */}
        <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="max-w-7xl mx-auto">
            {/* 內容容器 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 border border-white/20 overflow-hidden">
              <div className="p-4 sm:p-6 lg:p-8">
                {renderCurrentTab()}
              </div>
            </div>
          </div>
        </main>

        {/* 底部安全區域 */}
        <div className="h-safe-bottom"></div>
      </div>

      {/* Toast 通知 */}
      {showToast && (
        <Toast 
          message={showToast.message}
          type={showToast.type}
          onClose={hideToast}
          position="top-right"
        />
      )}

      {/* 狀態指示器 (移動端) */}
      {isTracking && (
        <div className="fixed top-safe bottom-safe left-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 z-30 md:hidden"></div>
      )}

      {/* 無障礙輔助 */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isTracking ? '計時器正在運行' : '計時器已停止'}
      </div>
    </div>
  );
};

export default App;
