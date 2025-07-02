import React from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
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
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* 計時器卡片 - 完全按照原始設計 */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center">
        {/* 專案選擇 */}
        <div className="mb-4 sm:mb-6">
          <select 
            value={selectedProject?.id || ''} 
            onChange={(e) => {
              const project = projects.find(p => p.id === parseInt(e.target.value));
              onProjectChange(project);
            }}
            className="w-full sm:w-auto px-3 py-2 sm:px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client}
              </option>
            ))}
          </select>
        </div>
        
        {/* 時間顯示 - 確保大字體 */}
        <div className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-gray-800 mb-6 sm:mb-8">
          {formatTime(currentTime)}
        </div>
        
        {/* 控制按鈕 - 按照原始設計 */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {!isTracking ? (
            <button 
              onClick={onStartTracking}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>開始</span>
            </button>
          ) : (
            <button 
              onClick={onPauseTracking}
              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>暫停</span>
            </button>
          )}
          
          <button 
            onClick={onStopTracking}
            className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Square className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>停止</span>
          </button>
        </div>
        
        {/* 當前收入顯示 */}
        {currentTime > 0 && (
          <div className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600">
            當前收入: NT$ {Math.round((currentTime / 3600) * selectedProject.rate).toLocaleString()}
          </div>
        )}
      </div>

      {/* 今日工作記錄 - 按照原始設計 */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">今日工作記錄</h3>
        <div className="space-y-3">
          {timeEntries.slice(0, 3).map(entry => (
            <div 
              key={entry.id} 
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0"
            >
              <div className="flex-1">
                <div className="font-semibold text-sm sm:text-base">{entry.project}</div>
                <div className="text-xs sm:text-sm text-gray-600">{entry.client}</div>
              </div>
              <div className="flex justify-between sm:block sm:text-right">
                <div className="font-bold text-sm sm:text-base">NT$ {entry.amount.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-600">{formatTime(entry.duration)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
