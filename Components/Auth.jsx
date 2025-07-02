import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Clock, Shield, Zap } from 'lucide-react';
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
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  
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

    if (!validateForm()) return;

    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password, rememberMe);
      } else {
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
      }
    } catch (error) {
      console.error('認證失敗:', error);
    }
  };

  // 處理忘記密碼
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: '請先輸入您的電子郵件' });
      return;
    }

    const result = await forgotPassword(formData.email);
    if (result.success) {
      alert(result.message);
    }
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
    clearError();
  };

  // 演示帳號快速登入
  const handleDemoLogin = async () => {
    console.log('🚀 開始演示帳號登入...');
    
    try {
      // 清除之前的錯誤
      clearError();
      setErrors({});
      
      // 更新表單數據（視覺上的反饋）
      setFormData({
        email: 'demo@timetracker.pro',
        password: 'demo123',
        name: '',
        confirmPassword: ''
      });
      
      console.log('📧 使用演示帳號: demo@timetracker.pro');
      
      // 執行登入
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* 左側 - 品牌介紹 */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Clock size={40} className="text-blue-200" />
              <h1 className="text-3xl font-bold">TimeTracker Pro</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              智能時間追蹤<br />
              <span className="text-blue-200">讓工作更有價值</span>
            </h2>
            
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              專為自由工作者和創意專業人士設計的時間管理工具，
              精準追蹤每分每秒，自動計算收入，讓您專注於創作。
            </p>
          </div>

          {/* 功能特色 */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-semibold">精準計時</h3>
                <p className="text-blue-200 text-sm">毫秒級時間追蹤，自動收入計算</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-semibold">資料安全</h3>
                <p className="text-blue-200 text-sm">雲端同步，多重備份保護</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-semibold">智能分析</h3>
                <p className="text-blue-200 text-sm">深度報表，洞察工作模式</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右側 - 登入表單 */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            
            {/* 手機版標題 */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock size={32} className="text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800">TimeTracker Pro</h1>
              </div>
              <p className="text-gray-600">智能時間追蹤工具</p>
            </div>

            {/* 表單標題 */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {isLogin ? '歡迎回來' : '開始使用'}
              </h2>
              <p className="text-gray-600">
                {isLogin ? '登入您的帳戶繼續使用' : '建立帳戶，開始追蹤您的時間'}
              </p>
            </div>

            {/* 演示帳號按鈕 */}
            {isLogin && (
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full mb-6 p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                快速體驗演示帳號
              </button>
            )}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">或使用郵箱{isLogin ? '登入' : '註冊'}</span>
              </div>
            </div>

            {/* 錯誤提示 */}
            {(error || errors.general) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error || errors.general}
              </div>
            )}

            {/* 表單 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 姓名欄位 (僅註冊時顯示) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="請輸入您的姓名"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
              )}

              {/* 電子郵件 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電子郵件
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* 密碼 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-11 pr-11 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="請輸入密碼"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* 確認密碼 (僅註冊時顯示) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    確認密碼
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="請再次輸入密碼"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* 記住我 & 忘記密碼 (僅登入時顯示) */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">記住我</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    忘記密碼？
                  </button>
                </div>
              )}

              {/* 提交按鈕 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? '登入' : '建立帳戶'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* 切換模式 */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {isLogin ? '還沒有帳戶？' : '已經有帳戶了？'}
                <button
                  onClick={toggleMode}
                  className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isLogin ? '立即註冊' : '前往登入'}
                </button>
              </p>
            </div>

            {/* 服務條款 (僅註冊時顯示) */}
            {!isLogin && (
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  註冊即表示您同意我們的
                  <a href="#" className="text-blue-600 hover:underline">服務條款</a>
                  和
                  <a href="#" className="text-blue-600 hover:underline">隱私政策</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
