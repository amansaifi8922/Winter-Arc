import { subDays, parseISO, format } from 'date-fns';
import { CHALLENGE_CONSTANTS, SEED_CHALLENGE_WEEKS } from './constants';
import { PointTransaction, WorkoutEntry, MissionSubmission, DailyStudyEvidence, StudySession } from '../types';

/**
 * Validates whether a study day is officially completed:
 * 1. Total valid recorded study seconds >= 10,800 (180 minutes)
 * 2. An accepted (status === 'approved') study evidence exists for that calendar date
 */
export function isStudyDayCompleted(
  dateStr: string,
  sessions: StudySession[],
  evidenceList: DailyStudyEvidence[]
): boolean {
  const daySessions = sessions.filter(
    (s) => s.challenge_date === dateStr && s.status === 'completed'
  );
  const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration_seconds, 0);
  const hasApprovedEvidence = evidenceList.some(
    (e) => e.challenge_date === dateStr && e.status === 'approved'
  );

  return totalSeconds >= CHALLENGE_CONSTANTS.DAILY_STUDY_TARGET_SECONDS && hasApprovedEvidence;
}

/**
 * Calculates current and longest daily study streaks.
 * Uses calendar days in Asia/Kolkata timezone, strictly checking consecutive days.
 */
export function calculateStudyStreaks(
  completedDateSet: Set<string>,
  referenceDateStr: string // Today's date in IST (e.g. '2026-10-15')
): { currentStreak: number; longestStreak: number } {
  // If reference date is before challenge start, streaks are 0
  if (referenceDateStr < CHALLENGE_CONSTANTS.START_DATE) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Calculate Current Streak
  let currentStreak = 0;
  const refDate = parseISO(referenceDateStr);
  const isTodayCompleted = completedDateSet.has(referenceDateStr);

  let checkDate: Date;
  if (isTodayCompleted) {
    currentStreak = 1;
    checkDate = subDays(refDate, 1);
  } else {
    // If today is not completed yet, check if yesterday was completed
    checkDate = subDays(refDate, 1);
  }

  // Count backwards consecutively
  while (true) {
    const checkStr = format(checkDate, 'yyyy-MM-dd');
    if (checkStr < CHALLENGE_CONSTANTS.START_DATE) break;

    if (completedDateSet.has(checkStr)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // 2. Calculate Longest Streak across all dates up to referenceDateStr
  let longestStreak = 0;
  let tempStreak = 0;
  const startDate = parseISO(CHALLENGE_CONSTANTS.START_DATE);
  let iterDate = startDate;

  while (format(iterDate, 'yyyy-MM-dd') <= referenceDateStr) {
    const iterStr = format(iterDate, 'yyyy-MM-dd');
    if (completedDateSet.has(iterStr)) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
    iterDate = new Date(iterDate.getTime() + 86400000);
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

/**
 * Calculates current and longest weekly workout streaks.
 */
export function calculateWorkoutStreaks(
  workouts: WorkoutEntry[],
  currentWeekNumber: number
): { currentStreak: number; longestStreak: number; thisWeekCount: number } {
  // Group approved workouts by challenge week
  const weekCounts: Record<number, number> = {};
  for (const w of workouts) {
    if (w.status === 'approved') {
      const challengeWeek = SEED_CHALLENGE_WEEKS.find((cw) => cw.id === w.challenge_week_id);
      if (challengeWeek) {
        weekCounts[challengeWeek.week_number] = (weekCounts[challengeWeek.week_number] || 0) + 1;
      }
    }
  }

  const thisWeekCount = weekCounts[currentWeekNumber] || 0;

  let longestStreak = 0;
  let runningStreak = 0;

  for (let wk = 1; wk <= 12; wk++) {
    const weekMeta = SEED_CHALLENGE_WEEKS.find((w) => w.week_number === wk);
    const required = weekMeta ? weekMeta.required_workouts : 3;
    const count = weekCounts[wk] || 0;

    if (count >= required) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      // If we are currently in this week, don't break longest past streak
      if (wk < currentWeekNumber) {
        runningStreak = 0;
      }
    }
  }

  // Current streak
  let currentStreak = 0;
  const currentWeekMeta = SEED_CHALLENGE_WEEKS.find((w) => w.week_number === currentWeekNumber);
  const currentReq = currentWeekMeta ? currentWeekMeta.required_workouts : 3;
  const isCurrentWeekMet = thisWeekCount >= currentReq;

  let checkWk = isCurrentWeekMet ? currentWeekNumber : currentWeekNumber - 1;
  while (checkWk >= 1) {
    const meta = SEED_CHALLENGE_WEEKS.find((w) => w.week_number === checkWk);
    const req = meta ? meta.required_workouts : 3;
    if ((weekCounts[checkWk] || 0) >= req) {
      currentStreak++;
      checkWk--;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    thisWeekCount,
  };
}

/**
 * Calculates weekly mission streak
 */
export function calculateMissionStreaks(
  submissions: MissionSubmission[],
  currentWeekNumber: number
): { currentStreak: number; longestStreak: number } {
  const approvedMissions = new Set(
    submissions.filter((s) => s.status === 'approved').map((s) => s.mission_id)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  for (let wk = 1; wk <= 12; wk++) {
    // Check if the mission for this week was completed
    // Match via mission challenge_week
    const completed = submissions.some((s) => s.status === 'approved'); // placeholder check
    if (completed) {
      runningStreak++;
      if (runningStreak > longestStreak) longestStreak = runningStreak;
    } else if (wk < currentWeekNumber) {
      runningStreak = 0;
    }
  }

  return {
    currentStreak: approvedMissions.size,
    longestStreak: Math.max(longestStreak, approvedMissions.size),
  };
}

/**
 * Generates authoritative PointTransactions idempotently for a user
 */
export function computePointTransactions(
  userId: string,
  completedStudyDates: string[],
  approvedWorkouts: WorkoutEntry[],
  approvedMissions: MissionSubmission[],
  studyStreakLongest: number
): PointTransaction[] {
  const transactions: PointTransaction[] = [];

  // 1. Daily Study Goals: 10 pts each
  for (const dateStr of completedStudyDates) {
    transactions.push({
      id: `pt_study_${userId}_${dateStr}`,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      event_key: `study_goal_${userId}_${dateStr}`,
      points: CHALLENGE_CONSTANTS.POINTS.DAILY_STUDY_GOAL,
      category: 'study_goal',
      description: `Daily 180-min study target completed on ${dateStr}`,
      created_at: `${dateStr}T23:59:00Z`,
    });
  }

  // 2. Approved Workouts: 5 pts each
  for (const workout of approvedWorkouts) {
    transactions.push({
      id: `pt_workout_${workout.id}`,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      event_key: `workout_${workout.id}`,
      points: CHALLENGE_CONSTANTS.POINTS.WORKOUT,
      category: 'workout',
      description: `Workout verified: ${workout.workout_type} (${workout.duration_minutes}m)`,
      reference_id: workout.id,
      created_at: workout.created_at,
    });
  }

  // 3. Approved Missions: 20 pts each
  for (const sub of approvedMissions) {
    transactions.push({
      id: `pt_mission_${sub.mission_id}_${userId}`,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      event_key: `mission_${sub.mission_id}_${userId}`,
      points: CHALLENGE_CONSTANTS.POINTS.WEEKLY_MISSION,
      category: 'mission',
      description: `Weekly house mission completed`,
      reference_id: sub.mission_id,
      created_at: sub.submitted_at,
    });
  }

  // 4. Milestone bonuses
  if (studyStreakLongest >= 7) {
    transactions.push({
      id: `pt_milestone_7_${userId}`,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      event_key: `milestone_study_7_${userId}`,
      points: CHALLENGE_CONSTANTS.POINTS.STUDY_STREAK_7,
      category: 'streak_milestone',
      description: '7-Day Study Streak Milestone Unlocked',
      created_at: new Date().toISOString(),
    });
  }

  if (studyStreakLongest >= 14) {
    transactions.push({
      id: `pt_milestone_14_${userId}`,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      event_key: `milestone_study_14_${userId}`,
      points: CHALLENGE_CONSTANTS.POINTS.STUDY_STREAK_14,
      category: 'streak_milestone',
      description: '14-Day Study Streak Milestone Unlocked',
      created_at: new Date().toISOString(),
    });
  }

  if (studyStreakLongest >= 30) {
    transactions.push({
      id: `pt_milestone_30_${userId}`,
      user_id: userId,
      challenge_id: CHALLENGE_CONSTANTS.ID,
      event_key: `milestone_study_30_${userId}`,
      points: CHALLENGE_CONSTANTS.POINTS.STUDY_STREAK_30,
      category: 'streak_milestone',
      description: '30-Day Study Streak Legend Milestone Unlocked',
      created_at: new Date().toISOString(),
    });
  }

  return transactions;
}
