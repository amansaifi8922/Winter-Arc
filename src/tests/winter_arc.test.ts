import { describe, it, expect, beforeEach } from 'vitest';
import { validateEmailEligibility, validateUsername, calculateAuthoritativeSessionDuration } from '../lib/validation';
import { calculateStudyStreaks, calculateWorkoutStreaks, computePointTransactions } from '../lib/calculations';
import { CHALLENGE_CONSTANTS, SEED_CHALLENGE_WEEKS } from '../lib/constants';
import { isDateWithinChallenge, getChallengeWeekForDate, formatSecondsToTimer } from '../lib/timezone';
import { WorkoutEntry, MissionSubmission } from '../types';

describe('Winter Arc – Namdapha Core Business Logic & Security', () => {

  describe('1. Authentication & Domain Eligibility Rule', () => {
    it('accepts valid IIT Madras BS student email domains', () => {
      expect(validateEmailEligibility('student@study.iitm.ac.in').isEligible).toBe(true);
      expect(validateEmailEligibility('rohan.k@ds.study.iitm.ac.in').isEligible).toBe(true);
      expect(validateEmailEligibility('vikram.s@es.study.iitm.ac.in').isEligible).toBe(true);
    });

    it('rejects unauthorized or personal email domains with clear explanation', () => {
      const personal = validateEmailEligibility('attacker@gmail.com');
      expect(personal.isEligible).toBe(false);
      expect(personal.reason).toContain('is not an approved IIT Madras BS student email address');

      const yahoo = validateEmailEligibility('student@yahoo.co.in');
      expect(yahoo.isEligible).toBe(false);

      const fakeSubdomain = validateEmailEligibility('student@randomiitm.ac.in');
      expect(fakeSubdomain.isEligible).toBe(false);
    });

    it('rejects malformed or empty email addresses', () => {
      expect(validateEmailEligibility('').isEligible).toBe(false);
      expect(validateEmailEligibility('notanemail').isEligible).toBe(false);
    });
  });

  describe('2. Username Selection & Change Restrictions', () => {
    it('validates good usernames', () => {
      expect(validateUsername('rohan_arc').isValid).toBe(true);
      expect(validateUsername('student2026').isValid).toBe(true);
      expect(validateUsername('nam_dev_99').isValid).toBe(true);
    });

    it('rejects too short or too long usernames', () => {
      expect(validateUsername('ab').isValid).toBe(false);
      expect(validateUsername('a'.repeat(21)).isValid).toBe(false);
    });

    it('rejects invalid characters (spaces, symbols)', () => {
      expect(validateUsername('rohan arc').isValid).toBe(false);
      expect(validateUsername('user@namdapha').isValid).toBe(false);
      expect(validateUsername('user!#$').isValid).toBe(false);
    });

    it('rejects reserved system keywords', () => {
      expect(validateUsername('admin').isValid).toBe(false);
      expect(validateUsername('administrator').isValid).toBe(false);
      expect(validateUsername('namdapha').isValid).toBe(false);
      expect(validateUsername('system').isValid).toBe(false);
      expect(validateUsername('coordinator').isValid).toBe(false);
    });

    it('rejects inappropriate profanity', () => {
      expect(validateUsername('fuck_system').isValid).toBe(false);
    });
  });

  describe('3. Study Timer & Authoritative Duration Calculation', () => {
    it('calculates duration correctly without pauses', () => {
      const start = '2026-10-10T10:00:00Z';
      const end = '2026-10-10T11:00:00Z'; // 1 hour = 3600s
      const result = calculateAuthoritativeSessionDuration(start, end, []);
      expect(result.isValid).toBe(true);
      expect(result.durationSeconds).toBe(3600);
    });

    it('accurately subtracts pause intervals', () => {
      const start = '2026-10-10T10:00:00Z';
      const end = '2026-10-10T11:30:00Z'; // 90 mins = 5400s
      const pauseLog = [
        { paused_at: '2026-10-10T10:30:00Z', resumed_at: '2026-10-10T10:45:00Z' }, // 15 mins pause
      ];
      const result = calculateAuthoritativeSessionDuration(start, end, pauseLog);
      expect(result.isValid).toBe(true);
      expect(result.durationSeconds).toBe(5400 - 900); // 4500 seconds
    });

    it('rejects negative or impossible durations', () => {
      const start = '2026-10-10T12:00:00Z';
      const end = '2026-10-10T11:00:00Z'; // end before start
      const result = calculateAuthoritativeSessionDuration(start, end, []);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('End time must be after start time');
    });

    it('enforces maximum session limit (6 hours)', () => {
      const start = '2026-10-10T08:00:00Z';
      const end = '2026-10-10T15:00:00Z'; // 7 hours
      const result = calculateAuthoritativeSessionDuration(start, end, []);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum permitted limit of 6 hours');
    });

    it('discards trivial sessions < 10 seconds', () => {
      const start = '2026-10-10T10:00:00Z';
      const end = '2026-10-10T10:00:05Z'; // 5 seconds
      const result = calculateAuthoritativeSessionDuration(start, end, []);
      expect(result.isValid).toBe(false);
      expect(result.durationSeconds).toBe(5);
    });
  });

  describe('4. Daily Streak Calculation & Preservation Rules', () => {
    it('establishes a streak of 1 on first successful day', () => {
      const completedSet = new Set(['2026-10-10']);
      const streaks = calculateStudyStreaks(completedSet, '2026-10-10');
      expect(streaks.currentStreak).toBe(1);
      expect(streaks.longestStreak).toBe(1);
    });

    it('increments streak for consecutive successful days', () => {
      const completedSet = new Set(['2026-10-10', '2026-10-11', '2026-10-12']);
      const streaks = calculateStudyStreaks(completedSet, '2026-10-12');
      expect(streaks.currentStreak).toBe(3);
      expect(streaks.longestStreak).toBe(3);
    });

    it('preserves current streak if today is in progress but yesterday was completed', () => {
      const completedSet = new Set(['2026-10-10', '2026-10-11']);
      // Today is 2026-10-12 and student has not completed today yet
      const streaks = calculateStudyStreaks(completedSet, '2026-10-12');
      expect(streaks.currentStreak).toBe(2);
      expect(streaks.longestStreak).toBe(2);
    });

    it('resets current streak when a day is missed without wiping longest streak', () => {
      // Completed Oct 10, 11, 12 (streak 3), but missed Oct 13. Today is Oct 14.
      const completedSet = new Set(['2026-10-10', '2026-10-11', '2026-10-12']);
      const streaks = calculateStudyStreaks(completedSet, '2026-10-14');
      expect(streaks.currentStreak).toBe(0);
      expect(streaks.longestStreak).toBe(3);
    });
  });

  describe('5. Weekly Workout Tracking & Challenge Boundaries', () => {
    it('identifies correct challenge week from date', () => {
      const week1 = getChallengeWeekForDate('2026-10-12');
      expect(week1?.week_number).toBe(1);
      expect(week1?.required_workouts).toBe(3);

      const week12 = getChallengeWeekForDate('2026-12-28');
      expect(week12?.week_number).toBe(12);
      expect(week12?.is_partial_week).toBe(true);
      expect(week12?.required_workouts).toBe(2); // partial week configuration
    });

    it('strictly enforces challenge date boundaries (Oct 10 - Dec 31, 2026)', () => {
      expect(isDateWithinChallenge('2026-10-09')).toBe(false); // Before start
      expect(isDateWithinChallenge('2026-10-10')).toBe(true);  // First day
      expect(isDateWithinChallenge('2026-12-31')).toBe(true);  // Last day
      expect(isDateWithinChallenge('2027-01-01')).toBe(false); // After end
    });

    it('calculates weekly workout streak when 3 workouts completed', () => {
      const week1Id = SEED_CHALLENGE_WEEKS[0].id;
      const sampleWorkouts: WorkoutEntry[] = [
        { id: 'w1', user_id: 'u1', challenge_id: 'c1', challenge_week_id: week1Id, workout_date: '2026-10-10', workout_type: 'Gym', duration_minutes: 45, storage_path: '', status: 'approved', created_at: '' },
        { id: 'w2', user_id: 'u1', challenge_id: 'c1', challenge_week_id: week1Id, workout_date: '2026-10-12', workout_type: 'Running', duration_minutes: 30, storage_path: '', status: 'approved', created_at: '' },
        { id: 'w3', user_id: 'u1', challenge_id: 'c1', challenge_week_id: week1Id, workout_date: '2026-10-14', workout_type: 'Calisthenics', duration_minutes: 50, storage_path: '', status: 'approved', created_at: '' },
      ];

      const streak = calculateWorkoutStreaks(sampleWorkouts, 1);
      expect(streak.thisWeekCount).toBe(3);
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(1);
    });
  });

  describe('6. Points Engine & Idempotency Rules', () => {
    it('computes correct points and awards milestones idempotently', () => {
      const userId = 'u_test_1';
      const completedDates = ['2026-10-10', '2026-10-11', '2026-10-12']; // 3 * 10 = 30 pts
      const workouts: WorkoutEntry[] = [
        { id: 'wo_1', user_id: userId, challenge_id: 'c1', challenge_week_id: 'w1', workout_date: '2026-10-10', workout_type: 'Gym', duration_minutes: 45, storage_path: '', status: 'approved', created_at: '' }
      ]; // 5 pts
      const missions: MissionSubmission[] = [
        { id: 'sub_1', mission_id: 'm1', user_id: userId, challenge_id: 'c1', storage_path: '', status: 'approved', submitted_at: '' }
      ]; // 20 pts

      const transactions = computePointTransactions(userId, completedDates, workouts, missions, 7);
      const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);

      // Expected: 30 (study) + 5 (workout) + 20 (mission) + 10 (7-day milestone) = 65 pts
      expect(totalPoints).toBe(65);

      // Verify unique event keys for idempotency
      const eventKeys = transactions.map((t) => t.event_key);
      const uniqueKeys = new Set(eventKeys);
      expect(uniqueKeys.size).toBe(eventKeys.length);
      expect(eventKeys).toContain(`study_goal_${userId}_2026-10-10`);
      expect(eventKeys).toContain(`workout_wo_1`);
      expect(eventKeys).toContain(`mission_m1_${userId}`);
      expect(eventKeys).toContain(`milestone_study_7_${userId}`);
    });
  });

  describe('7. Time and Formatting Helpers', () => {
    it('formats seconds into accurate timer strings', () => {
      expect(formatSecondsToTimer(0)).toBe('00:00:00');
      expect(formatSecondsToTimer(65)).toBe('00:01:05');
      expect(formatSecondsToTimer(10800)).toBe('03:00:00'); // 180 minutes target
      expect(formatSecondsToTimer(3665)).toBe('01:01:05');
    });
  });
});
