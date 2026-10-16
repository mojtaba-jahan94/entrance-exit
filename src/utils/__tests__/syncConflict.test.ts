import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialSyncState,
  canPerformSave,
  handleLoadSuccess,
  handleSaveSuccess,
  handleConflictDetected,
  resolveConflictWithCloud,
  prepareOverwriteCloud,
  getPersistedCloudVersion,
  setPersistedCloudVersion,
  CLOUD_VERSION_STORAGE_PREFIX,
} from '../syncConflict';

// Polyfill localStorage in node test environment
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
}

describe('syncConflict pure decision module', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('forbids saving before a successful load in the current session', () => {
    // Even if localStorage has a persisted version from a previous run
    const state = createInitialSyncState(3);
    expect(state.hasLoadedInSession).toBe(false);
    expect(state.currentVersion).toBe(3);

    const check = canPerformSave(state);
    expect(check.allowed).toBe(false);
    if (!check.allowed) {
      expect(check.reason).toBe('NOT_LOADED_IN_SESSION');
    }
  });

  it('allows saving after a successful initial load with correct version', () => {
    const initialState = createInitialSyncState();
    expect(canPerformSave(initialState).allowed).toBe(false);

    // Load succeeds from cloud with version 2
    const loadedState = handleLoadSuccess(initialState, 2);
    expect(loadedState.hasLoadedInSession).toBe(true);
    expect(loadedState.currentVersion).toBe(2);
    expect(loadedState.hasConflict).toBe(false);
    expect(loadedState.isAutoSyncHalted).toBe(false);

    const check = canPerformSave(loadedState);
    expect(check.allowed).toBe(true);
  });

  it('increments and persists new version on successful save', () => {
    const loadedState = handleLoadSuccess(createInitialSyncState(), 2);
    const savedState = handleSaveSuccess(loadedState, 3);

    expect(savedState.currentVersion).toBe(3);
    expect(savedState.hasConflict).toBe(false);
    expect(savedState.isAutoSyncHalted).toBe(false);

    const check = canPerformSave(savedState);
    expect(check.allowed).toBe(true);
  });

  it('detects 409 conflict and halts automatic saves', () => {
    const loadedState = handleLoadSuccess(createInitialSyncState(), 2);
    expect(canPerformSave(loadedState).allowed).toBe(true);

    // Server returns 409 conflict with remoteVersion: 4
    const conflictState = handleConflictDetected(loadedState, 4);

    expect(conflictState.hasConflict).toBe(true);
    expect(conflictState.conflictRemoteVersion).toBe(4);
    expect(conflictState.isAutoSyncHalted).toBe(true);

    // Auto-save must be halted!
    const check = canPerformSave(conflictState);
    expect(check.allowed).toBe(false);
    if (!check.allowed) {
      expect(check.reason).toBe('CONFLICT_HALTED');
    }
  });

  it('updates version and unhalts sync when user selects "استفاده از داده ابری" (Option A)', () => {
    const loadedState = handleLoadSuccess(createInitialSyncState(), 2);
    const conflictState = handleConflictDetected(loadedState, 5);
    expect(canPerformSave(conflictState).allowed).toBe(false);

    // User accepts cloud data with version 5
    const resolvedState = resolveConflictWithCloud(conflictState, 5);

    expect(resolvedState.currentVersion).toBe(5);
    expect(resolvedState.hasConflict).toBe(false);
    expect(resolvedState.isAutoSyncHalted).toBe(false);
    expect(resolvedState.hasLoadedInSession).toBe(true);

    const check = canPerformSave(resolvedState);
    expect(check.allowed).toBe(true);
  });

  it('prepares overwrite with cloud version when user selects "جایگزینی داده ابری" (Option B)', () => {
    const loadedState = handleLoadSuccess(createInitialSyncState(), 2);
    const conflictState = handleConflictDetected(loadedState, 5);
    expect(canPerformSave(conflictState).allowed).toBe(false);

    // User chooses to overwrite cloud with local data using latest server version
    const { nextState, baseVersionToSave } = prepareOverwriteCloud(conflictState, 5);

    expect(baseVersionToSave).toBe(5);
    expect(nextState.currentVersion).toBe(5);
    expect(nextState.hasConflict).toBe(false);
    expect(nextState.isAutoSyncHalted).toBe(false);

    const check = canPerformSave(nextState);
    expect(check.allowed).toBe(true);

    // After successfully overwriting, new version is returned by server (e.g. 6)
    const finalState = handleSaveSuccess(nextState, 6);
    expect(finalState.currentVersion).toBe(6);
    expect(canPerformSave(finalState).allowed).toBe(true);
  });

  it('persists and retrieves user version in localStorage scoped by userId', () => {
    const userId1 = 'user_abc';
    const userId2 = 'user_xyz';

    expect(getPersistedCloudVersion(userId1)).toBe(null);

    setPersistedCloudVersion(userId1, 7);
    setPersistedCloudVersion(userId2, 12);

    expect(getPersistedCloudVersion(userId1)).toBe(7);
    expect(getPersistedCloudVersion(userId2)).toBe(12);
    expect(localStorage.getItem(`${CLOUD_VERSION_STORAGE_PREFIX}${userId1}`)).toBe('7');

    setPersistedCloudVersion(userId1, null);
    expect(getPersistedCloudVersion(userId1)).toBe(null);
    expect(getPersistedCloudVersion(userId2)).toBe(12);
  });
});
