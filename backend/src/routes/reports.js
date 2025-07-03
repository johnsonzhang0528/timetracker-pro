import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { formatSuccessResponse, formatErrorResponse, getDateRange } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 使用認證中間件
router.use(authenticate);

// 獲取時間統計報表
router.get('/time-stats', async (req, res) => {
  try {
    const { period = 'thisWeek', projectId } = req.query;
    const { start, end } = getDateRange(period);
    
    const where = {
      userId: req.user.id,
      startTime: {
        gte: start,
        lte: end
      },
      ...(projectId && { projectId })
    };
    
    // 總體統計
    const totalStats = await prisma.timeEntry.aggregate({
      where,
      _sum: {
        duration: true,
        amount: true
      },
      _count: {
        id: true
      }
    });
    
    // 按專案統計
    const projectStats = await prisma.timeEntry.groupBy({
      by: ['projectId'],
      where,
      _sum: {
        duration: true,
        amount: true
      },
      _count: {
        id: true
      }
    });
    
    // 獲取專案資訊
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectStats.map(stat => stat.projectId) },
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        color: true
      }
    });
    
    // 合併專案資訊
    const projectStatsWithInfo = projectStats.map(stat => {
      const project = projects.find(p => p.id === stat.projectId);
      return {
        project,
        totalDuration: stat._sum.duration || 0,
        totalAmount: stat._sum.amount || 0,
        totalEntries: stat._count.id || 0
      };
    });
    
    // 按日期統計
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(start_time) as date,
        SUM(duration) as total_duration,
        SUM(amount) as total_amount,
        COUNT(*) as total_entries
      FROM time_entries 
      WHERE user_id = ${req.user.id} 
        AND start_time >= ${start}
        AND start_time <= ${end}
        ${projectId ? `AND project_id = ${projectId}` : ''}
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `;
    
    res.json(formatSuccessResponse({
      period,
      dateRange: { start, end },
      total: {
        duration: totalStats._sum.duration || 0,
        amount: totalStats._sum.amount || 0,
        entries: totalStats._count.id || 0
      },
      byProject: projectStatsWithInfo,
      byDate: dailyStats
    }));
  } catch (error) {
    logger.error('獲取時間統計失敗:', error);
    res.status(500).json(formatErrorResponse('獲取時間統計失敗'));
  }
});

// 獲取收入統計報表
router.get('/income-stats', async (req, res) => {
  try {
    const { period = 'thisMonth' } = req.query;
    const { start, end } = getDateRange(period);
    
    // 時間記錄收入統計
    const timeEntryIncome = await prisma.timeEntry.aggregate({
      where: {
        userId: req.user.id,
        startTime: {
          gte: start,
          lte: end
        },
        endTime: { not: null }
      },
      _sum: {
        amount: true
      }
    });
    
    // 發票收入統計
    const invoiceIncome = await prisma.invoice.aggregate({
      where: {
        userId: req.user.id,
        issueDate: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        total: true
      }
    });
    
    // 已付款發票統計
    const paidInvoiceIncome = await prisma.invoice.aggregate({
      where: {
        userId: req.user.id,
        status: 'PAID',
        paidDate: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        total: true
      }
    });
    
    // 按月收入趨勢
    const monthlyIncome = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', issue_date) as month,
        SUM(total) as total_income,
        COUNT(*) as invoice_count
      FROM invoices 
      WHERE user_id = ${req.user.id} 
        AND issue_date >= ${start}
        AND issue_date <= ${end}
      GROUP BY DATE_TRUNC('month', issue_date)
      ORDER BY month ASC
    `;
    
    res.json(formatSuccessResponse({
      period,
      dateRange: { start, end },
      timeEntryIncome: timeEntryIncome._sum.amount || 0,
      invoiceIncome: invoiceIncome._sum.total || 0,
      paidIncome: paidInvoiceIncome._sum.total || 0,
      monthlyTrend: monthlyIncome
    }));
  } catch (error) {
    logger.error('獲取收入統計失敗:', error);
    res.status(500).json(formatErrorResponse('獲取收入統計失敗'));
  }
});

