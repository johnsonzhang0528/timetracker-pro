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
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center animate-fade-in">
          <div className="mb-6">
            <Clock className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
              歡迎使用 TimeTracker Pro
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              開始追蹤時間前，請先建立您的第一個專案
            </p>
            <button
              onClick={() => setActiveTab('projects')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center mx-auto"
            >
              <Clock className="w-5 h-5 mr-2" />
              建立專案
            </button>
          </div>
        </div>
      )}

      {/* 主計時器區域 */}
      {!hasNoProjects && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center relative overflow-hidden">
          
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

            {/* 時間顯示 */}
            <div className="mb-6 sm:mb-8">
              <div className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-mono font-bold text-gray-800 mb-4 transition-all duration-300 ${
                isAnimating ? 'scale-105 text-blue-600' : 'scale-100'
              }`}>
                {formatTime(currentTime)}
              </div>
              
              {/* 當前收入顯示 */}
              {currentTime > 0 && selectedProject && (
                <div className="text-lg sm:text-xl text-gray-600 font-semibold">
                  當前收入: <span className="text-green-600">{formatCurrency(currentEarnings)}</span>
                </div>
              )}
            </div>

            {/* 控制按鈕 */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
              {!isTracking ? (
                <button 
                  onClick={handleStartTracking}
                  disabled={!selectedProject}
                  className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 min-h-[56px] transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-6 h-6" />
                  <span>開始</span>
                </button>
              ) : (
                <button 
                  onClick={onPauseTracking}
                  className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 min-h-[56px] transform hover:scale-105 active:scale-95"
                >
                  <Pause className="w-6 h-6" />
                  <span>暫停</span>
                </button>
              )}
              
              <button 
                onClick={handleStopTracking}
                disabled={currentTime === 0}
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 min-h-[56px] transform hover:scale-105 active:scale-95"
              >
                <Square className="w-6 h-6" />
                <span>停止</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 今日統計卡片 */}
      {todayEntries.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">今日統計</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {formatCurrency(todayTotal)}
              </div>
              <div className="text-sm text-gray-600">今日收入</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {todayEntries.length}
              </div>
              <div className="text-sm text-gray-600">完成項目</div>
            </div>
          </div>
        </div>
      )}

      {/* 今日工作記錄 */}
      {timeEntries.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">最近工作記錄</h3>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
            >
              <span>查看全部</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {timeEntries.slice(0, 3).map(entry => (
              <div 
                key={entry.id} 
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 rounded-xl space-y-2 sm:space-y-0 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold text-base text-gray-800">{entry.project}</div>
                  <div className="text-sm text-gray-600">{entry.client} • {entry.date}</div>
                </div>
                <div className="flex justify-between sm:block sm:text-right">
                  <div className="font-bold text-green-600 text-base">
                    {formatCurrency(entry.amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(entry.duration)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
