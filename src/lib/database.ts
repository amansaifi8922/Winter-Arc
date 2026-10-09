import {
  UserProfile,
  StudySession,
  DailyStudyEvidence,
  WorkoutEntry,
  WeeklyMission,
  MissionSubmission,
  PointTransaction,
  AuditLog,
  NotificationItem,
  LeaderboardEntry,
  VerificationStatus,
} from '../types';
import { CHALLENGE_CONSTANTS, SEED_CHALLENGE_WEEKS } from './constants';
import { SEED_PROFILES, SEED_MISSIONS, SAMPLE_EVIDENCE_IMAGE, SAMPLE_WORKOUT_IMAGE } from './mockData';
import { getKolkataDateString, getChallengeWeekForDate } from './timezone';
import { calculateAuthoritativeSessionDuration, validateUsername, validateEmailEligibility } from './validation';
import { calculateStudyStreaks, calculateWorkoutStreaks, calculateMissionStreaks, computePointTransactions } from './calculations';
import { isSupabaseConfigured, supabase } from './supabase';

const STORAGE_KEYS = {
  CURRENT_USER: 'winter_arc_current_user_id',
  PROFILES: 'winter_arc_profiles_v1',
  SESSIONS: 'winter_arc_sessions_v1',
  STUDY_EVIDENCE: 'winter_arc_study_evidence_v1',
  WORKOUTS: 'winter_arc_workouts_v1',
  MISSIONS: 'winter_arc_missions_v1',
  MISSION_SUBMISSIONS: 'winter_arc_mission_subs_v1',
  AUDIT_LOGS: 'winter_arc_audit_logs_v1',
  POINTS: 'winter_arc_points_v1',
};

