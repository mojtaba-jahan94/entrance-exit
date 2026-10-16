import type { IncomingMessage } from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserById, type UserRow } from './db.js';

const BCRYPT_SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('متغیر محیطی JWT_SECRET تنظیم نشده است. تنظیم این متغیر برای امنیت احراز هویت اجباری است.');
  }
  return secret.trim();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface TokenPayload {
  userId: string;
  username: string;
  displayName: string;
  tv?: number;
}

export function generateToken(payload: TokenPayload): string {
  const tokenPayload = {
    userId: payload.userId,
    username: payload.username,
    displayName: payload.displayName,
    tv: typeof payload.tv === 'number' ? payload.tv : 0,
  };
  return jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

export type AuthResult =
  | { success: true; user: UserRow }
  | { success: false; status: 401; error: string };

/**
 * Unified token verification and session validation:
 * 1. Extracts bearer token from request headers
 * 2. Verifies cryptographic signature and 7-day expiration
 * 3. Reads user from DB in a single query
 * 4. Checks that token's `tv` claim (defaulting to 0 for legacy tokens) matches user.token_version
 * 5. Returns 401 on missing token, expired token, revoked token version, or missing user
 */
export async function authenticateRequest(
  req: IncomingMessage | { headers?: Record<string, string | string[] | undefined> }
): Promise<AuthResult> {
  const headers = req.headers || {};
  const authHeader = (headers['authorization'] || headers['Authorization']) as string | undefined;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      success: false,
      status: 401,
      error: 'توکن احراز هویت ارسال نشده است.',
    };
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return {
      success: false,
      status: 401,
      error: 'نشست کاربری منقضی شده یا نامعتبر است. لطفاً مجدداً وارد شوید.',
    };
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return {
      success: false,
      status: 401,
      error: 'کاربر یافت نشد یا نشست کاربری نامعتبر است.',
    };
  }

  const tokenVersion = typeof payload.tv === 'number' ? payload.tv : 0;
  if (tokenVersion !== user.token_version) {
    return {
      success: false,
      status: 401,
      error: 'نشست کاربری شما باطل شده است. لطفاً مجدداً وارد شوید.',
    };
  }

  return {
    success: true,
    user,
  };
}
