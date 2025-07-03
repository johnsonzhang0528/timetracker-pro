import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { projectValidation } from '../middleware/validation.js';
import { formatSuccessResponse, formatErrorResponse, paginate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 使用認證中間件
router.use(authenticate);

// 獲取所有專案
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, clientId } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));
    
    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(clientId && { clientId })
    };
    
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: true,
          _count: {
            select: { timeEntries: true }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ]);
    
    res.json(formatSuccessResponse({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    logger.error('獲取專案列表失敗:', error);
    res.status(500).json(formatErrorResponse('獲取專案列表失敗'));
  }
});

// 獲取單個專案
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        client: true,
        timeEntries: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { timeEntries: true }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json(formatErrorResponse('找不到指定的專案'));
    }
    
    res.json(formatSuccessResponse(project));
  } catch (error) {
    logger.error('獲取專案詳情失敗:', error);
    res.status(500).json(formatErrorResponse('獲取專案詳情失敗'));
  }
});

// 創建專案
router.post('/', projectValidation.create, async (req, res) => {
  try {
    const project = await prisma.project.create({
      data: {
        ...req.body,
        userId: req.user.id
      },
      include: {
        client: true
      }
    });
    
    logger.info(`用戶 ${req.user.id} 創建了新專案: ${project.name}`);
    res.status(201).json(formatSuccessResponse(project, '專案創建成功'));
  } catch (error) {
    logger.error('創建專案失敗:', error);
    res.status(500).json(formatErrorResponse('創建專案失敗'));
  }
});

// 更新專案
router.put('/:id', projectValidation.update, async (req, res) => {
  try {
    const project = await prisma.project.updateMany({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      data: req.body
    });
    
    if (project.count === 0) {
      return res.status(404).json(formatErrorResponse('找不到指定的專案'));
    }
    
    const updatedProject = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { client: true }
    });
    
    logger.info(`用戶 ${req.user.id} 更新了專案: ${req.params.id}`);
    res.json(formatSuccessResponse(updatedProject, '專案更新成功'));
  } catch (error) {
    logger.error('更新專案失敗:', error);
    res.status(500).json(formatErrorResponse('更新專案失敗'));
  }
});

// 刪除專案
router.delete('/:id', async (req, res) => {
  try {
    const project = await prisma.project.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (project.count === 0) {
      return res.status(404).json(formatErrorResponse('找不到指定的專案'));
    }
    
    logger.info(`用戶 ${req.user.id} 刪除了專案: ${req.params.id}`);
    res.json(formatSuccessResponse(null, '專案刪除成功'));
  } catch (error) {
    logger.error('刪除專案失敗:', error);
    res.status(500).json(formatErrorResponse('刪除專案失敗'));
  }
});

// 獲取專案統計
router.get('/:id/stats', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // 確認專案屬於當前用戶
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user.id
      }
    });
    
    if (!project) {
      return res.status(404).json(formatErrorResponse('找不到指定的專案'));
    }
    
    // 獲取統計數據
    const stats = await prisma.timeEntry.aggregate({
      where: {
        projectId,
        userId: req.user.id
      },
      _sum: {
        duration: true,
        amount: true
      },
      _count: {
        id: true
      }
    });
    
    res.json(formatSuccessResponse({
      totalDuration: stats._sum.duration || 0,
      totalAmount: stats._sum.amount || 0,
      totalEntries: stats._count.id || 0
    }));
  } catch (error) {
    logger.error('獲取專案統計失敗:', error);
    res.status(500).json(formatErrorResponse('獲取專案統計失敗'));
  }
});

export default router;
