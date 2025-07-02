import React, { useState } from 'react';
import { Clock, Users, BarChart3, FileText, Menu, X, User, ChevronDown, Settings, LogOut } from 'lucide-react';
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
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: '0',
      zIndex: '50',
      padding: '0 24px'
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#3b82f6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Clock size={18} />
          </div>
          <h1 style={{ 
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0'
          }}>
            {APP_TITLE}
          </h1>
        </div>
          
        {/* 桌面導航 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }} className="desktop-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#f3f4f6' : 'transparent',
                  color: isActive ? '#1f2937' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: isActive ? '500' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title={item.description}
                onMouseEnter={(e) => !isActive && (e.target.style.background = '#f9fafb')}
                onMouseLeave={(e) => !isActive && (e.target.style.background = 'transparent')}
              >
                <Icon size={16} />
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                {/* 計時指示器 */}
                {item.id === TABS.TRACKER && isTracking && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    marginLeft: '4px',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* 用戶資訊和選單 */}
        <div style={{ position: 'relative' }} className="user-menu">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.target.style.background = '#f9fafb')}
            onMouseLeave={(e) => (e.target.style.background = '#ffffff')}
          >
            <div style={{
              width: '32px',
              height: '32px',
              background: '#3b82f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="user-info">
              <span style={{ 
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937',
                lineHeight: '1'
              }}>
                {user?.name || '用戶'}
              </span>
              <span style={{ 
                fontSize: '12px',
                color: '#6b7280',
                lineHeight: '1'
              }}>
                {user?.plan === 'free' ? '免費版' : 'Pro 版'}
              </span>
            </div>
            <ChevronDown 
              size={16} 
              style={{
                color: '#9ca3af',
                transition: 'transform 0.2s',
                transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            />
          </button>

          {/* 用戶下拉選單 */}
          {isUserMenuOpen && (
            <div style={{
              position: 'absolute',
              right: '0',
              top: 'calc(100% + 8px)',
              width: '280px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: '50',
              overflow: 'hidden'
            }}>
              
              {/* 用戶資訊標題 */}
              <div style={{
                background: '#f9fafb',
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#3b82f6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: '1' }}>
                    <p style={{ 
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 4px 0'
                    }}>
                      {user?.name || '演示用戶'}
                    </p>
                    <p style={{ 
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      {user?.email || 'demo@timetracker.pro'}
                    </p>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: user?.plan === 'free' ? '#f3f4f6' : '#dbeafe',
                      color: user?.plan === 'free' ? '#374151' : '#1d4ed8'
                    }}>
                      {user?.plan === 'free' ? '免費版用戶' : 'Pro 版用戶'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 選單項目 */}
              <div style={{ padding: '8px' }}>
                <button
                  onClick={() => {
                    handleTabClick(TABS.PROFILE);
                    setIsUserMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                >
                  <Settings size={16} />
                  <div>
                    <div style={{ fontWeight: '500' }}>帳戶設定</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>管理個人資料和偏好</div>
                  </div>
                </button>
                
                <div style={{
                  height: '1px',
                  background: '#e5e7eb',
                  margin: '8px 16px'
                }} />
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsUserMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#dc2626',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                >
                  <LogOut size={16} />
                  <div>
                    <div style={{ fontWeight: '500' }}>登出</div>
                    <div style={{ fontSize: '12px', color: '#b91c1c' }}>結束當前會話</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 手機選單按鈕 */}
        <button
          onClick={toggleMobileMenu}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            color: '#6b7280',
            cursor: 'pointer'
          }}
          className="mobile-menu-btn"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* 手機導航選單 */}
      {isMobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          padding: '16px 0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#f3f4f6' : 'transparent',
                    color: isActive ? '#1f2937' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: isActive ? '500' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '4px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => !isActive && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !isActive && (e.target.style.background = 'transparent')}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.id === TABS.TRACKER && isTracking && (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      background: '#22c55e',
                      borderRadius: '50%',
                      marginLeft: 'auto'
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 背景遮罩 */}
      {(isMobileMenuOpen || isUserMenuOpen) && (
        <div
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.1)',
            zIndex: '40'
          }}
        />
      )}

      {/* CSS 樣式 */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .user-menu .user-info { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
};

export default Navigation;
