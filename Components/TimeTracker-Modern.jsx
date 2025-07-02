import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, TrendingUp, ArrowRight, Zap, Target, DollarSign } from 'lucide-react';
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
  const [showStats, setShowStats] = useState(false);
  const timerRef = useRef(null);

  // 檢查是否沒有專案
  const hasNoProjects = !projects || projects.length === 0;
  const hasNoSelectedProject = !selectedProject;

  // 計算當前收入
  const currentEarnings = selectedProject 
    ? calculateEarnings(currentTime, selectedProject.rate)
    : 0;

  // 計算今日統計
  const todayEntries = timeEntries.filter(entry => 
    entry.date === new Date().toISOString().split('T')[0]
  );
  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const todayHours = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);

  // 計算本週統計
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEntries = timeEntries.filter(entry => 
    new Date(entry.date) >= weekStart
  );
  const weekTotal = weekEntries.reduce((sum, entry) => sum + entry.amount, 0);

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
    if (window.confirm('確定要停止計時並保存記錄嗎？')) {
      onStopTracking();
    }
  };

  // 如果沒有專案，顯示引導
  if (hasNoProjects) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* 空狀態卡片 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 text-center">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              開始您的第一個專案
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              建立專案來追蹤工作時間，自動計算收入，讓您的工作更有效率！
            </p>
            <button
              onClick={() => setActiveTab('projects')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Target className="w-5 h-5 mr-2" />
              建立第一個專案
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 主計時器卡片 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border border-white/50 shadow-xl backdrop-blur-sm">
        {/* 背景裝飾 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10 p-6 sm:p-8">
          {/* 專案選擇器 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              選擇專案
            </label>
            <div className="relative">
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === parseInt(e.target.value));
                  onProjectChange(project);
                }}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 appearance-none"
              >
                <option value="">請選擇專案...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.client} ({formatCurrency(project.rate)}/小時)
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* 專案提示 */}
            {showProjectHint && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-slide-down">
                <p className="text-sm text-amber-700 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  請先選擇一個專案才能開始計時
                </p>
              </div>
            )}
          </div>

          {/* 時間顯示 */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className={`text-5xl sm:text-6xl lg:text-7xl font-mono font-bold transition-all duration-300 ${
                isTracking 
                  ? 'text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text' 
                  : 'text-gray-700'
              }`}>
                {formatTime(currentTime)}
              </div>
              {isTracking && (
                <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-2xl animate-pulse"></div>
              )}
            </div>
            
            {/* 收入顯示 */}
            {selectedProject && currentTime > 0 && (
              <div className="mt-4 flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-700">
                    {formatCurrency(currentEarnings)}
                  </span>
                </div>
                {isTracking && (
                  <div className="text-sm text-gray-500">
                    當前收入
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 控制按鈕 */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {!isTracking ? (
              <button 
                onClick={handleStartTracking}
                disabled={!selectedProject}
                className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                <div className="flex items-center space-x-2">
                  <Play className="w-6 h-6" />
                  <span>開始計時</span>
                </div>
                {!selectedProject && (
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                )}
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={onPauseTracking}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center space-x-2">
                    <Pause className="w-5 h-5" />
                    <span>暫停</span>
                  </div>
                </button>
                
                <button 
                  onClick={handleStopTracking}
                  disabled={currentTime === 0}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center space-x-2">
                    <Square className="w-5 h-5" />
                    <span>停止</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 狀態指示器 */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-50/80 backdrop-blur-sm">
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`} />
              <span className={`text-sm font-medium ${
                isTracking ? 'text-green-600' : 'text-gray-500'
              }`}>
                {isTracking ? '計時中' : '已停止'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 今日統計 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">今日</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(todayTotal)}
            </div>
            <div className="text-sm text-gray-500">
              {formatTime(todayHours)} 工作時間
            </div>
          </div>
        </div>

        {/* 本週統計 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">本週</h3>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(weekTotal)}
            </div>
            <div className="text-sm text-gray-500">
              {weekEntries.length} 個工作記錄
            </div>
          </div>
        </div>

        {/* 平均時薪 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">平均時薪</h3>
            <DollarSign className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900">
              {selectedProject ? formatCurrency(selectedProject.rate) : '--'}
            </div>
            <div className="text-sm text-gray-500">
              {selectedProject ? selectedProject.name : '未選擇專案'}
            </div>
          </div>
        </div>
      </div>

      {/* 最近記錄 */}
      {timeEntries.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">最近記錄</h3>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
              >
                <span>查看全部</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {timeEntries.slice(0, 3).map(entry => (
              <div key={entry.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{entry.project}</div>
                    <div className="text-sm text-gray-500">
                      {entry.description || '無描述'} • {entry.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(entry.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(entry.duration)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速操作提示 */}
      <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 text-center">
        <div className="text-sm text-blue-700">
          💡 <strong>小提示：</strong> 使用空白鍵可以快速開始/暫停計時
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
