import { CHALLENGE_CONSTANTS } from './constants';
import { PauseLogInterval } from '../types';

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'coordinator',
  'mod',
  'moderator',
  'namdapha',
  'iitm',
  'system',
  'official',
  'support',
  'root',
  'staff',
  'owner',
  'winterarc',
  'winter_arc',
]);

const PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'nigger', 'faggot'
];

/**
 * Validates a proposed username:
 * - Length: 3 to 20 characters
 * - Permitted chars: letters, numbers, underscores
 * - Reserved words protection
 * - Profanity/inappropriate content protection
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: 'Username cannot exceed 20 characters.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores.' };
  }

  const lower = trimmed.toLowerCase();
  if (RESERVED_USERNAMES.has(lower)) {
    return { isValid: false, error: 'This username is reserved and cannot be selected.' };
  }

  for (const badWord of PROFANITY_LIST) {
    if (lower.includes(badWord)) {
      return { isValid: false, error: 'Username contains inappropriate or restricted content.' };
    }
  }

  return { isValid: true };
}

/**
 * Validates whether an email satisfies the configured IITM student email domain rule
 */
export function validateEmailEligibility(email: string): { isEligible: boolean; domain: string; reason?: string } {
  if (!email || !email.includes('@')) {
    return {
      isEligible: false,
      domain: '',
      reason: 'Please sign in with a valid email address.'
    };
  }

  const parts = email.trim().toLowerCase().split('@');
  const domain = parts[1];

  const allowedDomains = CHALLENGE_CONSTANTS.ALLOWED_DOMAINS;
  const isMatch = allowedDomains.some((allowed: string) => domain === allowed || domain.endsWith('.' + allowed));

  if (!isMatch) {
    return {
      isEligible: false,
      domain,
      reason: `Access restricted. Your email domain (@${domain}) is not an approved IIT Madras BS student email address. Winter Arc is exclusively for students enrolled with an eligible institutional email (e.g., @ds.study.iitm.ac.in, @es.study.iitm.ac.in, or @study.iitm.ac.in).`
    };
  }

  return {
    isEligible: true,
    domain,
  };
}

/**
 * Server-authoritative calculation and validation of study session duration
 */
export function calculateAuthoritativeSessionDuration(
  startedAtIso: string,
  endedAtIso: string,
  pauseLog: PauseLogInterval[]
): { isValid: boolean; durationSeconds: number; error?: string } {
  const startMs = new Date(startedAtIso).getTime();
  const endMs = new Date(endedAtIso).getTime();

  if (isNaN(startMs) || isNaN(endMs)) {
    return { isValid: false, durationSeconds: 0, error: 'Invalid session timestamps.' };
  }

  if (endMs <= startMs) {
    return { isValid: false, durationSeconds: 0, error: 'End time must be after start time.' };
  }

  // Calculate paused time from pause log
  let totalPausedMs = 0;
  for (const interval of pauseLog) {
    const pauseStart = new Date(interval.paused_at).getTime();
    const pauseEnd = interval.resumed_at ? new Date(interval.resumed_at).getTime() : endMs;
    if (pauseEnd > pauseStart) {
      totalPausedMs += (pauseEnd - pauseStart);
    }
  }

  const rawDurationMs = endMs - startMs - totalPausedMs;
  const durationSeconds = Math.max(0, Math.floor(rawDurationMs / 1000));

  // Max session cap: 6 hours
  if (durationSeconds > CHALLENGE_CONSTANTS.MAX_STUDY_SESSION_SECONDS) {
    return {
      isValid: false,
      durationSeconds: CHALLENGE_CONSTANTS.MAX_STUDY_SESSION_SECONDS,
      error: `Session duration exceeds maximum permitted limit of ${CHALLENGE_CONSTANTS.MAX_STUDY_SESSION_HOURS} hours.`
    };
  }

  if (durationSeconds < 10) {
    return {
      isValid: false,
      durationSeconds,
      error: 'Session duration must be at least 10 seconds to record.'
    };
  }

  return { isValid: true, durationSeconds };
}

/**
 * Validates evidence file type and size
 */
export function validateEvidenceFile(file: File): { isValid: boolean; error?: string } {
  const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!validMimes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload a clear photo (JPEG, PNG, or WEBP).'
    };
  }

  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit. Please compress or take a smaller photo.'
    };
  }

  return { isValid: true };
}
