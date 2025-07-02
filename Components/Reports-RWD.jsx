import React, { useState, useMemo } from 'react';
import { DollarSign, Clock, BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react';
import { formatTime, formatCurrency, calculateTotalEarnings, calculateTotalHours } from '../Utils/helpers';

const Reports = ({ timeEntries }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, today, week, month
  const [selectedProject, setSelectedProject] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, amount, duration, project

  // 過濾時間記錄
  const filteredEntries = useMemo(() => {
    let filtered = [...timeEntries];
    
    // 時間範圍過濾
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (selectedPeriod === 'today') {
      filtered = filtered.filter(entry => entry.date === today);
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(entry => new Date(entry.date) >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(entry => new Date(entry.date) >= monthAgo);
    }
    
    // 專案過濾
    if (selectedProject !== 'all') {
      filtered = filtered.filter(entry => entry.project === selectedProject);
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'duration':
          return b.duration - a.duration;
        case 'project':
          return a.project.localeCompare(b.project);
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
    
    return filtered;
  }, [timeEntries, selectedPeriod, selectedProject, sortBy]);

  // 計算統計數據
  const stats = useMemo(() => {
    const totalEarnings = calculateTotalEarnings(filteredEntries);
    const totalHours = calculateTotalHours(filteredEntries);
    const averageHourlyRate = totalHours > 0 ? Math.round(totalEarnings / totalHours) : 0;
    const totalSessions = filteredEntries.length;
    
    // 專案統計
    const projectStats = {};
    filteredEntries.forEach(entry => {
      if (!projectStats[entry.project]) {
        projectStats[entry.project] = {
          earnings: 0,
          hours: 0,
          sessions: 0,
          client: entry.client
        };
      }
      projectStats[entry.project].earnings += entry.amount;
      projectStats[entry.project].hours += entry.duration / 3600;
      projectStats[entry.project].sessions += 1;
    });
    
    // 每日統計
    const dailyStats = {};
    filteredEntries.forEach(entry => {
      if (!dailyStats[entry.date]) {
        dailyStats[entry.date] = { earnings: 0, hours: 0, sessions: 0 };
      }
      dailyStats[entry.date].earnings += entry.amount;
      dailyStats[entry.date].hours += entry.duration / 3600;
      dailyStats[entry.date].sessions += 1;
    });
    
    return {
      totalEarnings,
      totalHours,
      averageHourlyRate,
      totalSessions,
      projectStats: Object.entries(projectStats).map(([name, data]) => ({
        name,
        ...data
      })).sort((a, b) => b.earnings - a.earnings),
      dailyStats: Object.entries(dailyStats).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  }, [filteredEntries]);

  // 獲取唯一專案列表
  const uniqueProjects = [...new Set(timeEntries.map(entry => entry.project))];

  // 期間選項
  const periodOptions = [
    { value: 'all', label: '全部時間' },
    { value: 'today', label: '今天' },
    { value: 'week', label: '最近 7 天' },
    { value: 'month', label: '最近 30 天' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-20 md:pb-8">
      
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">報表分析</h2>
          <p className="text-gray-600 text-responsive mt-1">
            追蹤您的工作效率和收入統計
          </p>
        </div>
      </div>
      
      {filteredEntries.length === 0 && timeEntries.length === 0 ? (
        /* 完全空狀態 */
        <div className="card spacing-responsive text-center py-12">
          <BarChart3 className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-3">
            還沒有數據
          </h3>
          <p className="text-gray-600 text-responsive mb-6 max-w-md mx-auto">
            開始計時工作來查看您的收入統計和工作分析
          </p>
        </div>
      ) : (
        <>
          {/* 篩選控制區 */}
          <div className="card spacing-responsive">
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
              
              {/* 時間範圍選擇 */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  時間範圍
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="input w-full"
                >
                  {periodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 專案過濾 */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  專案篩選
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="input w-full"
                >
                  <option value="all">所有專案</option>
                  {uniqueProjects.map(project => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 排序方式 */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  排序方式
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input w-full"
                >
                  <option value="date">依日期</option>
                  <option value="amount">依收入</option>
                  <option value="duration">依時長</option>
                  <option value="project">依專案</option>
                </select>
              </div>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            /* 篩選後無數據 */
            <div className="card spacing-responsive text-center py-12">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">沒有符合條件的數據</h3>
              <p className="text-gray-600 text-responsive">
                請調整篩選條件或選擇其他時間範圍
              </p>
              <button
                onClick={() => {
                  setSelectedPeriod('all');
                  setSelectedProject('all');
                }}
                className="btn btn-secondary mt-4"
              >
                重置篩選
              </button>
            </div>
          ) : (
            <>
              {/* 統計卡片 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                
                {/* 總收入 */}
                <div className="card spacing-responsive-sm text-center group">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">總收入</span>
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalEarnings)}
                  </div>
                </div>
                
                {/* 總工作時數 */}
                <div className="card spacing-responsive-sm text-center group">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">總時數</span>
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                    {stats.totalHours.toFixed(1)}h
                  </div>
                </div>
                
                {/* 平均時薪 */}
                <div className="card spacing-responsive-sm text-center group">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">平均時薪</span>
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.averageHourlyRate)}
                  </div>
                </div>
                
                {/* 工作次數 */}
                <div className="card spacing-responsive-sm text-center group">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">工作次數</span>
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                    {stats.totalSessions}
                  </div>
                </div>
              </div>

              {/* 專案統計 */}
              {stats.projectStats.length > 0 && (
                <div className="card spacing-responsive">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                    專案收入統計
                  </h3>
                  
                  <div className="space-y-4">
                    {stats.projectStats.map((project, index) => {
                      const percentage = (project.earnings / stats.totalEarnings) * 100;
                      return (
                        <div key={project.name} className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-responsive">
                                {project.name}
                              </div>
                              <div className="text-gray-600 text-responsive-sm">
                                {project.client} • {project.sessions} 次工作
                              </div>
                            </div>
                            <div className="flex justify-between sm:block sm:text-right space-x-4 sm:space-x-0">
                              <div className="font-bold text-green-600 text-responsive">
                                {formatCurrency(project.earnings)}
                              </div>
                              <div className="text-gray-600 text-responsive-sm">
                                {project.hours.toFixed(1)}h
                              </div>
                            </div>
                          </div>
                          
                          {/* 進度條 */}
                          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 sm:h-3 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            {percentage.toFixed(1)}% 的總收入
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 每日統計 */}
              {stats.dailyStats.length > 0 && selectedPeriod !== 'today' && (
                <div className="card spacing-responsive">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                    每日工作統計
                  </h3>
                  
                  <div className="space-y-3">
                    {stats.dailyStats.slice(0, 7).map(day => (
                      <div key={day.date} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-responsive">
                            {new Date(day.date).toLocaleDateString('zh-TW', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-gray-600 text-responsive-sm">
                            {day.sessions} 次工作
                          </div>
                        </div>
                        
                        <div className="flex justify-between sm:block sm:text-right space-x-4 sm:space-x-0">
                          <div className="font-bold text-green-600 text-responsive">
                            {formatCurrency(day.earnings)}
                          </div>
                          <div className="text-gray-600 text-responsive-sm">
                            {day.hours.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 詳細工作記錄 */}
              <div className="card spacing-responsive">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  詳細工作記錄 ({filteredEntries.length} 筆)
                </h3>
                
                {/* 桌面版表格 */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 text-responsive font-semibold text-gray-700">
                          日期
                        </th>
                        <th className="text-left py-3 px-2 text-responsive font-semibold text-gray-700">
                          專案
                        </th>
                        <th className="text-right py-3 px-2 text-responsive font-semibold text-gray-700">
                          時長
                        </th>
                        <th className="text-right py-3 px-2 text-responsive font-semibold text-gray-700">
                          收入
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map(entry => (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2 text-responsive">
                            {new Date(entry.date).toLocaleDateString('zh-TW')}
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-responsive font-medium text-gray-800">
                              {entry.project}
                            </div>
                            <div className="text-responsive-sm text-gray-600">
                              {entry.client}
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 text-responsive">
                            {formatTime(entry.duration)}
                          </td>
                          <td className="text-right py-3 px-2 text-responsive font-bold text-green-600">
                            {formatCurrency(entry.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 手機版卡片 */}
                <div className="sm:hidden space-y-3">
                  {filteredEntries.map(entry => (
                    <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-sm">
                            {entry.project}
                          </div>
                          <div className="text-gray-600 text-xs">
                            {entry.client}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600 text-sm">
                            {formatCurrency(entry.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{new Date(entry.date).toLocaleDateString('zh-TW')}</span>
                        <span>{formatTime(entry.duration)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 移動端提示 */}
              <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-sm text-blue-700">
                  💡 <strong>小提示:</strong> 使用篩選功能查看特定時間範圍或專案的統計
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
