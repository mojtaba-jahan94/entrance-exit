import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserByUsername, createUser, getTursoEnv } from '../_lib/db.js';
import { hashPassword, generateToken } from '../_lib/auth.js';
import { setCorsHeaders, sendJson, parseRequestBody } from '../_lib/response.js';
import crypto from 'crypto';

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
      error: 'دیتابیس ابری Turso هنوز در Vercel متصل نشده است. لطفاً ابتدا TURSO_DATABASE_URL را در تنظیمات Vercel اضافه فرمایید.',
    });
  }

  try {
    const body = await parseRequestBody(req);
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
  } catch (err: any) {
    console.error('Registration error:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || 'خطا در ارتباط با دیتابیس Turso.',
    });
  }
}
