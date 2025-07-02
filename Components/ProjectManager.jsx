import React from 'react';
import { Plus } from 'lucide-react';
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
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 頁面標題和新增按鈕 - 恢復原本簡潔設計 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold">專案管理</h2>
        <button 
          onClick={() => setShowNewProject(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新增專案</span>
        </button>
      </div>

      {/* 新增專案表單 - 恢復原本簡潔設計 */}
      {showNewProject && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold mb-4">新增專案</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <input
                type="text"
                placeholder="專案名稱"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                className={`px-3 py-2 sm:px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-full ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="客戶名稱"
                value={newProject.client}
                onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                className={`px-3 py-2 sm:px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-full ${
                  formErrors.client ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.client && (
                <p className="text-red-500 text-xs mt-1">{formErrors.client}</p>
              )}
            </div>

            <div>
              <input
                type="number"
                placeholder="時薪 (NT$)"
                value={newProject.rate}
                onChange={(e) => setNewProject({...newProject, rate: e.target.value})}
                className={`px-3 py-2 sm:px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-full ${
                  formErrors.rate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.rate && (
                <p className="text-red-500 text-xs mt-1">{formErrors.rate}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
            <button 
              onClick={onAddProject}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
            >
              儲存
            </button>
            <button 
              onClick={() => setShowNewProject(false)}
              className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm sm:text-base"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 專案列表 - 恢復原本簡潔設計 */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Plus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-bold mb-2">還沒有專案</h3>
          <p className="text-gray-600 mb-4">建立您的第一個專案來開始追蹤時間</p>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            建立專案
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold">{project.name}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{project.client}</p>
                  <p className="text-sm sm:text-base text-blue-600 font-semibold">
                    {formatCurrency(project.rate)}/小時
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{backgroundColor: project.color}}
                  ></div>
                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
