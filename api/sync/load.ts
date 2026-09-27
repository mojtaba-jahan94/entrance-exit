import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserCloudData } from '../_lib/db.js';
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

    const data = await getUserCloudData(payload.userId);

    return sendJson(res, 200, {
      success: true,
      storageMode: data?.storage_mode || 'local',
      encryptedPayload: data?.encrypted_payload || null,
      updatedAt: data?.updated_at || null,
    });
  } catch (err: any) {
    console.error('Sync load error:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || 'خطا در دریافت اطلاعات ابری.',
    });
  }
}
