import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'express-async-errors';

// 載入環境變數
dotenv.config();

// 導入路由
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import clientRoutes from './routes/clients.js';
import timeEntryRoutes from './routes/timeEntries.js';
import invoiceRoutes from './routes/invoices.js';
import reportRoutes from './routes/reports.js';

// 導入中間件
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

// 安全中間件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 最多 100 個請求
  message: '請求過於頻繁，請稍後再試'
});
app.use('/api/', limiter);

// 壓縮回應
app.use(compression());

// 請求日誌
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康檢查 - 同時支援 /health 和 /api/health
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'TimeTracker Pro Backend',
    version: '1.2.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'TimeTracker Pro Backend',
    version: '1.2.0'
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);

// 靜態檔案 (上傳的檔案)
app.use('/uploads', express.static('uploads'));

// 錯誤處理中間件
app.use(notFound);
app.use(errorHandler);

// 啟動服務器
app.listen(PORT, () => {
  logger.info(`🚀 伺服器運行在 http://localhost:${PORT}`);
  logger.info(`🌟 環境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
