import React, { useState, useEffect, useMemo } from 'react';

const Reports = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedProject, setSelectedProject] = useState('all');
  const [chartType, setChartType] = useState('daily');

  useEffect(() => {
    // 載入時間記錄
    const savedEntries = localStorage.getItem('timetracker-entries');
    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries));
    }

    // 載入專案
    const savedProjects = localStorage.getItem('timetracker-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // 根據選擇的時間範圍過濾資料
  const filteredEntries = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const matchesPeriod = entryDate >= startDate;
      const projectName = entry.project?.name || entry.project;
      const matchesProject = selectedProject === 'all' || projectName === selectedProject;
      return matchesPeriod && matchesProject;
    });
  }, [timeEntries, selectedPeriod, selectedProject]);

  // 計算統計資料
  const stats = useMemo(() => {
    const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalEarnings = filteredEntries.reduce((sum, entry) => {
      const projectName = entry.project?.name || entry.project;
      const project = projects.find(p => p.name === projectName);
      return sum + ((entry.duration || 0) * (project?.hourlyRate || 0));
    }, 0);

    const projectStats = filteredEntries.reduce((acc, entry) => {
      const projectName = entry.project?.name || entry.project || 'Unknown Project';
      if (!acc[projectName]) {
        acc[projectName] = { hours: 0, earnings: 0 };
      }
      acc[projectName].hours += entry.duration || 0;
      
      const project = projects.find(p => p.name === projectName);
      acc[projectName].earnings += (entry.duration || 0) * (project?.hourlyRate || 0);
      
      return acc;
    }, {});

    return {
      totalHours,
      totalEarnings,
      averageHoursPerDay: totalHours / Math.max(1, getDaysInPeriod()),
      projectStats
    };
  }, [filteredEntries, projects, selectedPeriod]);

  const getDaysInPeriod = () => {
    switch (selectedPeriod) {
      case 'today': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 1;
    }
  };

  // 準備圖表資料
  const chartData = useMemo(() => {
    if (chartType === 'daily') {
      const dailyData = {};
      filteredEntries.forEach(entry => {
        const date = entry.date.split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = 0;
        }
        dailyData[date] += entry.duration;
      });

      return Object.entries(dailyData)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, hours]) => ({ date, hours }));
    } else {
      return Object.entries(stats.projectStats)
        .map(([project, data]) => ({ project, ...data }))
        .sort((a, b) => b.hours - a.hours);
    }
  }, [filteredEntries, chartType, stats.projectStats]);

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="reports-manager">
      <div className="reports-manager-header">
        <div>
          <h1 className="reports-manager-title">工作報告</h1>
          <p className="reports-manager-subtitle">分析您的工作時數與收益</p>
        </div>
        <div className="filter-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="today">今天</option>
            <option value="week">本週</option>
            <option value="month">本月</option>
            <option value="year">今年</option>
          </select>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">所有專案</option>
            {projects.map(project => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="reports-stats-grid">
        <div className="reports-stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{formatHours(stats.totalHours)}</div>
          <div className="stat-label">總工作時間</div>
        </div>
        <div className="reports-stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-value">${stats.totalEarnings.toFixed(0)}</div>
          <div className="stat-label">總收益</div>
        </div>
        <div className="reports-stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{formatHours(stats.averageHoursPerDay)}</div>
          <div className="stat-label">日均工作時間</div>
        </div>
        <div className="reports-stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{Object.keys(stats.projectStats).length}</div>
          <div className="stat-label">專案數量</div>
        </div>
      </div>

      {/* 圖表區域 */}
      <div className="card">
        <div className="card-header">
          <h3>數據視覺化</h3>
          <div className="chart-controls">
            <button
              className={`btn ${chartType === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setChartType('daily')}
            >
              每日趨勢
            </button>
            <button
              className={`btn ${chartType === 'project' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setChartType('project')}
            >
              專案分布
            </button>
          </div>
        </div>

        <div className="chart-container">
          {chartData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>沒有數據</h3>
              <p>選擇的時間範圍內沒有工作記錄</p>
            </div>
          ) : (
            <div className="simple-chart">
              {chartType === 'daily' ? (
                // 簡單的日期條形圖
                <div className="daily-chart">
                  {chartData.map(({ date, hours }) => {
                    const maxHours = Math.max(...chartData.map(d => d.hours));
                    const height = (hours / maxHours) * 100;
                    
                    return (
                      <div key={date} className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{ height: `${height}%` }}
                          title={`${formatDate(date)}: ${formatHours(hours)}`}
                        />
                        <div className="chart-label">
                          {formatDate(date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // 專案分布圖
                <div className="project-chart">
                  {chartData.map(({ project, hours, earnings }) => {
                    const maxHours = Math.max(...chartData.map(d => d.hours));
                    const width = (hours / maxHours) * 100;
                    
                    return (
                      <div key={project} className="project-bar">
                        <div className="project-info">
                          <span className="project-name">{project}</span>
                          <span className="project-hours">{formatHours(hours)}</span>
                        </div>
                        <div className="project-bar-container">
                          <div 
                            className="project-bar-fill"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <div className="project-earnings">
                          ${earnings.toFixed(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 詳細記錄表格 */}
      <div className="card">
        <div className="card-header">
          <h3>詳細記錄</h3>
        </div>
        
        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>沒有記錄</h3>
            <p>選擇的時間範圍內沒有工作記錄</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>專案</th>
                  <th>任務</th>
                  <th>時間</th>
                  <th>收益</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((entry, index) => {
                    const projectName = entry.project?.name || entry.project;
                    const project = projects.find(p => p.name === projectName);
                    const earnings = (entry.duration || 0) * (project?.hourlyRate || 0);
                    
                    return (
                      <tr key={index}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{entry.project?.name || entry.project || 'Unknown Project'}</td>
                        <td>{entry.task || '-'}</td>
                        <td>{formatHours(entry.duration)}</td>
                        <td>${earnings.toFixed(0)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
