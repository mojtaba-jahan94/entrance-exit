import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getUserByUsername,
  updateLastLogin,
  getTursoEnv,
  getRateLimitRecord,
  recordRateLimitAttempt,
  resetRateLimit,
  cleanupExpiredRateLimits,
} from '../_lib/db.js';
import { verifyPassword, generateToken, getJwtSecret } from '../_lib/auth.js';
import {
  createRateLimitKey,
  getClientIp,
  checkRateLimit,
  RATE_LIMIT_POLICIES,
  DUMMY_BCRYPT_HASH,
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
    const body = await parseRequestBody<{ username?: string; password?: string }>(req);
    const { username, password } = body;

    if (!username || !password) {
      return sendJson(res, 400, {
        success: false,
        error: 'لطفاً نام کاربری و رمز عبور را وارد کنید.',
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const clientIp = getClientIp(req);
    const secret = getJwtSecret();

    const userKey = createRateLimitKey('login-user', cleanUsername, secret);
    const ipKey = createRateLimitKey('login-ip', clientIp, secret);

    const now = Date.now();

    // 1. Check if either user or IP is currently locked before touching password
    const [userRecord, ipRecord] = await Promise.all([
      getRateLimitRecord(userKey),
      getRateLimitRecord(ipKey),
    ]);

    const userCheck = checkRateLimit(userRecord, now, RATE_LIMIT_POLICIES.loginUser);
    const ipCheck = checkRateLimit(ipRecord, now, RATE_LIMIT_POLICIES.loginIp);

    if (userCheck.isLocked || ipCheck.isLocked) {
      const retryAfter = Math.max(userCheck.retryAfterSeconds, ipCheck.retryAfterSeconds);
      return sendJson(
        res,
        429,
        {
          success: false,
          error: 'rate_limited',
          retryAfter,
          message: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
        },
        req,
        { 'Retry-After': retryAfter }
      );
    }

    // Opportunistic cleanup of expired rate limits (5% probability)
    if (Math.random() < 0.05) {
      cleanupExpiredRateLimits(now - 24 * 60 * 60 * 1000).catch((e) =>
        console.error('Rate limit cleanup error:', e)
      );
    }

    // 2. Lookup user
    const user = await getUserByUsername(cleanUsername);

    // 3. Constant-time dummy comparison if user does not exist to mitigate user enumeration
    if (!user) {
      await verifyPassword(String(password), DUMMY_BCRYPT_HASH);
      // Record failure attempt sequentially for both user key and IP key
      await recordRateLimitAttempt(userKey, RATE_LIMIT_POLICIES.loginUser);
      await recordRateLimitAttempt(ipKey, RATE_LIMIT_POLICIES.loginIp);

      return sendJson(res, 401, {
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است.',
      });
    }

    // 4. Verify password
    const isMatch = await verifyPassword(String(password), user.password_hash);
    if (!isMatch) {
      // Record failure attempt sequentially for both user key and IP key
      await recordRateLimitAttempt(userKey, RATE_LIMIT_POLICIES.loginUser);
      await recordRateLimitAttempt(ipKey, RATE_LIMIT_POLICIES.loginIp);

      return sendJson(res, 401, {
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است.',
      });
    }

    // 5. Successful login: reset user counter only (not IP counter)
    await resetRateLimit(userKey);

    // Update last login timestamp in background
    updateLastLogin(user.id).catch((e) => console.error('Failed to update last login:', e));

    const token = generateToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      tv: user.token_version,
    });

    return sendJson(res, 200, {
      success: true,
      message: 'ورود موفقیت‌آمیز بود.',
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        createdAt: user.created_at,
        lastLoginAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error('Login error:', err);
    // Fail closed: reject request with generic 500 on database or rate limit failure
    return sendJson(res, 500, {
      success: false,
      error: 'خطای داخلی سرور در پردازش درخواست ورود.',
    });
  }
}
