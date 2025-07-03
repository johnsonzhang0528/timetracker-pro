import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('錯誤處理:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Prisma 錯誤處理
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: '資料重複，請檢查輸入內容'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: '找不到指定的資源'
    });
  }

  // JWT 錯誤處理
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '無效的認證令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '認證令牌已過期'
    });
  }

  // 驗證錯誤
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '資料驗證失敗',
      errors: err.details
    });
  }

  // 預設錯誤處理
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '伺服器內部錯誤' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
