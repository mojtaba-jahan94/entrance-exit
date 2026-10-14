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
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutMs = (options as any).timeout || 6000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new Error('خطا در برقراری ارتباط با سرور.');
    }

    if (!response.ok) {
      throw new Error(data?.error || `خطای سرور: ${response.status}`);
    }

    return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
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
  }): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/change-password', {
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
  }): Promise<{ success: boolean; updatedAt: string; storageMode: string }> {
    return request<{ success: boolean; updatedAt: string; storageMode: string }>('/api/sync/save', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async loadCloudData(): Promise<{
    success: boolean;
    storageMode: 'local' | 'cloud_encrypted';
    encryptedPayload: string | null;
    updatedAt: string | null;
  }> {
    return request<{
      success: boolean;
      storageMode: 'local' | 'cloud_encrypted';
      encryptedPayload: string | null;
      updatedAt: string | null;
    }>('/api/sync/load', {
      method: 'GET',
    });
  },
};
