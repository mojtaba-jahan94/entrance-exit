import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserById, getTursoEnv } from '../_lib/db.js';
import { verifyToken, extractBearerToken } from '../_lib/auth.js';
import { setCorsHeaders, sendJson } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  const { url } = getTursoEnv();
  if (!url) {
    return sendJson(res, 401, {
      success: false,
      error: 'دیتابیس متصل نیست.',
    });
  }

  try {
    const authHeader = req.headers.authorization || (req.headers['authorization'] as string);
    const token = extractBearerToken(authHeader);

    if (!token) {
      return sendJson(res, 401, {
        success: false,
        error: 'توکن احراز هویت ارسال نشده است.',
      });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return sendJson(res, 401, {
        success: false,
        error: 'توکن منقضی شده یا نامعتبر است. لطفاً مجدداً وارد شوید.',
      });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return sendJson(res, 404, {
        success: false,
        error: 'کاربر یافت نشد.',
      });
    }

    return sendJson(res, 200, {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
    });
  } catch (err: any) {
    console.error('Auth verification error:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || 'خطا در بررسی نشست کاربری.',
    });
  }
}
