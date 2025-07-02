import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// 認證上下文
const AuthContext = createContext(null);

// Storage keys for auth
const AUTH_STORAGE_KEYS = {
  TOKEN: 'timetracker_auth_token',
  USER: 'timetracker_user_data',
  REFRESH_TOKEN: 'timetracker_refresh_token'
};

// API 基礎 URL (開發階段使用模擬)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

// 用戶認證 Hook
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // 調試: 監控狀態變化
  console.log('🔐 useAuth 狀態:', {
    isAuthenticated,
    isLoading,
    user: user ? user.name : 'null',
    error
  });

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
        // 驗證 token 有效性 (模擬)
        const isValidToken = await validateToken(token);
        
        if (isValidToken) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // Token 無效，清除本地資料
          await logout();
        }
      }
    } catch (error) {
      console.error('檢查認證狀態失敗:', error);
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
    console.log('🔐 開始登入流程:', email);
    
    try {
      setIsLoading(true);
      setError(null);

      console.log('📡 調用模擬 API...');
      // 模擬 API 調用
      const response = await mockLoginAPI(email, password);
      
      console.log('📬 API 響應:', response);
      
      if (response.success) {
        const { user: userData, token, refreshToken } = response.data;
        
        console.log('💾 儲存認證資料到 localStorage...');
        // 儲存認證資料
        localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(userData));
        
        if (rememberMe && refreshToken) {
          localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        console.log('🏠 更新用戶狀態...');
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ 登入完成！用戶:', userData.name);
        return { success: true, message: '登入成功' };
      } else {
        console.error('❌ 登入失敗:', response.message);
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

      // 模擬 API 調用
      const response = await mockRegisterAPI(userData);
      
      if (response.success) {
        const { user: newUser, token } = response.data;
        
        // 自動登入新用戶
        localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
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
      
      // 清除本地儲存
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      
      // 清除用戶狀態
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // 在實際應用中，這裡會調用 API 使 token 失效
      
      return { success: true, message: '已成功登出' };
    } catch (error) {
      console.error('登出失敗:', error);
      return { success: false, message: '登出過程中發生錯誤' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新用戶資料
  const updateUser = useCallback(async (updates) => {
    try {
      setIsLoading(true);
      setError(null);

      // 模擬 API 調用
      const response = await mockUpdateUserAPI(user.id, updates);
      
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
      const response = await mockForgotPasswordAPI(email);
      
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
    updateUser,
    forgotPassword,
    checkAuthStatus,
    
    // 清除錯誤
    clearError: () => setError(null)
  };
};

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

// 認證上下文 Provider
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  
  return React.createElement(AuthContext.Provider, { value: auth }, children);
};

// 使用認證上下文的 Hook
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
