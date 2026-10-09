import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { db } from '../../lib/database';

interface NavbarProps {
  currentUser: UserProfile | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenLogin,
}) => {
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const allProfiles = db.getAllProfiles();

  const isStaff = currentUser?.role === 'coordinator' || currentUser?.role === 'admin';

  return (
    <header className="sticky top-4 z-40 px-4 max-w-7xl mx-auto mb-6">
      <nav className="bg-[#0e1017]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between">
        
        {/* Brand / Insignia */}
        <div 
          onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E599]/20 via-[#38BDF8]/20 to-transparent border border-white/10 flex items-center justify-center p-2 group-hover:border-[#00E599]/40 transition-colors">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#00E599" strokeWidth="6" />
              <path d="M30 65 L50 25 L70 65 Z" fill="none" stroke="#38BDF8" strokeWidth="6" strokeLinejoin="round" />
              <circle cx="50" cy="52" r="6" fill="#FF6B35" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">WINTER ARC</span>
              <span className="text-[10px] tracking-widest uppercase font-mono px-1.5 py-0.5 rounded bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/20">
                NAMDAPHA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">IIT Madras BS Community</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {currentUser ? (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-white/10 text-white shadow-inner font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('workouts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'workouts'
                    ? 'bg-white/10 text-white shadow-inner font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Workouts
              </button>
              <button
                onClick={() => onNavigate('missions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'missions'
                    ? 'bg-white/10 text-white shadow-inner font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Missions
              </button>
              <button
                onClick={() => onNavigate('leaderboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'leaderboard'
                    ? 'bg-white/10 text-white shadow-inner font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Leaderboard
              </button>
              {isStaff && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    currentView === 'admin'
                      ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30 font-semibold'
                      : 'text-slate-400 hover:text-[#FF6B35] hover:bg-white/5'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse"></span>
                  {currentUser.role === 'admin' ? 'Admin Portal' : 'Coordinator'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('landing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  currentView === 'landing' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onNavigate('leaderboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  currentView === 'leaderboard' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Leaderboard
              </button>
            </>
          )}
        </div>

        {/* Right Area: User Pill / Auth / Switcher */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="relative">
              <div className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-2 pr-3 py-1 transition-colors">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username || 'User'}
                    className="w-6 h-6 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center text-xs font-bold font-mono">
                    {currentUser.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                
                <div 
                  className="cursor-pointer"
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white max-w-[100px] truncate">
                      @{currentUser.username || 'setup_user'}
                    </span>
                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded ${
                      currentUser.role === 'admin' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : currentUser.role === 'coordinator'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                {/* Quick Persona Switcher Toggle */}
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  title="Switch Persona / Role for Testing"
                  className="text-slate-400 hover:text-white p-1 rounded-full"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Persona Switcher Dropdown */}
              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0e1017] border border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1.5 border-b border-white/10 mb-1">
                    <p className="text-[11px] font-semibold text-slate-300">Switch Test Persona</p>
                    <p className="text-[10px] text-slate-500">Test platform roles instantaneously</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {allProfiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          db.switchUser(p.id);
                          setShowRoleSwitcher(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          p.id === currentUser.id ? 'bg-[#00E599]/15 text-[#00E599]' : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-semibold truncate">@{p.username || 'unnamed'}</p>
                          <p className="text-[10px] text-slate-500 truncate">{p.email}</p>
                        </div>
                        <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-white/5 text-slate-400">
                          {p.role}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/10 mt-1 pt-1">
                    <button
                      onClick={() => {
                        db.signOut();
                        setShowRoleSwitcher(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#00E599] to-[#38BDF8] text-black text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-[#00E599]/20"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Mobile nav bar */}
      {currentUser && (
        <div className="md:hidden flex items-center justify-around bg-[#0e1017]/95 border border-white/10 rounded-xl px-2 py-2 mt-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`text-xs px-2 py-1 rounded ${currentView === 'dashboard' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('workouts')}
            className={`text-xs px-2 py-1 rounded ${currentView === 'workouts' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400'}`}
          >
            Workouts
          </button>
          <button
            onClick={() => onNavigate('missions')}
            className={`text-xs px-2 py-1 rounded ${currentView === 'missions' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400'}`}
          >
            Missions
          </button>
          <button
            onClick={() => onNavigate('leaderboard')}
            className={`text-xs px-2 py-1 rounded ${currentView === 'leaderboard' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400'}`}
          >
            Rankings
          </button>
          {isStaff && (
            <button
              onClick={() => onNavigate('admin')}
              className={`text-xs px-2 py-1 rounded ${currentView === 'admin' ? 'bg-[#FF6B35]/20 text-[#FF6B35] font-semibold' : 'text-[#FF6B35]'}`}
            >
              Admin
            </button>
          )}
        </div>
      )}
    </header>
  );
};
