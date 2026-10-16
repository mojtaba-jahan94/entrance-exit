import { createClient, type Client } from '@libsql/client/web';

let dbInstance: Client | null = null;
let isInitialized = false;

export function getTursoEnv() {
  const url =
    process.env.TURSO_DATABASE_URL ||
    process.env.TURSO_DB_URL ||
    process.env.LIBSQL_URL ||
    process.env.TURSO_URL ||
    process.env.DATABASE_URL;

  const authToken =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.TURSO_TOKEN ||
    process.env.TURSO_DB_AUTH_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN;

  return { url: url?.trim() || null, authToken: authToken?.trim() || null };
}

export function getDb(): Client {
  const { url, authToken } = getTursoEnv();

  if (!url) {
    throw new Error(
      'پایگاه داده سرور پیکربندی نشده است. لطفاً متغیرهای اتصال را در پنل سرور وارد نمایید.'
    );
  }

  if (!dbInstance) {
    dbInstance = createClient({
      url,
      authToken: authToken || undefined,
    });
  }

  return dbInstance;
}

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Migration: ensure 'token_version' column exists on users table
  try {
    const usersInfo = await db.execute('PRAGMA table_info(users)');
    const hasTokenVersion = usersInfo.rows.some((row) => String(row.name) === 'token_version');
    if (!hasTokenVersion) {
      await db.execute('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0');
    }
  } catch (migErr) {
    console.error('Migration notice for users.token_version:', migErr);
  }

  // Table for tracking authentication rate limits (IP and user lockouts)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS auth_attempts (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      window_start INTEGER NOT NULL,
      locked_until INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_auth_attempts_window ON auth_attempts(window_start, locked_until);
  `);

  // Table for user cloud storage (supports encrypted payload sync with versioning)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_cloud_data (
      user_id TEXT PRIMARY KEY,
      storage_mode TEXT NOT NULL DEFAULT 'local',
      encrypted_payload TEXT,
      version INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  // Migration: ensure 'version' column exists for existing tables created before
  try {
    const tableInfo = await db.execute('PRAGMA table_info(user_cloud_data)');
    const hasVersionColumn = tableInfo.rows.some((row) => String(row.name) === 'version');
    if (!hasVersionColumn) {
      await db.execute('ALTER TABLE user_cloud_data ADD COLUMN version INTEGER NOT NULL DEFAULT 0');
    }
  } catch (migErr) {
    console.error('Migration notice for user_cloud_data.version:', migErr);
  }

  isInitialized = true;
}

export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  token_version: number;
  created_at: string;
  last_login_at: string | null;
}

export interface UserCloudDataRow {
  user_id: string;
  storage_mode: 'local' | 'cloud_encrypted';
  encrypted_payload: string | null;
  version: number;
  updated_at: string;
}

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, username, display_name, password_hash, token_version, created_at, last_login_at FROM users WHERE username = ? COLLATE NOCASE LIMIT 1',
    args: [username.trim().toLowerCase()],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: String(row.id),
    username: String(row.username),
    display_name: String(row.display_name),
    password_hash: String(row.password_hash),
    token_version: typeof row.token_version === 'number' ? row.token_version : Number(row.token_version ?? 0),
    created_at: String(row.created_at),
    last_login_at: row.last_login_at ? String(row.last_login_at) : null,
  };
}

export async function getUserById(id: string): Promise<UserRow | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, username, display_name, password_hash, token_version, created_at, last_login_at FROM users WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: String(row.id),
    username: String(row.username),
    display_name: String(row.display_name),
    password_hash: String(row.password_hash),
    token_version: typeof row.token_version === 'number' ? row.token_version : Number(row.token_version ?? 0),
    created_at: String(row.created_at),
    last_login_at: row.last_login_at ? String(row.last_login_at) : null,
  };
}

export async function createUser(user: {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
}): Promise<void> {
  await initDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: 'INSERT INTO users (id, username, display_name, password_hash, token_version, created_at, last_login_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
    args: [user.id, user.username.trim().toLowerCase(), user.displayName.trim(), user.passwordHash, now, now],
  });
}

export async function updateUserPassword(id: string, newPasswordHash: string): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
    args: [newPasswordHash, id],
  });
}

export async function incrementUserTokenVersion(userId: string): Promise<number> {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: 'UPDATE users SET token_version = token_version + 1 WHERE id = ?',
    args: [userId],
  });
  const user = await getUserById(userId);
  return user?.token_version ?? 1;
}

export async function updateLastLogin(id: string): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: 'UPDATE users SET last_login_at = ? WHERE id = ?',
    args: [new Date().toISOString(), id],
  });
}

// ---------------- Rate Limit DB Operations ----------------

export async function getRateLimitRecord(key: string) {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT key, count, window_start, locked_until FROM auth_attempts WHERE key = ? LIMIT 1',
    args: [key],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    key: String(row.key),
    count: Number(row.count),
    window_start: Number(row.window_start),
    locked_until: Number(row.locked_until),
  };
}

export async function recordRateLimitAttempt(
  key: string,
  policy: { maxAttempts: number; windowMs: number; lockoutDurationMs: number }
): Promise<{ count: number; windowStart: number; lockedUntil: number; isLocked: boolean; retryAfterSeconds: number }> {
  await initDb();
  const db = getDb();
  const now = Date.now();

  // Atomic conditional UPSERT: resets expired window or increments counter and locks if threshold exceeded
  await db.execute({
    sql: `INSERT INTO auth_attempts (key, count, window_start, locked_until)
          VALUES (?, 1, ?, CASE WHEN 1 >= ? THEN ? + ? ELSE 0 END)
          ON CONFLICT(key) DO UPDATE SET
            count = CASE
              WHEN (? - auth_attempts.window_start) > ? THEN 1
              ELSE auth_attempts.count + 1
            END,
            window_start = CASE
              WHEN (? - auth_attempts.window_start) > ? THEN ?
              ELSE auth_attempts.window_start
            END,
            locked_until = CASE
              WHEN (CASE WHEN (? - auth_attempts.window_start) > ? THEN 1 ELSE auth_attempts.count + 1 END) >= ?
                THEN ? + ?
              WHEN auth_attempts.locked_until > ? THEN auth_attempts.locked_until
              ELSE 0
            END`,
    args: [
      // INSERT values
      key,
      now,
      policy.maxAttempts,
      now,
      policy.lockoutDurationMs,
      // UPDATE count
      now,
      policy.windowMs,
      // UPDATE window_start
      now,
      policy.windowMs,
      now,
      // UPDATE locked_until
      now,
      policy.windowMs,
      policy.maxAttempts,
      now,
      policy.lockoutDurationMs,
      now,
    ],
  });

  const updated = await getRateLimitRecord(key);
  const isLocked = (updated?.locked_until ?? 0) > now;
  const retryAfterSeconds = isLocked ? Math.max(1, Math.ceil(((updated?.locked_until ?? 0) - now) / 1000)) : 0;

  return {
    count: updated?.count ?? 1,
    windowStart: updated?.window_start ?? now,
    lockedUntil: updated?.locked_until ?? 0,
    isLocked,
    retryAfterSeconds,
  };
}

export async function resetRateLimit(key: string): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM auth_attempts WHERE key = ?',
    args: [key],
  });
}

export async function cleanupExpiredRateLimits(olderThanMs: number): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM auth_attempts WHERE window_start < ? AND locked_until < ?',
    args: [olderThanMs, olderThanMs],
  });
}

export async function getUserCloudData(userId: string): Promise<UserCloudDataRow | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT user_id, storage_mode, encrypted_payload, version, updated_at FROM user_cloud_data WHERE user_id = ? LIMIT 1',
    args: [userId],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    user_id: String(row.user_id),
    storage_mode: (row.storage_mode as 'local' | 'cloud_encrypted') || 'local',
    encrypted_payload: row.encrypted_payload ? String(row.encrypted_payload) : null,
    version: typeof row.version === 'number' ? row.version : Number(row.version ?? 0),
    updated_at: String(row.updated_at),
  };
}

export type SaveUserCloudDataResult =
  | { success: true; conflict?: false; version: number; updatedAt: string }
  | { success: false; conflict: true; currentVersion: number };

/**
 * Optimistic concurrency save for user cloud data:
 * - If baseVersion === 0 and user has no record: atomic INSERT with version = 1.
 * - If user has record: atomic conditional UPDATE with `WHERE user_id = ? AND version = ?`.
 * - If conditional UPDATE matches 0 rows: returns conflict with currentVersion.
 */
export async function saveUserCloudDataWithVersion(
  userId: string,
  storageMode: 'local' | 'cloud_encrypted',
  encryptedPayload: string | null,
  baseVersion: number
): Promise<SaveUserCloudDataResult> {
  await initDb();
  const db = getDb();
  const now = new Date().toISOString();

  // 1. Attempt atomic conditional UPDATE
  const updateResult = await db.execute({
    sql: `UPDATE user_cloud_data
          SET storage_mode = ?, encrypted_payload = ?, version = version + 1, updated_at = ?
          WHERE user_id = ? AND version = ?`,
    args: [storageMode, encryptedPayload || null, now, userId, baseVersion],
  });

  if (updateResult.rowsAffected > 0) {
    return {
      success: true,
      version: baseVersion + 1,
      updatedAt: now,
    };
  }

  // 2. If 0 rows were affected and baseVersion === 0, attempt atomic initial INSERT
  if (baseVersion === 0) {
    const insertResult = await db.execute({
      sql: `INSERT INTO user_cloud_data (user_id, storage_mode, encrypted_payload, version, updated_at)
            VALUES (?, ?, ?, 1, ?)
            ON CONFLICT(user_id) DO NOTHING`,
      args: [userId, storageMode, encryptedPayload || null, now],
    });

    if (insertResult.rowsAffected > 0) {
      return {
        success: true,
        version: 1,
        updatedAt: now,
      };
    }
  }

  // 3. Otherwise, a conflict occurred (outdated version or concurrent insertion)
  const currentResult = await db.execute({
    sql: 'SELECT version FROM user_cloud_data WHERE user_id = ? LIMIT 1',
    args: [userId],
  });

  let currentVersion = 0;
  if (currentResult.rows.length > 0) {
    const row = currentResult.rows[0];
    currentVersion = typeof row.version === 'number' ? row.version : Number(row.version ?? 0);
  }

  return {
    success: false,
    conflict: true,
    currentVersion,
  };
}

export async function saveUserCloudData(
  userId: string,
  storageMode: 'local' | 'cloud_encrypted',
  encryptedPayload?: string | null
): Promise<string> {
  await initDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO user_cloud_data (user_id, storage_mode, encrypted_payload, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            storage_mode = excluded.storage_mode,
            encrypted_payload = excluded.encrypted_payload,
            updated_at = excluded.updated_at`,
    args: [userId, storageMode, encryptedPayload || null, now],
  });

  return now;
}
