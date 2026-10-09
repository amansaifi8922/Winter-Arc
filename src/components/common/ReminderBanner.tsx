import React, { useState } from 'react';
import { NotificationItem } from '../../types';

interface ReminderBannerProps {
  reminders: NotificationItem[];
  onAction?: (actionUrl: string) => void;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({ reminders, onAction }) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeReminders = reminders.filter((r) => !dismissedIds.has(r.id));
  if (activeReminders.length === 0) return null;

  const current = activeReminders[0];

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 shadow-lg transition-all ${
        current.type === 'warning'
          ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
          : 'bg-[#151821] border-white/10 text-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            current.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-[#00E599]/20 text-[#00E599]'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold">{current.title}</p>
            <p className="text-xs text-slate-400">{current.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {current.action_url && onAction && (
            <button
              onClick={() => onAction(current.action_url!)}
              className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Action
            </button>
          )}
          <button
            onClick={() => handleDismiss(current.id)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
            title="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
