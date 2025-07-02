import React, { useState } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Users, DollarSign, Calendar, Palette } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState('name');
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // 顏色選項
  const colorOptions = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
    '#EF4444', '#06B6D4', '#84CC16', '#F97316',
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
    <div className="space-y-6 animate-fade-in">
      
      {/* 頁面標題和操作區 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            專案管理
          </h2>
          <p className="text-gray-600 mt-1">
            管理您的專案和客戶資訊 ({projects.length} 個專案)
          </p>
        </div>
        
        <button 
          onClick={() => setShowNewProject(true)}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          <span>新增專案</span>
        </button>
      </div>

      {/* 搜尋和過濾區 */}
      {projects.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* 搜尋框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋專案或客戶..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            
            {/* 排序選擇 */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 appearance-none min-w-[160px]"
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-2xl animate-scale-in">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左側表單 */}
              <div className="space-y-6">
                {/* 專案名稱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    專案名稱 *
                  </label>
                  <input
                    type="text"
                    placeholder="輸入專案名稱..."
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm focus:ring-2 transition-all duration-200 ${
                      formErrors.name 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* 客戶名稱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    客戶名稱 *
                  </label>
                  <input
                    type="text"
                    placeholder="輸入客戶名稱..."
                    value={newProject.client}
                    onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm focus:ring-2 transition-all duration-200 ${
                      formErrors.client 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {formErrors.client && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.client}</p>
                  )}
                </div>

                {/* 時薪 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    時薪 (NT$) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="800"
                      value={newProject.rate}
                      onChange={(e) => setNewProject({...newProject, rate: e.target.value})}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm focus:ring-2 transition-all duration-200 ${
                        formErrors.rate 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                  </div>
                  {formErrors.rate && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.rate}</p>
                  )}
                </div>
              </div>

              {/* 右側顏色選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  <Palette className="w-4 h-4 inline mr-2" />
                  專案顏色
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                        newProject.color === color 
                          ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' 
                          : 'hover:scale-110 hover:shadow-lg'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`選擇顏色 ${color}`}
                    />
                  ))}
                </div>
                
                {/* 顏色預覽 */}
                <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-white/50">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: newProject.color }}
                    />
                    <span className="text-sm text-gray-600">
                      專案標識顏色預覽
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 表單按鈕 */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
              <button 
                onClick={onAddProject}
                className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {editingProject ? '更新專案' : '建立專案'}
              </button>
              <button 
                onClick={resetForm}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 專案列表 */}
      {projects.length === 0 ? (
        /* 空狀態 */
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/50 shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            還沒有專案
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            建立您的第一個專案來開始追蹤時間和管理客戶
          </p>
          <button
            onClick={() => setShowNewProject(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            建立第一個專案
          </button>
        </div>
      ) : (
        /* 專案卡片網格 */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map(project => (
            <div 
              key={project.id} 
              className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              {/* 專案顏色條 */}
              <div 
                className="h-2"
                style={{ backgroundColor: project.color }}
              />
              
              <div className="p-6">
                {/* 專案資訊 */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Users className="w-4 h-4" />
                    <span>{project.client}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">{formatCurrency(project.rate)}/小時</span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEditProject(project)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm font-medium"
                    title="編輯專案"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    <span>編輯</span>
                  </button>
                  
                  <button
                    onClick={() => confirmDelete(project.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
                    title="刪除專案"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    <span>刪除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 搜尋無結果 */}
      {projects.length > 0 && filteredAndSortedProjects.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/50 shadow-lg">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            找不到符合的專案
          </h3>
          <p className="text-gray-600 mb-6">
            試試不同的搜尋關鍵字或調整篩選條件
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            清除搜尋
          </button>
        </div>
      )}

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-gray-900 mb-4">確認刪除</h3>
            <p className="text-gray-600 mb-6">
              確定要刪除這個專案嗎？此動作無法復原。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                確認刪除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 小提示 */}
      <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 text-center">
        <div className="text-sm text-blue-700">
          💡 <strong>小提示：</strong> 使用不同顏色來區分不同類型的專案或客戶
        </div>
      </div>
    </div>
  );
};

export default ProjectManager;
