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
    const isRightSwipe = distance < -50;
    const isLeftSwipe = distance > 50;
    
    if (position.includes('right') && isRightSwipe) {
      handleClose();
    } else if (position.includes('left') && isLeftSwipe) {
      handleClose();
    }
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 transform transition-all duration-300 ease-out max-w-sm w-full mx-4 sm:mx-0 ${
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : position.includes('right')
            ? 'translate-x-full opacity-0 scale-95'
            : '-translate-x-full opacity-0 scale-95'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`${bgGradient} ${textColor} rounded-2xl shadow-2xl border-2 ${borderColor} overflow-hidden backdrop-blur-sm`}>
        
        {/* 進度條 */}
        {duration > 0 && (
          <div className="h-1 bg-black bg-opacity-20">
            <div 
              className={`h-full ${progressColor} transition-all duration-75 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* 主要內容 */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold leading-relaxed">
                {message}
              </p>
            </div>
            
            <button 
              onClick={handleClose}
              className="flex-shrink-0 ml-2 p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200 touch-target"
              aria-label="關閉通知"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
