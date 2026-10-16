import { describe, it, expect } from 'vitest';
import { isUnauthorizedSessionExpiry } from '../api';

describe('Client authentication decision logic (isUnauthorizedSessionExpiry)', () => {
  it('does NOT treat 401 from /api/auth/login as session expiry (401 login !== session expiry)', () => {
    expect(isUnauthorizedSessionExpiry(401, '/api/auth/login')).toBe(false);
    expect(isUnauthorizedSessionExpiry(401, '/api/auth/login/')).toBe(false);
    expect(isUnauthorizedSessionExpiry(401, '/api/auth/login?ref=test')).toBe(false);
  });

  it('does NOT treat 401 from /api/auth/register as session expiry', () => {
    expect(isUnauthorizedSessionExpiry(401, '/api/auth/register')).toBe(false);
    expect(isUnauthorizedSessionExpiry(401, '/api/auth/register/')).toBe(false);
  });

  it('treats 401 from /api/auth/me as session expiry (401 me === session expiry)', () => {
    expect(isUnauthorizedSessionExpiry(401, '/api/auth/me')).toBe(true);
  });

  it('treats 401 from sync endpoints as session expiry', () => {
    expect(isUnauthorizedSessionExpiry(401, '/api/sync/load')).toBe(true);
    expect(isUnauthorizedSessionExpiry(401, '/api/sync/save')).toBe(true);
  });

  it('treats 401 from change-password as session expiry', () => {
    expect(isUnauthorizedSessionExpiry(401, '/api/auth/change-password')).toBe(true);
  });

  it('does NOT treat non-401 statuses as session expiry', () => {
    expect(isUnauthorizedSessionExpiry(200, '/api/auth/me')).toBe(false);
    expect(isUnauthorizedSessionExpiry(400, '/api/auth/me')).toBe(false);
    expect(isUnauthorizedSessionExpiry(409, '/api/sync/save')).toBe(false);
    expect(isUnauthorizedSessionExpiry(429, '/api/auth/login')).toBe(false);
    expect(isUnauthorizedSessionExpiry(500, '/api/sync/load')).toBe(false);
  });
});
