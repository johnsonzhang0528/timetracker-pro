import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// 系統健康檢查
export const healthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // 基本系統資訊
    const systemInfo = {
      service: 'TimeTracker Pro Backend',
      version: '1.3.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      status: 'OK'
    };

    // 檢查資料庫連接
    let dbStatus = 'OK';
    let dbResponseTime = 0;
    
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'ERROR';
      logger.error('資料庫健康檢查失敗:', error);
    }

    // 檢查關鍵環境變數
    const envCheck = {
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      FRONTEND_URL: !!process.env.FRONTEND_URL
    };

    const responseTime = Date.now() - startTime;

    const healthData = {
      ...systemInfo,
      checks: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        },
        environment: envCheck,
        api: {
          status: 'OK',
          responseTime
        }
      }
    };

    // 如果有關鍵服務故障，回傳 503
    if (dbStatus !== 'OK') {
      healthData.status = 'DEGRADED';
      return res.status(503).json(healthData);
    }

    res.json(healthData);
    
  } catch (error) {
    logger.error('健康檢查失敗:', error);
    res.status(500).json({
      service: 'TimeTracker Pro Backend',
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// 詳細系統資訊
export const systemInfo = async (req, res) => {
  try {
    // 檢查使用者數量
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const timeEntryCount = await prisma.timeEntry.count();
    const invoiceCount = await prisma.invoice.count();

    // 最近 24 小時的活動
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = {
      newUsers: await prisma.user.count({
        where: { createdAt: { gte: yesterday } }
      }),
      newProjects: await prisma.project.count({
        where: { createdAt: { gte: yesterday } }
      }),
      newTimeEntries: await prisma.timeEntry.count({
        where: { createdAt: { gte: yesterday } }
      })
    };

    // 系統資源使用
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    const systemData = {
      service: 'TimeTracker Pro Backend',
      version: '1.3.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      memory: memoryUsageMB,
      statistics: {
        users: userCount,
        projects: projectCount,
        timeEntries: timeEntryCount,
        invoices: invoiceCount
      },
      recentActivity,
      platform: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      }
    };

    res.json(systemData);
    
  } catch (error) {
    logger.error('系統資訊查詢失敗:', error);
    res.status(500).json({
      error: '無法獲取系統資訊',
      message: error.message
    });
  }
};

// 資料庫統計
export const databaseStats = async (req, res) => {
  try {
    // 各表的記錄數量
    const [users, projects, clients, timeEntries, invoices] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.client.count(),
      prisma.timeEntry.count(),
      prisma.invoice.count()
    ]);

    // 最活躍的用戶（最多時間記錄）
    const activeUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            timeEntries: true,
            projects: true
          }
        }
      },
      orderBy: {
        timeEntries: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // 今天的統計
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = {
      timeEntries: await prisma.timeEntry.count({
        where: { createdAt: { gte: today } }
      }),
      totalDuration: await prisma.timeEntry.aggregate({
        where: { 
          createdAt: { gte: today },
          endTime: { not: null }
        },
        _sum: { duration: true }
      }),
      activeUsers: await prisma.timeEntry.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: today } }
      }).then(groups => groups.length)
    };

    const stats = {
      tables: {
        users,
        projects,
        clients,
        timeEntries,
        invoices
      },
      activeUsers,
      today: {
        ...todayStats,
        totalHours: todayStats.totalDuration._sum.duration ? 
          Math.round(todayStats.totalDuration._sum.duration / 3600) : 0
      },
      timestamp: new Date().toISOString()
    };

    res.json(stats);
    
  } catch (error) {
    logger.error('資料庫統計查詢失敗:', error);
    res.status(500).json({
      error: '無法獲取資料庫統計',
      message: error.message
    });
  }
};
