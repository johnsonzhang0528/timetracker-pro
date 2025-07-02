import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { formatTime, calculateEarnings, formatCurrency } from '../Utils/helpers';

const TimeTracker = ({
  isTracking,
  currentTime,
  projects,
  selectedProject,
  timeEntries,
  onStartTracking,
  onPauseTracking,
  onStopTracking,
  onProjectChange,
  setActiveTab
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showProjectHint, setShowProjectHint] = useState(false);
  const timerRef = useRef(null);

  // 檢查是否沒有專案
  const hasNoProjects = !projects || projects.length === 0;
  const hasNoSelectedProject = !selectedProject;

  // 計算當前收入
  const currentEarnings = selectedProject 
    ? calculateEarnings(currentTime, selectedProject.rate)
    : 0;

  // 計算今日總收入
  const todayEntries = timeEntries.filter(entry => 
    entry.date === new Date().toISOString().split('T')[0]
  );
  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // 動畫效果
  useEffect(() => {
    if (isTracking) {
      setIsAnimating(true);
      const interval = setInterval(() => {
        setIsAnimating(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsAnimating(false);
    }
  }, [isTracking]);

  // 專案提示
  useEffect(() => {
    if (hasNoSelectedProject && projects.length > 0) {
      setShowProjectHint(true);
      const timer = setTimeout(() => setShowProjectHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasNoSelectedProject, projects.length]);

  // 處理計時操作
  const handleStartTracking = () => {
    if (!selectedProject) {
      setShowProjectHint(true);
      return;
    }
    onStartTracking();
  };

  const handleStopTracking = () => {
    onStopTracking();
    // 觸覺反饋
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-20 md:pb-8">
      
      {/* 沒有專案時的引導 */}
      {hasNoProjects && (
        <div className="card spacing-responsive text-center animate-fade-in">
          <div className="mb-6">
            <Clock className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
              歡迎使用 TimeTracker Pro
            </h3>
            <p className="text-gray-600 text-responsive mb-6">
              開始追蹤時間前，請先建立您的第一個專案
            </p>
            <button
              onClick={() => setActiveTab('projects')}
              className="btn btn-primary btn-lg"
            >
              <Clock className="w-5 h-5 mr-2" />
              建立專案
            </button>
          </div>
        </div>
      )}

      {/* 主計時器區域 */}
      {!hasNoProjects && (
        <div className="card spacing-responsive text-center relative overflow-hidden">
          
          {/* 背景裝飾 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-green-50 opacity-50" />
          
          <div className="relative z-10">
            {/* 專案選擇器 */}
            <div className="mb-6 sm:mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3 text-left sm:text-center">
                選擇專案
              </label>
              
              <div className="relative">
                <select 
                  value={selectedProject?.id || ''} 
                  onChange={(e) => {
                    const project = projects.find(p => p.id === parseInt(e.target.value));
                    onProjectChange(project);
                    setShowProjectHint(false);
                  }}
                  className={`w-full px-4 py-3 sm:px-6 sm:py-4 border-2 rounded-xl sm:rounded-2xl 
                    font-medium text-base sm:text-lg bg-white shadow-sm
                    focus:ring-4 focus:ring-blue-200 focus:border-blue-500 
                    transition-all duration-200 ${
                    showProjectHint 
                      ? 'border-orange-400 bg-orange-50' 
                      : 'border-gray-200'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(45deg, ${selectedProject?.color || '#3b82f6'}, ${selectedProject?.color || '#1d4ed8'})`,
                    backgroundClip: selectedProject ? 'text' : 'initial',
                    WebkitBackgroundClip: selectedProject ? 'text' : 'initial',
                    color: selectedProject ? 'transparent' : 'inherit'
                  }}
                >
                  {!selectedProject && (
                    <option value="">請選擇專案...</option>
                  )}
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.client} (NT${project.rate}/小時)
                    </option>
                  ))}
                </select>
                
                {/* 專案提示 */}
                {showProjectHint && (
                  <div className="absolute -bottom-12 left-0 right-0 bg-orange-100 border border-orange-300 rounded-lg p-2 text-sm text-orange-700 animate-scale-in">
                    ⚠️ 請先選擇一個專案才能開始計時
                  </div>
                )}
              </div>
            </div>
            
            {/* 時間顯示器 */}
            <div className="mb-6 sm:mb-8">
              <div 
                ref={timerRef}
                className={`time-display font-mono font-bold text-gray-800 mb-4 transition-all duration-300 ${
                  isAnimating ? 'text-blue-600 scale-105' : ''
                }`}
                style={{
                  textShadow: isTracking ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {formatTime(currentTime)}
              </div>
              
              {/* 狀態指示器 */}
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                }`} />
                <span className={`text-sm font-medium ${
                  isTracking ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {isTracking ? '計時中' : '已停止'}
                </span>
              </div>
            </div>
            
            {/* 控制按鈕區域 */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4 mb-6">
              {!isTracking ? (
                <button 
                  onClick={handleStartTracking}
                  disabled={!selectedProject}
                  className="btn btn-success btn-lg w-full sm:w-auto min-w-[140px] group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
                    <span>開始計時</span>
                  </div>
                  {/* 背景動畫 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </button>
              ) : (
                <button 
                  onClick={onPauseTracking}
                  className="btn btn-warning btn-lg w-full sm:w-auto min-w-[140px] group"
                >
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 mr-2 transition-transform group-hover:scale-110" />
                  <span>暫停</span>
                </button>
              )}
              
              <button 
                onClick={handleStopTracking}
                disabled={currentTime === 0}
                className="btn btn-danger btn-lg w-full sm:w-auto min-w-[140px] group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-5 h-5 sm:w-6 sm:h-6 mr-2 transition-transform group-hover:scale-110" />
                <span>停止計時</span>
              </button>
            </div>
            
            {/* 當前收入顯示 */}
            {currentTime > 0 && selectedProject && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-green-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">當前會話收入</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {formatCurrency(currentEarnings)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">
                  {selectedProject.name} • {formatCurrency(selectedProject.rate)}/小時
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 今日統計卡片 */}
      {!hasNoProjects && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 今日收入 */}
          <div className="card spacing-responsive-sm text-center">
            <div className="text-sm font-medium text-gray-600 mb-1">今日收入</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {formatCurrency(todayTotal + currentEarnings)}
            </div>
          </div>
          
          {/* 今日時數 */}
          <div className="card spacing-responsive-sm text-center">
            <div className="text-sm font-medium text-gray-600 mb-1">今日時數</div>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {((todayEntries.reduce((sum, entry) => sum + entry.duration, 0) + currentTime) / 3600).toFixed(1)}h
            </div>
          </div>
        </div>
      )}

      {/* 最近工作記錄 */}
      {!hasNoProjects && timeEntries.length > 0 && (
        <div className="card spacing-responsive">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">最近工作記錄</h3>
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              <span>查看全部</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {timeEntries.slice(0, 3).map(entry => (
              <div 
                key={entry.id} 
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 
                  bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl 
                  border border-gray-200 hover:shadow-md transition-all duration-200 
                  space-y-2 sm:space-y-0"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-responsive">
                    {entry.project}
                  </div>
                  <div className="text-gray-600 text-responsive-sm">
                    {entry.client}
                  </div>
                  <div className="text-gray-500 text-xs sm:text-sm">
                    {entry.date}
                  </div>
                </div>
                
                <div className="flex justify-between sm:block sm:text-right space-x-4 sm:space-x-0">
                  <div className="text-green-600 font-bold text-responsive">
                    {formatCurrency(entry.amount)}
                  </div>
                  <div className="text-gray-600 text-responsive-sm">
                    {formatTime(entry.duration)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {timeEntries.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-responsive">
                還沒有工作記錄，開始計時來建立您的第一筆記錄吧！
              </p>
            </div>
          )}
        </div>
      )}

      {/* 快速操作提示 (手機版) */}
      {!hasNoProjects && (
        <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-sm text-blue-700">
            💡 <strong>小提示:</strong> 在底部導航快速切換功能
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
