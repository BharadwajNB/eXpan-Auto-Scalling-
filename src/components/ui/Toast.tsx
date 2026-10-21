import React, { useEffect } from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { AlertTriangle, CheckCircle, Info, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast: React.FC = () => {
  const toast = useSystemStore((state) => state.toast);
  const dismissToast = useSystemStore((state) => state.dismissToast);

  // Automatically dismiss the toast after 5 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      dismissToast();
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast?.id, dismissToast]);

  if (!toast) return null;

  const icons = {
    info: <Info className="w-5 h-5 text-white shrink-0" />,
    success: <CheckCircle className="w-5 h-5 text-white shrink-0" />,
    warning: <Zap className="w-5 h-5 text-white shrink-0" />,
    alert: <AlertTriangle className="w-5 h-5 text-white shrink-0" />,
  };

  const borderStyles = {
    info: 'border-neutral-700 shadow-2xl',
    success: 'border-white/40 shadow-2xl',
    warning: 'border-white/60 shadow-2xl',
    alert: 'border-white shadow-2xl',
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 max-w-md w-full pointer-events-none select-none font-mono">
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`pointer-events-auto p-4 rounded-xl bg-neutral-950/95 backdrop-blur-xl border ${borderStyles[toast.type]} flex items-start gap-3 relative overflow-hidden`}
        >
          {icons[toast.type]}
          <div className="flex-1 pr-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white tracking-tight">{toast.title}</h4>
              <span className="text-[10px] text-neutral-400 font-mono">{toast.timestamp}</span>
            </div>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed font-sans">{toast.message}</p>
          </div>
          <button
            onClick={dismissToast}
            className="text-neutral-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-neutral-800"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 5-Second Animated Auto-Dismiss Progress Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 overflow-hidden">
            <motion.div
              key={toast.id}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-full bg-white"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
