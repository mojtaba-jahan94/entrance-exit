import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { authApi, getStoredToken, setStoredToken } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dbStatus: 'connected' | 'not_configured' | 'error' | 'checking';
  login: (params: { username: string; password: string }) => Promise<void>;
  register: (params: { username: string; displayName: string; password: string }) => Promise<void>;
  logout: () => void;
  changePassword: (params: { currentPassword: string; newPassword: string }) => Promise<void>;
  checkConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'not_configured' | 'error' | 'checking'>('checking');

  // Check database connectivity
  const checkConnection = useCallback(async () => {
    try {
      const res = await authApi.checkStatus();
      if (res.database === 'connected') {
        setDbStatus('connected');
      } else if (res.database === 'not_configured') {
        setDbStatus('not_configured');
      } else {
        setDbStatus('error');
      }
    } catch {
      setDbStatus('error');
    }
  }, []);

  // Validate existing token on boot
  useEffect(() => {
    async function initAuth() {
      checkConnection();
      const existingToken = getStoredToken();
      if (!existingToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          setStoredToken(null);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        setStoredToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, [checkConnection]);

  const login = async (params: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(params);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setDbStatus('connected');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: { username: string; displayName: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(params);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setDbStatus('connected');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const changePassword = async (params: { currentPassword: string; newPassword: string }) => {
    await authApi.changePassword(params);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        dbStatus,
        login,
        register,
        logout,
        changePassword,
        checkConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
