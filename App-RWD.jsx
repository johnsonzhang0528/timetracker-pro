import React, { useState } from 'react';
import Navigation from './Components/Navigation-RWD';
import TimeTracker from './Components/TimeTracker-RWD';
import ProjectManager from './Components/ProjectManager-RWD';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 safe-top safe-bottom">
      
      {/* 導航組件 */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* 主要內容區域 - 響應式容器 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {renderCurrentTab()}
        </div>
      </main>

      {/* Toast 通知 */}
      {showToast && (
        <Toast 
          message={showToast.message}
          type={showToast.type}
          onClose={hideToast}
          position="top-right"
        />
      )}

      {/* PWA 安裝提示 (移動端) */}
      <div className="md:hidden fixed bottom-20 left-4 right-4 z-40">
        {/* 可以在這裡添加 PWA 安裝提示 */}
      </div>

      {/* 無障礙輔助 */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isTracking ? '計時器正在運行' : '計時器已停止'}
      </div>
    </div>
  );
};

export default App;
