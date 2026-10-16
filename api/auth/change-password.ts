import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateUserPassword, incrementUserTokenVersion, getTursoEnv } from '../_lib/db.js';
import { authenticateRequest, verifyPassword, hashPassword, generateToken } from '../_lib/auth.js';
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

    const body = await parseRequestBody<{ currentPassword?: string; newPassword?: string }>(req);
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
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

    const isMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return sendJson(res, 400, {
        success: false,
        error: 'رمز عبور فعلی نادرست است.',
      });
    }

    const newHash = await hashPassword(newPassword);
    await updateUserPassword(user.id, newHash);

    // Invalidate all prior sessions on other devices by incrementing token_version
    const newVersion = await incrementUserTokenVersion(user.id);
    const newToken = generateToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      tv: newVersion,
    });

    return sendJson(res, 200, {
      success: true,
      message: 'رمز عبور با موفقیت به‌روزرسانی شد.',
      token: newToken,
    });
  } catch (err: unknown) {
    console.error('Change password error:', err);
    return sendJson(res, 500, {
      success: false,
      error: 'خطای داخلی سرور در تغییر رمز عبور.',
    });
  }
}
