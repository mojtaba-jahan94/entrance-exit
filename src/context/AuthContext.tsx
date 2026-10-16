import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, StorageMode, AttendanceRecord, LeaveRecord, ShiftConfig } from '../types';
import { authApi, getStoredToken, setStoredToken, ApiError, onUnauthorized } from '../utils/api';
import { encryptData, decryptData } from '../utils/crypto';
import {
  SyncConflictState,
  createInitialSyncState,
  canPerformSave,
  handleLoadSuccess,
  handleSaveSuccess,
  handleConflictDetected,
  resolveConflictWithCloud,
  getPersistedCloudVersion,
  setPersistedCloudVersion,
} from '../utils/syncConflict';

interface CloudPayload {
  records: AttendanceRecord[];
  leaves: LeaveRecord[];
  config: ShiftConfig;
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
  hasConflict: boolean;
  conflictRemoteVersion: number | null;
  cloudVersion: number | null;
  isConflictModalOpen: boolean;
  setIsConflictModalOpen: (open: boolean) => void;
  login: (params: { username: string; password: string }) => Promise<void>;
  register: (params: { username: string; displayName: string; password: string }) => Promise<void>;
  logout: () => void;
  changePassword: (params: { currentPassword: string; newPassword: string }) => Promise<void>;
  checkConnection: () => Promise<void>;
  setStorageMode: (mode: StorageMode) => Promise<void>;
  syncDataToCloud: (data: { records: AttendanceRecord[]; leaves: LeaveRecord[]; config: ShiftConfig }) => Promise<void>;
  loadDataFromCloud: () => Promise<CloudPayload | null>;
  resolveConflictAdoptCloud: () => Promise<CloudPayload | null>;
  resolveConflictOverwriteCloud: (data: { records: AttendanceRecord[]; leaves: LeaveRecord[]; config: ShiftConfig }) => Promise<void>;
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

