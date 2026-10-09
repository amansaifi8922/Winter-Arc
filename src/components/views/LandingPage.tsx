import React from 'react';
import { UserProfile } from '../../types';
import { CHALLENGE_CONSTANTS, SEED_CHALLENGE_WEEKS } from '../../lib/constants';

interface LandingPageProps {
  currentUser?: UserProfile | null;
  onOpenLogin: () => void;
  onViewLeaderboard: () => void;
  onGoToDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onOpenLogin,
  onViewLeaderboard,
  onGoToDashboard,
}) => {
  return (
    <div className="relative overflow-hidden pb-24">
      
      {/* Background radial atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#00E599]/10 via-[#38BDF8]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-12 md:pt-20 text-center">
        
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#00E599] mb-6 glow-emerald">
          <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse"></span>
          <span>IIT MADRAS BS • NAMDAPHA HOUSE</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">OCT 10 – DEC 31, 2026</span>
        </div>

        {/* Cinematic Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          Winter Arc <span className="bg-gradient-to-r from-[#00E599] via-[#38BDF8] to-white bg-clip-text text-transparent">Namdapha</span>
        </h1>

        {/* Subtext */}
        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          83 days of unyielding focus, physical discipline, and collective accountability.
          Built strictly for the students of Namdapha House. No shortcuts. No vanity. Just daily execution.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {currentUser ? (
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto px-8 py-4 bg-[#00E599] hover:bg-[#00E599]/90 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-xl shadow-[#00E599]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{currentUser.role === 'admin' ? 'Open Admin Control Center' : 'Go to My Dashboard'}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-4 bg-[#00E599] hover:bg-[#00E599]/90 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-xl shadow-[#00E599]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue with Google</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}

          <button
            onClick={onViewLeaderboard}
            className="w-full sm:w-auto px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl text-sm border border-white/10 transition-all cursor-pointer"
          >
            Explore Public Leaderboard
          </button>
        </div>

        {/* Trust & Eligibility Bar */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#00E599]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>IITM Institutional Email Gate</span>
          </div>
          <span className="text-slate-600">•</span>
          <div>Zero External Cash Prizes • 100% Peer Accountability</div>
        </div>
      </section>

      {/* The Three Pillars (Bento Double-Bezel Grid) */}
      <section className="max-w-6xl mx-auto px-4 mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">The Three Non-Negotiables</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">Every week is governed by three measurable standards of personal excellence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pillar 1: Study */}
          <div className="double-bezel">
            <div className="double-bezel-inner h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#00E599]/15 border border-[#00E599]/30 text-[#00E599] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Daily 180-Minute Study</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Record 3 hours of focused academic deep work every calendar day. A study session must be backed by a photo of the completed timer to secure your daily streak.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Target</span>
                <span className="text-[#00E599] font-bold">180 Mins / Day</span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Workout */}
          <div className="double-bezel">
            <div className="double-bezel-inner h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Weekly 3 Workouts</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Push your physical baseline. Log running, gym training, calisthenics, or sports sessions with photo evidence to maintain your weekly workout streak.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Requirement</span>
                <span className="text-[#FF6B35] font-bold">3 Workouts / Week</span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Missions */}
          <div className="double-bezel">
            <div className="double-bezel-inner h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Weekly House Missions</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  One communal challenge every week curated by house coordinators, designed to conquer digital distractions, build habits, and elevate mental grit.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Reward</span>
                <span className="text-[#38BDF8] font-bold">20 Pts / Mission</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Calendar Roadmap (12 Periods) */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-[#00E599]">THE TIMELINE</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">12 Consecutive Challenge Periods</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            October 10 through December 31, 2026. The final period (Dec 26–31) is a calibrated 6-day partial sprint.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {SEED_CHALLENGE_WEEKS.map((w) => (
            <div
              key={w.id}
              className={`p-4 rounded-2xl border transition-all ${
                w.is_partial_week
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-[#0e1017] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-white">Week {w.week_number}</span>
                {w.is_partial_week && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Partial (6d)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate font-medium">{w.title.split(': ')[1]}</p>
              <div className="mt-3 text-[11px] font-mono text-slate-500 flex items-center justify-between border-t border-white/5 pt-2">
                <span>{w.start_date.substring(5)} → {w.end_date.substring(5)}</span>
                <span className="text-slate-400">{w.required_workouts} WODs</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rules & Philosophy Section */}
      <section className="max-w-4xl mx-auto px-4 mt-24">
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <h3 className="text-lg font-bold text-white mb-3">Namdapha House Charter of Integrity</h3>
            <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <p>
                1. <strong>Authoritative Timing:</strong> Study durations are measured through server-anchored timestamps. Browser clock tampering or forged intervals are immediately rejected.
              </p>
              <p>
                2. <strong>Evidence & Review:</strong> Photo evidence supports accountability. Coordinators inspect records and can reject anomalous entries with logged rationale.
              </p>
              <p>
                3. <strong>Midnight Cutoff:</strong> All day and streak records resolve at 23:59:59 IST (Asia/Kolkata). Entries cannot be backdated once the day has passed.
              </p>
              <p>
                4. <strong>Privacy by Design:</strong> Your email address is strictly private and never exposed anywhere on public leaderboards or API endpoints.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
