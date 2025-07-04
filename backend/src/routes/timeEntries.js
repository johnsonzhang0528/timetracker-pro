import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { timeEntryValidation } from '../middleware/validation.js';
import { formatSuccessResponse, formatErrorResponse, paginate, calculateDuration, calculateAmount } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 使用認證中間件
router.use(authenticate);

// 獲取所有時間記錄
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, projectId, startDate, endDate } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));
    
    const where = {
      userId: req.user.id,
      ...(projectId && { projectId }),
      ...(startDate && endDate && {
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };
    
    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        },
        skip,
        take,
        orderBy: { startTime: 'desc' }
      }),
      prisma.timeEntry.count({ where })
    ]);
    
    res.json(formatSuccessResponse({
      timeEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    logger.error('獲取時間記錄失敗:', error);
    res.status(500).json(formatErrorResponse('獲取時間記錄失敗'));
  }
});

// 獲取當前計時狀態 - 確保此路由在 /:id 路由之前定義
router.get('/active', async (req, res) => {
  try {
    console.log('Accessing /active route with user:', req.user?.id);
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    res.json(formatSuccessResponse(activeEntry));
  } catch (error) {
    logger.error('獲取當前計時狀態失敗:', error);
    res.status(500).json(formatErrorResponse('獲取當前計時狀態失敗'));
  }
});

// 獲取單個時間記錄
router.get('/:id', async (req, res) => {
  try {
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    if (!timeEntry) {
      return res.status(404).json(formatErrorResponse('找不到指定的時間記錄'));
    }
    
    res.json(formatSuccessResponse(timeEntry));
  } catch (error) {
    logger.error('獲取時間記錄詳情失敗:', error);
    res.status(500).json(formatErrorResponse('獲取時間記錄詳情失敗'));
  }
});

// 創建時間記錄
router.post('/', timeEntryValidation.create, async (req, res) => {
  try {
    const { projectId, description, startTime, endTime, hourlyRate } = req.body;
    
    // 驗證專案是否屬於當前用戶
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user.id
      }
    });
    
    if (!project) {
      return res.status(404).json(formatErrorResponse('找不到指定的專案'));
    }
    
    // 計算時間長度和金額
    const duration = endTime ? calculateDuration(startTime, endTime) : null;
    const rate = hourlyRate || project.hourlyRate || 0;
    const amount = duration ? calculateAmount(duration, rate) : null;
    
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        projectId,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        hourlyRate: rate,
        amount
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    logger.info(`用戶 ${req.user.id} 創建了新時間記錄: ${timeEntry.id}`);
    res.status(201).json(formatSuccessResponse(timeEntry, '時間記錄創建成功'));
  } catch (error) {
    logger.error('創建時間記錄失敗:', error);
    res.status(500).json(formatErrorResponse('創建時間記錄失敗'));
  }
});

// 更新時間記錄
router.put('/:id', timeEntryValidation.update, async (req, res) => {
  try {
    const timeEntryId = req.params.id;
    const updates = req.body;
    
    // 獲取現有記錄
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        userId: req.user.id
      }
    });
    
    if (!existingEntry) {
      return res.status(404).json(formatErrorResponse('找不到指定的時間記錄'));
    }
    
    // 如果更新了時間，重新計算時間長度和金額
    const startTime = updates.startTime ? new Date(updates.startTime) : existingEntry.startTime;
    const endTime = updates.endTime ? new Date(updates.endTime) : existingEntry.endTime;
    
    if (startTime && endTime) {
      const duration = calculateDuration(startTime, endTime);
      const rate = updates.hourlyRate || existingEntry.hourlyRate || 0;
      const amount = calculateAmount(duration, rate);
      
      updates.duration = duration;
      updates.amount = amount;
    }
    
    const timeEntry = await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: updates,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    logger.info(`用戶 ${req.user.id} 更新了時間記錄: ${timeEntryId}`);
    res.json(formatSuccessResponse(timeEntry, '時間記錄更新成功'));
  } catch (error) {
    logger.error('更新時間記錄失敗:', error);
    res.status(500).json(formatErrorResponse('更新時間記錄失敗'));
  }
});

