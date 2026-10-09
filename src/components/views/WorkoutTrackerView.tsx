import React, { useState } from 'react';
import { UserProfile, WorkoutEntry } from '../../types';
import { db } from '../../lib/database';
import { SEED_CHALLENGE_WEEKS } from '../../lib/constants';
import { getKolkataDateString, getChallengeWeekForDate } from '../../lib/timezone';

interface WorkoutTrackerViewProps {
  user: UserProfile;
  onOpenWorkoutModal: () => void;
}

export const WorkoutTrackerView: React.FC<WorkoutTrackerViewProps> = ({
  user,
  onOpenWorkoutModal,
}) => {
  const todayIST = getKolkataDateString();
  const currentWeek = getChallengeWeekForDate(todayIST) || SEED_CHALLENGE_WEEKS[0];
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(currentWeek.week_number);

  const workouts = db.getUserWorkouts(user.id);
  const selectedWeekMeta = SEED_CHALLENGE_WEEKS.find((w) => w.week_number === selectedWeekNumber) || currentWeek;

  const filteredWorkouts = workouts.filter((w) => w.challenge_week_id === selectedWeekMeta.id);
  const approvedCount = filteredWorkouts.filter((w) => w.status === 'approved').length;
  const targetWorkouts = selectedWeekMeta.required_workouts;
  const isGoalReached = approvedCount >= targetWorkouts;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#12141c] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35]"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B35]">PHYSICAL DISCIPLINE TRACKER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Namdapha Workout Protocol</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Target: 3 verified workouts per challenge week. Photo evidence is required for every session.
          </p>
        </div>

        <button
          onClick={onOpenWorkoutModal}
          className="px-6 py-3.5 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-[#FF6B35]/20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Log Workout Session
        </button>
      </div>

      {/* Week Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SEED_CHALLENGE_WEEKS.map((w) => {
          const isSelected = w.week_number === selectedWeekNumber;
          const isCurrent = w.week_number === currentWeek.week_number;
          const count = workouts.filter((wo) => wo.challenge_week_id === w.id && wo.status === 'approved').length;
          const met = count >= w.required_workouts;

          return (
            <button
              key={w.id}
              onClick={() => setSelectedWeekNumber(w.week_number)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono shrink-0 transition-all border flex items-center gap-2 ${
                isSelected
                  ? 'bg-white/15 border-white/20 text-white font-bold shadow-lg'
                  : 'bg-[#0e1017] border-white/5 text-slate-400 hover:text-white hover:border-white/10'
              }`}
            >
              <span>W{w.week_number}</span>
              {met ? (
                <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
              ) : isCurrent ? (
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Selected Week Status Card */}
      <div className="double-bezel">
        <div className="double-bezel-inner">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{selectedWeekMeta.title}</h2>
                {selectedWeekMeta.is_partial_week && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Partial Week (2 WODs)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedWeekMeta.start_date} to {selectedWeekMeta.end_date} (Asia/Kolkata)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Weekly Progress</span>
                <span className="text-lg font-mono font-bold text-white">
                  {approvedCount} / {targetWorkouts}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                isGoalReached ? 'bg-[#00E599]/20 text-[#00E599]' : 'bg-white/5 text-slate-400'
              }`}>
                {isGoalReached ? 'GOAL MET' : `${targetWorkouts - approvedCount} REMAINING`}
              </span>
            </div>
          </div>

          {/* Workouts List for this week */}
          <div className="mt-6">
            <h3 className="text-xs font-mono uppercase text-slate-500 mb-3">Logged Sessions for this Period</h3>

            {filteredWorkouts.length === 0 ? (
              <div className="text-center py-12 bg-[#090b10] border border-white/5 rounded-2xl">
                <p className="text-xs text-slate-500">No workout records logged for Week {selectedWeekNumber}.</p>
                <button
                  onClick={onOpenWorkoutModal}
                  className="mt-3 text-xs text-[#FF6B35] hover:underline font-semibold"
                >
                  Log a workout now →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredWorkouts.map((w) => (
                  <div key={w.id} className="bg-[#090b10] border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between">
                    {w.photo_url && (
                      <div className="h-40 w-full overflow-hidden bg-black/40 relative">
                        <img
                          src={w.photo_url}
                          alt={w.workout_type}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-black/70 backdrop-blur-md text-[#00E599] border border-[#00E599]/30">
                          {w.status}
                        </span>
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{w.workout_type}</h4>
                          <span className="text-xs font-mono text-[#FF6B35] font-semibold">{w.duration_minutes}m</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 mt-1">{w.workout_date}</p>
                        {w.notes && (
                          <p className="text-xs text-slate-300 mt-2 bg-white/5 p-2 rounded-xl italic">
                            "{w.notes}"
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Points Awarded</span>
                        <span className="text-[#00E599] font-bold">+5 pts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
