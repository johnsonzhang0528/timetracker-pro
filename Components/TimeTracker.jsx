import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, TrendingUp, Target, DollarSign, Plus } from 'lucide-react';
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
  const [showProjectHint, setShowProjectHint] = useState(false);

  // 檢查是否沒有專案
  const hasNoProjects = !projects || projects.length === 0;
  const hasNoSelectedProject = !selectedProject;

  // 計算當前收入
  const currentEarnings = selectedProject 
    ? calculateEarnings(currentTime, selectedProject.rate)
    : 0;

  // 計算統計數據
  const todayEntries = timeEntries.filter(entry => 
    entry.date === new Date().toISOString().split('T')[0]
  );
  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const todayHours = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEntries = timeEntries.filter(entry => 
    new Date(entry.date) >= weekStart
  );
  const weekTotal = weekEntries.reduce((sum, entry) => sum + entry.amount, 0);

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
      <div className="fade-in">
        <div className="card">
          <div className="card-padding text-center">
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto var(--space-6)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Target size={40} />
            </div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: 'var(--gray-900)',
              marginBottom: 'var(--space-3)'
            }}>
              開始您的第一個專案
            </h2>
            <p style={{ 
              color: 'var(--gray-600)', 
              marginBottom: 'var(--space-8)',
              maxWidth: '400px',
              margin: '0 auto var(--space-8)'
            }}>
              建立專案來追蹤工作時間，自動計算收入，讓您的工作更有效率！
            </p>
            <button
              onClick={() => setActiveTab('projects')}
              className="btn btn-primary btn-lg"
            >
              <Plus size={20} />
              建立第一個專案
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {/* 主計時器卡片 */}
      <div className="card">
        <div className="card-padding">
          {/* 專案選擇器 */}
          <div className="form-group">
            <label className="form-label">選擇專案</label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === parseInt(e.target.value));
                onProjectChange(project);
              }}
              className="form-select"
            >
              <option value="">請選擇專案...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.client} ({formatCurrency(project.rate)}/小時)
                </option>
              ))}
            </select>
            
            {/* 專案提示 */}
            {showProjectHint && (
              <div style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                color: '#92400e'
              }}>
                請先選擇一個專案才能開始計時
              </div>
            )}
          </div>

          {/* 時間顯示 */}
          <div className={`timer-display ${isTracking ? 'active' : ''}`}>
            {formatTime(currentTime)}
          </div>
          
          {/* 收入顯示 */}
          {selectedProject && currentTime > 0 && (
            <div className="text-center mb-6">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: '#ecfdf5',
                borderRadius: 'var(--radius)',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#059669'
              }}>
                <DollarSign size={20} />
                {formatCurrency(currentEarnings)}
              </div>
              {isTracking && (
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--gray-500)',
                  marginTop: 'var(--space-2)' 
                }}>
                  當前收入
                </div>
              )}
            </div>
          )}

          {/* 控制按鈕 */}
          <div className="text-center" style={{ marginBottom: 'var(--space-6)' }}>
            {!isTracking ? (
              <button 
                onClick={handleStartTracking}
                disabled={!selectedProject}
                className="btn btn-success btn-lg"
                style={{ minWidth: '140px' }}
              >
                <Play size={20} />
                開始計時
              </button>
            ) : (
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={onPauseTracking}
                  className="btn btn-warning"
                >
                  <Pause size={18} />
                  暫停
                </button>
                
                <button 
                  onClick={handleStopTracking}
                  disabled={currentTime === 0}
                  className="btn btn-danger"
                >
                  <Square size={18} />
                  停止
                </button>
              </div>
            )}
          </div>

          {/* 狀態指示器 */}
          <div className="text-center">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--gray-100)',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isTracking ? '#10b981' : 'var(--gray-400)'
              }} className={isTracking ? 'pulse' : ''}></div>
              <span style={{ color: isTracking ? '#059669' : 'var(--gray-500)' }}>
                {isTracking ? '計時中' : '已停止'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="stats-grid">
        {/* 今日統計 */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">今日</div>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">{formatCurrency(todayTotal)}</div>
          <div className="stat-description">
            {formatTime(todayHours)} 工作時間
          </div>
        </div>

        {/* 本週統計 */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">本週</div>
            <TrendingUp size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value">{formatCurrency(weekTotal)}</div>
          <div className="stat-description">
            {weekEntries.length} 個工作記錄
          </div>
        </div>

        {/* 平均時薪 */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">平均時薪</div>
            <DollarSign size={16} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="stat-value">
            {selectedProject ? formatCurrency(selectedProject.rate) : '--'}
          </div>
          <div className="stat-description">
            {selectedProject ? selectedProject.name : '未選擇專案'}
          </div>
        </div>
      </div>

      {/* 最近記錄 */}
      {timeEntries.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title" style={{ fontSize: '1.125rem' }}>最近記錄</h3>
              <button
                onClick={() => setActiveTab('reports')}
                className="btn btn-sm btn-secondary"
              >
                查看全部
              </button>
            </div>
          </div>
          <div>
            {timeEntries.slice(0, 3).map((entry, index) => (
              <div key={entry.id} style={{
                padding: 'var(--space-4)',
                borderBottom: index < 2 ? '1px solid var(--gray-200)' : 'none'
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                      {entry.project}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      {entry.description || '無描述'} • {entry.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontWeight: '600', color: 'var(--success)' }}>
                      {formatCurrency(entry.amount)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      {formatTime(entry.duration)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 小提示 */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius)',
        padding: 'var(--space-4)',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#1e40af'
      }}>
        💡 <strong>小提示：</strong> 選擇專案後即可開始計時，系統會自動計算收入
      </div>
    </div>
  );
};

export default TimeTracker;