  // Cloud sync versioning and conflict state
  const [syncState, setSyncState] = useState<SyncConflictState>(() => createInitialSyncState());
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);

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

  // Fetch cloud storage preferences and latest version on user load
  const loadCloudPreferences = useCallback(async (activeUser: User) => {
    try {
      const persistedVer = getPersistedCloudVersion(activeUser.id);
      setSyncState(createInitialSyncState(persistedVer));

      const res = await authApi.loadCloudData();
      if (res.success) {
        const mode = res.storageMode || 'local';
        setStorageModeState(mode);
        setLastSyncedAt(res.updatedAt || null);
        localStorage.setItem(`shamsi_storage_mode_${activeUser.id}`, mode);

        const serverVersion = res.version ?? 0;
        setSyncState((prev) => handleLoadSuccess(prev, serverVersion));
        setPersistedCloudVersion(activeUser.id, serverVersion);
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
    const res = await authApi.login(params);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setDbStatus('connected');
    await loadCloudPreferences(res.user);
  };

  const register = async (params: { username: string; displayName: string; password: string }) => {
    const res = await authApi.register(params);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setDbStatus('connected');
    setStorageModeState('local');
    setSyncState(createInitialSyncState());
  };

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setStorageModeState('local');
    setLastSyncedAt(null);
    setSyncState(createInitialSyncState());
    setIsConflictModalOpen(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      logout();
    });
    return unsubscribe;
  }, [logout]);

  const changePassword = async (params: { currentPassword: string; newPassword: string }) => {
    const res = await authApi.changePassword(params);
    if (res.token) {
      setStoredToken(res.token);
      setToken(res.token);
    }
  };

  const setStorageMode = async (mode: StorageMode) => {
    setStorageModeState(mode);
    if (user) {
      localStorage.setItem(`shamsi_storage_mode_${user.id}`, mode);
      try {
        const baseVersion = syncState.currentVersion ?? 0;
        const res = await authApi.saveCloudData({ storageMode: mode, baseVersion });
        if (res.success) {
          setSyncState((prev) => handleSaveSuccess(prev, res.version));
          setPersistedCloudVersion(user.id, res.version);
        }
      } catch (e) {
        console.error('Failed to save storage mode to server:', e);
      }
    }
  };

  /**
   * Encrypts and syncs data to online database if mode is cloud_encrypted.
   * Enforces version-based optimistic concurrency.
   */
  const syncDataToCloud = useCallback(
    async (data: { records: AttendanceRecord[]; leaves: LeaveRecord[]; config: ShiftConfig }) => {
      if (!user) return;
      if (storageMode !== 'cloud_encrypted') {
        // Local mode: do not send data to cloud
        return;
      }

      const check = canPerformSave(syncState);
      if (!check.allowed) {
        if (check.reason === 'CONFLICT_HALTED') {
          console.warn('Sync save blocked: conflict is active and sync is halted.');
          return;
        }
        if (check.reason === 'NOT_LOADED_IN_SESSION') {
          console.warn('Sync save blocked: must load from cloud before saving in this session.');
          return;
        }
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

        const baseVersion = syncState.currentVersion ?? 0;
        const res = await authApi.saveCloudData({
          storageMode: 'cloud_encrypted',
          encryptedPayload,
          baseVersion,
        });

        if (res.success) {
          setSyncState((prev) => handleSaveSuccess(prev, res.version));
          setPersistedCloudVersion(user.id, res.version);
          setLastSyncedAt(res.updatedAt);
        }
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 409) {
          const remoteVer =
            typeof err.data?.currentVersion === 'number'
              ? err.data.currentVersion
              : (syncState.currentVersion ?? 0) + 1;
          setSyncState((prev) => handleConflictDetected(prev, remoteVer));
          setIsConflictModalOpen(true);
          throw err;
        }
        console.error('Failed to sync encrypted data to cloud:', err);
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [user, storageMode, syncState]
  );

  /**
   * Fetches and decrypts data from online database.
   * Updates current session version.
   */
  const loadDataFromCloud = useCallback(async (): Promise<CloudPayload | null> => {
    if (!user) return null;
    setIsSyncing(true);
    try {
      const res = await authApi.loadCloudData();
      if (!res.success) {
        return null;
      }

      setStorageModeState(res.storageMode || 'local');
      setLastSyncedAt(res.updatedAt || null);

      const serverVersion = res.version ?? 0;
      setSyncState((prev) => handleLoadSuccess(prev, serverVersion));
      setPersistedCloudVersion(user.id, serverVersion);

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
  }, [user]);

  /**
   * Conflict resolution - Option A:
   * Adopt cloud version and payload, clearing conflict and unhalting sync.
   */
  const resolveConflictAdoptCloud = useCallback(async (): Promise<CloudPayload | null> => {
    if (!user) return null;
    setIsSyncing(true);
    try {
      const res = await authApi.loadCloudData();
      if (!res.success) {
        return null;
      }

      setStorageModeState(res.storageMode || 'local');
      setLastSyncedAt(res.updatedAt || null);

      const serverVersion = res.version ?? 0;
      setSyncState((prev) => resolveConflictWithCloud(prev, serverVersion));
      setPersistedCloudVersion(user.id, serverVersion);
      setIsConflictModalOpen(false);

      if (res.storageMode === 'cloud_encrypted' && res.encryptedPayload) {
        const encryptionSecret = `${user.id}_e2ee_key`;
        const decrypted = await decryptData<CloudPayload>(res.encryptedPayload, encryptionSecret);
        return decrypted;
      }
      return null;
    } catch (err) {
      console.error('Failed to adopt cloud data during conflict resolution:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  /**
   * Conflict resolution - Option B:
   * Fetch current cloud version (version only), then overwrite cloud with local data.
   */
  const resolveConflictOverwriteCloud = useCallback(
    async (data: { records: AttendanceRecord[]; leaves: LeaveRecord[]; config: ShiftConfig }) => {
      if (!user) return;
      setIsSyncing(true);
      try {
        // Step 1: fetch latest version only
        const loadRes = await authApi.loadCloudData();
        const latestVer = loadRes.version ?? 0;

        // Step 2: encrypt local data
        const payload: CloudPayload = {
          records: data.records,
          leaves: data.leaves,
          config: data.config,
          syncTime: new Date().toISOString(),
        };
        const encryptionSecret = `${user.id}_e2ee_key`;
        const encryptedPayload = await encryptData(payload, encryptionSecret);

        // Step 3: save with baseVersion = latestVer
        const res = await authApi.saveCloudData({
          storageMode: 'cloud_encrypted',
          encryptedPayload,
          baseVersion: latestVer,
        });

        if (res.success) {
          setSyncState((prev) => handleSaveSuccess(prev, res.version));
          setPersistedCloudVersion(user.id, res.version);
          setLastSyncedAt(res.updatedAt);
          setIsConflictModalOpen(false);
        }
      } catch (err) {
        console.error('Failed to overwrite cloud data during conflict resolution:', err);
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [user]
  );

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
        hasConflict: syncState.hasConflict,
        conflictRemoteVersion: syncState.conflictRemoteVersion,
        cloudVersion: syncState.currentVersion,
        isConflictModalOpen,
        setIsConflictModalOpen,
        login,
        register,
        logout,
        changePassword,
        checkConnection,
        setStorageMode,
        syncDataToCloud,
        loadDataFromCloud,
        resolveConflictAdoptCloud,
        resolveConflictOverwriteCloud,
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
