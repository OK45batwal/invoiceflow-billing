import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'danger':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/90 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/30';
      case 'warning':
        return 'bg-amber-50/90 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/30';
      case 'danger':
        return 'bg-rose-50/90 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/30';
      default:
        return 'bg-blue-50/90 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/30';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full no-print">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-2xl border shadow-premium backdrop-blur-md animate-fade-slide-up transition-all ${getBgColor(toast.type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          <div className="flex-grow text-sm font-medium text-text-primary dark:text-slate-200">
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
