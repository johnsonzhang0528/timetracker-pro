import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { clientValidation } from '../middleware/validation.js';
import { formatSuccessResponse, formatErrorResponse, paginate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 使用認證中間件
router.use(authenticate);

// 獲取所有客戶
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));
    
    const where = {
      userId: req.user.id,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } }
        ]
      })
    };
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { projects: true }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where })
    ]);
    
    res.json(formatSuccessResponse({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    logger.error('獲取客戶列表失敗:', error);
    res.status(500).json(formatErrorResponse('獲取客戶列表失敗'));
  }
});

// 獲取單個客戶
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { projects: true, invoices: true }
        }
      }
    });
    
    if (!client) {
      return res.status(404).json(formatErrorResponse('找不到指定的客戶'));
    }
    
    res.json(formatSuccessResponse(client));
  } catch (error) {
    logger.error('獲取客戶詳情失敗:', error);
    res.status(500).json(formatErrorResponse('獲取客戶詳情失敗'));
  }
});

// 創建客戶
router.post('/', clientValidation.create, async (req, res) => {
  try {
    const client = await prisma.client.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });
    
    logger.info(`用戶 ${req.user.id} 創建了新客戶: ${client.name}`);
    res.status(201).json(formatSuccessResponse(client, '客戶創建成功'));
  } catch (error) {
    logger.error('創建客戶失敗:', error);
    res.status(500).json(formatErrorResponse('創建客戶失敗'));
  }
});

// 更新客戶
router.put('/:id', clientValidation.update, async (req, res) => {
  try {
    const client = await prisma.client.updateMany({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      data: req.body
    });
    
    if (client.count === 0) {
      return res.status(404).json(formatErrorResponse('找不到指定的客戶'));
    }
    
    const updatedClient = await prisma.client.findUnique({
      where: { id: req.params.id }
    });
    
    logger.info(`用戶 ${req.user.id} 更新了客戶: ${req.params.id}`);
    res.json(formatSuccessResponse(updatedClient, '客戶更新成功'));
  } catch (error) {
    logger.error('更新客戶失敗:', error);
    res.status(500).json(formatErrorResponse('更新客戶失敗'));
  }
});

// 刪除客戶 (軟刪除)
router.delete('/:id', async (req, res) => {
  try {
    const client = await prisma.client.updateMany({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      data: { isActive: false }
    });
    
    if (client.count === 0) {
      return res.status(404).json(formatErrorResponse('找不到指定的客戶'));
    }
    
    logger.info(`用戶 ${req.user.id} 刪除了客戶: ${req.params.id}`);
    res.json(formatSuccessResponse(null, '客戶刪除成功'));
  } catch (error) {
    logger.error('刪除客戶失敗:', error);
    res.status(500).json(formatErrorResponse('刪除客戶失敗'));
  }
});

export default router;
