import { User } from '../types';

export const TOKEN_STORAGE_KEY = 'shamsi_auth_token_v1';

export interface AuthSuccessResponse {
  success: true;
  message?: string;
  token: string;
  user: User;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  retryAfter?: number;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  data: any;
  retryAfter?: number;

  constructor(status: number, data: any, message?: string, retryAfter?: number) {
    super(message || data?.error || data?.message || `خطای سرور: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function notifyUnauthorized(): void {
  for (const listener of unauthorizedListeners) {
    try {
      listener();
    } catch (e) {
      console.error('Unauthorized listener error:', e);
    }
  }
}

/**
 * Determines whether a 401 HTTP response represents an expired authenticated session
 * rather than an unauthenticated credentials error from login or register.
 */
export function isUnauthorizedSessionExpiry(status: number, path: string): boolean {
  if (status !== 401) return false;
  const normalizedPath = path.toLowerCase();
  if (
    normalizedPath.startsWith('/api/auth/login') ||
    normalizedPath.startsWith('/api/auth/register')
  ) {
    return false;
  }
  return true;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      let retryAfter: number | undefined;
      const retryHeader = response.headers.get('Retry-After');
      if (retryHeader) {
        const parsed = parseInt(retryHeader, 10);
        if (!isNaN(parsed) && parsed > 0) retryAfter = parsed;
      }
      throw new ApiError(response.status, null, `خطای سرور: ${response.status}`, retryAfter);
    }
    throw new Error('خطا در برقراری ارتباط با سرور.');
  }

  if (!response.ok) {
    let retryAfter: number | undefined;
    const retryHeader = response.headers.get('Retry-After');
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10);
      if (!isNaN(parsed) && parsed > 0) retryAfter = parsed;
    }
    if (!retryAfter && typeof data?.retryAfter === 'number' && data.retryAfter > 0) {
      retryAfter = data.retryAfter;
    }

    if (isUnauthorizedSessionExpiry(response.status, path)) {
      notifyUnauthorized();
    }

    throw new ApiError(
      response.status,
      data,
      data?.error || data?.message || `خطای سرور: ${response.status}`,
      retryAfter
    );
  }

  return data as T;
}

export const authApi = {
  async register(params: {
    username: string;
    displayName: string;
    password: string;
  }): Promise<AuthSuccessResponse> {
    return request<AuthSuccessResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async login(params: {
    username: string;
    password: string;
  }): Promise<AuthSuccessResponse> {
    return request<AuthSuccessResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>('/api/auth/me', {
      method: 'GET',
    });
  },

  async changePassword(params: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string; token?: string }> {
    return request<{ success: boolean; message: string; token?: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async checkStatus(): Promise<{ success: boolean; database: string; provider?: string }> {
    return request<{ success: boolean; database: string; provider?: string }>('/api/status', {
      method: 'GET',
    });
  },

  async saveCloudData(params: {
    storageMode: 'local' | 'cloud_encrypted';
    encryptedPayload?: string | null;
    baseVersion: number;
  }): Promise<{ success: boolean; version: number; updatedAt: string; storageMode: string; message?: string }> {
    return request<{ success: boolean; version: number; updatedAt: string; storageMode: string; message?: string }>(
      '/api/sync/save',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  },

  async loadCloudData(): Promise<{
    success: boolean;
    storageMode: 'local' | 'cloud_encrypted';
    encryptedPayload: string | null;
    updatedAt: string | null;
    version: number;
  }> {
    return request<{
      success: boolean;
      storageMode: 'local' | 'cloud_encrypted';
      encryptedPayload: string | null;
      updatedAt: string | null;
      version: number;
    }>('/api/sync/load', {
      method: 'GET',
    });
  },
};
