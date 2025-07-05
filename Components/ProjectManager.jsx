import React, { useState, useEffect, useCallback } from 'react';
import { useProjectAPI } from '../Hooks/useAPI';
import { useAPIStatus } from '../contexts/APIContext';
import { apiClient } from '../Utils/ApiClient';
import { offlineSync } from '../Utils/OfflineSync';
import Toast from './Toast';
import { API_CONFIG } from '../config/api';

const ProjectManager = () => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    hourlyRate: '',
    estimatedHours: '',
    status: 'active'
  });
  const [showToast, setShowToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 自己管理 projects 狀態
  const [projects, setProjects] = useState([]);
  
  // 使用 API Hooks
  const { loading, error, fetchProjects, createProject, updateProject, deleteProject } = useProjectAPI();
  const { useAPI, apiStatus } = useAPIStatus();
  
  // 計算專案總時數和收益
  const calculateProjectTotals = useCallback(async () => {
    console.log('正在計算專案總時數和收益...');
    try {
      const timeEntriesJson = localStorage.getItem('timetracker-time-entries');
      if (!timeEntriesJson) {
        console.log('沒有時間記錄，跳過計算');
        return;
      }
      
      const timeEntries = JSON.parse(timeEntriesJson);
      const projectTotals = {};
      
      timeEntries.forEach(entry => {
        const projectId = entry.projectId || (entry.project && entry.project.id);
        if (!projectId) return;
        
        if (!projectTotals[projectId]) {
          projectTotals[projectId] = { totalHours: 0, totalEarnings: 0 };
        }
        
        const hours = entry.duration ? entry.duration / 3600 : 0;
        projectTotals[projectId].totalHours += hours;
        projectTotals[projectId].totalEarnings += entry.amount || 0;
      });
      
      const savedProjects = localStorage.getItem('timetracker-projects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        const updatedProjects = parsedProjects.map(project => {
          const totals = projectTotals[project.id];
          return {
            ...project,
            totalHours: totals ? totals.totalHours : (project.totalHours || 0),
            totalEarnings: totals ? totals.totalEarnings : (project.totalEarnings || 0)
          };
        });
        
        setProjects(updatedProjects);
      }
    } catch (err) {
      console.error('計算專案總時數和收益失敗:', err);
    }
  }, []);
  
  // 載入儲存的專案
  useEffect(() => {
    const savedProjects = localStorage.getItem('timetracker-projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      setProjects(parsedProjects);
    }
    
    if (useAPI) {
      fetchProjects().then((apiProjects) => {
        if (apiProjects && apiProjects.length > 0) {
          setProjects(apiProjects);
          localStorage.setItem('timetracker-projects', JSON.stringify(apiProjects));
        }
      }).catch(err => {
        console.error('從 API 載入專案失敗:', err);
      });
    }
  }, [useAPI, fetchProjects]);
  
  // 監聽時間記錄的更新
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'timetracker-time-entries') {
        setTimeout(() => {
          calculateProjectTotals();
        }, 100);
      }
    };
    
    const handleTimeEntryUpdated = () => {
      setTimeout(() => {
        calculateProjectTotals();
      }, 100);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('timeentry_updated', handleTimeEntryUpdated);
    
    const initialCalculation = setTimeout(() => {
      calculateProjectTotals();
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('timeentry_updated', handleTimeEntryUpdated);
      clearTimeout(initialCalculation);
    };
  }, [calculateProjectTotals]);

  // 新增專案
  const handleAddProject = async () => {
    if (!newProject.name.trim()) {
      setShowToast({
        type: 'error',
        message: '專案名稱不能為空'
      });
      return;
    }

    const projectData = {
      name: newProject.name.trim(),
      description: newProject.description ? newProject.description.trim() : '',
      hourlyRate: parseFloat(newProject.hourlyRate) || 0,
      status: (newProject.status || 'active').toUpperCase(),
      estimatedHours: parseFloat(newProject.estimatedHours) || 0
    };

    try {
      setIsSyncing(true);
      let savedProject;
      
      if (useAPI) {
        savedProject = await createProject(projectData);
      } else {
        savedProject = {
          id: Date.now().toString(),
          ...projectData,
          createdAt: new Date().toISOString(),
          totalHours: 0,
          totalEarnings: 0
        };
      }
      
      const updatedProjects = [...projects, savedProject];
      setProjects(updatedProjects);
      localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
      
      setNewProject({
        name: '',
        description: '',
        hourlyRate: '',
        estimatedHours: '',
        status: 'active'
      });
      setIsAddingProject(false);
      
      setShowToast({
        type: 'success',
        message: '專案新增成功'
      });
      
    } catch (error) {
      console.error('新增專案失敗:', error);
      setShowToast({
        type: 'error',
        message: '新增專案失敗'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 刪除專案
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('確定要刪除這個專案嗎？這個操作無法復原。')) {
      return;
    }

    try {
      setIsSyncing(true);
      
      if (useAPI) {
        await deleteProject(projectId);
      }
      
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
      
      setShowToast({
        type: 'success',
        message: '專案刪除成功'
      });
      
    } catch (error) {
      console.error('刪除專案失敗:', error);
      setShowToast({
        type: 'error',
        message: '刪除專案失敗'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 更新專案狀態
  const handleStatusChange = async (projectId, newStatus) => {
    try {
      setIsSyncing(true);
      
      if (useAPI) {
        await updateProject(projectId, { status: newStatus.toUpperCase() });
      }
      
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, status: newStatus } : p
      );
      setProjects(updatedProjects);
      localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
      
      setShowToast({
        type: 'success',
        message: '專案狀態更新成功'
      });
      
    } catch (error) {
      console.error('更新專案狀態失敗:', error);
      setShowToast({
        type: 'error',
        message: '更新專案狀態失敗'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 計算進度
  const calculateProgress = (project) => {
    if (!project.estimatedHours || project.estimatedHours === 0) return 0;
    return Math.min((project.totalHours || 0) / project.estimatedHours * 100, 100);
  };

  // 獲取狀態徽章
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { text: '進行中', class: 'active' },
      paused: { text: '暫停', class: 'paused' },
      completed: { text: '已完成', class: 'completed' },
      cancelled: { text: '已取消', class: 'cancelled' }
    };
    return statusMap[status] || statusMap.active;
  };

  return (
    <div className="project-manager">
      <div className="project-manager-header">
        <div>
          <h1 className="project-manager-title">專案管理</h1>
          <p className="project-manager-subtitle">管理您的專案並追蹤時間</p>
        </div>
        
        <div className="header-actions">
          <div className={`sync-status ${isSyncing ? 'syncing' : useAPI ? 'synced' : 'offline'}`}>
            <div className="sync-status-icon">
              {isSyncing ? '🔄' : useAPI ? '✅' : '📴'}
            </div>
            <span>
              {isSyncing ? '同步中...' : useAPI ? '已同步' : '離線模式'}
            </span>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddingProject(true)}
            disabled={loading}
          >
            <span style={{ marginRight: '8px' }}>✨</span>
            新增專案
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">總專案數</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-value">
            {projects.filter(p => p.status === 'active').length}
          </div>
          <div className="stat-label">進行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">
            {projects.filter(p => p.status === 'completed').length}
          </div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">
            ${projects.reduce((sum, p) => sum + ((p.totalHours || 0) * (p.hourlyRate || 0)), 0).toFixed(0)}
          </div>
          <div className="stat-label">總收益</div>
        </div>
      </div>

      {/* 新增專案表單 */}
      {isAddingProject && (
        <div className="add-project-form">
          <div className="form-header">
            <h3>新增專案</h3>
            <button 
              className="btn btn-secondary"
              onClick={() => setIsAddingProject(false)}
            >
              ✕ 關閉
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">專案名稱 *</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                placeholder="輸入專案名稱"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">時薪 (NT$)</label>
              <input
                type="number"
                value={newProject.hourlyRate}
                onChange={(e) => setNewProject({...newProject, hourlyRate: e.target.value})}
                placeholder="800"
                className="form-input"
                min="0"
                step="50"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">預估時數</label>
              <input
                type="number"
                value={newProject.estimatedHours}
                onChange={(e) => setNewProject({...newProject, estimatedHours: e.target.value})}
                placeholder="40"
                className="form-input"
                min="0"
                step="0.5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">專案狀態</label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                className="form-select"
              >
                <option value="active">🟢 進行中</option>
                <option value="paused">🟡 暫停</option>
                <option value="completed">✅ 已完成</option>
                <option value="cancelled">❌ 已取消</option>
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label className="form-label">專案描述</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              placeholder="詳細描述專案內容、目標和需求..."
              className="form-textarea"
            />
          </div>

          <div className="form-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setIsAddingProject(false)}
              type="button"
            >
              取消
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={handleAddProject}
              type="button"
              disabled={isSyncing}
            >
              新增專案
            </button>
          </div>
        </div>
      )}

      {/* 專案列表 */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3 className="empty-state-title">還沒有專案</h3>
          <p className="empty-state-description">點擊上方「新增專案」按鈕來建立第一個專案</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const statusInfo = getStatusBadge(project.status);
            const progress = calculateProgress(project);
            
            let createdDate = '未知日期';
            try {
              if (project.createdAt) {
                createdDate = new Date(project.createdAt).toLocaleDateString('zh-TW');
              }
            } catch (err) {
              console.error('日期格式錯誤:', err);
            }
            
            return (
              <div key={project.id} className="project-card">
                <div className={`project-status ${project.status}`}>
                  <div className="project-status-icon"></div>
                  <span>{statusInfo.text}</span>
                </div>
                
                <h3 className="project-title">{project.name}</h3>
                
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                
                <div className="project-stats">
                  <div className="project-stat">
                    <div className="project-stat-value">{(project.totalHours || 0).toFixed(1)}h</div>
                    <div className="project-stat-label">已工作時數</div>
                  </div>
                  <div className="project-stat">
                    <div className="project-stat-value">${project.totalEarnings ? project.totalEarnings.toFixed(0) : ((project.totalHours || 0) * (project.hourlyRate || 0)).toFixed(0)}</div>
                    <div className="project-stat-label">總收益</div>
                  </div>
                </div>
                
                {project.estimatedHours > 0 && (
                  <div className="progress-container">
                    <div className="progress-label">
                      <span>進度</span>
                      <span>{(progress || 0).toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="project-details">
                  <div className="project-detail">
                    <div className="project-detail-label">時薪</div>
                    <div className="project-detail-value">${project.hourlyRate || 0}</div>
                  </div>
                  <div className="project-detail">
                    <div className="project-detail-label">預估時數</div>
                    <div className="project-detail-value">{project.estimatedHours || 0}h</div>
                  </div>
                  <div className="project-detail">
                    <div className="project-detail-label">建立日期</div>
                    <div className="project-detail-value">{createdDate}</div>
                  </div>
                  <div className="project-detail">
                    <div className="project-detail-label">狀態</div>
                    <div className="project-detail-value">
                      <select
                        value={project.status}
                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                        className="form-select"
                      >
                        <option value="active">進行中</option>
                        <option value="paused">暫停</option>
                        <option value="completed">已完成</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="project-actions">
                  <button
                    className="project-action-btn danger"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <span style={{ marginRight: '4px' }}>🗑️</span>
                    刪除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast 訊息 */}
      {showToast && (
        <Toast 
          type={showToast.type} 
          message={showToast.message}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
};

export default ProjectManager;
