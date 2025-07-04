import React, { useState, useEffect } from 'react';

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    hourlyRate: '',
    estimatedHours: '',
    status: 'active'
  });

  // 載入儲存的專案
  useEffect(() => {
    const savedProjects = localStorage.getItem('timetracker-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // 儲存專案到 localStorage
  const saveProjects = (updatedProjects) => {
    localStorage.setItem('timetracker-projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  const handleAddProject = () => {
    if (newProject.name.trim()) {
      const project = {
        id: Date.now(),
        ...newProject,
        hourlyRate: parseFloat(newProject.hourlyRate) || 0,
        estimatedHours: parseFloat(newProject.estimatedHours) || 0,
        totalHours: 0,
        createdAt: new Date().toISOString()
      };
      
      const updatedProjects = [...projects, project];
      saveProjects(updatedProjects);
      
      setNewProject({
        name: '',
        description: '',
        hourlyRate: '',
        estimatedHours: '',
        status: 'active'
      });
      setIsAddingProject(false);
    }
  };

  const handleDeleteProject = (projectId) => {
    if (confirm('確定要刪除這個專案嗎？')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      saveProjects(updatedProjects);
    }
  };

  const handleStatusChange = (projectId, newStatus) => {
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, status: newStatus } : p
    );
    saveProjects(updatedProjects);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { text: '進行中', class: 'status-active' },
      completed: { text: '已完成', class: 'status-completed' },
      paused: { text: '暫停', class: 'status-paused' }
    };
    return statusMap[status] || statusMap.active;
  };

  const calculateProgress = (project) => {
    if (project.estimatedHours === 0) return 0;
    return Math.min((project.totalHours / project.estimatedHours) * 100, 100);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>專案管理</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAddingProject(true)}
        >
          + 新增專案
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">總專案數</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {projects.filter(p => p.status === 'active').length}
          </div>
          <div className="stat-label">進行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {projects.filter(p => p.status === 'completed').length}
          </div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ${projects.reduce((sum, p) => sum + (p.totalHours * p.hourlyRate), 0).toFixed(0)}
          </div>
          <div className="stat-label">總收益</div>
        </div>
      </div>

      {/* 新增專案表單 */}
      {isAddingProject && (
        <div className="form-container">
          <div className="form-header">
            <h3>新增專案</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAddingProject(false)}
            >
              ✕ 關閉
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>專案名稱 *</label>
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
              <label>時薪 (NT$)</label>
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

            <div className="form-group">
              <label>預估時數</label>
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
              <label>專案狀態</label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                className="form-select"
              >
                <option value="active">🟢 進行中</option>
                <option value="paused">🟡 暫停</option>
                <option value="completed">✅ 已完成</option>
              </select>
            </div>

            <div className="form-group form-group-full">
              <label>專案描述</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="詳細描述專案內容、目標和需求..."
                rows="4"
                className="form-textarea"
              />
            </div>

            <div className="form-actions form-group-full">
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
              >
                新增專案
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 專案列表 */}
      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>還沒有專案</h3>
            <p>點擊上方「新增專案」按鈕來建立第一個專案</p>
          </div>
        ) : (
          projects.map(project => {
            const statusInfo = getStatusBadge(project.status);
            const progress = calculateProgress(project);
            const createdDate = new Date(project.createdAt).toLocaleDateString('zh-TW');
            
            return (
              <div key={project.id} className="project-card">
                <div className="project-card-top">
                  <div className={`status-indicator status-${project.status}`}></div>
                  <div className="project-header">
                    <h3 className="project-title">{project.name}</h3>
                    <div className={`status-badge ${statusInfo.class}`}>
                      {statusInfo.text}
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                </div>
                
                <div className="project-card-content">
                  <div className="project-stats">
                    <div className="project-stat">
                      <div className="stat-icon">💰</div>
                      <span className="stat-label">時薪</span>
                      <span className="stat-value">${project.hourlyRate}</span>
                    </div>
                    <div className="project-stat">
                      <div className="stat-icon">⏱️</div>
                      <span className="stat-label">已工作</span>
                      <span className="stat-value">{project.totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="project-stat">
                      <div className="stat-icon">📊</div>
                      <span className="stat-label">預估</span>
                      <span className="stat-value">{project.estimatedHours}h</span>
                    </div>
                    <div className="project-stat">
                      <div className="stat-icon">💵</div>
                      <span className="stat-label">收益</span>
                      <span className="stat-value">${(project.totalHours * project.hourlyRate).toFixed(0)}</span>
                    </div>
                  </div>
                  
                  {project.estimatedHours > 0 && (
                    <div className="progress-container">
                      <div className="progress-label">
                        <span>進度</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill progress-fill-${project.status}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="project-card-footer">
                  <div className="project-date">
                    <span className="date-icon">📅</span>
                    <span>建立於 {createdDate}</span>
                  </div>
                  <div className="project-actions">
                    <select
                      value={project.status}
                      onChange={(e) => handleStatusChange(project.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="active">進行中</option>
                      <option value="paused">暫停</option>
                      <option value="completed">已完成</option>
                    </select>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectManager;