class DatabaseService {
  private profiles: Map<string, UserProfile> = new Map();
  private studySessions: Map<string, StudySession> = new Map();
  private studyEvidence: Map<string, DailyStudyEvidence> = new Map();
  private workouts: Map<string, WorkoutEntry> = new Map();
  private missions: Map<string, WeeklyMission> = new Map();
  private missionSubmissions: Map<string, MissionSubmission> = new Map();
  private auditLogs: AuditLog[] = [];
  private currentUserId: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveState();
    this.listeners.forEach((l) => l());
  }

  private loadState() {
    try {
      // 1. Profiles
      const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (savedProfiles) {
        const parsed: UserProfile[] = JSON.parse(savedProfiles);
        parsed.forEach((p) => this.profiles.set(p.id, p));
      } else {
        SEED_PROFILES.forEach((p) => this.profiles.set(p.id, p));
      }

      // 2. Missions
      const savedMissions = localStorage.getItem(STORAGE_KEYS.MISSIONS);
      if (savedMissions) {
        const parsed: WeeklyMission[] = JSON.parse(savedMissions);
        parsed.forEach((m) => this.missions.set(m.id, m));
      } else {
        SEED_MISSIONS.forEach((m) => this.missions.set(m.id, m));
      }

      // 3. Sessions
      const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (savedSessions) {
        const parsed: StudySession[] = JSON.parse(savedSessions);
        parsed.forEach((s) => this.studySessions.set(s.id, s));
      }

      // 4. Study Evidence
      const savedEvidence = localStorage.getItem(STORAGE_KEYS.STUDY_EVIDENCE);
      if (savedEvidence) {
        const parsed: DailyStudyEvidence[] = JSON.parse(savedEvidence);
        parsed.forEach((e) => this.studyEvidence.set(e.id, e));
      }

      // 5. Workouts
      const savedWorkouts = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      if (savedWorkouts) {
        const parsed: WorkoutEntry[] = JSON.parse(savedWorkouts);
        parsed.forEach((w) => this.workouts.set(w.id, w));
      }

      // 6. Mission Submissions
      const savedSubs = localStorage.getItem(STORAGE_KEYS.MISSION_SUBMISSIONS);
      if (savedSubs) {
        const parsed: MissionSubmission[] = JSON.parse(savedSubs);
        parsed.forEach((s) => this.missionSubmissions.set(s.id, s));
      }

      // 7. Audit Logs
      const savedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (savedLogs) {
        this.auditLogs = JSON.parse(savedLogs);
      }

      // Current User
      const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUser && this.profiles.has(savedUser)) {
        this.currentUserId = savedUser;
      } else {
        // Default to student rohan_arc for initial demonstration
        this.currentUserId = SEED_PROFILES[0].id;
      }
    } catch {
      // Fallback to seeds
      SEED_PROFILES.forEach((p) => this.profiles.set(p.id, p));
      SEED_MISSIONS.forEach((m) => this.missions.set(m.id, m));
      this.currentUserId = SEED_PROFILES[0].id;
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(Array.from(this.profiles.values())));
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(Array.from(this.missions.values())));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(Array.from(this.studySessions.values())));
      localStorage.setItem(STORAGE_KEYS.STUDY_EVIDENCE, JSON.stringify(Array.from(this.studyEvidence.values())));
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(Array.from(this.workouts.values())));
      localStorage.setItem(STORAGE_KEYS.MISSION_SUBMISSIONS, JSON.stringify(Array.from(this.missionSubmissions.values())));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      if (this.currentUserId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, this.currentUserId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  // ==================== AUTHENTICATION & PROFILES ====================

  public getCurrentUser(): UserProfile | null {
    if (!this.currentUserId) return null;
    return this.profiles.get(this.currentUserId) || null;
  }

  public getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }

  public switchUser(userId: string): UserProfile {
    const user = this.profiles.get(userId);
    if (!user) throw new Error('User not found');
    this.currentUserId = user.id;
    this.notify();
    return user;
  }

  public async signInWithGoogle(simulatedEmail?: string): Promise<{ user?: UserProfile; error?: string }> {
    // If Supabase is configured with real client and not simulated:
    if (isSupabaseConfigured && supabase && !simulatedEmail) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) return { error: error.message };
      return {};
    }

    // Default simulation or direct email sign-in check
    const emailToVerify = simulatedEmail || 'new.student@study.iitm.ac.in';
    const eligibility = validateEmailEligibility(emailToVerify);
    if (!eligibility.isEligible) {
      return { error: eligibility.reason };
    }

    // Check if user already exists
    let existingUser = Array.from(this.profiles.values()).find(
      (p) => p.email.toLowerCase() === emailToVerify.toLowerCase()
    );

    if (!existingUser) {
      const newId = `u_${Date.now()}`;
      existingUser = {
        id: newId,
        email: emailToVerify,
        username: null, // First-time user must choose username
        username_changes_count: 0,
        role: 'student',
        house: CHALLENGE_CONSTANTS.HOUSE,
        bio: 'Winter Arc 2026 participant.',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      this.profiles.set(newId, existingUser);
    }

    this.currentUserId = existingUser.id;
    this.notify();
    return { user: existingUser };
  }

  public signOut() {
    this.currentUserId = null;
    this.notify();
  }

  public setupUsername(userId: string, newUsername: string): { success: boolean; error?: string } {
    const user = this.profiles.get(userId);
    if (!user) return { success: false, error: 'User not found' };

    // Validation
    const validation = validateUsername(newUsername);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Uniqueness check
    const isTaken = Array.from(this.profiles.values()).some(
      (p) => p.id !== userId && p.username?.toLowerCase() === newUsername.toLowerCase()
    );
    if (isTaken) {
      return { success: false, error: 'Username is already taken. Please choose another.' };
    }

    // Server-enforced change count limit: max 1 change allowed after initial setting
    if (user.username !== null && user.username_changes_count >= 1) {
      return { success: false, error: 'Username change limit reached. You can only change your username once.' };
    }

    const previousUsername = user.username;
    user.username = newUsername.trim();
    if (previousUsername !== null) {
      user.username_changes_count += 1;
    }

    this.logAuditEvent(
      user.id,
      'UPDATE_USERNAME',
      'profiles',
      user.id,
      { old_username: previousUsername },
      { new_username: user.username, changes_count: user.username_changes_count },
      'User set/updated their username'
    );

    this.notify();
    return { success: true };
  }

  public updateProfile(userId: string, updates: { bio?: string; avatar_url?: string }): void {
    const user = this.profiles.get(userId);
    if (!user) return;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.avatar_url !== undefined) user.avatar_url = updates.avatar_url;
    this.notify();
  }

  // ==================== STUDY TIMER & SESSIONS ====================

  public getActiveStudySession(userId: string): StudySession | null {
    return (
      Array.from(this.studySessions.values()).find(
        (s) => s.user_id === userId && (s.status === 'active' || s.status === 'paused')
      ) || null
    );
  }

  public getStudySessionsForDate(userId: string, dateStr: string): StudySession[] {
    return Array.from(this.studySessions.values()).filter(
      (s) => s.user_id === userId && s.challenge_date === dateStr
    );
  }

  public getTodayStudyTotalSeconds(userId: string, dateStr: string = getKolkataDateString()): number {
    const sessions = this.getStudySessionsForDate(userId, dateStr);
    return sessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.duration_seconds, 0);
  }

  public startStudySession(userId: string): { session?: StudySession; error?: string } {
    // Check if an active session already exists
    const existing = this.getActiveStudySession(userId);
    if (existing) {
      return { session: existing, error: 'A study session is already currently running.' };
    }

    const todayIST = getKolkataDateString();
    const sessionId = `s_${Date.now()}`;
    const newSession: StudySession = {
      id: sessionId,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      challenge_date: todayIST,
      started_at: new Date().toISOString(),
      total_paused_seconds: 0,
      duration_seconds: 0,
      status: 'active',
      pause_log: [],
      created_at: new Date().toISOString(),
    };

    this.studySessions.set(sessionId, newSession);
    this.notify();
    return { session: newSession };
  }

  public pauseStudySession(sessionId: string): { session?: StudySession; error?: string } {
    const session = this.studySessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return { error: 'Active session not found.' };
    }

    session.status = 'paused';
    session.pause_log.push({
      paused_at: new Date().toISOString(),
    });
    this.notify();
    return { session };
  }

  public resumeStudySession(sessionId: string): { session?: StudySession; error?: string } {
    const session = this.studySessions.get(sessionId);
    if (!session || session.status !== 'paused') {
      return { error: 'Paused session not found.' };
    }

    session.status = 'active';
    const lastInterval = session.pause_log[session.pause_log.length - 1];
    if (lastInterval && !lastInterval.resumed_at) {
      lastInterval.resumed_at = new Date().toISOString();
      const pausedMs = new Date(lastInterval.resumed_at).getTime() - new Date(lastInterval.paused_at).getTime();
      session.total_paused_seconds += Math.max(0, Math.floor(pausedMs / 1000));
    }

    this.notify();
    return { session };
  }

  public stopStudySession(sessionId: string): {
    session?: StudySession;
    error?: string;
    todayTotalSeconds: number;
    goalReached: boolean;
  } {
    const session = this.studySessions.get(sessionId);
    if (!session || (session.status !== 'active' && session.status !== 'paused')) {
      return { error: 'No active session to stop.', todayTotalSeconds: 0, goalReached: false };
    }

    const endedAtIso = new Date().toISOString();
    session.ended_at = endedAtIso;

    // Close any unclosed pause interval
    if (session.status === 'paused') {
      const lastInterval = session.pause_log[session.pause_log.length - 1];
      if (lastInterval && !lastInterval.resumed_at) {
        lastInterval.resumed_at = endedAtIso;
        const pausedMs = new Date(endedAtIso).getTime() - new Date(lastInterval.paused_at).getTime();
        session.total_paused_seconds += Math.max(0, Math.floor(pausedMs / 1000));
      }
    }

    // Authoritative calculation
    const validation = calculateAuthoritativeSessionDuration(
      session.started_at,
      session.ended_at,
      session.pause_log
    );

    if (!validation.isValid && validation.durationSeconds < 10) {
      // Discard trivial <10s sessions
      this.studySessions.delete(sessionId);
      this.notify();
      return {
        error: validation.error || 'Session too short (< 10 seconds). Discarded.',
        todayTotalSeconds: this.getTodayStudyTotalSeconds(session.user_id, session.challenge_date),
        goalReached: false,
      };
    }

    session.duration_seconds = validation.durationSeconds;
    session.status = 'completed';

    const todayTotal = this.getTodayStudyTotalSeconds(session.user_id, session.challenge_date);
    const goalReached = todayTotal >= CHALLENGE_CONSTANTS.DAILY_STUDY_TARGET_SECONDS;

    this.notify();
    return {
      session,
      todayTotalSeconds: todayTotal,
      goalReached,
    };
  }

  // ==================== STUDY EVIDENCE ====================

  public getDailyStudyEvidence(userId: string, dateStr: string): DailyStudyEvidence | null {
    return (
      Array.from(this.studyEvidence.values()).find(
        (e) => e.user_id === userId && e.challenge_date === dateStr
      ) || null
    );
  }

  public async submitDailyStudyEvidence(
    userId: string,
    dateStr: string,
    file: File | string, // can be File or dataURL/sample
    verifiedSeconds: number
  ): Promise<{ evidence?: DailyStudyEvidence; error?: string }> {
    // Students can only submit evidence for the current IST day
    const todayIST = getKolkataDateString();
    if (dateStr !== todayIST) {
      return { error: 'Evidence can only be submitted for the current challenge day.' };
    }

    // Check if total study duration is at least 180 minutes
    const totalToday = this.getTodayStudyTotalSeconds(userId, dateStr);
    if (totalToday < CHALLENGE_CONSTANTS.DAILY_STUDY_TARGET_SECONDS) {
      return {
        error: `Daily study duration is ${Math.floor(totalToday / 60)} minutes. You must complete at least 180 minutes before submitting photographic evidence.`
      };
    }

    const evidenceId = `dse_${userId}_${dateStr}`;
    let photoUrl = SAMPLE_EVIDENCE_IMAGE;

    if (typeof file === 'string') {
      photoUrl = file;
    } else {
      // Create local object URL for preview
      photoUrl = URL.createObjectURL(file);
    }

    const evidence: DailyStudyEvidence = {
      id: evidenceId,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      challenge_date: dateStr,
      storage_path: `study-evidence/${userId}/${dateStr}.jpg`,
      photo_url: photoUrl,
      verified_duration_seconds: verifiedSeconds || totalToday,
      status: 'approved', // Automatic acceptance with administrative review as specified
      submitted_at: new Date().toISOString(),
    };

    this.studyEvidence.set(evidenceId, evidence);
    this.notify();
    return { evidence };
  }

  // ==================== WORKOUTS ====================

  public getUserWorkouts(userId: string): WorkoutEntry[] {
    return Array.from(this.workouts.values()).filter((w) => w.user_id === userId);
  }

  public async logWorkout(
    userId: string,
    workoutType: string,
    durationMinutes: number,
    dateStr: string,
    file: File | string,
    notes?: string
  ): Promise<{ workout?: WorkoutEntry; error?: string }> {
    const todayIST = getKolkataDateString();
    if (dateStr > todayIST) {
      return { error: 'Cannot log workouts for future dates.' };
    }

    const week = getChallengeWeekForDate(dateStr) || SEED_CHALLENGE_WEEKS[0];
    const workoutId = `wo_${Date.now()}`;
    let photoUrl = SAMPLE_WORKOUT_IMAGE;

    if (typeof file === 'string') {
      photoUrl = file;
    } else {
      photoUrl = URL.createObjectURL(file);
    }

    const workout: WorkoutEntry = {
      id: workoutId,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      challenge_week_id: week.id,
      workout_date: dateStr,
      workout_type: workoutType,
      duration_minutes: durationMinutes,
      notes: notes || '',
      storage_path: `workout-evidence/${userId}/${workoutId}.jpg`,
      photo_url: photoUrl,
      status: 'approved', // Auto-accepted with administrative review
      created_at: new Date().toISOString(),
    };

    this.workouts.set(workoutId, workout);
    this.notify();
    return { workout };
  }

  // ==================== MISSIONS ====================

  public getWeeklyMissions(): WeeklyMission[] {
    return Array.from(this.missions.values()).sort((a, b) => a.week_number - b.week_number);
  }

  public getMissionSubmission(userId: string, missionId: string): MissionSubmission | null {
    return (
      Array.from(this.missionSubmissions.values()).find(
        (s) => s.user_id === userId && s.mission_id === missionId
      ) || null
    );
  }

  public getUserMissionSubmissions(userId: string): MissionSubmission[] {
    return Array.from(this.missionSubmissions.values()).filter((s) => s.user_id === userId);
  }

  public async submitMissionEvidence(
    userId: string,
    missionId: string,
    file: File | string,
    studentNotes?: string
  ): Promise<{ submission?: MissionSubmission; error?: string }> {
    const mission = this.missions.get(missionId);
    if (!mission) return { error: 'Mission not found.' };

    const existing = this.getMissionSubmission(userId, missionId);
    if (existing && existing.status === 'approved') {
      return { error: 'You have already completed this weekly mission.' };
    }

    const subId = `ms_${missionId}_${userId}`;
    let photoUrl = SAMPLE_EVIDENCE_IMAGE;
    if (typeof file === 'string') {
      photoUrl = file;
    } else {
      photoUrl = URL.createObjectURL(file);
    }

    const submission: MissionSubmission = {
      id: subId,
      mission_id: missionId,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      storage_path: `mission-evidence/${missionId}/${userId}.jpg`,
      photo_url: photoUrl,
      student_notes: studentNotes || '',
      status: 'approved', // Auto-accepted with coordinator review
      submitted_at: new Date().toISOString(),
    };

    this.missionSubmissions.set(subId, submission);
    this.notify();
    return { submission };
  }

  public createOrUpdateMission(
    actorId: string,
    missionData: Partial<WeeklyMission>
  ): { mission?: WeeklyMission; error?: string } {
    const actor = this.profiles.get(actorId);
    if (!actor || (actor.role !== 'admin' && actor.role !== 'coordinator')) {
      return { error: 'Unauthorized: only coordinators or admins can manage missions.' };
    }

    let mission: WeeklyMission;
    if (missionData.id && this.missions.has(missionData.id)) {
      mission = { ...this.missions.get(missionData.id)!, ...missionData };
    } else {
      const id = `m_${Date.now()}`;
      mission = {
        id,
        challenge_id: CHALLENGE_CONSTANTS.ID,
        challenge_week_id: missionData.challenge_week_id || SEED_CHALLENGE_WEEKS[0].id,
        week_number: missionData.week_number || 1,
        title: missionData.title || 'Weekly Mission',
        description: missionData.description || '',
        instructions: missionData.instructions || '',
        criteria: missionData.criteria || '',
        evidence_instructions: missionData.evidence_instructions || '',
        point_value: missionData.point_value || 20,
        deadline: missionData.deadline || '2026-10-16T23:59:59Z',
        is_published: missionData.is_published ?? true,
        created_by: actorId,
        created_at: new Date().toISOString(),
      };
    }

    this.missions.set(mission.id, mission);
    this.logAuditEvent(
      actorId,
      'UPSERT_MISSION',
      'weekly_missions',
      mission.id,
      null,
      mission,
      `Mission ${mission.title} saved`
    );
    this.notify();
    return { mission };
  }

  // ==================== EVIDENCE REVIEW (ADMIN & COORDINATOR) ====================

  public getAllSubmissionsForReview(): {
    studyEvidence: (DailyStudyEvidence & { username: string })[];
    workouts: (WorkoutEntry & { username: string })[];
    missionSubmissions: (MissionSubmission & { username: string; missionTitle: string })[];
  } {
    const studyEvidence = Array.from(this.studyEvidence.values()).map((e) => ({
      ...e,
      username: this.profiles.get(e.user_id)?.username || 'Student',
    }));

    const workouts = Array.from(this.workouts.values()).map((w) => ({
      ...w,
      username: this.profiles.get(w.user_id)?.username || 'Student',
    }));

    const missionSubmissions = Array.from(this.missionSubmissions.values()).map((m) => ({
      ...m,
      username: this.profiles.get(m.user_id)?.username || 'Student',
      missionTitle: this.missions.get(m.mission_id)?.title || 'Weekly Mission',
    }));

    return { studyEvidence, workouts, missionSubmissions };
  }

  public reviewSubmission(
    actorId: string,
    type: 'study' | 'workout' | 'mission',
    id: string,
    newStatus: VerificationStatus,
    reason?: string
  ): { success: boolean; error?: string } {
    const actor = this.profiles.get(actorId);
    if (!actor || (actor.role !== 'admin' && actor.role !== 'coordinator')) {
      return { success: false, error: 'Unauthorized: only coordinators or admins can review evidence.' };
    }

    if (type === 'study') {
      const item = this.studyEvidence.get(id);
      if (!item) return { success: false, error: 'Item not found' };
      const oldStatus = item.status;
      item.status = newStatus;
      item.reviewed_by = actorId;
      item.reviewed_at = new Date().toISOString();
      item.reviewer_notes = reason || '';
      this.logAuditEvent(actorId, 'REVIEW_STUDY_EVIDENCE', 'daily_study_evidence', id, { status: oldStatus }, { status: newStatus }, reason);
    } else if (type === 'workout') {
      const item = this.workouts.get(id);
      if (!item) return { success: false, error: 'Item not found' };
      const oldStatus = item.status;
      item.status = newStatus;
      item.reviewed_by = actorId;
      item.reviewed_at = new Date().toISOString();
      item.reviewer_notes = reason || '';
      this.logAuditEvent(actorId, 'REVIEW_WORKOUT', 'workout_entries', id, { status: oldStatus }, { status: newStatus }, reason);
    } else if (type === 'mission') {
      const item = this.missionSubmissions.get(id);
      if (!item) return { success: false, error: 'Item not found' };
      const oldStatus = item.status;
      item.status = newStatus;
      item.reviewed_by = actorId;
      item.reviewed_at = new Date().toISOString();
      item.reviewer_notes = reason || '';
      this.logAuditEvent(actorId, 'REVIEW_MISSION', 'mission_submissions', id, { status: oldStatus }, { status: newStatus }, reason);
    }

    this.notify();
    return { success: true };
  }

  // ==================== USER CORRECTIONS & AUDIT LOGS ====================

  public logAuditEvent(
    actorId: string,
    action: string,
    targetEntity: string,
    targetId: string,
    oldVals: any,
    newVals: any,
    reason?: string
  ) {
    const actor = this.profiles.get(actorId);
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actor_id: actorId,
      actor_email: actor?.email,
      actor_role: actor?.role || 'system',
      action,
      target_entity: targetEntity,
      target_id: targetId,
      old_values: oldVals,
      new_values: newVals,
      reason: reason || 'Administrative action',
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public correctUserRecord(
    adminId: string,
    targetUserId: string,
    correctionType: 'adjust_duration' | 'toggle_status' | 'update_role',
    details: any,
    reason: string
  ): { success: boolean; error?: string } {
    const admin = this.profiles.get(adminId);
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'Unauthorized: only administrators can execute record corrections.' };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'Mandatory reason required for audit log compliance.' };
    }

    const targetUser = this.profiles.get(targetUserId);
    if (!targetUser) return { success: false, error: 'Target user not found.' };

    if (correctionType === 'update_role') {
      const oldRole = targetUser.role;
      targetUser.role = details.newRole;
      this.logAuditEvent(adminId, 'UPDATE_ROLE', 'profiles', targetUserId, { role: oldRole }, { role: targetUser.role }, reason);
    } else if (correctionType === 'adjust_duration') {
      const sessionId = details.sessionId;
      const session = this.studySessions.get(sessionId);
      if (session) {
        const oldDur = session.duration_seconds;
        session.duration_seconds = details.newDurationSeconds;
        this.logAuditEvent(adminId, 'CORRECT_SESSION_DURATION', 'study_sessions', sessionId, { duration: oldDur }, { duration: session.duration_seconds }, reason);
      }
    }

    this.notify();
    return { success: true };
  }

  // ==================== STATS, LEADERBOARD & REMINDERS ====================

  public getUserStats(userId: string): {
    totalPoints: number;
    currentStudyStreak: number;
    longestStudyStreak: number;
    currentWorkoutStreak: number;
    longestWorkoutStreak: number;
    currentMissionStreak: number;
    longestMissionStreak: number;
    totalStudyHours: number;
    completedStudyDays: number;
    completedWorkouts: number;
    completedMissions: number;
    rank: number;
    transactions: PointTransaction[];
  } {
    const todayIST = getKolkataDateString();
    const sessions = Array.from(this.studySessions.values()).filter((s) => s.user_id === userId);
    const evidence = Array.from(this.studyEvidence.values()).filter((e) => e.user_id === userId);
    const workouts = Array.from(this.workouts.values()).filter((w) => w.user_id === userId);
    const missions = Array.from(this.missionSubmissions.values()).filter((m) => m.user_id === userId);

    // Identify completed study days
    const completedDays: string[] = [];
    const dateMap: Record<string, number> = {};
    for (const s of sessions) {
      if (s.status === 'completed') {
        dateMap[s.challenge_date] = (dateMap[s.challenge_date] || 0) + s.duration_seconds;
      }
    }

    for (const [d, secs] of Object.entries(dateMap)) {
      if (secs >= CHALLENGE_CONSTANTS.DAILY_STUDY_TARGET_SECONDS) {
        const hasApprovedEv = evidence.some((e) => e.challenge_date === d && e.status === 'approved');
        if (hasApprovedEv) {
          completedDays.push(d);
        }
      }
    }

    const completedDaySet = new Set(completedDays);
    const studyStreak = calculateStudyStreaks(completedDaySet, todayIST);

    // Workout streak
    const currentWeek = getChallengeWeekForDate(todayIST)?.week_number || 1;
    const workoutStreak = calculateWorkoutStreaks(workouts, currentWeek);

    // Mission streak
    const missionStreak = calculateMissionStreaks(missions, currentWeek);

    // Points
    const transactions = computePointTransactions(
      userId,
      completedDays,
      workouts.filter((w) => w.status === 'approved'),
      missions.filter((m) => m.status === 'approved'),
      studyStreak.longestStreak
    );

    const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);
    const totalStudySeconds = sessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.duration_seconds, 0);

    return {
      totalPoints,
      currentStudyStreak: studyStreak.currentStreak,
      longestStudyStreak: studyStreak.longestStreak,
      currentWorkoutStreak: workoutStreak.currentStreak,
      longestWorkoutStreak: workoutStreak.longestStreak,
      currentMissionStreak: missionStreak.currentStreak,
      longestMissionStreak: missionStreak.longestStreak,
      totalStudyHours: Math.round((totalStudySeconds / 3600) * 10) / 10,
      completedStudyDays: completedDays.length,
      completedWorkouts: workouts.filter((w) => w.status === 'approved').length,
      completedMissions: missions.filter((m) => m.status === 'approved').length,
      rank: 1, // dynamically computed in leaderboard
      transactions,
    };
  }

  public getLeaderboard(): LeaderboardEntry[] {
    const allUsers = Array.from(this.profiles.values()).filter((u) => u.is_active && u.username);
    const entries: LeaderboardEntry[] = allUsers.map((u) => {
      const stats = this.getUserStats(u.id);
      return {
        user_id: u.id,
        username: u.username!,
        avatar_url: u.avatar_url,
        house: u.house,
        total_points: stats.totalPoints,
        current_study_streak: stats.currentStudyStreak,
        longest_study_streak: stats.longestStudyStreak,
        completed_study_days: stats.completedStudyDays,
        completed_workouts: stats.completedWorkouts,
        completed_missions: stats.completedMissions,
      };
    });

    entries.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.current_study_streak !== a.current_study_streak) return b.current_study_streak - a.current_study_streak;
      return b.completed_study_days - a.completed_study_days;
    });

    return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
  }

  public getRemindersForUser(userId: string): NotificationItem[] {
    const todayIST = getKolkataDateString();
    const reminders: NotificationItem[] = [];

    // 1. Study target reminder
    const todaySeconds = this.getTodayStudyTotalSeconds(userId, todayIST);
    const remainingMins = Math.max(0, Math.ceil((CHALLENGE_CONSTANTS.DAILY_STUDY_TARGET_SECONDS - todaySeconds) / 60));

    if (remainingMins > 0) {
      reminders.push({
        id: `rem_study_${todayIST}`,
        user_id: userId,
        title: 'Daily Study Incomplete',
        message: `You have ${remainingMins} minutes remaining to reach today's 180-minute study target.`,
        type: 'info',
        is_read: false,
        action_url: '#timer',
        created_at: new Date().toISOString(),
      });
    } else {
      // Check if evidence submitted
      const hasEv = this.getDailyStudyEvidence(userId, todayIST);
      if (!hasEv) {
        reminders.push({
          id: `rem_ev_${todayIST}`,
          user_id: userId,
          title: 'Study Evidence Needed',
          message: 'Congratulations on 180 minutes! Please upload your timer photograph to secure today\'s streak.',
          type: 'warning',
          is_read: false,
          action_url: '#study-evidence',
          created_at: new Date().toISOString(),
        });
      }
    }

    // 2. Weekly Workout reminder
    const week = getChallengeWeekForDate(todayIST) || SEED_CHALLENGE_WEEKS[0];
    const userWorkouts = this.getUserWorkouts(userId).filter(
      (w) => w.challenge_week_id === week.id && w.status === 'approved'
    );
    const remainingWorkouts = Math.max(0, week.required_workouts - userWorkouts.length);
    if (remainingWorkouts > 0) {
      reminders.push({
        id: `rem_wo_${week.id}`,
        user_id: userId,
        title: 'Weekly Workout Goal',
        message: `${remainingWorkouts} of ${week.required_workouts} workouts needed this challenge week (${week.title}).`,
        type: 'info',
        is_read: false,
        action_url: '#workouts',
        created_at: new Date().toISOString(),
      });
    }

    // 3. Weekly Mission reminder
    const mission = Array.from(this.missions.values()).find(
      (m) => m.challenge_week_id === week.id && m.is_published
    );
    if (mission) {
      const sub = this.getMissionSubmission(userId, mission.id);
      if (!sub) {
        reminders.push({
          id: `rem_ms_${mission.id}`,
          user_id: userId,
          title: 'Weekly Mission Pending',
          message: `Mission "${mission.title}" is active. Submit before deadline to earn 20 points!`,
          type: 'info',
          is_read: false,
          action_url: '#missions',
          created_at: new Date().toISOString(),
        });
      }
    }

    return reminders;
  }

  // ==================== REPORTING & CSV EXPORT ====================

  public exportChallengeDataCsv(): string {
    const leaderboard = this.getLeaderboard();
    const rows = [
      ['Rank', 'Username', 'House', 'Total Points', 'Current Study Streak', 'Longest Study Streak', 'Completed Study Days', 'Completed Workouts', 'Completed Missions'],
      ...leaderboard.map((e) => [
        e.rank,
        e.username,
        e.house,
        e.total_points,
        e.current_study_streak,
        e.longest_study_streak,
        e.completed_study_days,
        e.completed_workouts,
        e.completed_missions,
      ]),
    ];

    return rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n');
  }
}

export const db = new DatabaseService();
