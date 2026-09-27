import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveUserCloudData } from '../_lib/db.js';
import { verifyToken, extractBearerToken } from '../_lib/auth.js';
import { setCorsHeaders, sendJson, parseRequestBody } from '../_lib/response.js';

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
      return sendJson(res, 401, { success: false, error: 'توکن نامعتبر است.' });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return sendJson(res, 401, { success: false, error: 'نشست کاربری منقضی شده است.' });
    }

    const body = await parseRequestBody(req);
    const { storageMode, encryptedPayload } = body;

    const validMode = storageMode === 'cloud_encrypted' ? 'cloud_encrypted' : 'local';
    const updatedAt = await saveUserCloudData(payload.userId, validMode, encryptedPayload || null);

    return sendJson(res, 200, {
      success: true,
      message: 'همگام‌سازی با موفقیت انجام شد.',
      updatedAt,
      storageMode: validMode,
    });
  } catch (err: any) {
    console.error('Sync save error:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || 'خطا در همگام‌سازی داده‌های ابری.',
    });
  }
}
