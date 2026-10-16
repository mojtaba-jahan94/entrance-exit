import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoEnv } from '../_lib/db.js';
import { authenticateRequest } from '../_lib/auth.js';
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
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return sendJson(res, auth.status, {
        success: false,
        error: auth.error,
      });
    }

    const user = auth.user;
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
  } catch (err: unknown) {
    console.error('Auth verification error:', err);
    return sendJson(res, 500, {
      success: false,
      error: 'خطای داخلی سرور در بررسی اطلاعات حساب کاربری.',
    });
  }
}
