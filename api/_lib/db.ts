import { createClient, Client } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables for local dev / scripts
dotenv.config({ path: '.env.local' });
dotenv.config();

let dbInstance: Client | null = null;
let isInitialized = false;

export function getDb(): Client {
  let url =
    process.env.TURSO_DATABASE_URL ||
    process.env.TURSO_DB_URL ||
    process.env.LIBSQL_URL ||
    process.env.TURSO_URL ||
    process.env.DATABASE_URL;

  let authToken =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.TURSO_TOKEN ||
    process.env.TURSO_DB_AUTH_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN;

  // Fallback to local SQLite file during local development if cloud credentials are not yet entered
  if (!url || url.trim() === '') {
    if (process.env.NODE_ENV !== 'production') {
      url = 'file:dev_local.db';
      authToken = undefined;
    } else {
      throw new Error(
        'TURSO_DATABASE_URL در متغیرهای محیطی Vercel یافت نشد. لطفاً در پنل Vercel آن را مقداردهی فرمایید.'
      );
    }
  }

  if (!dbInstance) {
    dbInstance = createClient({
      url,
      authToken: authToken || undefined,
    });
  }

  return dbInstance;
}

/**
 * Initializes the users table in Turso if not already present
 */
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
