import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// 認證上下文
const AuthContext = createContext(null);

// Storage keys for auth
const AUTH_STORAGE_KEYS = {
  TOKEN: 'timetracker_auth_token',
  USER: 'timetracker_user_data',
  REFRESH_TOKEN: 'timetracker_refresh_token'
};

// API 基礎 URL (後端服務器)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 通用 API 請求函數
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // 無法解析 JSON，使用 HTTP 狀態信息
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    // 處理網絡錯誤
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('無法連接到服務器，請檢查網絡連接');
    }
    
    throw error;
  }
};

// 模擬用戶資料 (開發階段)
const MOCK_USERS = [
  {
    id: 1,
    email: 'demo@timetracker.pro',
    name: '演示用戶',
    password: 'demo123', // 實際應用中絕不能明文存儲
    plan: 'free',
    createdAt: '2025-01-01T00:00:00Z',
    settings: {
      timezone: 'Asia/Taipei',
      currency: 'TWD',
      workingHours: { start: '09:00', end: '18:00' },
      notifications: true
    }
  }
];

// 驗證 Token API 調用
const verifyTokenAPI = async (token) => {
  try {
    console.log('🔒 驗證令牌...');
    const response = await apiRequest('/auth/verify', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('✅ 令牌有效:', response);
    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    console.error('❌ 令牌驗證失敗:', error.message);
    // 令牌無效時清除本地存儲
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    
    return { success: false, message: error.message };
  }
};

// 登入 API 調用
const loginAPI = async (email, password) => {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // 後端返回的格式：{ success: true, data: { user, accessToken, refreshToken } }
    return { 
      success: true, 
      data: {
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 註冊 API 調用
const registerAPI = async (userData) => {
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    return { 
      success: true, 
      data: {
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 登出 API 調用
const logoutAPI = async () => {
  try {
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
    });
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 用戶認證 Hook
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // 初始化時檢查登入狀態
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 檢查認證狀態
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
      const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER);

      if (token && userData) {
        try {
          // 驗證 token 有效性 (真實 API)
          const tokenValidation = await verifyTokenAPI(token);
          
          if (tokenValidation.success) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Token 無效，清除本地資料
            console.warn('Token 驗證失敗，清除本地認證資料');
            localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
            localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
            localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (apiError) {
          // API 不可用時，嘗試使用本地資料
          console.warn('API 不可用，使用本地認證資料:', apiError.message);
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (parseError) {
            // 本地資料也無效
            console.error('本地資料解析失敗:', parseError);
            localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
            localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
            localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        // 沒有認證資料
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('檢查認證狀態失敗:', error);
      // 如果是 401 錯誤，清除認證資料
      if (error.message.includes('401')) {
        localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
        localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
        setUser(null);
        setIsAuthenticated(false);
      }
      setError('認證狀態檢查失敗');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 模擬 Token 驗證
  const validateToken = async (token) => {
    // 在實際應用中，這裡會調用 API 驗證 token
    return new Promise((resolve) => {
      setTimeout(() => {
        // 簡單的 token 格式檢查
        resolve(token && token.startsWith('tt_token_'));
      }, 300);
    });
  };

  // 登入
  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // 調用真實 API
      const response = await loginAPI(email, password);
      
      if (response.success) {
        const { user: userData, accessToken, refreshToken } = response.data;
        
        // 儲存認證資料
        localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, accessToken);
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(userData));
        
        if (rememberMe && refreshToken) {
          localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, message: '登入成功' };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = '登入失敗，請稍後再試';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 註冊
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);

      // 調用真實 API
      const response = await registerAPI(userData);
      
      if (response.success) {
        const { user: newUser, accessToken } = response.data;
        
        // 自動登入新用戶
        localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, accessToken);
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(newUser));

        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, message: '註冊成功' };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = '註冊失敗，請稍後再試';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 調用真實 API 登出
      const response = await logoutAPI();
      
      // 清除本地儲存
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      
      // 清除用戶狀態
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      return { success: true, message: '已成功登出' };
    } catch (error) {
      console.error('登出失敗:', error);
      // 即使 API 失敗，也要清除本地狀態
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      return { success: true, message: '已成功登出' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出所有設備
  const logoutAllDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('⏳ 設置 loading 狀態為 true');
      
      // 在實際應用中，這裡會調用後端 API 使所有該用戶的 token 失效
      console.log('📞 調用真實 API logoutAllDevicesAPI');
      const response = await logoutAllDevicesAPI();
      console.log('📊 API 響應:', response);
      
      if (response.success) {
        console.log('✅ API 調用成功，開始清除本地狀態');
        
        // 清除本地儲存
        localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
        localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
        console.log('🗑️ 已清除本地儲存');
        
        // 清除用戶狀態
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
        console.log('🔄 已更新認證狀態: isAuthenticated = false');
        
        return { success: true, message: '已成功登出所有設備' };
      } else {
        console.error('❌ API 調用失敗:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('💥 登出所有設備失敗:', error);
      return { success: false, message: '登出所有設備過程中發生錯誤' };
    } finally {
      setIsLoading(false);
      console.log('⏳ 設置 loading 狀態為 false');
    }
  }, [user]);

  // 更新用戶資料
  const updateUser = useCallback(async (updates) => {
    try {
      setIsLoading(true);
      setError(null);

      // 模擬 API 調用
      const response = await updateUserAPI(user.id, updates);
      
      if (response.success) {
        const updatedUser = { ...user, ...updates };
        
        // 更新本地儲存
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        return { success: true, message: '資料更新成功' };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = '更新失敗，請稍後再試';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 忘記密碼
  const forgotPassword = useCallback(async (email) => {
    try {
      setIsLoading(true);
      setError(null);

      // 模擬 API 調用
      const response = await forgotPasswordAPI(email);
      
      return response;
    } catch (error) {
      const errorMessage = '發送重設郵件失敗';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // 狀態
    user,
    isLoading,
    isAuthenticated,
    error,
    
    // 操作函數
    login,
    register,
    logout,
    logoutAllDevices,
    updateUser,
    forgotPassword,
    checkAuthStatus,
    
    // 清除錯誤
    clearError: () => setError(null)
  };
};

// 忘記密碼 API 調用
const forgotPasswordAPI = async (email) => {
  try {
    // 暫時返回功能未實現的錯誤
    return { success: false, message: '密碼重設功能暫時未實現，請聯繫管理員' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 更新用戶資料 API 調用
const updateUserAPI = async (userId, updates) => {
  try {
    const response = await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 登出所有設備 API 調用
const logoutAllDevicesAPI = async () => {
  try {
    // 目前使用一般登出，未來可以擴展為真正的登出所有設備
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
    });
    return { success: true, message: response.message || '已成功登出所有設備' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ===========================================
// 以下是模擬 API 函數 (開發階段備用)
// ===========================================

// 模擬 API 函數
const mockLoginAPI = async (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email);
      
      if (user && user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        resolve({
          success: true,
          data: {
            user: userWithoutPassword,
            token: `tt_token_${user.id}_${Date.now()}`,
            refreshToken: `tt_refresh_${user.id}_${Date.now()}`
          }
        });
      } else {
        resolve({
          success: false,
          message: '電子郵件或密碼錯誤'
        });
      }
    }, 800);
  });
};

const mockRegisterAPI = async (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 檢查是否已存在相同 email
      const existingUser = MOCK_USERS.find(u => u.email === userData.email);
      
      if (existingUser) {
        resolve({
          success: false,
          message: '此電子郵件已被使用'
        });
        return;
      }

      // 創建新用戶
      const newUser = {
        id: MOCK_USERS.length + 1,
        email: userData.email,
        name: userData.name,
        plan: 'free',
        createdAt: new Date().toISOString(),
        settings: {
          timezone: 'Asia/Taipei',
          currency: 'TWD',
          workingHours: { start: '09:00', end: '18:00' },
          notifications: true
        }
      };

      // 在實際應用中會儲存到資料庫
      MOCK_USERS.push({ ...newUser, password: userData.password });

      resolve({
        success: true,
        data: {
          user: newUser,
          token: `tt_token_${newUser.id}_${Date.now()}`
        }
      });
    }, 1000);
  });
};

const mockUpdateUserAPI = async (userId, updates) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: updates
      });
    }, 500);
  });
};

const mockForgotPasswordAPI = async (email) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email);
      
      if (user) {
        resolve({
          success: true,
          message: '密碼重設郵件已發送，請檢查您的信箱'
        });
      } else {
        resolve({
          success: false,
          message: '找不到此電子郵件對應的帳戶'
        });
      }
    }, 600);
  });
};

const mockLogoutAllDevicesAPI = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true
      });
    }, 500);
  });
};

// 認證上下文 Provider
const AuthProvider = ({ children }) => {
  const auth = useAuth();
  
  return React.createElement(AuthContext.Provider, { value: auth }, children);
};

// 使用認證上下文的 Hook
const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// 導出所有必要的函數和組件
export {
  AuthContext,
  AUTH_STORAGE_KEYS,
  API_BASE_URL,
  useAuth,
  AuthProvider,
  useAuthContext
};

// 默認導出
export default useAuth;
