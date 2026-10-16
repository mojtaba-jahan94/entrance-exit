import { describe, it, expect } from 'vitest';
import {
  checkRateLimit,
  calculateNextAttempt,
  createRateLimitKey,
  getClientIp,
  RATE_LIMIT_POLICIES,
  RateLimitRecord,
} from '../../../api/_lib/rateLimitCore';

describe('rateLimitCore pure logic module', () => {
  const policy = RATE_LIMIT_POLICIES.loginUser; // maxAttempts: 5, windowMs: 15m, lockout: 15m
  const baseNow = 1_700_000_000_000;

  it('allows requests when no previous record exists (under threshold)', () => {
    const result = checkRateLimit(null, baseNow, policy);
    expect(result.isLocked).toBe(false);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it('allows attempts when count is strictly below maxAttempts', () => {
    const record: RateLimitRecord = {
      key: 'test_key',
      count: 4,
      window_start: baseNow - 60_000,
      locked_until: 0,
    };
    const result = checkRateLimit(record, baseNow, policy);
    expect(result.isLocked).toBe(false);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it('locks when attempt count reaches maxAttempts (5)', () => {
    // 4th attempt transitions to 5th attempt
    const record: RateLimitRecord = {
      key: 'test_key',
      count: 4,
      window_start: baseNow - 60_000,
      locked_until: 0,
    };
    const next = calculateNextAttempt(record, baseNow, policy);
    expect(next.count).toBe(5);
    expect(next.isLocked).toBe(true);
    expect(next.lockedUntil).toBe(baseNow + policy.lockoutDurationMs);
    expect(next.retryAfterSeconds).toBe(policy.lockoutDurationMs / 1000); // 900 seconds
  });

  it('reports active lock and accurately calculates retryAfter in seconds', () => {
    const record: RateLimitRecord = {
      key: 'test_key',
      count: 5,
      window_start: baseNow - 120_000,
      locked_until: baseNow + 300_000, // 300 seconds left
    };
    const result = checkRateLimit(record, baseNow, policy);
    expect(result.isLocked).toBe(true);
    expect(result.retryAfterSeconds).toBe(300);
  });

  it('resets counter and starts fresh window when window has expired', () => {
    const expiredWindowStart = baseNow - (policy.windowMs + 10_000); // 15m 10s ago
    const record: RateLimitRecord = {
      key: 'test_key',
      count: 4,
      window_start: expiredWindowStart,
      locked_until: 0,
    };

    // calculateNextAttempt resets count to 1 and updates windowStart to baseNow
    const next = calculateNextAttempt(record, baseNow, policy);
    expect(next.count).toBe(1);
    expect(next.windowStart).toBe(baseNow);
    expect(next.isLocked).toBe(false);
    expect(next.lockedUntil).toBe(0);
  });

  it('allows requests again once lock period has passed', () => {
    const record: RateLimitRecord = {
      key: 'test_key',
      count: 5,
      window_start: baseNow - 1_000_000,
      locked_until: baseNow - 1_000, // Lock expired 1s ago
    };

    const check = checkRateLimit(record, baseNow, policy);
    expect(check.isLocked).toBe(false);
    expect(check.retryAfterSeconds).toBe(0);
  });

  it('hashes keys with SHA-256 and pepper and normalizes input', () => {
    const secret = 'super-secret-pepper-123';
    const key1 = createRateLimitKey('login-user', 'AdminUser ', secret);
    const key2 = createRateLimitKey('login-user', 'adminuser', secret);
    const keyDiff = createRateLimitKey('login-user', 'otheruser', secret);

    expect(key1).toBe(key2);
    expect(key1).not.toBe(keyDiff);
    expect(key1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('extracts client IP with strict header precedence', () => {
    // 1. x-vercel-forwarded-for takes top priority
    const req1 = {
      headers: {
        'x-vercel-forwarded-for': '203.0.113.195, 198.51.100.1',
        'x-real-ip': '198.51.100.2',
        'x-forwarded-for': '198.51.100.3',
      },
    };
    expect(getClientIp(req1 as any)).toBe('203.0.113.195');

    // 2. x-real-ip takes second priority
    const req2 = {
      headers: {
        'x-real-ip': '198.51.100.2',
        'x-forwarded-for': '198.51.100.3',
      },
    };
    expect(getClientIp(req2 as any)).toBe('198.51.100.2');

    // 3. first IP in x-forwarded-for
    const req3 = {
      headers: {
        'x-forwarded-for': '198.51.100.3, 10.0.0.1',
      },
    };
    expect(getClientIp(req3 as any)).toBe('198.51.100.3');

    // 4. fallback to unknown
    const req4 = { headers: {} };
    expect(getClientIp(req4 as any)).toBe('unknown');
  });

  it('resets user counter on successful login, immediately allowing requests under threshold', () => {
    // User had failed attempts previously
    const failedRecord: RateLimitRecord = {
      key: 'test_user_key',
      count: 4,
      window_start: baseNow - 60_000,
      locked_until: 0,
    };
    expect(checkRateLimit(failedRecord, baseNow, policy).isLocked).toBe(false);

    // On successful login, user attempt record is reset to null in the database
    const resetRecord: RateLimitRecord | null = null;
    const checkAfterReset = checkRateLimit(resetRecord, baseNow, policy);
    expect(checkAfterReset.isLocked).toBe(false);
    expect(checkAfterReset.retryAfterSeconds).toBe(0);

    // New attempt after reset starts cleanly at count 1
    const freshAttempt = calculateNextAttempt(resetRecord, baseNow, policy);
    expect(freshAttempt.count).toBe(1);
    expect(freshAttempt.isLocked).toBe(false);
  });

  it('enforces register IP policy (max 5 requests per hour)', () => {
    const regPolicy = RATE_LIMIT_POLICIES.registerIp; // maxAttempts: 5, window: 1h, lock: 1h
    const record: RateLimitRecord = {
      key: 'reg_ip_key',
      count: 4,
      window_start: baseNow - 100_000,
      locked_until: 0,
    };

    // 5th attempt locks the IP for 1 hour
    const next = calculateNextAttempt(record, baseNow, regPolicy);
    expect(next.count).toBe(5);
    expect(next.isLocked).toBe(true);
    expect(next.lockedUntil).toBe(baseNow + regPolicy.lockoutDurationMs);
    expect(next.retryAfterSeconds).toBe(3600);
  });
});
