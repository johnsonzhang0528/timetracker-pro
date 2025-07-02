import React, { useState, useEffect } from 'react';
import { Clock, Users, BarChart3, FileText, Menu, X } from 'lucide-react';
import { APP_TITLE, TABS } from '../Constants';

const Navigation = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 監聽螢幕尺寸變化
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      // 當螢幕變大時，關閉手機選單
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    // 初始檢查
    checkScreenSize();
    
    // 監聽尺寸變化
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

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
      primary: true
    },
    {
      id: TABS.PROJECTS,
      label: '專案管理',
      shortLabel: '專案',
      icon: Users,
      description: '管理您的專案和客戶'
    },
    {
      id: TABS.REPORTS,
      label: '報表分析',
      shortLabel: '報表',
      icon: BarChart3,
      description: '查看收入和工作統計'
    },
    {
      id: TABS.INVOICE,
      label: '發票生成',
      shortLabel: '發票',
      icon: FileText,
      description: '生成專業發票'
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

  return (
    <>
      {/* 主導航 */}
      <nav 
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          isScrolled 
            ? 'shadow-lg border-b border-gray-200' 
            : 'shadow-sm border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            
            {/* Logo 區域 */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="relative">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 transition-transform duration-200 hover:scale-110" />
                {/* 小圓點指示器 (如果正在計時) */}
                {activeTab === TABS.TRACKER && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                  {APP_TITLE}
                </h1>
                <p className="hidden sm:block text-xs text-gray-500">智能時間追蹤工具</p>
              </div>
            </div>
            
            {/* 桌面導航 - 只在桌面版顯示 */}
            {!isMobile && (
              <div className="desktop-navigation flex items-center space-x-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`group relative px-3 lg:px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={item.description}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 transition-transform duration-200 ${
                        isActive ? 'text-white' : 'group-hover:scale-110'
                      }`} />
                      <span className="hidden lg:inline">{item.label}</span>
                      <span className="lg:hidden">{item.shortLabel}</span>
                    </div>
                    
                    {/* 活動指示器 */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
              </div>
            )}

            {/* 手機菜單按鈕 - 只在手機版顯示 */}
            {isMobile && (
              <button
                onClick={toggleMobileMenu}
                className="mobile-menu-button flex p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors touch-target"
                aria-label="開啟選單"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 手機下拉選單 - 只在手機版且選單開啟時顯示 */}
        {isMobile && isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg animate-slide-down z-40">
            <div className="px-4 py-2 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 touch-target ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${
                        isActive ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* 遮罩層 (當手機選單開啟時) - 只在手機版顯示 */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navigation;
