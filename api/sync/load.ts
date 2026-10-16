import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserCloudData } from '../_lib/db.js';
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

  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return sendJson(res, auth.status, { success: false, error: auth.error });
    }

    const data = await getUserCloudData(auth.user.id);

    return sendJson(res, 200, {
      success: true,
      storageMode: data?.storage_mode || 'local',
      encryptedPayload: data?.encrypted_payload || null,
      updatedAt: data?.updated_at || null,
      version: data?.version ?? 0,
    });
  } catch (err: unknown) {
    console.error('Sync load error:', err);
    return sendJson(res, 500, {
      success: false,
      error: 'خطای داخلی سرور در بازیابی داده‌های ابری.',
    });
  }
}
