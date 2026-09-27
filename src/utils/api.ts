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
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
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
    throw new Error('خطا در برقراری ارتباط با سرور.');
  }

  if (!response.ok) {
    throw new Error(data?.error || `خطای سرور: ${response.status}`);
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
};
