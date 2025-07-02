import React, { useState } from 'react';
import { Clock, Users, BarChart3, FileText, Menu, X, Zap, User, ChevronDown } from 'lucide-react';
import { APP_TITLE, TABS } from '../Constants';
import { useAuthContext } from '../Hooks/useAuth';

const Navigation = ({ activeTab, setActiveTab, isTracking }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuthContext();

  // 導航項目配置
  const navItems = [
    {
      id: TABS.TRACKER,
      label: '時間追蹤',
      shortLabel: '計時',
      icon: Clock,
      description: '開始追蹤您的工作時間'
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
    setIsUserMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    if (window.confirm('確定要登出嗎？')) {
      await logout();
    }
  };

  return (
    <>
      {/* 主導航 */}
      <header className="header">
        <nav className="nav">
          {/* Logo */}
          <div className="logo">
            <div className="logo-icon">
              <Zap size={24} />
            </div>
            <h1 className="logo-text">{APP_TITLE}</h1>
          </div>
            
          {/* 桌面導航 */}
          <div className="nav-desktop">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={item.description}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {/* 計時指示器 */}
                  {item.id === TABS.TRACKER && isTracking && (
                    <div 
                      className="pulse"
                      style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        marginLeft: '4px'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* 用戶資訊和選單 */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.name || '用戶'}
              </span>
              <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 用戶下拉選單 */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-medium text-gray-800">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {user?.plan === 'free' ? '免費版' : 'Pro 版'}
                    </span>
                  </div>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={() => {
                      handleTabClick(TABS.PROFILE);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <User size={16} />
                    帳戶設定
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <X size={16} />
                    登出
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 手機菜單按鈕 */}
          <button
            onClick={toggleMobileMenu}
            className="menu-toggle desktop-hidden"
            aria-label="開啟選單"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* 手機下拉選單 */}
        {isMobileMenuOpen && (
          <div className="desktop-hidden fade-in" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--gray-200)',
            zIndex: 40
          }}>
            <div style={{ padding: 'var(--space-4)' }}>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      marginBottom: 'var(--space-2)'
                    }}
                  >
                    <Icon size={18} />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{item.label}</div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--gray-500)', 
                        marginTop: '2px' 
                      }}>
                        {item.description}
                      </div>
                    </div>
                    {/* 手機版計時指示器 */}
                    {item.id === TABS.TRACKER && isTracking && (
                      <div 
                        className="pulse"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#10b981',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                  </button>
                );
              })}
              
              {/* 手機版用戶選單 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleTabClick(TABS.PROFILE)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left mb-2"
                >
                  <User size={16} />
                  帳戶設定
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  <X size={16} />
                  登出
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 手機底部導航 */}
      <nav className="nav-mobile desktop-hidden">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`nav-mobile-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-mobile-icon">
                <Icon size={20} />
                {/* 手機底部計時指示器 */}
                {item.id === TABS.TRACKER && isTracking && (
                  <div 
                    className="pulse"
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#10b981',
                      borderRadius: '50%'
                    }}
                  />
                )}
              </div>
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Navigation;