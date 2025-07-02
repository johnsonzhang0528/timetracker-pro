import React, { useState } from 'react';
import { Clock, Users, BarChart3, FileText, Menu, X, Zap } from 'lucide-react';
import { APP_TITLE, TABS } from '../Constants';

const Navigation = ({ activeTab, setActiveTab, isTracking }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* 主導航 */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            {/* Logo 區域 */}
            <a href="#" className="logo">
              <div className="logo-icon">
                <Zap size={20} />
              </div>
              <div className="mobile-hidden">
                <div>{APP_TITLE}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 'normal' }}>
                  智能時間追蹤工具
                </div>
              </div>
            </a>
            
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
                          color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--gray-500)' 
                        }}>
                          {item.description}
                        </div>
                      </div>
                      {/* 計時指示器 */}
                      {item.id === TABS.TRACKER && isTracking && (
                        <div 
                          className="pulse"
                          style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: isActive ? 'white' : '#10b981',
                            borderRadius: '50%'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 底部導航 (手機版) */}
      <nav className="bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              title={item.description}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} />
                {/* 計時指示器 */}
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
