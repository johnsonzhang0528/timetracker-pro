import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Loader, AlertTriangle } from 'lucide-react';
import { useAuthContext } from '../Hooks/useAuth';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const { login, register, forgotPassword, isLoading, error, clearError } = useAuthContext();

  // 表單驗證
  const validateForm = () => {
    const newErrors = {};

    // Email 驗證
    if (!formData.email) {
      newErrors.email = '請輸入電子郵件';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件格式';
    }

    // 密碼驗證
    if (!formData.password) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼至少需要 6 個字元';
    }

    // 註冊時的額外驗證
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = '請輸入姓名';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '請確認密碼';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '密碼確認不一致';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setErrors({});

    if (!validateForm()) return;

    try {
      let result;
      
      if (isLogin) {
        console.log('🔒 嘗試登入...');
        result = await login(formData.email, formData.password, false);
      } else {
        console.log('📝 嘗試註冊...');
        result = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name
        });
      }

      if (result.success) {
        console.log('✅ 表單登入成功！準備跳轉...');
        console.log('📞 調用 onAuthSuccess 回調');
        onAuthSuccess && onAuthSuccess();
      } else {
        console.error('❌ 認證失敗:', result.message);
        setErrors({ general: result.message || '認證失敗，請稍後再試' });
      }
    } catch (error) {
      console.error('💥 認證過程發生錯誤:', error);
      setErrors({ general: error.message || '認證過程中發生錯誤，請稍後再試' });
    }
  };

  // 處理忘記密碼
  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    
    if (forgotPasswordMode) {
      if (!formData.email) {
        setErrors({ email: '請輸入您的電子郵件' });
        return;
      }

      try {
        const result = await forgotPassword(formData.email);
        if (result.success) {
          setResetEmailSent(true);
        } else {
          setErrors({ email: result.message || '重設密碼請求失敗' });
        }
      } catch (error) {
        setErrors({ email: '發送重設郵件時發生錯誤' });
      }
    } else {
      setForgotPasswordMode(true);
    }
  };

  // 返回登入表單
  const handleBackToLogin = () => {
    setForgotPasswordMode(false);
    setResetEmailSent(false);
    clearError();
  };

  // 處理輸入變化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 切換登入/註冊模式
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    setErrors({});
    setShowPassword(false);
    setForgotPasswordMode(false);
    setResetEmailSent(false);
    clearError();
  };

  // 演示帳號快速登入
  const handleDemoLogin = async () => {
    console.log('🚀 開始演示帳號登入...');
    
    try {
      clearError();
      setErrors({});
      
      setFormData({
        email: 'demo@timetracker.pro',
        password: 'demo123',
        name: '',
        confirmPassword: ''
      });
      
      console.log('📧 使用演示帳號: demo@timetracker.pro');
      
      const result = await login('demo@timetracker.pro', 'demo123', false);
      
      console.log('📊 登入結果:', result);
      
      if (result.success) {
        console.log('✅ 演示登入成功！準備跳轉...');
        console.log('📞 調用 onAuthSuccess 回調');
        onAuthSuccess && onAuthSuccess();
      } else {
        console.error('❌ 登入失敗:', result.message);
        setErrors({ general: result.message || '登入失敗，請稍後再試' });
      }
    } catch (error) {
      console.error('💥 演示登入發生錯誤:', error);
      setErrors({ general: '登入過程中發生錯誤，請刷新頁面後重試' });
    }
  };

  // 重置密碼請求已發送畫面
  if (resetEmailSent) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '24px'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '28px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px',
              letterSpacing: '-0.025em'
            }}>
              TimeTracker Pro
            </h1>
          </div>
          
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Mail size={32} color="#10b981" />
            </div>
            
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              密碼重設郵件已發送
            </h2>
            
            <p style={{ 
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              我們已發送密碼重設指引到您的郵箱：<br />
              <span style={{ fontWeight: '500', color: '#374151' }}>{formData.email}</span>
            </p>
            
            <button
              onClick={handleBackToLogin}
              style={{
                width: '100%',
                background: '#3b82f6',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.target.style.background = '#2563eb')}
              onMouseLeave={(e) => (e.target.style.background = '#3b82f6')}
            >
              返回登入
            </button>
            
            <p style={{ 
              fontSize: '13px',
              color: '#9ca3af',
              marginTop: '16px'
            }}>
              沒有收到郵件？請檢查垃圾郵件箱，或<br />
              <button
                onClick={() => {
                  setResetEmailSent(false);
                  handleForgotPassword();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                重新發送重設郵件
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 忘記密碼表單
  if (forgotPasswordMode) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '24px'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '28px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px',
              letterSpacing: '-0.025em'
            }}>
              TimeTracker Pro
            </h1>
          </div>
          
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            padding: '32px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                重設您的密碼
              </h2>
              <p style={{ 
                fontSize: '14px',
                color: '#6b7280',
                margin: '0'
              }}>
                輸入您的郵箱，我們將發送重設密碼的指引
              </p>
            </div>
            
            {error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            
            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  電子郵件
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    style={{ 
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }} 
                    size={16} 
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '40px',
                      paddingRight: '12px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box'
                    }}
                    placeholder="your@email.com"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.email && (
                  <p style={{ 
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#dc2626',
                    margin: '4px 0 0 0'
                  }}>
                    {errors.email}
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                  opacity: isLoading ? 0.6 : 1,
                  marginBottom: '16px'
                }}
                onMouseEnter={(e) => !isLoading && (e.target.style.background = '#2563eb')}
                onMouseLeave={(e) => !isLoading && (e.target.style.background = '#3b82f6')}
              >
                {isLoading ? (
                  <Loader size={16} className="animate-spin" />
                ) : '發送重設郵件'}
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: '0'
                  }}
                >
                  返回登入
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* 標題區域 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '28px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px',
            letterSpacing: '-0.025em'
          }}>
            TimeTracker Pro
          </h1>
          <p style={{ 
            fontSize: '16px',
            color: '#6b7280',
            margin: '0'
          }}>
            智能時間追蹤工具
          </p>
        </div>

        {/* 登入表單卡片 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '32px'
        }}>
          
          {/* 表單標題 */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {isLogin ? '歡迎回來' : '開始使用'}
            </h2>
            <p style={{ 
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }}>
              {isLogin ? '登入您的帳戶繼續使用' : '建立帳戶，開始追蹤您的時間'}
            </p>
          </div>

          {/* 演示帳號按鈕 */}
          {isLogin && (
            <>
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: '#22c55e',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                  opacity: isLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !isLoading && (e.target.style.background = '#16a34a')}
                onMouseLeave={(e) => !isLoading && (e.target.style.background = '#22c55e')}
              >
                快速體驗演示帳號
              </button>

              {/* 分隔線 */}
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <div style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '0',
                  right: '0',
                  height: '1px',
                  background: '#e5e7eb'
                }}></div>
                <div style={{ 
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <span style={{ 
                    padding: '0 16px',
                    background: 'white',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    或使用郵箱登入
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 錯誤提示 */}
          {(error || errors.general) && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error || errors.general}
            </div>
          )}

          {/* 表單 */}
          <form onSubmit={handleSubmit}>
            
            {/* 姓名欄位 (僅註冊時顯示) */}
            {!isLogin && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  姓名
                </label>
                <div style={{ position: 'relative' }}>
                  <User 
                    style={{ 
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }} 
                    size={16} 
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '40px',
                      paddingRight: '12px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box'
                    }}
                    placeholder="請輸入您的姓名"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.name ? '#ef4444' : '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.name && (
                  <p style={{ 
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#dc2626',
                    margin: '4px 0 0 0'
                  }}>
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* 電子郵件 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                電子郵件
              </label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  style={{ 
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }} 
                  size={16} 
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '12px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="your@email.com"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.email && (
                <p style={{ 
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#dc2626',
                  margin: '4px 0 0 0'
                }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* 密碼 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                密碼
              </label>
              <div style={{ position: 'relative' }}>
                <Lock 
                  style={{ 
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }} 
                  size={16} 
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    border: `1px solid ${errors.password ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="請輸入密碼"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? '#ef4444' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ 
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#dc2626',
                  margin: '4px 0 0 0'
                }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* 確認密碼 (僅註冊時顯示) */}
            {!isLogin && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  確認密碼
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    style={{ 
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }} 
                    size={16} 
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '40px',
                      paddingRight: '12px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      border: `1px solid ${errors.confirmPassword ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box'
                    }}
                    placeholder="請再次輸入密碼"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.confirmPassword && (
                  <p style={{ 
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#dc2626',
                    margin: '4px 0 0 0'
                  }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Remember Me 選項 (僅登入時顯示) */}
            {isLogin && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#3b82f6',
                      cursor: 'pointer'
                    }}
                  />
                  記住我
                </label>
                
                <button
                  type="button"
                  onClick={() => setForgotPasswordMode(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '14px',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    padding: '0'
                  }}
                >
                  忘記密碼？
                </button>
              </div>
            )}

            {/* 提交按鈕 */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                background: '#3b82f6',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
                opacity: isLoading ? 0.6 : 1,
                marginBottom: '24px'
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.background = '#2563eb')}
              onMouseLeave={(e) => !isLoading && (e.target.style.background = '#3b82f6')}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {isLogin ? '登入中...' : '註冊中...'}
                </>
              ) : (
                isLogin ? '登入' : '建立帳戶'
              )}
            </button>
          </form>

          {/* 切換模式 */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              color: '#6b7280',
              fontSize: '14px',
              margin: '0'
            }}>
              {isLogin ? '還沒有帳戶？' : '已經有帳戶了？'}
              <button
                onClick={toggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  marginLeft: '4px',
                  color: '#3b82f6',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '0'
                }}
              >
                {isLogin ? '立即註冊' : '前往登入'}
              </button>
            </p>
          </div>

          {/* 服務條款 (僅註冊時顯示) */}
          {!isLogin && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p style={{ 
                fontSize: '12px',
                color: '#9ca3af',
                margin: '0'
              }}>
                註冊即表示您同意我們的
                <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>服務條款</a>
                和
                <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>隱私政策</a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 加載動畫的 CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Auth;
