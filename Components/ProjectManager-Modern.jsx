import React, { useState } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Users, DollarSign, Calendar, Palette, Briefcase, Star, Clock, TrendingUp } from 'lucide-react';
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

  // 顏色選項 - 更加豐富和現代
  const colorOptions = [
    { color: '#3B82F6', name: '藍色' },
    { color: '#8B5CF6', name: '紫色' },
    { color: '#10B981', name: '綠色' },
    { color: '#F59E0B', name: '橙色' },
    { color: '#EF4444', name: '紅色' },
    { color: '#06B6D4', name: '青色' },
    { color: '#84CC16', name: '萊姆' },
    { color: '#F97316', name: '橘色' },
    { color: '#EC4899', name: '粉色' },
    { color: '#6B7280', name: '灰色' },
    { color: '#14B8A6', name: '藍綠' },
    { color: '#F43F5E', name: '玫紅' }
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
    setNewProject({ name: '', client: '', rate: '', color: colorOptions[0].color });
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
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              專案管理
            </h2>
          </div>
          <p className="text-gray-600 ml-13">
            管理您的專案和客戶資訊 • {projects.length} 個專案
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {projects.length > 0 && (
            <div className="hidden sm:flex items-center space-x-4 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  總價值: {formatCurrency(projects.reduce((sum, p) => sum + p.rate, 0))}
                </span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setShowNewProject(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>新增專案</span>
          </button>
        </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-white/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingProject ? '編輯專案' : '建立新專案'}
                  </h3>
                </div>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="關閉"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左側基本資訊 */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                      基本資訊
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* 專案名稱 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          專案名稱 *
                        </label>
                        <input
                          type="text"
                          placeholder="例：網站重新設計"
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                          className={`w-full px-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm focus:ring-2 transition-all duration-200 text-sm ${
                            formErrors.name 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                        {formErrors.name && (
                          <p className="text-sm text-red-600 mt-1 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                            {formErrors.name}
                          </p>
                        )}
                      </div>

                      {/* 客戶名稱 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          客戶名稱 *
                        </label>
                        <input
                          type="text"
                          placeholder="例：ABC 科技公司"
                          value={newProject.client}
                          onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                          className={`w-full px-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm focus:ring-2 transition-all duration-200 text-sm ${
                            formErrors.client 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                        {formErrors.client && (
                          <p className="text-sm text-red-600 mt-1 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                            {formErrors.client}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 時薪 */}
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        時薪 (NT$) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          placeholder="800"
                          value={newProject.rate}
                          onChange={(e) => setNewProject({...newProject, rate: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm focus:ring-2 transition-all duration-200 text-sm ${
                            formErrors.rate 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                      </div>
                      {formErrors.rate && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                          {formErrors.rate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右側顏色選擇和預覽 */}
                <div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Palette className="w-5 h-5 mr-2 text-purple-600" />
                      視覺設計
                    </h4>
                    
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      專案標識顏色
                    </label>
                    
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {colorOptions.map(option => (
                        <button
                          key={option.color}
                          type="button"
                          onClick={() => handleColorSelect(option.color)}
                          className={`group relative w-full aspect-square rounded-xl transition-all duration-200 ${
                            newProject.color === option.color 
                              ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' 
                              : 'hover:scale-110 hover:shadow-lg'
                          }`}
                          style={{ backgroundColor: option.color }}
                          title={option.name}
                        >
                          {newProject.color === option.color && (
                            <div className="absolute inset-0 rounded-xl bg-white/20 flex items-center justify-center">
                              <Star className="w-4 h-4 text-white fill-current" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* 顏色預覽卡片 */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div 
                          className="w-8 h-8 rounded-lg shadow-sm" 
                          style={{ backgroundColor: newProject.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">預覽效果</div>
                          <div className="text-xs text-gray-500">專案標識顏色</div>
                        </div>
                      </div>
                      
                      {/* 模擬專案卡片預覽 */}
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div 
                          className="h-1 rounded-full mb-2"
                          style={{ backgroundColor: newProject.color }}
                        />
                        <div className="text-xs font-medium text-gray-800">
                          {newProject.name || '專案名稱'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {newProject.client || '客戶名稱'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 表單按鈕 */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={onAddProject}
                  className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:from-blue-700 hover:to-indigo-700"
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map(project => (
            <div 
              key={project.id} 
              className="group relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              {/* 專案顏色裝飾條 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: project.color }}
              />
              
              {/* 背景漸變裝飾 */}
              <div 
                className="absolute top-0 right-0 w-20 h-20 opacity-5 rounded-bl-3xl"
                style={{ backgroundColor: project.color }}
              />
              
              <div className="p-6 relative">
                {/* 專案頭部資訊 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {project.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600 mb-3">
                      <Users className="w-4 h-4" />
                      <span className="text-sm truncate">{project.client}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-lg">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      {formatCurrency(project.rate)}
                    </span>
                  </div>
                </div>

                {/* 專案統計資訊 */}
                <div className="bg-gray-50/80 rounded-xl p-3 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(project.rate)}</div>
                      <div className="text-xs text-gray-500 flex items-center justify-center">
                        <Clock className="w-3 h-3 mr-1" />
                        每小時
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">活躍</div>
                      <div className="text-xs text-gray-500">狀態</div>
                    </div>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEditProject(project)}
                    className="flex-1 flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-600 rounded-lg transition-all duration-200 text-sm font-medium border border-blue-200/50"
                    title="編輯專案"
                  >
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    <span>編輯</span>
                  </button>
                  
                  <button
                    onClick={() => confirmDelete(project.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-600 rounded-lg transition-all duration-200 text-sm font-medium border border-red-200/50"
                    title="刪除專案"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    <span>刪除</span>
                  </button>
                </div>
              </div>
              
              {/* Hover 效果裝飾 */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
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