// 獲取專案效率報表
router.get('/project-efficiency', async (req, res) => {
  try {
    const { projectId, period = 'thisMonth' } = req.query;
    const { start, end } = getDateRange(period);
    
    const where = {
      userId: req.user.id,
      startTime: {
        gte: start,
        lte: end
      },
      ...(projectId && { projectId })
    };
    
    // 平均每日工作時間
    const avgDailyHours = await prisma.$queryRaw`
      SELECT 
        AVG(daily_duration) as avg_hours
      FROM (
        SELECT 
          DATE(start_time) as date,
          SUM(duration) / 3600.0 as daily_duration
        FROM time_entries 
        WHERE user_id = ${req.user.id} 
          AND start_time >= ${start}
          AND start_time <= ${end}
          ${projectId ? `AND project_id = ${projectId}` : ''}
        GROUP BY DATE(start_time)
      ) as daily_stats
    `;
    
    // 最高效率時段
    const peakHours = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM start_time) as hour,
        AVG(duration) as avg_duration,
        COUNT(*) as entry_count
      FROM time_entries 
      WHERE user_id = ${req.user.id} 
        AND start_time >= ${start}
        AND start_time <= ${end}
        ${projectId ? `AND project_id = ${projectId}` : ''}
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY avg_duration DESC
      LIMIT 5
    `;
    
    // 工作日分佈
    const weekdayDistribution = await prisma.$queryRaw`
      SELECT 
        EXTRACT(DOW FROM start_time) as weekday,
        SUM(duration) as total_duration,
        COUNT(*) as entry_count
      FROM time_entries 
      WHERE user_id = ${req.user.id} 
        AND start_time >= ${start}
        AND start_time <= ${end}
        ${projectId ? `AND project_id = ${projectId}` : ''}
      GROUP BY EXTRACT(DOW FROM start_time)
      ORDER BY weekday
    `;
    
    res.json(formatSuccessResponse({
      period,
      dateRange: { start, end },
      avgDailyHours: avgDailyHours[0]?.avg_hours || 0,
      peakHours,
      weekdayDistribution
    }));
  } catch (error) {
    logger.error('獲取專案效率報表失敗:', error);
    res.status(500).json(formatErrorResponse('獲取專案效率報表失敗'));
  }
});

// 獲取客戶報表
router.get('/client-stats', async (req, res) => {
  try {
    const { period = 'thisMonth' } = req.query;
    const { start, end } = getDateRange(period);
    
    // 客戶工作時間統計
    const clientStats = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.company,
        SUM(te.duration) as total_duration,
        SUM(te.amount) as total_amount,
        COUNT(te.id) as total_entries,
        COUNT(DISTINCT p.id) as project_count
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
      LEFT JOIN time_entries te ON p.id = te.project_id
      WHERE c.user_id = ${req.user.id}
        AND te.start_time >= ${start}
        AND te.start_time <= ${end}
      GROUP BY c.id, c.name, c.company
      ORDER BY total_amount DESC
    `;
    
    // 客戶發票統計
    const clientInvoiceStats = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        SUM(i.total) as total_invoiced,
        COUNT(i.id) as invoice_count,
        SUM(CASE WHEN i.status = 'PAID' THEN i.total ELSE 0 END) as total_paid
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id
      WHERE c.user_id = ${req.user.id}
        AND i.issue_date >= ${start}
        AND i.issue_date <= ${end}
      GROUP BY c.id, c.name
      ORDER BY total_invoiced DESC
    `;
    
    res.json(formatSuccessResponse({
      period,
      dateRange: { start, end },
      workStats: clientStats,
      invoiceStats: clientInvoiceStats
    }));
  } catch (error) {
    logger.error('獲取客戶報表失敗:', error);
    res.status(500).json(formatErrorResponse('獲取客戶報表失敗'));
  }
});

export default router;
