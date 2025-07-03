import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { userSettingsValidation } from '../middleware/validation.js';
import { formatSuccessResponse, formatErrorResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 使用認證中間件
router.use(authenticate);

// 獲取用戶資料
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        plan: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json(formatErrorResponse('找不到用戶資料'));
    }
    
    res.json(formatSuccessResponse(user));
  } catch (error) {
    logger.error('獲取用戶資料失敗:', error);
    res.status(500).json(formatErrorResponse('獲取用戶資料失敗'));
  }
});

// 更新用戶資料
router.put('/profile', async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        plan: true
      }
    });
    
    logger.info(`用戶 ${req.user.id} 更新了個人資料`);
    res.json(formatSuccessResponse(user, '個人資料更新成功'));
  } catch (error) {
    logger.error('更新用戶資料失敗:', error);
    res.status(500).json(formatErrorResponse('更新用戶資料失敗'));
  }
});

// 獲取用戶設定
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!settings) {
      // 如果沒有設定，創建預設設定
      const defaultSettings = await prisma.userSettings.create({
        data: { userId: req.user.id }
      });
      return res.json(formatSuccessResponse(defaultSettings));
    }
    
    res.json(formatSuccessResponse(settings));
  } catch (error) {
    logger.error('獲取用戶設定失敗:', error);
    res.status(500).json(formatErrorResponse('獲取用戶設定失敗'));
  }
});

// 更新用戶設定
router.put('/settings', userSettingsValidation.update, async (req, res) => {
  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: req.body,
      create: {
        userId: req.user.id,
        ...req.body
      }
    });
    
    logger.info(`用戶 ${req.user.id} 更新了設定`);
    res.json(formatSuccessResponse(settings, '設定更新成功'));
  } catch (error) {
    logger.error('更新用戶設定失敗:', error);
    res.status(500).json(formatErrorResponse('更新用戶設定失敗'));
  }
});

// 獲取用戶統計
router.get('/stats', async (req, res) => {
  try {
    const [projectCount, clientCount, timeEntryStats, invoiceStats] = await Promise.all([
      prisma.project.count({
        where: { userId: req.user.id }
      }),
      prisma.client.count({
        where: { userId: req.user.id }
      }),
      prisma.timeEntry.aggregate({
        where: { userId: req.user.id },
        _sum: { duration: true, amount: true },
        _count: { id: true }
      }),
      prisma.invoice.aggregate({
        where: { userId: req.user.id },
        _sum: { total: true },
        _count: { id: true }
      })
    ]);
    
    res.json(formatSuccessResponse({
      projects: projectCount,
      clients: clientCount,
      timeEntries: {
        count: timeEntryStats._count.id || 0,
        totalDuration: timeEntryStats._sum.duration || 0,
        totalAmount: timeEntryStats._sum.amount || 0
      },
      invoices: {
        count: invoiceStats._count.id || 0,
        totalAmount: invoiceStats._sum.total || 0
      }
    }));
  } catch (error) {
    logger.error('獲取用戶統計失敗:', error);
    res.status(500).json(formatErrorResponse('獲取用戶統計失敗'));
  }
});

export default router;
