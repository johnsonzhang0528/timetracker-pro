import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authValidation } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 生成 JWT Token
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// 註冊
router.post('/register', authValidation.register, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // 檢查用戶是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '此電子郵件已被註冊'
      });
    }
    
    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 創建用戶
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        settings: {
          create: {} // 創建預設設定
        }
      },
      include: {
        settings: true
      }
    });
    
    // 生成 Token
    const tokens = generateTokens(user.id);
    
    logger.info(`用戶註冊成功: ${email}`);
    
    res.status(201).json({
      success: true,
      message: '註冊成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan
        },
        ...tokens
      }
    });
  } catch (error) {
    logger.error('註冊失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
});

// 登入
router.post('/login', authValidation.login, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查找用戶
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        settings: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '電子郵件或密碼錯誤'
      });
    }
    
    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '電子郵件或密碼錯誤'
      });
    }
    
    // 更新最後登入時間
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // 生成 Token
    const tokens = generateTokens(user.id);
    
    logger.info(`用戶登入成功: ${email}`);
    
    res.json({
      success: true,
      message: '登入成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          settings: user.settings
        },
        ...tokens
      }
    });
  } catch (error) {
    logger.error('登入失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
});

// 刷新 Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: '請提供刷新令牌'
      });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokens = generateTokens(decoded.userId);
    
    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    logger.error('刷新令牌失敗:', error);
    res.status(401).json({
      success: false,
      message: '無效的刷新令牌'
    });
  }
});

// 登出
router.post('/logout', (req, res) => {
  // 在真實環境中，可以將 Token 加入黑名單
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 驗證 Token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供認證令牌'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '無效的令牌'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('令牌驗證失敗:', error);
    res.status(401).json({
      success: false,
      message: '無效的令牌'
    });
  }
});

export default router;
