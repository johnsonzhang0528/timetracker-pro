import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// 認證中間件
export const authenticate = async (req, res, next) => {
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
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('認證失敗:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已過期'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '無效的令牌'
    });
  }
};

// 授權中間件 (檢查用戶方案)
export const authorize = (requiredPlan) => {
  return (req, res, next) => {
    const userPlan = req.user.plan;
    
    // 方案等級定義
    const planLevels = {
      'FREE': 0,
      'PRO': 1,
      'BUSINESS': 2
    };
    
    if (planLevels[userPlan] < planLevels[requiredPlan]) {
      return res.status(403).json({
        success: false,
        message: '需要升級到更高的方案才能使用此功能'
      });
    }
    
    next();
  };
};
