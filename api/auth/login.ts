import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserByUsername, updateLastLogin } from '../_lib/db';
import { verifyPassword, generateToken } from '../_lib/auth';
import { setCorsHeaders, sendJson, parseRequestBody } from '../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { username, password } = body;

    if (!username || !password) {
      return sendJson(res, 400, {
        success: false,
        error: 'لطفاً نام کاربری و رمز عبور را وارد کنید.',
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const user = await getUserByUsername(cleanUsername);

    if (!user) {
      return sendJson(res, 401, {
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است.',
      });
    }

    // Verify password hash
    const isMatch = await verifyPassword(String(password), user.password_hash);
    if (!isMatch) {
      return sendJson(res, 401, {
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است.',
      });
    }

    // Update last login timestamp in background/async
    updateLastLogin(user.id).catch((e) => console.error('Failed to update last login:', e));

    const token = generateToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
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
  } catch (err: any) {
    console.error('Login error:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || 'خطا در برقراری ارتباط با دیتابیس یا سرور.',
    });
  }
}
