import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, TrendingUp, Target, DollarSign, Plus, Cloud, CloudOff } from 'lucide-react';
import { formatTime, calculateEarnings, formatCurrency } from '../Utils/helpers';
import { useAPIStatus } from '../contexts/APIContext';
import { SYNC_STATUS } from '../Utils/OfflineSync';

const TimeTracker = ({
  isTracking,
  currentTime,
  projects,
  selectedProject,
  timeEntries,
  onStartTracking,
  onPauseTracking,
  onStopTracking,
  onStopAndStartTracking,
  onProjectChange,
  onReloadTimeEntries,
  setActiveTab
}) => {
  const [showProjectHint, setShowProjectHint] = useState(false);
  const { apiStatus, useAPI, syncStatus, triggerSync } = useAPIStatus();

  // 檢查是否沒有專案
  const hasNoProjects = !projects || projects.length === 0;
  const hasNoSelectedProject = !selectedProject;

  // 計算當前收入
  const currentEarnings = selectedProject 
    ? calculateEarnings(currentTime, selectedProject.rate || selectedProject.hourlyRate || 0)
    : 0;
  
  console.log('計算收入:', {
    currentTime,
    projectRate: selectedProject?.rate,
    projectHourlyRate: selectedProject?.hourlyRate,
    usedRate: selectedProject ? (selectedProject.rate || selectedProject.hourlyRate || 0) : 0,
    calculatedEarnings: selectedProject 
      ? calculateEarnings(currentTime, selectedProject.rate || selectedProject.hourlyRate || 0)
      : 0
  });

  // 計算統計數據
  console.log('所有時間記錄:', timeEntries);
  
  // 獲取今天的日期 (YYYY-MM-DD 格式)
  const today = new Date().toISOString().split('T')[0];
  
  // 過濾今天的記錄
  const todayEntries = timeEntries.filter(entry => {
    if (entry.startTime) {
      const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
      return entryDate === today;
    } else if (entry.date) {
      return entry.date === today;
    }
    return false;
  });
  
  const todayTotal = todayEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const todayHours = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  // 本週數據
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  
  const weekEntries = timeEntries.filter(entry => {
    if (entry.startTime) {
      return new Date(entry.startTime) >= weekStart;
    } else if (entry.date) {
      return new Date(entry.date) >= weekStart;
    }
    return false;
  });
  
  const weekTotal = weekEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const weekHours = weekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  // 本月數據
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEntries = timeEntries.filter(entry => {
    if (entry.startTime) {
      return new Date(entry.startTime) >= monthStart;
    } else if (entry.date) {
      return new Date(entry.date) >= monthStart;
    }
    return false;
  });
  
  const monthTotal = monthEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const monthHours = monthEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  // 計算真正的平均時薪（基於所有歷史數據）
  const totalEarnings = timeEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  const realAverageRate = totalHours > 0 ? (totalEarnings / (totalHours / 3600)) : 0;

  // 目標設定（可以後續從用戶設置中獲取）
  const dailyTarget = 8 * 3600; // 8小時目標（秒）
  const weeklyTarget = 40 * 3600; // 40小時目標
  const monthlyTarget = 160 * 3600; // 160小時目標

  // 計算完成百分比
  const todayProgress = Math.min((todayHours / dailyTarget) * 100, 100);
  const weekProgress = Math.min((weekHours / weeklyTarget) * 100, 100);
  const monthProgress = Math.min((monthHours / monthlyTarget) * 100, 100);

  // 專案提示
  useEffect(() => {
    if (hasNoSelectedProject && projects.length > 0) {
      setShowProjectHint(true);
      const timer = setTimeout(() => setShowProjectHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasNoSelectedProject, projects.length]);

  // 處理計時操作
  const handleStartTracking = async () => {
    if (!selectedProject) {
      setShowProjectHint(true);
      return;
    }
    
    try {
      console.log('準備開始計時', { 
        selectedProject, 
        isTracking 
      });
      
      // 首先檢查本地儲存狀態
      const activeEntryInStorage = localStorage.getItem('timetracker_active_entry');
      const isLocalTracking = localStorage.getItem('timetracker_is_tracking') === 'true';
      
      console.log('狀態檢查:', {
        activeEntryInStorage: !!activeEntryInStorage,
        isLocalTracking,
        isTracking,
        hasInconsistency: (activeEntryInStorage || isLocalTracking) && !isTracking
      });
      
      // 檢查數據不一致情況：localStorage 顯示正在計時，但應用狀態顯示未計時
      if ((activeEntryInStorage || isLocalTracking) && !isTracking) {
        console.log('檢測到狀態不一致，等待 500ms 後再次檢查...');
        
        // 等待一小段時間，讓狀態有機會同步
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 重新檢查狀態
        const activeEntryInStorageAfterDelay = localStorage.getItem('timetracker_active_entry');
        const isLocalTrackingAfterDelay = localStorage.getItem('timetracker_is_tracking') === 'true';
        
        console.log('延遲後的狀態檢查:', {
          activeEntryInStorageAfterDelay: !!activeEntryInStorageAfterDelay,
          isLocalTrackingAfterDelay,
          isTracking
        });
        
        // 如果延遲後仍有狀態不一致，才提示用戶
        if ((activeEntryInStorageAfterDelay || isLocalTrackingAfterDelay) && !isTracking) {
          console.log('延遲後仍檢測到狀態不一致');
          
          // 提示用戶狀態不一致，並詢問如何處理
          if (window.confirm('系統檢測到可能有未正確結束的計時，要清除本地計時狀態並開始新的計時嗎？')) {
            // 清除本地儲存中的所有計時狀態
            localStorage.removeItem('timetracker_active_entry');
            localStorage.removeItem('timetracker_is_tracking');
            localStorage.removeItem('timetracker_paused_entry');
            localStorage.removeItem('timetracker_resumed');
            console.log('已清除本地計時狀態，準備開始新計時');
            
            // 直接開始新計時
            const result = await onStartTracking();
            console.log('開始計時結果:', result);
            return;
          } else {
            return; // 用戶取消，不執行任何操作
          }
        } else {
          console.log('延遲後狀態已同步，繼續正常流程');
        }
      }
      
      // 正常情況：應用顯示正在計時，檢查是否需要停止當前計時
      if (isTracking) {
        // 詢問用戶是否要停止當前計時並開始新的計時
        if (window.confirm('已有正在進行的計時，是否要停止當前計時並開始新的計時？')) {
          // 使用輔助函數停止當前計時並開始新的
          onStopAndStartTracking(selectedProject.id);
          return;
        } else {
          return; // 用戶取消，不執行任何操作
        }
      }
      
      // 直接開始新計時
      const result = await onStartTracking();
      console.log('開始計時結果:', result);
      
      // 記錄到本地儲存，標記正在計時狀態
      if (result && result.success) {
        localStorage.setItem('timetracker_is_tracking', 'true');
      }
      
      // 檢查是否返回特定錯誤：已有進行中的計時
      if (result && !result.success && 
          (result.message?.includes('已有正在進行的計時') || 
           result.message?.includes('已有進行中的計時'))) {
        
        // 嘗試自動修復狀態不一致問題
        console.log('後端報告已有進行中的計時，但前端狀態不一致，嘗試修復');
        
        // 詢問用戶是否要停止當前計時並開始新的計時
        if (window.confirm('伺服器報告已有正在進行的計時，是否要嘗試停止它並開始新的計時？')) {
          // 使用輔助函數停止當前計時並開始新的
          onStopAndStartTracking(selectedProject.id);
        }
      }
    } catch (error) {
      console.error('開始計時操作失敗:', error);
    }
  };

  const handleStopTracking = () => {
    if (window.confirm('確定要停止計時並保存記錄嗎？')) {
      console.log('用戶確認停止計時');
      
      // 停止計時，並獲取回傳的新紀錄
      onStopTracking().then(result => {
        if (result && result.success && result.data) {
          console.log('停止計時成功，新紀錄:', result.data);
          // 如果這裡需要做特別處理，例如直接更新 UI 等
        }
      }).catch(err => {
        console.error('停止計時錯誤:', err);
      });
    }
  };

  // 監控時間條目的變化
  useEffect(() => {
    console.log('TimeTracker 收到更新的時間條目:', timeEntries.length);
    // 確保頂部顯示最近的記錄
    if (timeEntries.length > 0) {
      console.log('最新時間條目:', timeEntries[0]);
    } else {
      // 如果 timeEntries 為空，檢查 localStorage 是否有數據
      try {
        const entriesJson = localStorage.getItem('timetracker-time-entries');
        if (entriesJson) {
          const localEntries = JSON.parse(entriesJson);
          if (localEntries.length > 0) {
            console.log('timeEntries 為空但 localStorage 有記錄:', localEntries.length);
            
            // 使用新的 onReloadTimeEntries 函數而不是 onStopTracking
            if (typeof onReloadTimeEntries === 'function') {
              console.log('嘗試重新載入時間記錄');
              setTimeout(() => {
                onReloadTimeEntries();
              }, 100);
            }
          }
        }
      } catch (err) {
        console.error('檢查 localStorage 時出錯:', err);
      }
    }
  }, [timeEntries, onReloadTimeEntries]);
  
  // 監聽 timeentry_updated 事件和 localStorage 變化
  useEffect(() => {
    // 追蹤最後一次更新時間，避免過頻繁更新
    let lastUpdateTime = 0;
    
    // 處理自定義事件 - 當新增時間記錄時觸發
    const handleTimeEntryUpdated = () => {
      // 防抖處理 - 避免短時間內多次觸發
      const now = Date.now();
      if (now - lastUpdateTime < 1000) { // 1秒內不重複觸發
        console.log('忽略過頻繁的更新請求');
        return;
      }
      
      lastUpdateTime = now;
      console.log('TimeTracker 監聽到 timeentry_updated 事件');
      
      try {
        // 從 localStorage 讀取最新記錄
        const entriesJson = localStorage.getItem('timetracker-time-entries');
        if (entriesJson) {
          const localEntries = JSON.parse(entriesJson);
          console.log('從 localStorage 讀取到最新時間記錄:', localEntries.length);
          
          // 深度比較，檢查記錄是否有變化
          const currentEntriesJson = JSON.stringify(timeEntries);
          const localEntriesJson = JSON.stringify(localEntries);
          
          if (localEntriesJson !== currentEntriesJson) {
            console.log('檢測到時間記錄有變化，使用 onReloadTimeEntries 重新載入');
            // 使用新的 onReloadTimeEntries 函數而不是 onStopTracking
            if (typeof onReloadTimeEntries === 'function') {
              setTimeout(() => {
                onReloadTimeEntries();
              }, 50);
            }
          } else {
            console.log('時間記錄沒有變化，無需更新');
          }
        }
      } catch (error) {
        console.error('處理時間記錄更新事件出錯:', error);
      }
    };

    // 註冊事件監聽器
    window.addEventListener('timeentry_updated', handleTimeEntryUpdated);
    window.addEventListener('storage', (e) => {
      if (e.key === 'timetracker-time-entries') {
        console.log('偵測到 localStorage 中的時間記錄變更');
        handleTimeEntryUpdated();
      }
    });

    return () => {
      // 移除事件監聽器
      window.removeEventListener('timeentry_updated', handleTimeEntryUpdated);
      window.removeEventListener('storage', (e) => {
        if (e.key === 'timetracker-time-entries') {
          handleTimeEntryUpdated();
        }
      });
    };
  }, [timeEntries, onReloadTimeEntries]);

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
                console.log('選擇專案:', e.target.value);
                // 檢查專案 ID 格式並靈活比較
                const selectedId = e.target.value;
                const project = projects.find(p => 
                  String(p.id) === String(selectedId)
                );
                console.log('找到專案:', project);
                if (project) {
                  onProjectChange(project);
                }
              }}
              className="form-select"
            >
              <option value="">請選擇專案...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.client?.name || project.client?.company || 'Unknown Client'} ({formatCurrency(project.rate || project.hourlyRate || 0)}/小時)
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
                {localStorage.getItem('timetracker_paused_entry') ? '繼續計時' : '開始計時'}
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

      {/* 優化的統計卡片 */}
      <div className="tracker-stats-grid">
        {/* 今日統計 - 合併時間和收入 */}
        <div className="tracker-stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">今日進度</div>
            <Clock size={16} style={{ color: '#3b82f6' }} />
          </div>
          {todayHours > 0 ? (
            <>
              <div className="stat-value">{formatCurrency(todayTotal)}</div>
              <div className="stat-description">
                {formatTime(todayHours)} · {todayProgress.toFixed(0)}% 完成
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e2e8f0',
                borderRadius: '2px',
                marginTop: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${todayProgress}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-value text-gray-400">--</div>
              <div className="stat-description">還未開始今日工作</div>
            </>
          )}
        </div>

        {/* 本週統計 */}
        <div className="tracker-stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">本週概覽</div>
            <TrendingUp size={16} style={{ color: '#10b981' }} />
          </div>
          {weekHours > 0 ? (
            <>
              <div className="stat-value">{formatCurrency(weekTotal)}</div>
              <div className="stat-description">
                {formatTime(weekHours)} · {weekEntries.length} 個工作階段
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--gray-200)',
                borderRadius: '2px',
                marginTop: 'var(--space-2)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${weekProgress}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-value text-gray-400">--</div>
              <div className="stat-description">本週尚未記錄</div>
            </>
          )}
        </div>

        {/* 本月統計 */}
        <div className="tracker-stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">本月表現</div>
            <Target size={16} style={{ color: '#06b6d4' }} />
          </div>
          {monthHours > 0 ? (
            <>
              <div className="stat-value">{formatCurrency(monthTotal)}</div>
              <div className="stat-description">
                {formatTime(monthHours)} · {monthProgress.toFixed(0)}% 月目標
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e2e8f0',
                borderRadius: '2px',
                marginTop: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${monthProgress}%`,
                  height: '100%',
                  backgroundColor: '#06b6d4',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-value text-gray-400">--</div>
              <div className="stat-description">本月首次工作</div>
            </>
          )}
        </div>

        {/* 效率指標 */}
        <div className="tracker-stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">效率指標</div>
            <DollarSign size={16} style={{ color: '#f59e0b' }} />
          </div>
          {realAverageRate > 0 ? (
            <>
              <div className="stat-value">{formatCurrency(realAverageRate)}</div>
              <div className="stat-description">
                實際平均時薪 · {timeEntries.length} 筆記錄
              </div>
            </>
          ) : selectedProject ? (
            <>
              <div className="stat-value">{formatCurrency(selectedProject.rate || selectedProject.hourlyRate)}</div>
              <div className="stat-description">
                {selectedProject.name} 設定時薪
              </div>
            </>
          ) : (
            <>
              <div className="stat-value text-gray-400">--</div>
              <div className="stat-description">選擇專案查看時薪</div>
            </>
          )}
        </div>
      </div>

      {/* 最近記錄 */}
      {timeEntries.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title" style={{ fontSize: '1.125rem' }}>最近記錄</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    console.log('手動刷新時間記錄');
                    
                    // 顯示加載指示器
                    const showLoadingToast = () => {
                      if (document.getElementById('refresh-toast')) {
                        document.getElementById('refresh-toast').remove();
                      }
                      
                      const toast = document.createElement('div');
                      toast.id = 'refresh-toast';
                      toast.style.position = 'fixed';
                      toast.style.bottom = '20px';
                      toast.style.right = '20px';
                      toast.style.backgroundColor = '#3b82f6';
                      toast.style.color = 'white';
                      toast.style.padding = '10px 15px';
                      toast.style.borderRadius = '4px';
                      toast.style.zIndex = '9999';
                      toast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      toast.innerHTML = '正在刷新數據...';
                      
                      document.body.appendChild(toast);
                      return toast;
                    };
                    
                    const updateToastSuccess = (toast) => {
                      toast.style.backgroundColor = '#10b981';
                      toast.innerHTML = '記錄已刷新';
                      
                      setTimeout(() => {
                        if (document.getElementById('refresh-toast')) {
                          document.getElementById('refresh-toast').remove();
                        }
                      }, 3000);
                    };
                    
                    const updateToastError = (toast) => {
                      toast.style.backgroundColor = '#ef4444';
                      toast.innerHTML = '刷新失敗，請重試';
                      
                      setTimeout(() => {
                        if (document.getElementById('refresh-toast')) {
                          document.getElementById('refresh-toast').remove();
                        }
                      }, 3000);
                    };
                    
                    const toast = showLoadingToast();
                    
                    try {
                      // 使用兩種方式刷新記錄
                      
                      // 1. 從 localStorage 獲取最新記錄
                      let localEntries = [];
                      try {
                        // 清除可能的緩存
                        localStorage.removeItem('__temp_clear_cache');
                        localStorage.setItem('__temp_clear_cache', Date.now().toString());
                        localStorage.removeItem('__temp_clear_cache');
                        
                        const entriesJson = localStorage.getItem('timetracker-time-entries');
                        if (entriesJson) {
                          localEntries = JSON.parse(entriesJson);
                          console.log('本地存儲中的記錄數量:', localEntries.length);
                          
                          if (localEntries.length > 0 && 
                              JSON.stringify(localEntries) !== JSON.stringify(timeEntries)) {
                            console.log('從 localStorage 發現新記錄，正在更新');
                            // 透過父組件的 onStopTracking 函數更新記錄
                            if (typeof onStopTracking === 'function') {
                              await onStopTracking();
                            }
                          }
                        }
                      } catch (err) {
                        console.error('讀取本地記錄失敗:', err);
                      }
                      
                      // 2. 如果還是無法獲取最新記錄，嘗試重新加載頁面
                      if (timeEntries.length === 0 && localEntries.length > 0) {
                        console.log('顯示記錄為空但本地有記錄，準備重新加載');
                        
                        // 使用特殊標記防止循環重載
                        const reloadCount = parseInt(sessionStorage.getItem('timetracker_reload_count') || '0');
                        if (reloadCount < 2) {  // 最多重載 2 次
                          sessionStorage.setItem('timetracker_reload_count', (reloadCount + 1).toString());
                          
                          toast.innerHTML = '正在重新載入頁面...';
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                          return;
                        } else {
                          // 超過重載次數限制，顯示錯誤
                          console.error('達到重載次數限制，仍無法獲取最新記錄');
                        }
                      }
                      
                      // 成功刷新
                      updateToastSuccess(toast);
                    } catch (error) {
                      console.error('刷新記錄失敗:', error);
                      updateToastError(toast);
                    }
                  }}
                  className="btn btn-sm btn-outline-secondary"
                  title="刷新記錄"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="btn btn-sm btn-secondary"
                >
                  查看全部
                </button>
              </div>
            </div>
          </div>
          <div>
            {console.log('顯示最近記錄:', timeEntries)}
            {timeEntries.slice(0, 3).map((entry, index) => (
              <div key={entry.id} style={{
                padding: 'var(--space-4)',
                borderBottom: index < 2 ? '1px solid var(--gray-200)' : 'none'
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                      {entry.project?.name || (typeof entry.project === 'string' ? entry.project : 'Unknown Project')}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      {entry.description || '無描述'} • {
                        entry.date || 
                        (entry.startTime ? new Date(entry.startTime).toLocaleDateString('zh-TW') : '未知日期')
                      }
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
            <div style={{
              padding: 'var(--space-3)',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid var(--gray-200)',
              fontSize: '0.875rem',
              color: 'var(--gray-500)',
              textAlign: 'center'
            }}>
              結束計時後，新記錄將自動出現在這裡
            </div>
          </div>
        </div>
      )}


      
      {/* 同步狀態 */}
      {useAPI && (
        <div className="mt-6 border rounded-lg p-4 flex justify-between items-center bg-white shadow-sm">
          <div className="flex items-center">
            {apiStatus === 'success' ? (
              <Cloud size={16} className="text-green-500 mr-2" />
            ) : (
              <CloudOff size={16} className="text-orange-500 mr-2" />
            )}
            <span className="text-gray-600 text-sm">
              {apiStatus === 'success' 
                ? '資料同步已啟用' 
                : '目前為離線模式'}
            </span>
            
            {syncStatus === SYNC_STATUS.PENDING && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                有待同步的資料
              </span>
            )}
            
            {syncStatus === SYNC_STATUS.SYNCING && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                正在同步資料...
              </span>
            )}
            
            {syncStatus === SYNC_STATUS.ERROR && (
              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                同步失敗
              </span>
            )}
            
            {syncStatus === SYNC_STATUS.CONFLICT && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                發現資料衝突
              </span>
            )}
          </div>
          
          {(syncStatus === SYNC_STATUS.PENDING || syncStatus === SYNC_STATUS.ERROR) && (
            <button
              onClick={triggerSync}
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              立即同步
            </button>
          )}
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
