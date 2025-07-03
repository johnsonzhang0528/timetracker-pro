import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { formatSuccessResponse, formatErrorResponse, generateInvoiceNumber, paginate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 使用認證中間件
router.use(authenticate);

// 獲取所有發票
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, clientId } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));
    
    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(clientId && { clientId })
    };
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);
    
    res.json(formatSuccessResponse({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    logger.error('獲取發票列表失敗:', error);
    res.status(500).json(formatErrorResponse('獲取發票列表失敗'));
  }
});

// 獲取單個發票
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        client: true,
        items: true
      }
    });
    
    if (!invoice) {
      return res.status(404).json(formatErrorResponse('找不到指定的發票'));
    }
    
    res.json(formatSuccessResponse(invoice));
  } catch (error) {
    logger.error('獲取發票詳情失敗:', error);
    res.status(500).json(formatErrorResponse('獲取發票詳情失敗'));
  }
});

// 創建發票
router.post('/', async (req, res) => {
  try {
    const { clientId, title, description, items, tax = 0, issueDate, dueDate } = req.body;
    
    // 驗證客戶是否屬於當前用戶
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: req.user.id
      }
    });
    
    if (!client) {
      return res.status(404).json(formatErrorResponse('找不到指定的客戶'));
    }
    
    // 計算小計和總計
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const total = subtotal + tax;
    
    // 生成發票編號
    const invoiceNumber = generateInvoiceNumber();
    
    // 創建發票和發票項目
    const invoice = await prisma.invoice.create({
      data: {
        userId: req.user.id,
        clientId,
        number: invoiceNumber,
        title,
        description,
        subtotal,
        tax,
        total,
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate
          }))
        }
      },
      include: {
        client: true,
        items: true
      }
    });
    
    logger.info(`用戶 ${req.user.id} 創建了新發票: ${invoice.number}`);
    res.status(201).json(formatSuccessResponse(invoice, '發票創建成功'));
  } catch (error) {
    logger.error('創建發票失敗:', error);
    res.status(500).json(formatErrorResponse('創建發票失敗'));
  }
});

// 更新發票
router.put('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { title, description, items, tax, issueDate, dueDate, status } = req.body;
    
    // 驗證發票是否屬於當前用戶
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: req.user.id
      }
    });
    
    if (!existingInvoice) {
      return res.status(404).json(formatErrorResponse('找不到指定的發票'));
    }
    
    // 如果發票已付款，不允許編輯
    if (existingInvoice.status === 'PAID') {
      return res.status(400).json(formatErrorResponse('已付款的發票不能編輯'));
    }
    
    let updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(tax !== undefined && { tax }),
      ...(issueDate && { issueDate: new Date(issueDate) }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(status && { status })
    };
    
    // 如果更新項目，重新計算金額
    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const total = subtotal + (tax || existingInvoice.tax);
      
      updateData.subtotal = subtotal;
      updateData.total = total;
      
      // 刪除舊項目，創建新項目
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId }
      });
      
      updateData.items = {
        create: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate
        }))
      };
    }
    
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        client: true,
        items: true
      }
    });
    
    logger.info(`用戶 ${req.user.id} 更新了發票: ${invoiceId}`);
    res.json(formatSuccessResponse(invoice, '發票更新成功'));
  } catch (error) {
    logger.error('更新發票失敗:', error);
    res.status(500).json(formatErrorResponse('更新發票失敗'));
  }
});

// 刪除發票
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (invoice.count === 0) {
      return res.status(404).json(formatErrorResponse('找不到指定的發票'));
    }
    
    logger.info(`用戶 ${req.user.id} 刪除了發票: ${req.params.id}`);
    res.json(formatSuccessResponse(null, '發票刪除成功'));
  } catch (error) {
    logger.error('刪除發票失敗:', error);
    res.status(500).json(formatErrorResponse('刪除發票失敗'));
  }
});

// 標記發票為已付款
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { paidDate } = req.body;
    
    const invoice = await prisma.invoice.updateMany({
      where: {
        id: invoiceId,
        userId: req.user.id,
        status: { not: 'PAID' }
      },
      data: {
        status: 'PAID',
        paidDate: paidDate ? new Date(paidDate) : new Date()
      }
    });
    
    if (invoice.count === 0) {
      return res.status(404).json(formatErrorResponse('找不到指定的發票或發票已付款'));
    }
    
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        items: true
      }
    });
    
    logger.info(`用戶 ${req.user.id} 標記發票為已付款: ${invoiceId}`);
    res.json(formatSuccessResponse(updatedInvoice, '發票標記為已付款'));
  } catch (error) {
    logger.error('標記發票為已付款失敗:', error);
    res.status(500).json(formatErrorResponse('標記發票為已付款失敗'));
  }
});

// 從時間記錄生成發票
router.post('/generate-from-time-entries', async (req, res) => {
  try {
    const { clientId, timeEntryIds, title, description, tax = 0, issueDate, dueDate } = req.body;
    
    // 驗證客戶是否屬於當前用戶
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: req.user.id
      }
    });
    
    if (!client) {
      return res.status(404).json(formatErrorResponse('找不到指定的客戶'));
    }
    
    // 獲取時間記錄
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        id: { in: timeEntryIds },
        userId: req.user.id,
        isInvoiced: false
      },
      include: {
        project: true
      }
    });
    
    if (timeEntries.length === 0) {
      return res.status(400).json(formatErrorResponse('找不到可開票的時間記錄'));
    }
    
    // 根據專案分組時間記錄
    const groupedByProject = timeEntries.reduce((acc, entry) => {
      const projectId = entry.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: entry.project,
          entries: [],
          totalDuration: 0,
          totalAmount: 0
        };
      }
      acc[projectId].entries.push(entry);
      acc[projectId].totalDuration += entry.duration || 0;
      acc[projectId].totalAmount += entry.amount || 0;
      return acc;
    }, {});
    
    // 生成發票項目
    const items = Object.values(groupedByProject).map(group => {
      const hours = group.totalDuration / 3600;
      const rate = group.totalAmount / hours;
      return {
        description: `${group.project.name} - ${hours.toFixed(2)} 小時`,
        quantity: hours,
        rate: rate,
        amount: group.totalAmount
      };
    });
    
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal + tax;
    
    // 生成發票編號
    const invoiceNumber = generateInvoiceNumber();
    
    // 創建發票
    const invoice = await prisma.invoice.create({
      data: {
        userId: req.user.id,
        clientId,
        number: invoiceNumber,
        title,
        description,
        subtotal,
        tax,
        total,
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }))
        }
      },
      include: {
        client: true,
        items: true
      }
    });
    
    // 標記時間記錄為已開票
    await prisma.timeEntry.updateMany({
      where: {
        id: { in: timeEntryIds },
        userId: req.user.id
      },
      data: { isInvoiced: true }
    });
    
    logger.info(`用戶 ${req.user.id} 從時間記錄生成發票: ${invoice.number}`);
    res.status(201).json(formatSuccessResponse(invoice, '發票生成成功'));
  } catch (error) {
    logger.error('從時間記錄生成發票失敗:', error);
    res.status(500).json(formatErrorResponse('從時間記錄生成發票失敗'));
  }
});

export default router;
