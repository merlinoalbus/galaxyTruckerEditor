import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/locales';

interface ErrorModalProps {
  message: string;
  duration?: number; // millisecondi
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ 
  message, 
  duration = 5000,
  onClose 
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Timer per auto-chiusura
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Aspetta l'animazione di fade out
    }, duration);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return createPortal(
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="pointer-events-auto bg-red-950/95 border border-red-600 rounded-lg shadow-2xl max-w-md mx-4 backdrop-blur-sm">
        {/* Progress bar */}
        <div className="h-1 bg-red-900 rounded-t-lg overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">{t('visualFlowEditor.validation.error')}</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-red-800/50 rounded transition-colors"
              title={t('visualFlowEditor.errorModal.close')}
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
          
          {/* Message */}
          <div className="text-white text-sm">
            {message}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};