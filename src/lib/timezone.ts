import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CHALLENGE_CONSTANTS, SEED_CHALLENGE_WEEKS } from './constants';
import { ChallengeWeek } from '../types';

/**
 * Returns the current date in Asia/Kolkata timezone as 'YYYY-MM-DD'
 */
export function getKolkataDateString(date: Date = new Date()): string {
  const zoned = toZonedTime(date, CHALLENGE_CONSTANTS.TIMEZONE);
  return format(zoned, 'yyyy-MM-dd');
}

/**
 * Formats a Date or ISO string into a friendly IST timestamp string
 */
export function formatToKolkataTime(dateOrIso: Date | string, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const d = typeof dateOrIso === 'string' ? parseISO(dateOrIso) : dateOrIso;
  const zoned = toZonedTime(d, CHALLENGE_CONSTANTS.TIMEZONE);
  return format(zoned, formatStr);
}

/**
 * Checks if a given YYYY-MM-DD date is within the Winter Arc 2026 challenge window
 */
export function isDateWithinChallenge(dateStr: string): boolean {
  return dateStr >= CHALLENGE_CONSTANTS.START_DATE && dateStr <= CHALLENGE_CONSTANTS.END_DATE;
}

/**
 * Identifies which ChallengeWeek a given date belongs to
 */
export function getChallengeWeekForDate(dateStr: string): ChallengeWeek | undefined {
  return SEED_CHALLENGE_WEEKS.find(
    (w) => dateStr >= w.start_date && dateStr <= w.end_date
  );
}

/**
 * Checks whether an entry date is editable by a student.
 * Students can only modify or submit for the current day until midnight IST.
 */
export function isDateEditableByStudent(entryDateStr: string, currentDateStr: string = getKolkataDateString()): boolean {
  return entryDateStr === currentDateStr;
}

/**
 * Helper to format seconds into "HH:MM:SS"
 */
export function formatSecondsToTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Helper to format seconds into "Xh Ym"
 */
export function formatSecondsToHoursMinutes(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}
