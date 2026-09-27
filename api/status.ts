import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoEnv, initDb, getDb } from './_lib/db.js';
import { setCorsHeaders, sendJson } from './_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = getTursoEnv();

  if (!url) {
    return sendJson(res, 200, {
      success: false,
      database: 'not_configured',
      message: 'پایگاه داده سرور مرکزی در دسترس نیست.',
    });
  }

  try {
    await initDb();
    const db = getDb();
    await db.execute('SELECT 1 as connected');

    return sendJson(res, 200, {
      success: true,
      database: 'connected',
      provider: 'cloud_cluster',
      message: 'سرور مرکزی آنلاین و متصل',
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Status check error:', err);
    return sendJson(res, 200, {
      success: false,
      database: 'error',
      error: err.message || 'خطا در برقراری ارتباط با سرور مرکزی',
    });
  }
}
