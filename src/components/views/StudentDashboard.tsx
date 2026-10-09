import React, { useState, useEffect } from 'react';
import { UserProfile, StudySession, DailyStudyEvidence, WorkoutEntry, WeeklyMission, MissionSubmission } from '../../types';
import { db } from '../../lib/database';
import { CHALLENGE_CONSTANTS, SEED_CHALLENGE_WEEKS } from '../../lib/constants';
import { getKolkataDateString, formatSecondsToTimer, formatSecondsToHoursMinutes, getChallengeWeekForDate } from '../../lib/timezone';
import confetti from 'canvas-confetti';

interface StudentDashboardProps {
  user: UserProfile;
  onNavigate: (view: string) => void;
  onOpenStudyEvidenceModal: () => void;
  onOpenWorkoutModal: () => void;
  onOpenMissionModal: (mission: WeeklyMission) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onNavigate,
  onOpenStudyEvidenceModal,
  onOpenWorkoutModal,
  onOpenMissionModal,
}) => {
  const todayIST = getKolkataDateString();
  const currentWeek = getChallengeWeekForDate(todayIST) || SEED_CHALLENGE_WEEKS[0];

  // User Stats & records
  const [stats, setStats] = useState(db.getUserStats(user.id));
  const [activeSession, setActiveSession] = useState<StudySession | null>(db.getActiveStudySession(user.id));
  const [todayStudySeconds, setTodayStudySeconds] = useState(db.getTodayStudyTotalSeconds(user.id, todayIST));
  const [todayEvidence, setTodayEvidence] = useState<DailyStudyEvidence | null>(db.getDailyStudyEvidence(user.id, todayIST));
  const [userWorkouts, setUserWorkouts] = useState<WorkoutEntry[]>(db.getUserWorkouts(user.id));
  const [activeMission, setActiveMission] = useState<WeeklyMission | undefined>(
    db.getWeeklyMissions().find((m) => m.challenge_week_id === currentWeek.id && m.is_published)
  );
  const [missionSubmission, setMissionSubmission] = useState<MissionSubmission | null>(
    activeMission ? db.getMissionSubmission(user.id, activeMission.id) : null
  );

  // Live timer tick for active session
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);

  // Refresh data from db on change
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setStats(db.getUserStats(user.id));
      const curr = db.getActiveStudySession(user.id);
      setActiveSession(curr);
      setTodayStudySeconds(db.getTodayStudyTotalSeconds(user.id, todayIST));
      setTodayEvidence(db.getDailyStudyEvidence(user.id, todayIST));
      setUserWorkouts(db.getUserWorkouts(user.id));
      const missions = db.getWeeklyMissions();
      const currentM = missions.find((m) => m.challenge_week_id === currentWeek.id && m.is_published);
      setActiveMission(currentM);
      if (currentM) {
        setMissionSubmission(db.getMissionSubmission(user.id, currentM.id));
      }
    });

    return () => unsubscribe();
  }, [user.id, todayIST, currentWeek.id]);

  // Live timer clock
  useEffect(() => {
    if (!activeSession) {
      setLiveElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      if (activeSession.status === 'active') {
        const startMs = new Date(activeSession.started_at).getTime();
        const nowMs = Date.now();
        const totalPausedMs = activeSession.total_paused_seconds * 1000;
        const currentPausedMs = 0;
        const elapsed = Math.max(0, Math.floor((nowMs - startMs - totalPausedMs - currentPausedMs) / 1000));
        setLiveElapsedSeconds(elapsed);
      } else if (activeSession.status === 'paused') {
        // Kept frozen at last paused value
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Handle timer controls
  const handleStartTimer = () => {
    const res = db.startStudySession(user.id);
    if (res.session) {
      setActiveSession(res.session);
    }
  };

  const handlePauseTimer = () => {
    if (activeSession) {
      const res = db.pauseStudySession(activeSession.id);
      if (res.session) setActiveSession(res.session);
    }
  };

  const handleResumeTimer = () => {
    if (activeSession) {
      const res = db.resumeStudySession(activeSession.id);
      if (res.session) setActiveSession(res.session);
    }
  };

  const handleStopTimer = () => {
    if (activeSession) {
      const res = db.stopStudySession(activeSession.id);
      setActiveSession(null);
      setTodayStudySeconds(res.todayTotalSeconds);
      if (res.goalReached && !todayEvidence) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        } catch {}
      }
    }
  };

  // Study progress metrics
  const totalRecordedSeconds = todayStudySeconds + (activeSession?.status === 'active' ? liveElapsedSeconds : 0);
  const targetSeconds = CHALLENGE_CONSTANTS.DAILY_STUDY_TARGET_SECONDS;
  const progressPercent = Math.min(100, Math.round((totalRecordedSeconds / targetSeconds) * 100));
  const remainingMinutes = Math.max(0, Math.ceil((targetSeconds - totalRecordedSeconds) / 60));
  const isGoalReached = totalRecordedSeconds >= targetSeconds;

  // Workout progress for current week
  const thisWeekWorkouts = userWorkouts.filter(
    (w) => w.challenge_week_id === currentWeek.id && w.status === 'approved'
  );
  const workoutGoal = currentWeek.required_workouts;
  const workoutsRemaining = Math.max(0, workoutGoal - thisWeekWorkouts.length);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 space-y-8">
      
      {/* 1. Welcome Header Section */}
      <div className="bg-gradient-to-r from-[#12141c] via-[#0e1017] to-[#12141c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#00E599]">STUDENT OPERATING SYSTEM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Welcome back, <span className="text-[#00E599]">@{user.username || 'Student'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            "Discipline is quiet confidence. Consistency beats intensity every single day."
          </p>
        </div>

        {/* Quick Highlights Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] font-mono uppercase text-slate-500">Total Points</p>
            <p className="text-lg font-mono font-bold text-[#00E599]">{stats.totalPoints} pts</p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] font-mono uppercase text-slate-500">House Rank</p>
            <p className="text-lg font-mono font-bold text-white">#{stats.rank || 1}</p>
          </div>
        </div>
      </div>

      {/* 2. Top Interactive Grid: Study Card & Workout Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DAILY STUDY CARD (Spans 2 columns) */}
        <div className="lg:col-span-2 double-bezel" id="timer">
          <div className="double-bezel-inner">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00E599]/15 border border-[#00E599]/30 text-[#00E599] flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Daily Study Target</h2>
                  <p className="text-[11px] text-slate-400">180 minutes required • Today ({todayIST})</p>
                </div>
              </div>

              {/* Streak badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-xs">
                <span className="text-[#FF6B35]">🔥</span>
                <span className="text-white font-bold">{stats.currentStudyStreak}</span>
                <span className="text-slate-400 text-[10px]">day streak</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-500 text-[10px]">Best: {stats.longestStudyStreak}</span>
              </div>
            </div>

            {/* Study Target Progress & Timer Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center my-6">
              
              {/* Left: Big Circular / Progress Indicator */}
              <div className="p-4 rounded-2xl bg-[#090b10] border border-white/5 flex flex-col items-center justify-center text-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1e222d" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={isGoalReached ? '#00E599' : '#38BDF8'}
                      strokeWidth="8"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * progressPercent) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-mono font-extrabold text-white">{progressPercent}%</span>
                    <span className="text-[10px] uppercase font-mono text-slate-400">180m Goal</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Completed</span>
                    <span className="text-white font-bold">{formatSecondsToHoursMinutes(totalRecordedSeconds)}</span>
                  </div>
                  <div className="w-px h-6 bg-white/10"></div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Remaining</span>
                    <span className={remainingMinutes === 0 ? 'text-[#00E599] font-bold' : 'text-slate-300'}>
                      {remainingMinutes === 0 ? 'Goal Reached!' : `${remainingMinutes} mins`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Live Timer Controls */}
              <div className="p-4 rounded-2xl bg-[#090b10] border border-white/5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="uppercase font-mono text-[10px]">Session Stopwatch</span>
                    {activeSession ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        activeSession.status === 'active' ? 'bg-[#00E599]/20 text-[#00E599] animate-pulse' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {activeSession.status.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[10px]">IDLE</span>
                    )}
                  </div>

                  <div className="text-4xl font-mono font-extrabold text-white tracking-wider my-3 text-center py-2 bg-black/30 rounded-xl border border-white/5">
                    {activeSession?.status === 'active' ? formatSecondsToTimer(liveElapsedSeconds) : '00:00:00'}
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    Server-calculated timestamps. Persists seamlessly across browser refreshes.
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 mt-4">
                  {!activeSession ? (
                    <button
                      onClick={handleStartTimer}
                      className="w-full py-3 bg-[#00E599] hover:bg-[#00E599]/90 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-[#00E599]/20 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Start Study Block
                    </button>
                  ) : (
                    <>
                      {activeSession.status === 'active' ? (
                        <button
                          onClick={handlePauseTimer}
                          className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6" />
                          </svg>
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={handleResumeTimer}
                          className="flex-1 py-2.5 bg-[#00E599]/20 hover:bg-[#00E599]/30 text-[#00E599] font-semibold rounded-xl text-xs border border-[#00E599]/30 transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          Resume
                        </button>
                      )}

                      <button
                        onClick={handleStopTimer}
                        className="flex-1 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold rounded-xl text-xs border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Stop & Save
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence Submission Status Footer */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" id="study-evidence">
              <div>
                <p className="text-xs font-semibold text-white">Daily Streak Evidence Verification</p>
                <p className="text-[11px] text-slate-400">
                  {todayEvidence
                    ? `Evidence submitted (${todayEvidence.status.toUpperCase()}). Verification complete.`
                    : isGoalReached
                    ? '180 minutes completed! Upload a photo of your timer to lock today\'s streak.'
                    : 'Requires 180 logged study minutes before uploading timer photograph.'}
                </p>
              </div>

              {todayEvidence ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Evidence Approved
                  </span>
                  {todayEvidence.photo_url && (
                    <img
                      src={todayEvidence.photo_url}
                      alt="Timer proof"
                      className="w-8 h-8 rounded-lg object-cover border border-white/20"
                    />
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenStudyEvidenceModal}
                  disabled={!isGoalReached}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/10 transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Timer Photo
                </button>
              )}
            </div>

          </div>
        </div>

        {/* WEEKLY WORKOUT CARD */}
        <div className="double-bezel" id="workouts">
          <div className="double-bezel-inner h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Weekly Workouts</h2>
                    <p className="text-[11px] text-slate-400">{currentWeek.title.split(': ')[0]}</p>
                  </div>
                </div>

                <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-xs text-white">
                  🔥 {stats.currentWorkoutStreak}w streak
                </div>
              </div>

              {/* Progress counter */}
              <div className="my-6 p-4 rounded-2xl bg-[#090b10] border border-white/5 text-center">
                <div className="text-3xl font-mono font-extrabold text-white">
                  {thisWeekWorkouts.length} <span className="text-slate-500 text-xl font-normal">/ {workoutGoal}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {workoutsRemaining === 0 ? 'Weekly Goal Completed!' : `${workoutsRemaining} more workout needed`}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-[#FF6B35] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (thisWeekWorkouts.length / workoutGoal) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Recent workout snippet */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono uppercase text-slate-500">This Week's Log</p>
                {thisWeekWorkouts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No workouts logged yet this week.</p>
                ) : (
                  thisWeekWorkouts.slice(0, 2).map((w) => (
                    <div key={w.id} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-xl">
                      <span className="font-semibold text-slate-200">{w.workout_type}</span>
                      <span className="text-slate-400 font-mono">{w.duration_minutes}m • {w.workout_date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 mt-4">
              <button
                onClick={onOpenWorkoutModal}
                className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#FF6B35]/20 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Log Workout & Upload Photo
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Middle Grid: Weekly Mission & Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WEEKLY MISSION CARD */}
        <div className="double-bezel" id="missions">
          <div className="double-bezel-inner h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Weekly Mission</h2>
                    <p className="text-[11px] text-slate-400">Week {currentWeek.week_number} • 20 Points</p>
                  </div>
                </div>

                <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-xs text-white">
                  🔥 {stats.currentMissionStreak}w streak
                </div>
              </div>

              {activeMission ? (
                <div className="space-y-3">
                  <div className="p-3 bg-[#090b10] border border-white/5 rounded-2xl">
                    <h3 className="text-xs font-bold text-white">{activeMission.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                      {activeMission.description}
                    </p>
                    <div className="mt-3 pt-2 border-t border-white/5 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                      <span>Deadline</span>
                      <span className="text-amber-400 font-semibold">{activeMission.deadline.substring(0, 10)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-300">
                    <p className="text-[11px] font-mono uppercase text-slate-500 mb-1">Status</p>
                    {missionSubmission ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Submitted & Verified (+20 pts)</span>
                      </div>
                    ) : (
                      <span className="text-amber-300">Awaiting submission</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No mission published for this week yet.</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 mt-4">
              {activeMission && (
                <button
                  onClick={() => onOpenMissionModal(activeMission)}
                  disabled={Boolean(missionSubmission)}
                  className="w-full py-2.5 bg-[#38BDF8] hover:bg-[#38BDF8]/90 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-[#38BDF8]/20"
                >
                  {missionSubmission ? 'Mission Completed' : 'Submit Mission Evidence'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVITY CALENDAR & STREAK HEATMAP (Spans 2 columns) */}
        <div className="lg:col-span-2 double-bezel">
          <div className="double-bezel-inner h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Consistency Grid</h2>
                  <p className="text-[11px] text-slate-400">
                    Successful study days require 180 valid minutes + approved photo evidence
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-[#00E599]"></span>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-[#38BDF8] animate-pulse"></span>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-[#1e222d]"></span>
                    <span>Rest/Incomplete</span>
                  </div>
                </div>
              </div>

              {/* Visual 83-Day Calendar Grid */}
              <div className="grid grid-cols-7 sm:grid-cols-12 md:grid-cols-14 gap-1.5 p-3 bg-[#090b10] border border-white/5 rounded-2xl max-h-52 overflow-y-auto">
                {Array.from({ length: 83 }).map((_, idx) => {
                  const dayOffset = idx;
                  const dateObj = new Date(2026, 9, 10 + dayOffset); // Month 9 = Oct
                  const dateStr = dateObj.toISOString().substring(0, 10);
                  const isToday = dateStr === todayIST;
                  const isFuture = dateStr > todayIST;
                  
                  // Check if completed in db
                  const daySessions = db.getStudySessionsForDate(user.id, dateStr);
                  const daySeconds = daySessions
                    .filter((s) => s.status === 'completed')
                    .reduce((sum, s) => sum + s.duration_seconds, 0);
                  const dayEv = db.getDailyStudyEvidence(user.id, dateStr);
                  const isCompleted = daySeconds >= targetSeconds && dayEv?.status === 'approved';

                  return (
                    <div
                      key={dateStr}
                      title={`${dateStr}: ${isCompleted ? 'Completed (180m + Photo)' : isToday ? 'Today in progress' : isFuture ? 'Upcoming' : 'Incomplete'}`}
                      className={`h-6 rounded flex items-center justify-center font-mono text-[9px] transition-all cursor-default ${
                        isCompleted
                          ? 'bg-[#00E599] text-black font-bold shadow-sm shadow-[#00E599]/30'
                          : isToday
                          ? 'border border-[#38BDF8] bg-[#38BDF8]/20 text-[#38BDF8] font-bold'
                          : isFuture
                          ? 'bg-[#151821]/40 text-slate-700'
                          : 'bg-[#151821] text-slate-500 hover:border hover:border-white/20'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">Completed Days</span>
                <span className="text-sm font-bold text-white">{stats.completedStudyDays} / 83</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Total Study Time</span>
                <span className="text-sm font-bold text-white">{stats.totalStudyHours} hrs</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Workouts Verified</span>
                <span className="text-sm font-bold text-[#FF6B35]">{stats.completedWorkouts}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Missions Conquered</span>
                <span className="text-sm font-bold text-[#38BDF8]">{stats.completedMissions}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
