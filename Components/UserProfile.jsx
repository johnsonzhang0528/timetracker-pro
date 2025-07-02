import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Clock, Globe, Bell, CreditCard, Shield, 
  Settings, LogOut, Save, Edit3, CheckCircle, Crown,
  Smartphone, Monitor, Moon, Sun
} from 'lucide-react';
import { useAuth } from '../Hooks/useAuth';

const UserProfile = () => {
  const { user, updateUser, logout, isLoading } = useAuth();
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
      theme: 'light',
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
      await logout();
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

  // 獲取計畫徽章
  const getPlanBadge = (plan) => {
    const badges = {
      free: { label: '免費版', color: 'bg-gray-100 text-gray-700', icon: null },
      pro: { label: 'Pro 版', color: 'bg-blue-100 text-blue-700', icon: Crown },
      business: { label: '商業版', color: 'bg-purple-100 text-purple-700', icon: Crown }
    };
    
    return badges[plan] || badges.free;
  };

  const tabs = [
    { id: 'profile', label: '個人資料', icon: User },
    { id: 'workspace', label: '工作設定', icon: Clock },
    { id: 'notifications', label: '通知設定', icon: Bell },
    { id: 'billing', label: '帳戶方案', icon: CreditCard },
    { id: 'security', label: '安全設定', icon: Shield }
  ];

  const planBadge = getPlanBadge(user?.plan);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">帳戶設定</h1>
          <p className="text-gray-600 mt-1">管理您的個人資料和偏好設定</p>
        </div>
        
        {/* 儲存狀態 */}
        {saveStatus && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            saveStatus === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <CheckCircle size={16} />
            {saveStatus === 'success' ? '設定已儲存' : '儲存失敗'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 左側導航 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            
            {/* 用戶資訊概覽 */}
            <div className="text-center mb-6 pb-6 border-b border-gray-200">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h3 className="font-semibold text-gray-800">{user?.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{user?.email}</p>
              
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${planBadge.color}`}>
                {planBadge.icon && <planBadge.icon size={12} />}
                {planBadge.label}
              </div>
            </div>

            {/* 導航選單 */}
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
              
              {/* 登出按鈕 */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200 mt-4 pt-6"
              >
                <LogOut size={20} />
                登出帳戶
              </button>
            </nav>
          </div>
        </div>

        {/* 右側內容 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">

            {/* 個人資料 */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">個人資料</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                    {isEditing ? '取消編輯' : '編輯資料'}
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">電子郵件無法修改</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">加入時間</label>
                    <p className="text-gray-600">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-TW') : '未知'}
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save size={16} />
                        儲存變更
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 工作設定 */}
            {activeTab === 'workspace' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">工作設定</h2>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">時區</label>
                      <select
                        value={formData.settings.timezone}
                        onChange={(e) => updateFormData('settings.timezone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Asia/Taipei">台北 (GMT+8)</option>
                        <option value="Asia/Tokyo">東京 (GMT+9)</option>
                        <option value="America/New_York">紐約 (GMT-5)</option>
                        <option value="Europe/London">倫敦 (GMT+0)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">預設貨幣</label>
                      <select
                        value={formData.settings.currency}
                        onChange={(e) => updateFormData('settings.currency', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="TWD">新台幣 (TWD)</option>
                        <option value="USD">美元 (USD)</option>
                        <option value="EUR">歐元 (EUR)</option>
                        <option value="JPY">日圓 (JPY)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">工作時間</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">開始時間</label>
                        <input
                          type="time"
                          value={formData.settings.workingHours.start}
                          onChange={(e) => updateFormData('settings.workingHours.start', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">結束時間</label>
                        <input
                          type="time"
                          value={formData.settings.workingHours.end}
                          onChange={(e) => updateFormData('settings.workingHours.end', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-800">自動開始計時</h4>
                      <p className="text-sm text-gray-600">開啟應用程式時自動開始計時</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.autoStart}
                        onChange={(e) => updateFormData('settings.autoStart', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={16} />
                    儲存設定
                  </button>
                </div>
              </div>
            )}

            {/* 通知設定 */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">通知設定</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-800">啟用通知</h4>
                      <p className="text-sm text-gray-600">接收應用程式通知和提醒</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.notifications}
                        onChange={(e) => updateFormData('settings.notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">提醒間隔 (分鐘)</label>
                    <select
                      value={formData.settings.reminderInterval}
                      onChange={(e) => updateFormData('settings.reminderInterval', parseInt(e.target.value))}
                      disabled={!formData.settings.notifications}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    >
                      <option value={15}>15 分鐘</option>
                      <option value={30}>30 分鐘</option>
                      <option value={60}>1 小時</option>
                      <option value={120}>2 小時</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={16} />
                    儲存設定
                  </button>
                </div>
              </div>
            )}

            {/* 帳戶方案 */}
            {activeTab === 'billing' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">帳戶方案</h2>
                
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        目前方案：{planBadge.label}
                      </h3>
                      <p className="text-gray-600">
                        {user?.plan === 'free' 
                          ? '升級到 Pro 版本解鎖更多功能' 
                          : '感謝您使用付費版本！'
                        }
                      </p>
                    </div>
                    {user?.plan === 'free' && (
                      <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
                        升級方案
                      </button>
                    )}
                  </div>
                </div>

                {/* 方案比較 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">免費版</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 單一專案</li>
                      <li>• 基礎時間追蹤</li>
                      <li>• 簡單報表 (7天)</li>
                      <li>• 本地儲存</li>
                    </ul>
                  </div>

                  <div className="border-2 border-blue-500 rounded-xl p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-medium">
                      推薦
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Pro 版</h4>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      <li>• 無限專案和客戶</li>
                      <li>• 進階報表和分析</li>
                      <li>• 專業發票生成</li>
                      <li>• 雲端資料備份</li>
                      <li>• 優先客服支援</li>
                    </ul>
                    <p className="text-2xl font-bold text-blue-600">NT$299/月</p>
                  </div>
                </div>
              </div>
            )}

            {/* 安全設定 */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">安全設定</h2>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-800 mb-2">變更密碼</h4>
                    <p className="text-sm text-gray-600 mb-4">定期更新密碼以保護您的帳戶安全</p>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      變更密碼
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-800 mb-2">兩步驟驗證</h4>
                    <p className="text-sm text-gray-600 mb-4">增加額外的安全層保護</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      啟用兩步驟驗證
                    </button>
                  </div>

                  <div className="border border-red-200 rounded-lg p-6">
                    <h4 className="font-medium text-red-600 mb-2">刪除帳戶</h4>
                    <p className="text-sm text-gray-600 mb-4">永久刪除您的帳戶和所有資料</p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      刪除帳戶
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
