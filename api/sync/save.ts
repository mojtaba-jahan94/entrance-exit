import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveUserCloudDataWithVersion } from '../_lib/db.js';
import { authenticateRequest } from '../_lib/auth.js';
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
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return sendJson(res, auth.status, { success: false, error: auth.error });
    }

    const body = await parseRequestBody<{
      storageMode?: string;
      encryptedPayload?: string | null;
      baseVersion?: unknown;
    }>(req);
    const { storageMode, encryptedPayload, baseVersion } = body;

    // Validate baseVersion: must be an integer >= 0
    if (
      typeof baseVersion !== 'number' ||
      !Number.isInteger(baseVersion) ||
      baseVersion < 0
    ) {
      return sendJson(res, 400, {
        success: false,
        error: 'درخواست نامعتبر است. لطفاً صفحه را بارگذاری مجدد نمایید.',
      });
    }

    const validMode = storageMode === 'cloud_encrypted' ? 'cloud_encrypted' : 'local';
    const payloadStr = typeof encryptedPayload === 'string' ? encryptedPayload : null;

    const result = await saveUserCloudDataWithVersion(
      auth.user.id,
      validMode,
      payloadStr,
      baseVersion
    );

    if (!result.success && result.conflict) {
      return sendJson(res, 409, {
        success: false,
        error: 'conflict',
        currentVersion: result.currentVersion,
        message: 'روی دستگاه دیگری داده‌ی جدیدتری ذخیره شده است.',
      });
    }

    if (result.success) {
      return sendJson(res, 200, {
        success: true,
        version: result.version,
        updatedAt: result.updatedAt,
        storageMode: validMode,
        message: 'همگام‌سازی با موفقیت انجام شد.',
      });
    }

    return sendJson(res, 500, {
      success: false,
      error: 'خطای داخلی سرور در ذخیره‌سازی داده‌های ابری.',
    });
  } catch (err: unknown) {
    console.error('Sync save error:', err);
    return sendJson(res, 500, {
      success: false,
      error: 'خطای داخلی سرور در ذخیره‌سازی داده‌های ابری.',
    });
  }
}