// 刪除時間記錄
router.delete('/:id', async (req, res) => {
  try {
    const timeEntry = await prisma.timeEntry.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (timeEntry.count === 0) {
      return res.status(404).json(formatErrorResponse('找不到指定的時間記錄'));
    }
    
    logger.info(`用戶 ${req.user.id} 刪除了時間記錄: ${req.params.id}`);
    res.json(formatSuccessResponse(null, '時間記錄刪除成功'));
  } catch (error) {
    logger.error('刪除時間記錄失敗:', error);
    res.status(500).json(formatErrorResponse('刪除時間記錄失敗'));
  }
});

// 開始計時
router.post('/start', async (req, res) => {
  try {
    const { projectId, description } = req.body;
    
    console.log(`用戶 ${req.user.id} 嘗試開始計時，專案: ${projectId}, 描述: ${description || '無'}`);
    
    // 驗證專案是否屬於當前用戶
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user.id
      }
    });
    
    if (!project) {
      console.log(`找不到專案 ${projectId} 或專案不屬於用戶 ${req.user.id}`);
      return res.status(404).json(formatErrorResponse('找不到指定的專案'));
    }
    
    // 檢查是否有正在進行的計時
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null
      }
    });
    
    if (activeEntry) {
      console.log(`用戶 ${req.user.id} 已有正在進行的計時: ${activeEntry.id}`);
      return res.status(400).json(formatErrorResponse('已有正在進行的計時，請先停止', {
        activeEntryId: activeEntry.id,
        activeProjectId: activeEntry.projectId
      }));
    }
    
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        projectId,
        description,
        startTime: new Date(),
        hourlyRate: project.hourlyRate || 0
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    console.log(`用戶 ${req.user.id} 成功開始計時: ${timeEntry.id}`);
    logger.info(`用戶 ${req.user.id} 開始計時: ${timeEntry.id}`);
    res.status(201).json(formatSuccessResponse(timeEntry, '計時開始'));
  } catch (error) {
    console.error('開始計時失敗:', error);
    logger.error('開始計時失敗:', error);
    res.status(500).json(formatErrorResponse('開始計時失敗'));
  }
});

// 停止計時
router.post('/stop/:id', async (req, res) => {
  try {
    const timeEntryId = req.params.id;
    
    // 輸出詳細日誌以便調試
    console.log(`嘗試停止計時，ID: ${timeEntryId}`, {
      user: req.user.id,
      params: req.params,
      url: req.url
    });
    
    // 放寬查詢條件，先找到記錄再判斷是否可以停止
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        userId: req.user.id
      }
    });
    
    if (!existingEntry) {
      console.log(`找不到計時記錄，ID: ${timeEntryId}`);
      return res.status(404).json(formatErrorResponse(`找不到計時記錄 (ID: ${timeEntryId})`));
    }
    
    // 檢查是否已經結束計時
    if (existingEntry.endTime) {
      console.log(`計時記錄已經結束，ID: ${timeEntryId}, 結束時間: ${existingEntry.endTime}`);
      return res.status(400).json(formatErrorResponse('此計時記錄已經結束'));
    }
    
    const endTime = new Date();
    const duration = calculateDuration(existingEntry.startTime, endTime);
    const amount = calculateAmount(duration, existingEntry.hourlyRate);
    
    const timeEntry = await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        endTime,
        duration,
        amount
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    logger.info(`用戶 ${req.user.id} 停止計時: ${timeEntryId}`);
    res.json(formatSuccessResponse(timeEntry, '計時停止'));
  } catch (error) {
    logger.error('停止計時失敗:', error);
    res.status(500).json(formatErrorResponse('停止計時失敗'));
  }
});

export default router;
