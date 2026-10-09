import React from 'react';
import { UserProfile, WeeklyMission } from '../../types';
import { db } from '../../lib/database';

interface WeeklyMissionsViewProps {
  user: UserProfile;
  onOpenMissionModal: (mission: WeeklyMission) => void;
}

export const WeeklyMissionsView: React.FC<WeeklyMissionsViewProps> = ({
  user,
  onOpenMissionModal,
}) => {
  const missions = db.getWeeklyMissions();
  const submissions = db.getUserMissionSubmissions(user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#12141c] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#38BDF8]">COMMUNITY HOUSE MISSIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Weekly House Missions</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            One challenge every week curated by Namdapha coordinators to forge mental clarity, habit systems, and peer accountability.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl font-mono text-xs text-white">
          <span>Earn 20 Points per Verified Mission</span>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {missions.map((m) => {
          const submission = submissions.find((s) => s.mission_id === m.id);
          const isCompleted = submission?.status === 'approved';

          return (
            <div key={m.id} className="double-bezel">
              <div className="double-bezel-inner h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                      Week {m.week_number}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00E599]">+{m.point_value} pts</span>
                  </div>

                  <h2 className="text-base font-bold text-white tracking-tight">{m.title}</h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{m.description}</p>

                  <div className="mt-4 p-3 bg-[#090b10] border border-white/5 rounded-2xl space-y-2 text-xs">
                    <div>
                      <p className="text-[10px] font-mono uppercase text-slate-500">Instructions</p>
                      <p className="text-slate-300 whitespace-pre-line mt-0.5">{m.instructions}</p>
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] font-mono uppercase text-slate-500">Submission Criteria</p>
                      <p className="text-slate-300 mt-0.5">{m.criteria}</p>
                    </div>
                  </div>

                  {submission && (
                    <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mission Completed (+{m.point_value} pts)</span>
                      </div>
                      {submission.photo_url && (
                        <img
                          src={submission.photo_url}
                          alt="Proof"
                          className="w-10 h-10 rounded-lg object-cover border border-white/20"
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-500">
                    Deadline: <span className="text-slate-300">{m.deadline.substring(0, 10)}</span>
                  </div>

                  {!isCompleted ? (
                    <button
                      onClick={() => onOpenMissionModal(m)}
                      className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-[#38BDF8]/20"
                    >
                      Submit Proof
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 font-bold">Verified</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
