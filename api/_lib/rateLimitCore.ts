import crypto from 'crypto';
import type { IncomingMessage } from 'http';

export interface RateLimitPolicy {
  maxAttempts: number;
  windowMs: number;
  lockoutDurationMs: number;
}

export const RATE_LIMIT_POLICIES = {
  loginUser: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes lockout
  },
  loginIp: {
    maxAttempts: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes lockout
  },
  registerIp: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDurationMs: 60 * 60 * 1000, // 1 hour lockout
  },
} as const satisfies Record<string, RateLimitPolicy>;

export interface RateLimitRecord {
  key: string;
  count: number;
  window_start: number;
  locked_until: number;
}

export interface RateLimitCheckResult {
  isLocked: boolean;
  retryAfterSeconds: number;
}

/**
 * Standard dummy bcrypt hash with 10 salt rounds used for constant-time dummy comparisons
 * when a user does not exist, protecting against timing-based user enumeration.
 */
export const DUMMY_BCRYPT_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

/**
 * Creates a deterministic SHA-256 hash key using a secret pepper.
 * This prevents raw IPs or usernames from being logged or stored in the database.
 */
export function createRateLimitKey(
  type: 'login-user' | 'login-ip' | 'register-ip',
  value: string,
  secret: string
): string {
  const normalized = value.trim().toLowerCase();
  return crypto.createHash('sha256').update(`${type}:${normalized}:${secret}`).digest('hex');
}

/**
 * Extracts client IP address with priority:
 * 1. x-vercel-forwarded-for
 * 2. x-real-ip
 * 3. first IP in x-forwarded-for
 * fallback: 'unknown'
 */
export function getClientIp(req: IncomingMessage & { headers?: Record<string, string | string[] | undefined> }): string {
  const headers = req.headers || {};

  const vercelIp = headers['x-vercel-forwarded-for'];
  if (typeof vercelIp === 'string' && vercelIp.trim()) {
    const first = vercelIp.split(',')[0].trim();
    if (first) return first;
  }

  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    const first = realIp.split(',')[0].trim();
    if (first) return first;
  }

  const forwardedFor = headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    const first = forwardedFor.split(',')[0].trim();
    if (first) return first;
  }

  const socketIp = (req as any).socket?.remoteAddress;
  if (typeof socketIp === 'string' && socketIp.trim()) {
    return socketIp.trim();
  }

  return 'unknown';
}

/**
 * Pure function: Evaluates whether a record is currently locked or within active rate limits.
 */
export function checkRateLimit(
  record: RateLimitRecord | null,
  nowMs: number,
  policy: RateLimitPolicy
): RateLimitCheckResult {
  if (!record) {
    return { isLocked: false, retryAfterSeconds: 0 };
  }

  // Active lock
  if (record.locked_until > nowMs) {
    const remainingMs = record.locked_until - nowMs;
    return {
      isLocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  // Active window threshold check
  const isWithinWindow = nowMs - record.window_start <= policy.windowMs;
  if (isWithinWindow && record.count >= policy.maxAttempts) {
    const remainingMs = Math.max(0, record.window_start + policy.windowMs - nowMs);
    return {
      isLocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  return { isLocked: false, retryAfterSeconds: 0 };
}

/**
 * Pure function: Calculates the next state after an attempt occurs.
 */
export function calculateNextAttempt(
  record: RateLimitRecord | null,
  nowMs: number,
  policy: RateLimitPolicy
): {
  count: number;
  windowStart: number;
  lockedUntil: number;
  isLocked: boolean;
  retryAfterSeconds: number;
} {
  const isWindowExpired = !record || nowMs - record.window_start > policy.windowMs;

  let newCount: number;
  let newWindowStart: number;

  if (isWindowExpired) {
    newCount = 1;
    newWindowStart = nowMs;
  } else {
    newCount = record.count + 1;
    newWindowStart = record.window_start;
  }

  const shouldLock = newCount >= policy.maxAttempts;
  const newLockedUntil = shouldLock ? nowMs + policy.lockoutDurationMs : 0;
  const retryAfterSeconds = shouldLock ? Math.max(1, Math.ceil(policy.lockoutDurationMs / 1000)) : 0;

  return {
    count: newCount,
    windowStart: newWindowStart,
    lockedUntil: newLockedUntil,
    isLocked: shouldLock,
    retryAfterSeconds,
  };
}
