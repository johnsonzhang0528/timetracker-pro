import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      icon: CheckCircle,
      bgGradient: 'bg-gradient-to-r from-green-500 to-green-600',
      borderColor: 'border-green-400',
      textColor: 'text-white'
    },
    error: {
      icon: XCircle,
      bgGradient: 'bg-gradient-to-r from-red-500 to-red-600',
      borderColor: 'border-red-400',
      textColor: 'text-white'
    },
    info: {
      icon: Info,
      bgGradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      borderColor: 'border-blue-400',
      textColor: 'text-white'
    },
    warning: {
      icon: AlertTriangle,
      bgGradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      borderColor: 'border-yellow-400',
      textColor: 'text-white'
    }
  };

  const { icon: Icon, bgGradient, borderColor, textColor } = config[type];

  return (
    <div className={`fixed top-6 right-6 ${bgGradient} ${textColor} px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 z-50 transform transition-all duration-300 ease-in-out animate-slide-in max-w-sm border-2 ${borderColor}`}>
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
      <button 
        onClick={onClose}
        className="ml-2 text-white hover:text-gray-200 flex-shrink-0 w-6 h-6 rounded-full hover:bg-white hover:bg-opacity-20 flex items-center justify-center transition-all duration-200"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
