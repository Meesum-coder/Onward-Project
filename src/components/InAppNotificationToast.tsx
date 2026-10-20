import React from 'react';
import { Bell, X } from 'lucide-react';
import { InAppNotification } from '../utils/notifications.ts';

interface InAppNotificationToastProps {
  notifications: InAppNotification[];
  onDismiss: (id: string) => void;
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {notifications.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto bg-neutral-900 border border-neutral-700/80 rounded-2xl p-4 shadow-2xl text-white flex items-start gap-3 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="p-2 rounded-xl bg-neutral-800 text-neutral-200 shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{item.message}</p>
          </div>
          <button
            onClick={() => onDismiss(item.id)}
            aria-label="Dismiss notification"
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
