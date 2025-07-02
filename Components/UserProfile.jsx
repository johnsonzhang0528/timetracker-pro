import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Clock, Bell, Shield, 
  Save, Edit3, CheckCircle
} from 'lucide-react';
import { useAuthContext } from '../Hooks/useAuth';

const UserProfile = () => {
  const { user, updateUser, logout, logoutAllDevices, isLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    settings: {
      timezone: 'Asia/Taipei',
      currency: 'TWD',
      workingHours: { start: '09:00', end: '18:00' },
      notifications: true,
      autoStart: false,
      reminderInterval: 30
    }
  });
  const [saveStatus, setSaveStatus] = useState(null);

  // 載入用戶資料
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        settings: {
          ...formData.settings,
          ...user.settings
        }
      });
    }
  }, [user]);

  // 處理表單提交
  const handleSave = async () => {
    try {
      const result = await updateUser({
        name: formData.name,
        settings: formData.settings
      });

      if (result.success) {
        setSaveStatus('success');
        setIsEditing(false);
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // 處理登出
  const handleLogout = async () => {
    if (window.confirm('確定要登出嗎？')) {
      const result = await logout();
      // 登出成功會自動跳轉到登入頁面，不需要額外處理
      if (!result.success) {
        alert(result.message || '登出失敗，請稍後再試');
      }
    }
  };

  // 處理登出所有設備
  const handleLogoutAllDevices = async () => {
    console.log('🚪 開始登出所有設備流程');
    if (window.confirm('確定要登出所有設備嗎？這將會登出所有已登入此帳戶的設備。')) {
      try {
        console.log('✅ 用戶確認登出，開始調用 logoutAllDevices');
        const result = await logoutAllDevices();
        console.log('📊 logoutAllDevices 結果:', result);
        
        // 不需要顯示 alert，因為會自動跳轉到登入頁面
        // 如果失敗才顯示錯誤訊息
        if (!result.success) {
          console.error('❌ 登出所有設備失敗:', result.message);
          alert(result.message || '登出所有設備失敗，請稍後再試');
        } else {
          console.log('✅ 登出所有設備成功，應該會自動跳轉到登入頁面');
        }
      } catch (error) {
        console.error('💥 登出所有設備過程中發生錯誤:', error);
        alert('登出所有設備過程中發生錯誤，請稍後再試');
      }
    } else {
      console.log('❌ 用戶取消登出所有設備');
    }
  };

  // 更新表單資料
  const updateFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#ffffff',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* 頁面標題 */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              帳戶設定
            </h1>
            <p style={{ 
              fontSize: '16px',
              color: '#6b7280',
              margin: '0'
            }}>
              管理您的個人資料和偏好設定
            </p>
          </div>
          
          {/* 儲存狀態 */}
          {saveStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: saveStatus === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${saveStatus === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: saveStatus === 'success' ? '#166534' : '#dc2626'
            }}>
              <CheckCircle size={16} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {saveStatus === 'success' ? '設定已成功儲存！' : '儲存失敗，請重試'}
              </span>
            </div>
          )}
        </div>

        {/* 用戶資訊卡片 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          marginBottom: '24px'
        }}>
          
          {/* 用戶資訊頭部 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '24px 24px 0 24px',
            marginBottom: '24px',
            paddingBottom: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#3b82f6',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: '600',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '4px',
                margin: '0 0 4px 0'
              }}>
                {user?.name}
              </h3>
              <p style={{ 
                fontSize: '14px',
                color: '#6b7280',
                margin: '0'
              }}>
                {user?.email}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // 重置表單資料
                      if (user) {
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          settings: {
                            ...formData.settings,
                            ...user.settings
                          }
                        });
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    <Save size={14} />
                    {isLoading ? '儲存中...' : '儲存'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit3 size={14} />
                  編輯
                </button>
              )}
            </div>
          </div>

          {/* 基本資料 */}
          <div style={{ padding: '0 24px 24px 24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                基本資料
              </h3>
              <p style={{ 
                fontSize: '14px',
                color: '#6b7280',
                margin: '0'
              }}>
                管理您的個人基本資訊
              </p>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* 姓名 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  姓名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    backgroundColor: isEditing ? '#ffffff' : '#f9fafb',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => isEditing && (e.target.style.borderColor = '#3b82f6', e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)')}
                  onBlur={(e) => (e.target.style.borderColor = '#d1d5db', e.target.style.boxShadow = 'none')}
                />
              </div>

              {/* 電子郵件 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  電子郵件
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ 
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  電子郵件無法修改
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 安全操作 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '24px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              安全設定
            </h3>
            <p style={{ 
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }}>
              管理您的帳戶安全性
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {/* 更改密碼 */}
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  密碼
                </div>
                <button
                  style={{
                    padding: '6px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  更改密碼
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                上次更改：2024年1月15日
              </div>
            </div>

            {/* 登出所有設備 */}
            <div style={{
              padding: '16px',
              background: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626' }}>
                  登出所有設備
                </div>
                <button
                  onClick={handleLogoutAllDevices}
                  disabled={isLoading}
                  style={{
                    padding: '6px 12px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  {isLoading ? '處理中...' : '登出所有設備'}
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                這將會登出所有設備上的帳戶
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
