import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000, position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  // Toast 配置
  const config = {
    success: {
      icon: CheckCircle,
      bgGradient: 'bg-gradient-to-r from-green-500 to-green-600',
      borderColor: 'border-green-400',
      textColor: 'text-white',
      progressColor: 'bg-green-300'
    },
    error: {
      icon: XCircle,
      bgGradient: 'bg-gradient-to-r from-red-500 to-red-600',
      borderColor: 'border-red-400',
      textColor: 'text-white',
      progressColor: 'bg-red-300'
    },
    info: {
      icon: Info,
      bgGradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      borderColor: 'border-blue-400',
      textColor: 'text-white',
      progressColor: 'bg-blue-300'
    },
    warning: {
      icon: AlertTriangle,
      bgGradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      borderColor: 'border-yellow-400',
      textColor: 'text-white',
      progressColor: 'bg-yellow-300'
    }
  };

  // 位置配置
  const positionClasses = {
    'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
    'top-left': 'top-4 left-4 sm:top-6 sm:left-6',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2 sm:top-6',
    'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
    'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2 sm:bottom-6'
  };

  const { icon: Icon, bgGradient, borderColor, textColor, progressColor } = config[type];

  // 進場動畫
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 自動關閉和進度條
  useEffect(() => {
    if (duration <= 0) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 50);

    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(closeTimer);
    };
  }, [duration]);

  // 處理關閉
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 手勢處理 (滑動關閉)
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      handleClose();
    }
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 max-w-sm w-full mx-4 sm:mx-0 transition-all duration-300 ease-out ${
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : position.includes('right')
            ? 'translate-x-full opacity-0 scale-95'
            : position.includes('left')
            ? '-translate-x-full opacity-0 scale-95'
            : 'translate-y-full opacity-0 scale-95'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="alert"
      aria-live="polite"
    >
      <div className={`${bgGradient} ${textColor} rounded-xl sm:rounded-2xl shadow-2xl border-2 ${borderColor} overflow-hidden relative`}>
        
        {/* 主要內容 */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 flex items-start space-x-3">
          
          {/* 圖示 */}
          <div className="flex-shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          
          {/* 訊息內容 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold leading-tight">
              {message}
            </p>
          </div>
          
          {/* 關閉按鈕 */}
          <button 
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1 rounded-lg hover:bg-white hover:bg-opacity-20 
                     transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white 
                     focus:ring-opacity-50 touch-target"
            aria-label="關閉通知"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {/* 進度條 */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30">
            <div 
              className={`h-full ${progressColor} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* 滑動提示 (僅在觸控裝置顯示) */}
        <div className="absolute top-2 right-2 opacity-30">
          <div className="w-1 h-4 bg-white rounded-full hidden touch:block" />
          <div className="w-1 h-4 bg-white rounded-full hidden touch:block ml-1" />
        </div>
      </div>
    </div>
  );
};

// Toast 容器組件 - 支援多個 Toast
export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map((toast, index) => (
        <div
          key={toast.id || index}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 80}px)`,
            zIndex: 1000 - index
          }}
        >
          <Toast
            {...toast}
            onClose={() => onRemove(toast.id || index)}
            position={toast.position || 'top-right'}
          />
        </div>
      ))}
    </div>
  );
};

// Toast Hook - 方便在其他組件中使用
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', options = {}) => {
    const id = Date.now();
    const newToast = {
      id,
      message,
      type,
      duration: options.duration || 3000,
      position: options.position || 'top-right',
      ...options
    };

    setToasts(prev => [...prev, newToast]);

    // 自動移除 (作為備用機制)
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration + 500);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // 便利方法
  const success = (message, options) => addToast(message, 'success', options);
  const error = (message, options) => addToast(message, 'error', options);
  const info = (message, options) => addToast(message, 'info', options);
  const warning = (message, options) => addToast(message, 'warning', options);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    info,
    warning
  };
};

export default Toast;
