import React, { useState } from 'react';
import { UserProfile, WeeklyMission, VerificationStatus } from '../../types';
import { db } from '../../lib/database';
import { SEED_CHALLENGE_WEEKS } from '../../lib/constants';

interface AdminDashboardViewProps {
  actor: UserProfile;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ actor }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'missions' | 'students' | 'audit'>('overview');
  const [reviewReason, setReviewReason] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Correction state
  const [selectedStudentForCorrection, setSelectedStudentForCorrection] = useState<UserProfile | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newRoleSelection, setNewRoleSelection] = useState<string>('student');

  // Mission editor state
  const [editingMission, setEditingMission] = useState<Partial<WeeklyMission> | null>(null);

  const isAdmin = actor.role === 'admin';
  const profiles = db.getAllProfiles();
  const submissionsForReview = db.getAllSubmissionsForReview();
  const auditLogs = db.getAuditLogs();
  const missions = db.getWeeklyMissions();

  // Metrics
  const totalStudents = profiles.filter((p) => p.role === 'student').length;
  const pendingStudyEvidence = submissionsForReview.studyEvidence.filter((e) => e.status === 'pending');
  const pendingWorkouts = submissionsForReview.workouts.filter((w) => w.status === 'pending');
  const pendingMissions = submissionsForReview.missionSubmissions.filter((m) => m.status === 'pending');
  const totalPendingReviews = pendingStudyEvidence.length + pendingWorkouts.length + pendingMissions.length;

  const handleReview = (
    type: 'study' | 'workout' | 'mission',
    id: string,
    status: VerificationStatus
  ) => {
    const res = db.reviewSubmission(actor.id, type, id, status, reviewReason || 'Administrative decision');
    if (res.success) {
      setFeedbackMsg(`Submission marked as ${status.toUpperCase()}. Audit log recorded.`);
      setReviewReason('');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleExecuteCorrection = () => {
    if (!selectedStudentForCorrection) return;
    if (!correctionReason.trim()) {
      alert('A valid reason is required for audit log compliance.');
      return;
    }

    const res = db.correctUserRecord(
      actor.id,
      selectedStudentForCorrection.id,
      'update_role',
      { newRole: newRoleSelection },
      correctionReason
    );

    if (res.success) {
      setFeedbackMsg(`Role for @${selectedStudentForCorrection.username} updated. Audit log recorded.`);
      setSelectedStudentForCorrection(null);
      setCorrectionReason('');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleSaveMission = () => {
    if (!editingMission || !editingMission.title) return;
    const res = db.createOrUpdateMission(actor.id, editingMission);
    if (res.mission) {
      setFeedbackMsg(`Mission "${res.mission.title}" saved successfully.`);
      setEditingMission(null);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleExportCsv = () => {
    const csvContent = db.exportChallengeDataCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `winter_arc_namdapha_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#12141c] border border-[#FF6B35]/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-ping"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B35]">
              {isAdmin ? 'ADMINISTRATIVE CONTROL CENTER' : 'COORDINATOR PORTAL'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            House Management & Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Logged in as <strong className="text-white">@{actor.username}</strong> ({actor.role}). All privileged changes are permanently audited.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs border border-white/10 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV Records
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-[#00E599]/15 border border-[#00E599]/30 rounded-2xl text-[#00E599] text-xs font-mono animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'overview' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'review' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Evidence Review</span>
          {totalPendingReviews > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF6B35] text-white font-mono">
              {totalPendingReviews}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'missions' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Manage Missions
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'students' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Student Registry & Roles
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'audit' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-[#0e1017] border border-white/10 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-500">Registered Students</span>
              <p className="text-2xl font-mono font-bold text-white mt-1">{totalStudents}</p>
            </div>
            <div className="p-5 bg-[#0e1017] border border-white/10 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-500">Total Workouts Logged</span>
              <p className="text-2xl font-mono font-bold text-[#FF6B35] mt-1">{submissionsForReview.workouts.length}</p>
            </div>
            <div className="p-5 bg-[#0e1017] border border-white/10 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-500">Completed Missions</span>
              <p className="text-2xl font-mono font-bold text-[#38BDF8] mt-1">{submissionsForReview.missionSubmissions.length}</p>
            </div>
            <div className="p-5 bg-[#0e1017] border border-white/10 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-500">Audit Actions Tracked</span>
              <p className="text-2xl font-mono font-bold text-[#00E599] mt-1">{auditLogs.length}</p>
            </div>
          </div>

          <div className="double-bezel">
            <div className="double-bezel-inner">
              <h2 className="text-base font-bold text-white mb-2">Challenge Parameters (Active: Winter Arc 2026)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-400 mt-4">
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-500 block text-[10px]">Challenge Window</span>
                  <span className="text-white font-bold">2026-10-10 → 2026-12-31 (83 Days)</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-500 block text-[10px]">Timezone</span>
                  <span className="text-[#00E599] font-bold">Asia/Kolkata (IST, UTC+05:30)</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-500 block text-[10px]">Final Week (W12)</span>
                  <span className="text-amber-400 font-bold">Partial 6-Day (2 Workouts Goal)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE REVIEW */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Submissions Verification Queue</h2>
              <p className="text-xs text-slate-400">
                Mode: Automatic acceptance with administrative review. Reject only when evidence violates authenticity.
              </p>
            </div>
            <input
              type="text"
              placeholder="Rejection / correction reason..."
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              className="bg-[#090b10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 w-72"
            />
          </div>

          {/* Study Evidence Section */}
          <div className="double-bezel">
            <div className="double-bezel-inner space-y-4">
              <h3 className="text-sm font-bold text-white">Daily Study Photographs</h3>
              {submissionsForReview.studyEvidence.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No study evidence records.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submissionsForReview.studyEvidence.map((e) => (
                    <div key={e.id} className="bg-[#090b10] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                      {e.photo_url && (
                        <img
                          src={e.photo_url}
                          alt="Study proof"
                          className="h-36 w-full object-cover rounded-xl mb-3"
                        />
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">@{e.username}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#00E599]">
                            {e.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">Date: {e.challenge_date}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Logged: {Math.floor(e.verified_duration_seconds / 60)} mins</p>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleReview('study', e.id, 'approved')}
                          className="flex-1 py-1.5 bg-[#00E599]/20 hover:bg-[#00E599]/30 text-[#00E599] text-xs font-semibold rounded-lg"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview('study', e.id, 'rejected')}
                          className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workouts Section */}
          <div className="double-bezel">
            <div className="double-bezel-inner space-y-4">
              <h3 className="text-sm font-bold text-white">Workout Photographs</h3>
              {submissionsForReview.workouts.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No workout records.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submissionsForReview.workouts.map((w) => (
                    <div key={w.id} className="bg-[#090b10] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                      {w.photo_url && (
                        <img
                          src={w.photo_url}
                          alt="Workout proof"
                          className="h-36 w-full object-cover rounded-xl mb-3"
                        />
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">@{w.username}</span>
                          <span className="text-xs font-mono text-[#FF6B35] font-semibold">{w.workout_type}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">{w.workout_date} • {w.duration_minutes}m</p>
                        {w.notes && <p className="text-xs text-slate-300 italic mt-1">"{w.notes}"</p>}
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleReview('workout', w.id, 'approved')}
                          className="flex-1 py-1.5 bg-[#00E599]/20 hover:bg-[#00E599]/30 text-[#00E599] text-xs font-semibold rounded-lg"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview('workout', w.id, 'rejected')}
                          className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MISSIONS MANAGEMENT */}
      {activeTab === 'missions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Weekly Challenge Missions</h2>
            <button
              onClick={() =>
                setEditingMission({
                  title: '',
                  description: '',
                  instructions: '',
                  criteria: '',
                  point_value: 20,
                  week_number: missions.length + 1,
                  is_published: true,
                })
              }
              className="px-4 py-2 bg-[#38BDF8] text-slate-950 font-bold rounded-xl text-xs"
            >
              + Create New Mission
            </button>
          </div>

          {editingMission && (
            <div className="p-6 bg-[#0e1017] border border-[#38BDF8]/40 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white">
                {editingMission.id ? 'Edit Mission' : 'Author New Weekly Mission'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingMission.title || ''}
                    onChange={(e) => setEditingMission({ ...editingMission, title: e.target.value })}
                    className="w-full bg-[#151821] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Challenge Week</label>
                  <select
                    value={editingMission.challenge_week_id || SEED_CHALLENGE_WEEKS[0].id}
                    onChange={(e) => setEditingMission({ ...editingMission, challenge_week_id: e.target.value })}
                    className="w-full bg-[#151821] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  >
                    {SEED_CHALLENGE_WEEKS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingMission.description || ''}
                  onChange={(e) => setEditingMission({ ...editingMission, description: e.target.value })}
                  className="w-full bg-[#151821] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Instructions & Criteria</label>
                <textarea
                  rows={2}
                  value={editingMission.instructions || ''}
                  onChange={(e) => setEditingMission({ ...editingMission, instructions: e.target.value, criteria: e.target.value })}
                  className="w-full bg-[#151821] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditingMission(null)}
                  className="px-4 py-2 bg-white/5 rounded-xl text-xs text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMission}
                  className="px-6 py-2 bg-[#38BDF8] text-slate-950 font-bold rounded-xl text-xs"
                >
                  Save & Publish Mission
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((m) => (
              <div key={m.id} className="p-5 bg-[#0e1017] border border-white/10 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-[#38BDF8]">Week {m.week_number}</span>
                    <span className="text-xs font-mono text-emerald-400">{m.point_value} pts</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{m.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">Deadline: {m.deadline.substring(0, 10)}</span>
                  <button
                    onClick={() => setEditingMission(m)}
                    className="text-xs text-[#38BDF8] hover:underline font-semibold"
                  >
                    Edit Mission
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT REGISTRY & ROLES */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Student Directory & Role Authorisation</h2>
              <p className="text-xs text-slate-400">
                Coordinators and Administrators. Role changes must be executed with an audit log reason.
              </p>
            </div>
          </div>

          <div className="double-bezel">
            <div className="double-bezel-inner overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Handle</th>
                    <th className="py-3 px-4">Institutional Email</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">House</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-bold text-white">
                        @{p.username || 'unregistered'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {p.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          p.role === 'admin'
                            ? 'bg-rose-500/20 text-rose-300'
                            : p.role === 'coordinator'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{p.house}</td>
                      <td className="py-3 px-4 text-right">
                        {isAdmin && p.id !== actor.id && (
                          <button
                            onClick={() => {
                              setSelectedStudentForCorrection(p);
                              setNewRoleSelection(p.role);
                            }}
                            className="text-xs text-amber-400 hover:underline font-sans"
                          >
                            Modify Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Correction Modal */}
          {selectedStudentForCorrection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="w-full max-w-md bg-[#0e1017] border border-white/15 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white">
                  Modify Role for @{selectedStudentForCorrection.username}
                </h3>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Role</label>
                  <select
                    value={newRoleSelection}
                    onChange={(e) => setNewRoleSelection(e.target.value)}
                    className="w-full bg-[#151821] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="student">Student</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Mandatory Audit Log Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Appointed as House Coordinator for Winter Arc 2026"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="w-full bg-[#151821] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setSelectedStudentForCorrection(null)}
                    className="flex-1 py-2.5 bg-white/5 rounded-xl text-xs text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteCorrection}
                    className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Confirm & Audit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Immutable Administrative Audit Log</h2>
            <span className="text-xs font-mono text-slate-400">{auditLogs.length} Events Tracked</span>
          </div>

          <div className="double-bezel">
            <div className="double-bezel-inner overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Actor Email</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-slate-400">
                        {log.created_at.substring(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#FF6B35]">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {log.target_entity}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.actor_email || 'system'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        {log.reason || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
