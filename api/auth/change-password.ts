import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserById, updateUserPassword } from '../_lib/db';
import { verifyToken, extractBearerToken, verifyPassword, hashPassword } from '../_lib/auth';
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
        error: 'توکن منقضی شده است. لطفاً مجدداً وارد شوید.',
      });
    }

    const body = await parseRequestBody(req);
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return sendJson(res, 400, {
        success: false,
        error: 'لطفاً رمز عبور فعلی و رمز عبور جدید را وارد نمایید.',
      });
    }

    if (newPassword.length < 6) {
      return sendJson(res, 400, {
        success: false,
        error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.',
      });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return sendJson(res, 404, {
        success: false,
        error: 'کاربر یافت نشد.',
      });
    }

    const isMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return sendJson(res, 400, {
        success: false,
        error: 'رمز عبور فعلی نادرست است.',
      });
    }

    const newHash = await hashPassword(newPassword);
    await updateUserPassword(user.id, newHash);

    return sendJson(res, 200, {
      success: true,
      message: 'رمز عبور با موفقیت به‌روزرسانی شد.',
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || 'خطا در تغییر رمز عبور.',
    });
  }
}
