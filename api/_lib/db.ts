import { createClient, type Client } from '@libsql/client/web';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

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
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Table for user cloud storage (supports encrypted payload sync)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_cloud_data (
      user_id TEXT PRIMARY KEY,
      storage_mode TEXT NOT NULL DEFAULT 'local',
      encrypted_payload TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  isInitialized = true;
}

export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
}

export interface UserCloudDataRow {
  user_id: string;
  storage_mode: 'local' | 'cloud_encrypted';
  encrypted_payload: string | null;
  updated_at: string;
}

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, username, display_name, password_hash, created_at, last_login_at FROM users WHERE username = ? COLLATE NOCASE LIMIT 1',
    args: [username.trim().toLowerCase()],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: String(row.id),
    username: String(row.username),
    display_name: String(row.display_name),
    password_hash: String(row.password_hash),
    created_at: String(row.created_at),
    last_login_at: row.last_login_at ? String(row.last_login_at) : null,
  };
}

export async function getUserById(id: string): Promise<UserRow | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, username, display_name, password_hash, created_at, last_login_at FROM users WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: String(row.id),
    username: String(row.username),
    display_name: String(row.display_name),
    password_hash: String(row.password_hash),
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
    sql: 'INSERT INTO users (id, username, display_name, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
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

export async function updateLastLogin(id: string): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: 'UPDATE users SET last_login_at = ? WHERE id = ?',
    args: [new Date().toISOString(), id],
  });
}

export async function getUserCloudData(userId: string): Promise<UserCloudDataRow | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT user_id, storage_mode, encrypted_payload, updated_at FROM user_cloud_data WHERE user_id = ? LIMIT 1',
    args: [userId],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    user_id: String(row.user_id),
    storage_mode: (row.storage_mode as 'local' | 'cloud_encrypted') || 'local',
    encrypted_payload: row.encrypted_payload ? String(row.encrypted_payload) : null,
    updated_at: String(row.updated_at),
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
