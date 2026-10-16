export interface SyncConflictState {
  currentVersion: number | null;
  hasLoadedInSession: boolean;
  hasConflict: boolean;
  conflictRemoteVersion: number | null;
  isAutoSyncHalted: boolean;
}

export type CanSaveResult =
  | { allowed: true }
  | { allowed: false; reason: 'NOT_LOADED_IN_SESSION' | 'CONFLICT_HALTED' | 'NO_VERSION' };

export const CLOUD_VERSION_STORAGE_PREFIX = 'shamsi_cloud_version_';

export function getPersistedCloudVersion(userId: string): number | null {
  if (!userId || typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(`${CLOUD_VERSION_STORAGE_PREFIX}${userId}`);
    if (raw === null || raw === undefined) return null;
    const parsed = parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function setPersistedCloudVersion(userId: string, version: number | null): void {
  if (!userId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = `${CLOUD_VERSION_STORAGE_PREFIX}${userId}`;
    if (version === null || version === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(version));
    }
  } catch {
    // Ignore storage quota or security issues
  }
}

export function createInitialSyncState(persistedVersion?: number | null): SyncConflictState {
  return {
    currentVersion: typeof persistedVersion === 'number' && Number.isInteger(persistedVersion) && persistedVersion >= 0 ? persistedVersion : null,
    hasLoadedInSession: false,
    hasConflict: false,
    conflictRemoteVersion: null,
    isAutoSyncHalted: false,
  };
}

/**
 * Checks whether a save is allowed:
 * 1. Must have had a successful load in this session (hasLoadedInSession === true).
 * 2. Must not be in a conflict/halted state (hasConflict === false && isAutoSyncHalted === false).
 * 3. Must have a valid numeric currentVersion >= 0.
 */
export function canPerformSave(state: SyncConflictState): CanSaveResult {
  if (!state.hasLoadedInSession) {
    return { allowed: false, reason: 'NOT_LOADED_IN_SESSION' };
  }

  if (state.hasConflict || state.isAutoSyncHalted) {
    return { allowed: false, reason: 'CONFLICT_HALTED' };
  }

  if (typeof state.currentVersion !== 'number' || !Number.isInteger(state.currentVersion) || state.currentVersion < 0) {
    return { allowed: false, reason: 'NO_VERSION' };
  }

  return { allowed: true };
}

/**
 * Handles a successful load response from the cloud server.
 */
export function handleLoadSuccess(
  state: SyncConflictState,
  serverVersion: number
): SyncConflictState {
  const validVersion = Math.max(0, Math.floor(serverVersion || 0));
  return {
    ...state,
    currentVersion: validVersion,
    hasLoadedInSession: true,
    hasConflict: false,
    conflictRemoteVersion: null,
    isAutoSyncHalted: false,
  };
}

/**
 * Handles a successful save response from the cloud server.
 */
export function handleSaveSuccess(
  state: SyncConflictState,
  newVersion: number
): SyncConflictState {
  const validVersion = Math.max(0, Math.floor(newVersion || 0));
  return {
    ...state,
    currentVersion: validVersion,
    hasConflict: false,
    conflictRemoteVersion: null,
    isAutoSyncHalted: false,
  };
}

/**
 * Handles an HTTP 409 conflict detected during save.
 * Halts automatic sync and marks conflict state.
 */
export function handleConflictDetected(
  state: SyncConflictState,
  remoteVersion: number
): SyncConflictState {
  return {
    ...state,
    hasConflict: true,
    conflictRemoteVersion: typeof remoteVersion === 'number' ? remoteVersion : null,
    isAutoSyncHalted: true,
  };
}

/**
 * Option A: "استفاده از داده‌ی ابری"
 * Adopts cloud data: updates version to cloud version, unhalts auto-sync, clears conflict.
 */
export function resolveConflictWithCloud(
  state: SyncConflictState,
  cloudVersion: number
): SyncConflictState {
  const validVersion = Math.max(0, Math.floor(cloudVersion || 0));
  return {
    ...state,
    currentVersion: validVersion,
    hasLoadedInSession: true,
    hasConflict: false,
    conflictRemoteVersion: null,
    isAutoSyncHalted: false,
  };
}

/**
 * Option B: "جایگزینی داده‌ی ابری با داده‌ی این دستگاه"
 * Prepares local state to overwrite cloud by setting baseVersion to the latest cloud version.
 */
export function prepareOverwriteCloud(
  state: SyncConflictState,
  latestCloudVersion: number
): { nextState: SyncConflictState; baseVersionToSave: number } {
  const validVersion = Math.max(0, Math.floor(latestCloudVersion || 0));
  return {
    nextState: {
      ...state,
      currentVersion: validVersion,
      hasLoadedInSession: true,
      hasConflict: false,
      conflictRemoteVersion: null,
      isAutoSyncHalted: false,
    },
    baseVersionToSave: validVersion,
  };
}
