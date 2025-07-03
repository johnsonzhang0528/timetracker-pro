import express from 'express';
import { healthCheck, systemInfo, databaseStats } from './system.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 公開的健康檢查端點
router.get('/health', healthCheck);

// 需要認證的系統資訊端點（僅限管理員）
router.get('/info', authenticate, systemInfo);
router.get('/stats', authenticate, databaseStats);

export default router;
