import React, { useState, useEffect } from 'react';
import { Clock, Users, BarChart3, FileText, Menu, X, Zap } from 'lucide-react';
import { APP_TITLE, TABS } from '../Constants';

const Navigation = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // 監聽滾動以調整導航樣式
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 導航項目配置
  const navItems = [
    {
      id: TABS.TRACKER,
      label: '時間追蹤',
      shortLabel: '計時',
      icon: Clock,
      description: '開始追蹤您的工作時間',
      primary: true,
      color: 'blue'
    },
    {
      id: TABS.PROJECTS,
      label: '專案管理',
      shortLabel: '專案',
      icon: Users,
      description: '管理您的專案和客戶',
      color: 'purple'
    },
    {
      id: TABS.REPORTS,
      label: '報表分析',
      shortLabel: '報表',
      icon: BarChart3,
      description: '查看收入和工作統計',
      color: 'emerald'
    },
    {
      id: TABS.INVOICE,
      label: '發票生成',
      shortLabel: '發票',
      icon: FileText,
      description: '生成專業發票',
      color: 'amber'
    }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    
    // 觸覺反饋 (如果裝置支援)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 獲取顏色類名
  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive 
        ? 'bg-blue-50 text-blue-700 border-blue-200' 
        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
      purple: isActive 
        ? 'bg-purple-50 text-purple-700 border-purple-200' 
        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50',
      emerald: isActive 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50',
      amber: isActive 
        ? 'bg-amber-50 text-amber-700 border-amber-200' 
        : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      {/* 主導航 */}
      <nav 
        className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md border-b ${
          isScrolled 
            ? 'bg-white/90 shadow-lg border-gray-200/50' 
            : 'bg-white/80 shadow-sm border-gray-100/50'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 sm:h-18 px-3 sm:px-4 lg:px-6 xl:px-8">
            
            {/* Logo 區域 */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                {/* 脈衝效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl animate-pulse opacity-75"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {APP_TITLE}
                </h1>
                <p className="text-xs text-gray-500 font-medium">智能時間追蹤工具</p>
              </div>
            </div>
            
            {/* 桌面導航 */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`group relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isActive 
                        ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg focus:ring-${item.color}-500` 
                        : `${getColorClasses(item.color, false)} focus:ring-${item.color}-500`
                    }`}
                    title={item.description}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-5 h-5 transition-all duration-200 ${
                        isActive ? 'text-white' : 'group-hover:scale-110'
                      }`} />
                      <span>{item.label}</span>
                    </div>
                    
                    {/* 活動指示器 */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-bounce-soft" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 平板導航 */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex flex-col items-center p-3 rounded-xl text-xs font-medium transition-all duration-200 min-w-[80px] ${
                      isActive 
                        ? `bg-${item.color}-600 text-white shadow-md` 
                        : getColorClasses(item.color, false)
                    }`}
                    title={item.description}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* 手機菜單按鈕 */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              aria-label="開啟選單"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 手機下拉選單 */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-xl animate-slide-down z-40">
            <div className="px-4 py-3 space-y-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      isActive 
                        ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg` 
                        : getColorClasses(item.color, false)
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${
                        isActive ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* 底部導航 (手機專用) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200/50 pb-safe z-50">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-200 min-h-[60px] ${
                  isActive 
                    ? `text-${item.color}-600 bg-${item.color}-50 scale-105` 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title={item.description}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 mb-1 transition-all duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`} />
                  {isActive && (
                    <div className={`absolute -top-1 -right-1 w-2 h-2 bg-${item.color}-500 rounded-full animate-pulse`} />
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  ); 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
                aria-label={item.label}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-active:scale-95'
                  }`} />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                <span className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 遮罩層 (當手機選單開啟時) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navigation;
