import React, { useState } from 'react';
import { db } from '../../lib/database';

export const LeaderboardView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const leaderboard = db.getLeaderboard();

  const filtered = leaderboard.filter((entry) =>
    entry.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#12141c] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#00E599]">COMMUNITY STANDINGS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Namdapha House Leaderboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Points are earned strictly through daily study consistency, verified workouts, and completed house missions.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search handle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#090b10] border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E599]/60 font-mono"
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Scoring Rules Guide Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
        <div className="p-3 bg-[#0e1017] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Daily Study (180m)</span>
          <span className="text-sm font-mono font-bold text-[#00E599]">+10 pts</span>
        </div>
        <div className="p-3 bg-[#0e1017] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Accepted Workout</span>
          <span className="text-sm font-mono font-bold text-[#FF6B35]">+5 pts</span>
        </div>
        <div className="p-3 bg-[#0e1017] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Weekly Mission</span>
          <span className="text-sm font-mono font-bold text-[#38BDF8]">+20 pts</span>
        </div>
        <div className="p-3 bg-[#0e1017] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">7-Day Streak</span>
          <span className="text-sm font-mono font-bold text-amber-400">+10 bonus</span>
        </div>
        <div className="p-3 bg-[#0e1017] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">14-Day Streak</span>
          <span className="text-sm font-mono font-bold text-amber-400">+20 bonus</span>
        </div>
        <div className="p-3 bg-[#0e1017] border border-white/5 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">30-Day Legend</span>
          <span className="text-sm font-mono font-bold text-purple-400">+50 bonus</span>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="double-bezel">
        <div className="double-bezel-inner overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-center">Study Streak</th>
                <th className="py-3 px-4 text-center">Study Days</th>
                <th className="py-3 px-4 text-center">Workouts</th>
                <th className="py-3 px-4 text-center">Missions</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {filtered.map((entry) => {
                const isTop3 = entry.rank && entry.rank <= 3;
                return (
                  <tr
                    key={entry.user_id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-4 font-bold">
                      {entry.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-extrabold">1</span>
                      ) : entry.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center text-xs font-extrabold">2</span>
                      ) : entry.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs font-extrabold">3</span>
                      ) : (
                        <span className="text-slate-500">#{entry.rank}</span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-sans font-medium text-white">
                      <div className="flex items-center gap-3">
                        {entry.avatar_url ? (
                          <img
                            src={entry.avatar_url}
                            alt={entry.username}
                            className="w-8 h-8 rounded-full object-cover border border-white/15"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 text-slate-300 flex items-center justify-center font-bold text-xs">
                            {entry.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-white">@{entry.username}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{entry.house} House</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-slate-200">
                        <span className="text-[#FF6B35]">🔥</span>
                        <span>{entry.current_study_streak}d</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center text-slate-300">
                      {entry.completed_study_days}
                    </td>

                    <td className="py-4 px-4 text-center text-[#FF6B35]">
                      {entry.completed_workouts}
                    </td>

                    <td className="py-4 px-4 text-center text-[#38BDF8]">
                      {entry.completed_missions}
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-sm">
                      <span className={isTop3 ? 'text-[#00E599]' : 'text-white'}>
                        {entry.total_points} pts
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
