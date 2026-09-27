import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, initDb } from './_lib/db';
import { setCorsHeaders, sendJson } from './_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl =
      process.env.TURSO_DATABASE_URL ||
      process.env.TURSO_DB_URL ||
      process.env.LIBSQL_URL ||
      process.env.TURSO_URL ||
      process.env.DATABASE_URL;
    const isCloud = Boolean(rawUrl && (rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://')));

    await initDb();
    const db = getDb();
    await db.execute('SELECT 1 as connected');

    return sendJson(res, 200, {
      success: true,
      database: 'connected',
      provider: isCloud ? 'turso_cloud' : 'local_sqlite',
      message: isCloud
        ? 'متصل به سرور ابری Turso'
        : 'دیتابیس در حالت لوکال فعال است. برای اتصال به Turso متغیرهای TURSO_DATABASE_URL را تنظیم فرمایید.',
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    return sendJson(res, 500, {
      success: false,
      database: 'error',
      error: err.message,
    });
  }
}
