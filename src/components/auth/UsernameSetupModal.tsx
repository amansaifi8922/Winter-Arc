import React, { useState } from 'react';
import { db } from '../../lib/database';
import { UserProfile } from '../../types';
import { validateUsername } from '../../lib/validation';

interface UsernameSetupModalProps {
  user: UserProfile;
  isOpen: boolean;
  onSuccess: () => void;
}

export const UsernameSetupModal: React.FC<UsernameSetupModalProps> = ({ user, isOpen, onSuccess }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setErrorMsg(null);
    const validation = validateUsername(usernameInput);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Invalid username');
      return;
    }

    setIsSubmitting(true);
    const res = db.setupUsername(user.id, usernameInput);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to set username');
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0e1017] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        <div className="w-12 h-12 rounded-2xl bg-[#00E599]/20 border border-[#00E599]/30 flex items-center justify-center text-[#00E599] mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">Choose Your Arc Handle</h2>
        <p className="text-xs text-slate-400 mt-1">
          This is your unique public identity across the Namdapha House leaderboard. Your email address ({user.email}) remains strictly private.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Public Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">@</span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="e.g. rohan_namdapha"
                className="w-full bg-[#151821] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#00E599]/60"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              3–20 characters. Letters, numbers, and underscores only.
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Rule:</strong> You are permitted at most <strong>one</strong> username change in the future.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSubmitting || !usernameInput.trim()}
            className="w-full py-3 bg-[#00E599] hover:bg-[#00E599]/90 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#00E599]/20"
          >
            Confirm Username & Enter
          </button>
        </div>
      </div>
    </div>
  );
};
