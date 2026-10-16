import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import {
  getUserByUsername,
  createUser,
  getTursoEnv,
  getRateLimitRecord,
  recordRateLimitAttempt,
  cleanupExpiredRateLimits,
} from '../_lib/db.js';
import { hashPassword, generateToken, getJwtSecret } from '../_lib/auth.js';
import {
  createRateLimitKey,
  getClientIp,
  checkRateLimit,
  RATE_LIMIT_POLICIES,
} from '../_lib/rateLimitCore.js';
import { setCorsHeaders, sendJson, parseRequestBody } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  const { url } = getTursoEnv();
  if (!url) {
    return sendJson(res, 400, {
      success: false,
      error: 'پایگاه داده سرور در حال حاضر در دسترس نیست. لطفاً دقایقی دیگر مجدداً تلاش نمایید.',
    });
  }

  try {
    const clientIp = getClientIp(req);
    const secret = getJwtSecret();
    const ipKey = createRateLimitKey('register-ip', clientIp, secret);
    const now = Date.now();

    // 1. Check if the IP is currently locked for registration
    const ipRecord = await getRateLimitRecord(ipKey);
    const check = checkRateLimit(ipRecord, now, RATE_LIMIT_POLICIES.registerIp);

    if (check.isLocked) {
      return sendJson(
        res,
        429,
        {
          success: false,
          error: 'rate_limited',
          retryAfter: check.retryAfterSeconds,
          message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
        },
        req,
        { 'Retry-After': check.retryAfterSeconds }
      );
    }

    // 2. Count this attempt (every attempt, successful or failed, is counted)
    await recordRateLimitAttempt(ipKey, RATE_LIMIT_POLICIES.registerIp);

    // Opportunistic cleanup of expired rate limits (5% probability)
    if (Math.random() < 0.05) {
      cleanupExpiredRateLimits(now - 24 * 60 * 60 * 1000).catch((e) =>
        console.error('Rate limit cleanup error:', e)
      );
    }

    const body = await parseRequestBody<{ username?: string; displayName?: string; password?: string }>(req);
    const { username, displayName, password } = body;

    // Validation
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return sendJson(res, 400, {
        success: false,
        error: 'نام کاربری باید حداقل ۳ کاراکتر باشد.',
      });
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
      return sendJson(res, 400, {
        success: false,
        error: 'نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return sendJson(res, 400, {
        success: false,
        error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    // Check if user already exists
    const existing = await getUserByUsername(cleanUsername);
    if (existing) {
      return sendJson(res, 409, {
        success: false,
        error: 'این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.',
      });
    }

    // Hash password securely with bcrypt
    const passwordHash = await hashPassword(password);
    const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    await createUser({
      id: userId,
      username: cleanUsername,
      displayName: cleanDisplayName,
      passwordHash,
    });

    const userPayload = {
      userId,
      username: cleanUsername,
      displayName: cleanDisplayName,
      tv: 0,
    };

    const token = generateToken(userPayload);

    return sendJson(res, 201, {
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد.',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        displayName: cleanDisplayName,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return sendJson(res, 500, {
      success: false,
      error: 'خطای داخلی سرور در ثبت‌نام کاربر.',
    });
  }
}
