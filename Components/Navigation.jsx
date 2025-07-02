import React from 'react';
import { Clock, Users, BarChart3, FileText } from 'lucide-react';
import { APP_TITLE, TABS } from '../Constants';

const Navigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    {
      id: TABS.TRACKER,
      label: '時間追蹤',
      icon: Clock,
      mobileOnly: false
    },
    {
      id: TABS.PROJECTS,
      label: '專案管理',
      icon: Users,
      mobileOnly: false
    },
    {
      id: TABS.REPORTS,
      label: '報表分析',
      icon: BarChart3,
      mobileOnly: false
    },
    {
      id: TABS.INVOICE,
      label: '發票',
      icon: FileText,
      mobileOnly: false
    }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo 區域 - 恢復原本簡潔設計 */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          
          {/* 桌面導航 - 恢復原本簡潔樣式 */}
          <div className="hidden lg:flex space-x-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* 手機/平板導航 - 恢復原本樣式 */}
          <div className="flex lg:hidden space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
