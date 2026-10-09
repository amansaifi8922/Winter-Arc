export type UserRole = 'student' | 'coordinator' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type SessionStatus = 'active' | 'paused' | 'completed' | 'invalidated';
export type PointCategory = 'study_goal' | 'workout' | 'mission' | 'streak_milestone' | 'adjustment';

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  username_changes_count: number;
  role: UserRole;
  house: string;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  created_at: string;
}

export interface ScoringConfig {
  daily_study_goal_pts: number;
  workout_pts: number;
  weekly_mission_pts: number;
  study_streak_7_pts: number;
  study_streak_14_pts: number;
  study_streak_30_pts: number;
  daily_study_target_minutes: number;
  weekly_workout_target: number;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  scoring_config: ScoringConfig;
  is_active: boolean;
}

export interface ChallengeWeek {
  id: string;
  challenge_id: string;
  week_number: number;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  required_workouts: number;
  is_partial_week: boolean;
}

export interface PauseLogInterval {
  paused_at: string;
  resumed_at?: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  challenge_id: string;
  challenge_date: string; // YYYY-MM-DD in Asia/Kolkata
  started_at: string;
  ended_at?: string;
  total_paused_seconds: number;
  duration_seconds: number;
  status: SessionStatus;
  pause_log: PauseLogInterval[];
  notes?: string;
  created_at: string;
}

export interface DailyStudyEvidence {
  id: string;
  user_id: string;
  challenge_id: string;
  challenge_date: string;
  storage_path: string;
  photo_url?: string;
  verified_duration_seconds: number;
  status: VerificationStatus;
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at: string;
}

export interface WorkoutEntry {
  id: string;
  user_id: string;
  challenge_id: string;
  challenge_week_id: string;
  workout_date: string; // YYYY-MM-DD
  workout_type: string;
  duration_minutes: number;
  notes?: string;
  storage_path: string;
  photo_url?: string;
  status: VerificationStatus;
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface WeeklyMission {
  id: string;
  challenge_id: string;
  challenge_week_id: string;
  week_number: number;
  title: string;
  description: string;
  instructions: string;
  criteria: string;
  evidence_instructions: string;
  point_value: number;
  deadline: string; // ISO
  is_published: boolean;
  created_by?: string;
  created_at: string;
}

export interface MissionSubmission {
  id: string;
  mission_id: string;
  user_id: string;
  challenge_id: string;
  storage_path: string;
  photo_url?: string;
  student_notes?: string;
  status: VerificationStatus;
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  challenge_id: string;
  event_key: string;
  points: number;
  category: PointCategory;
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email?: string;
  actor_role: string;
  action: string;
  target_entity: string;
  target_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  reason?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  house: string;
  total_points: number;
  current_study_streak: number;
  longest_study_streak: number;
  completed_study_days: number;
  completed_workouts: number;
  completed_missions: number;
  rank?: number;
}
