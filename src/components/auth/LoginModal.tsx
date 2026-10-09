import React, { useState } from 'react';
import { db } from '../../lib/database';
import { CHALLENGE_CONSTANTS } from '../../lib/constants';
import { validateEmailEligibility } from '../../lib/validation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (isFirstTime: boolean) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleContinueWithGoogle = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const email = emailInput.trim() || 'student.bs@study.iitm.ac.in';
    const eligibility = validateEmailEligibility(email);

    if (!eligibility.isEligible) {
      setIsLoading(false);
      setErrorMsg(eligibility.reason || 'Email is not eligible.');
      return;
    }

    try {
      const res = await db.signInWithGoogle(email);
      setIsLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        const isFirstTime = res.user.username === null;
        onLoginSuccess(isFirstTime);
        onClose();
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('An unexpected error occurred during authentication.');
    }
  };

  const handleQuickSelect = (email: string) => {
    setEmailInput(email);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e1017] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#00E599]/20 to-[#38BDF8]/20 border border-white/10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-6 h-6">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#00E599" strokeWidth="6" />
              <path d="M30 65 L50 25 L70 65 Z" fill="none" stroke="#38BDF8" strokeWidth="6" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Enter Winter Arc</h2>
          <p className="text-xs text-slate-400 mt-1">
            Namdapha House • IIT Madras BS Degree
          </p>
        </div>

        {/* Primary Google Auth CTA */}
        <div className="space-y-4">
          <button
            onClick={handleContinueWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl transition-all shadow-xl shadow-white/5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm">Continue with Google</span>
          </button>

          {/* Email input for verification demo & production fallback */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Google Account Email (Institutional)</span>
            </div>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. 21f1000000@ds.study.iitm.ac.in"
              className="w-full bg-[#151821] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E599]/60 transition-colors"
            />
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed animate-in fade-in">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Eligibility Domain Notice */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]"></span>
              Eligible Domains
            </div>
            <p>
              Only institutional Google accounts ending in:
            </p>
            <div className="flex flex-wrap gap-1 font-mono text-[10px] text-[#00E599]">
              {CHALLENGE_CONSTANTS.ALLOWED_DOMAINS.map((domain: string) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => handleQuickSelect(`student@${domain}`)}
                  className="bg-[#00E599]/10 hover:bg-[#00E599]/20 px-2 py-0.5 rounded border border-[#00E599]/20 cursor-pointer transition-colors"
                >
                  @{domain}
                </button>
              ))}
            </div>
          </div>

          {/* Test Non-Eligible Email trigger for validation proof */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Test Eligibility Rejection:</span>
            <button
              type="button"
              onClick={() => handleQuickSelect('test_ineligible@gmail.com')}
              className="text-rose-400 hover:text-rose-300 underline font-mono text-[10px]"
            >
              @gmail.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
