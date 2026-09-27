import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, StorageMode } from '../types';
import { authApi, getStoredToken, setStoredToken } from '../utils/api';
import { encryptData, decryptData } from '../utils/crypto';

interface CloudPayload {
  records: any[];
  leaves: any[];
  config: any;
  syncTime: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dbStatus: 'connected' | 'not_configured' | 'error' | 'checking';
  storageMode: StorageMode;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  login: (params: { username: string; password: string }) => Promise<void>;
  register: (params: { username: string; displayName: string; password: string }) => Promise<void>;
  logout: () => void;
  changePassword: (params: { currentPassword: string; newPassword: string }) => Promise<void>;
  checkConnection: () => Promise<void>;
  setStorageMode: (mode: StorageMode) => Promise<void>;
  syncDataToCloud: (data: { records: any[]; leaves: any[]; config: any }) => Promise<void>;
  loadDataFromCloud: () => Promise<CloudPayload | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'not_configured' | 'error' | 'checking'>('checking');

  // Storage Mode: 'local' (offline-first browser only) or 'cloud_encrypted' (E2EE AES-256 cloud sync)
  const [storageMode, setStorageModeState] = useState<StorageMode>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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

  // Fetch cloud storage preferences on user load
  const loadCloudPreferences = useCallback(async (activeUser: User) => {
    try {
      const res = await authApi.loadCloudData();
      if (res.success) {
        const mode = res.storageMode || 'local';
        setStorageModeState(mode);
        setLastSyncedAt(res.updatedAt || null);
        localStorage.setItem(`shamsi_storage_mode_${activeUser.id}`, mode);
      }
    } catch (e) {
      console.warn('Could not load cloud storage settings:', e);
      const cached = localStorage.getItem(`shamsi_storage_mode_${activeUser.id}`) as StorageMode;
      if (cached) setStorageModeState(cached);
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
          await loadCloudPreferences(res.user);
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
  }, [checkConnection, loadCloudPreferences]);

  const login = async (params: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(params);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setDbStatus('connected');
      await loadCloudPreferences(res.user);
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
      setStorageModeState('local');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setStorageModeState('local');
    setLastSyncedAt(null);
  };

  const changePassword = async (params: { currentPassword: string; newPassword: string }) => {
    await authApi.changePassword(params);
  };

  const setStorageMode = async (mode: StorageMode) => {
    setStorageModeState(mode);
    if (user) {
      localStorage.setItem(`shamsi_storage_mode_${user.id}`, mode);
      try {
        await authApi.saveCloudData({ storageMode: mode });
      } catch (e) {
        console.error('Failed to save storage mode to server:', e);
      }
    }
  };

  /**
   * Encrypts and syncs data to online database if mode is cloud_encrypted
   */
  const syncDataToCloud = async (data: { records: any[]; leaves: any[]; config: any }) => {
    if (!user) return;
    if (storageMode !== 'cloud_encrypted') {
      // Local mode: do not send data to cloud
      return;
    }

    setIsSyncing(true);
    try {
      const payload: CloudPayload = {
        records: data.records,
        leaves: data.leaves,
        config: data.config,
        syncTime: new Date().toISOString(),
      };

      // AES-256-GCM encryption with user's private identity key
      const encryptionSecret = `${user.id}_e2ee_key`;
      const encryptedPayload = await encryptData(payload, encryptionSecret);

      const res = await authApi.saveCloudData({
        storageMode: 'cloud_encrypted',
        encryptedPayload,
      });

      if (res.success) {
        setLastSyncedAt(res.updatedAt);
      }
    } catch (err) {
      console.error('Failed to sync encrypted data to cloud:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Fetches and decrypts data from online database
   */
  const loadDataFromCloud = async (): Promise<CloudPayload | null> => {
    if (!user) return null;
    setIsSyncing(true);
    try {
      const res = await authApi.loadCloudData();
      if (!res.success || !res.encryptedPayload) {
        return null;
      }

      setStorageModeState(res.storageMode || 'local');
      setLastSyncedAt(res.updatedAt || null);

      if (res.storageMode === 'cloud_encrypted' && res.encryptedPayload) {
        const encryptionSecret = `${user.id}_e2ee_key`;
        const decrypted = await decryptData<CloudPayload>(res.encryptedPayload, encryptionSecret);
        return decrypted;
      }
      return null;
    } catch (err) {
      console.error('Failed to load encrypted data from cloud:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        dbStatus,
        storageMode,
        lastSyncedAt,
        isSyncing,
        login,
        register,
        logout,
        changePassword,
        checkConnection,
        setStorageMode,
        syncDataToCloud,
        loadDataFromCloud,
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
