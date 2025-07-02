import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, DollarSign, Users, Search, Filter } from 'lucide-react';
import { formatCurrency } from '../Utils/helpers';

const ProjectManager = ({
  projects,
  showNewProject,
  setShowNewProject,
  newProject,
  setNewProject,
  formErrors,
  onAddProject,
  onDeleteProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, client, rate, recent
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // 預設顏色選項
  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
    '#EC4899', '#6B7280', '#14B8A6', '#F43F5E'
  ];

  // 過濾和排序專案
  const filteredAndSortedProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'client':
          return a.client.localeCompare(b.client);
        case 'rate':
          return b.rate - a.rate;
        case 'recent':
          return b.id - a.id;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // 表單重置
  const resetForm = () => {
    setNewProject({ name: '', client: '', rate: '', color: colorOptions[0] });
    setEditingProject(null);
    setShowNewProject(false);
  };

  // 開始編輯專案
  const startEditProject = (project) => {
    setNewProject({
      name: project.name,
      client: project.client,
      rate: project.rate.toString(),
      color: project.color
    });
    setEditingProject(project);
    setShowNewProject(true);
  };

  // 處理顏色選擇
  const handleColorSelect = (color) => {
    setNewProject(prev => ({ ...prev, color }));
  };

  // 確認刪除
  const confirmDelete = (projectId) => {
    setShowDeleteConfirm(projectId);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDeleteProject(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-8">
      
      {/* 頁面標題和操作區 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">專案管理</h2>
          <p className="text-gray-600 text-responsive mt-1">
            管理您的專案和客戶資訊 ({projects.length} 個專案)
          </p>
        </div>
        
        <button 
          onClick={() => setShowNewProject(true)}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>新增專案</span>
        </button>
      </div>

      {/* 搜尋和過濾區 */}
      {projects.length > 0 && (
        <div className="card spacing-responsive">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* 搜尋框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋專案或客戶..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            
            {/* 排序選擇 */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input pl-10 pr-8 min-w-[140px]"
              >
                <option value="name">依名稱排序</option>
                <option value="client">依客戶排序</option>
                <option value="rate">依時薪排序</option>
                <option value="recent">依建立時間</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 新增/編輯專案表單 */}
      {showNewProject && (
        <div className="card spacing-responsive animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-bold">
              {editingProject ? '編輯專案' : '新增專案'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6">
            {/* 專案名稱 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                專案名稱 *
              </label>
              <input
                type="text"
                placeholder="例：網站設計專案"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                className={`input w-full ${formErrors.name ? 'input-error' : ''}`}
                autoFocus
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  ⚠️ {formErrors.name}
                </p>
              )}
            </div>

            {/* 客戶名稱 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                客戶名稱 *
              </label>
              <input
                type="text"
                placeholder="例：ABC 公司"
                value={newProject.client}
                onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                className={`input w-full ${formErrors.client ? 'input-error' : ''}`}
              />
              {formErrors.client && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  ⚠️ {formErrors.client}
                </p>
              )}
            </div>

            {/* 時薪 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                時薪 (NT$) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="1500"
                  value={newProject.rate}
                  onChange={(e) => setNewProject({...newProject, rate: e.target.value})}
                  className={`input w-full pl-10 ${formErrors.rate ? 'input-error' : ''}`}
                  min="1"
                  step="50"
                />
              </div>
              {formErrors.rate && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  ⚠️ {formErrors.rate}
                </p>
              )}
            </div>

            {/* 顏色選擇 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                專案顏色
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-3">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 touch-target ${
                      newProject.color === color 
                        ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' 
                        : 'hover:scale-110 hover:shadow-lg'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`選擇顏色 ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 表單按鈕 */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-8">
            <button 
              onClick={onAddProject}
              className="btn btn-primary w-full sm:flex-1"
            >
              {editingProject ? '更新專案' : '建立專案'}
            </button>
            <button 
              onClick={resetForm}
              className="btn btn-secondary w-full sm:w-auto"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 專案列表 */}
      {projects.length === 0 ? (
        /* 空狀態 */
        <div className="card spacing-responsive text-center py-12">
          <div className="mb-6">
            <Users className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
              還沒有專案
            </h3>
            <p className="text-gray-600 text-responsive mb-6 max-w-md mx-auto">
              建立您的第一個專案來開始追蹤時間和管理客戶
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="btn btn-primary btn-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              建立第一個專案
            </button>
          </div>
        </div>
      ) : (
        /* 專案卡片網格 */
        <div className="grid gap-4 sm:gap-6">
          {filteredAndSortedProjects.map(project => (
            <div 
              key={project.id} 
              className="card spacing-responsive hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* 專案顏色條 */}
              <div 
                className="absolute top-0 left-0 w-full h-1 sm:h-2"
                style={{ backgroundColor: project.color }}
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                {/* 專案資訊 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between sm:justify-start sm:space-x-4">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                        {project.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-gray-600 text-responsive mb-2">
                        <Users className="w-4 h-4" />
                        <span>{project.client}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-600 text-responsive">
                          {formatCurrency(project.rate)}/小時
                        </span>
                      </div>
                    </div>
                    
                    {/* 專案顏色圓點 */}
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-md flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                  </div>
                </div>
                
                {/* 操作按鈕 */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={() => startEditProject(project)}
                    className="btn btn-sm bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200"
                    title="編輯專案"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">編輯</span>
                  </button>
                  
                  <button
                    onClick={() => confirmDelete(project.id)}
                    className="btn btn-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                    title="刪除專案"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">刪除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 搜尋無結果 */}
      {projects.length > 0 && filteredAndSortedProjects.length === 0 && (
        <div className="card spacing-responsive text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">找不到專案</h3>
          <p className="text-gray-600 text-responsive">
            請試試其他搜尋關鍵字或清除搜尋條件
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="btn btn-secondary mt-4"
          >
            清除搜尋
          </button>
        </div>
      )}

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">確認刪除</h3>
                  <p className="text-gray-600 text-sm">此操作無法復原</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                確定要刪除這個專案嗎？所有相關的時間記錄將會保留，但無法再為此專案計時。
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  className="btn btn-danger flex-1"
                >
                  確認刪除
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 移動端提示 */}
      <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="text-sm text-blue-700">
          💡 <strong>小提示:</strong> 滑動查看所有專案，點擊編輯按鈕修改專案資訊
        </div>
      </div>
    </div>
  );
};

export default ProjectManager;
