import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PageLoader } from '../components/PageLoader';
import { useAuth } from './AuthContext';

interface LoadingContextType {
  /** Whether the full-screen loader overlay is currently active */
  isLoading: boolean;
  /** Current loading status message */
  message?: React.ReactNode;
  /** Show the full-screen loader with an optional status message */
  showLoader: (message?: React.ReactNode) => void;
  /** Hide the full-screen loader */
  hideLoader: () => void;
  /** Execute an async operation wrapped with the page loader overlay */
  withLoader: <T>(action: () => Promise<T>, message?: React.ReactNode, timeoutMs?: number) => Promise<T>;
  /** Trigger a smooth route / tab transition */
  triggerTransition: (callback?: () => void, durationMs?: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [activeRequests, setActiveRequests] = useState<number>(0);
  const [message, setMessage] = useState<React.ReactNode>('در حال بررسی امنیت و بارگذاری سامانه...');
  const [bootTimedOut, setBootTimedOut] = useState<boolean>(false);

  // Maximum initial boot safety timeout: after 4s, force loader to clear
  useEffect(() => {
    const timer = setTimeout(() => {
      setBootTimedOut(true);
      setActiveRequests(0);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Whenever auth resolves to unauthenticated, immediately clear any pending requests
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setActiveRequests(0);
    }
  }, [isAuthLoading, isAuthenticated]);

  const showLoader = useCallback((msg?: React.ReactNode) => {
    if (msg) setMessage(msg);
    setActiveRequests((prev) => prev + 1);
  }, []);

  const hideLoader = useCallback(() => {
    setActiveRequests((prev) => Math.max(0, prev - 1));
  }, []);

  const withLoader = useCallback(
    async <T,>(action: () => Promise<T>, msg?: React.ReactNode, timeoutMs = 7000): Promise<T> => {
      showLoader(msg);
      let isDone = false;
      const safetyTimer = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          hideLoader();
          console.warn('withLoader operation exceeded safety timeout limit (', timeoutMs, 'ms)');
        }
      }, timeoutMs);

      try {
        return await action();
      } finally {
        clearTimeout(safetyTimer);
        if (!isDone) {
          isDone = true;
          hideLoader();
        }
      }
    },
    [showLoader, hideLoader]
  );

  const triggerTransition = useCallback((callback?: () => void, durationMs = 150) => {
    setActiveRequests((prev) => prev + 1);
    setTimeout(() => {
      try {
        if (callback) callback();
      } finally {
        setActiveRequests((prev) => Math.max(0, prev - 1));
      }
    }, durationMs);
  }, []);

  // Compute final loading state with comprehensive safeguards:
  // - If boot timeout fired and user is still unauthenticated: force false
  // - If unauthenticated: only true during active auth checks (isAuthLoading)
  // - If authenticated: true if isAuthLoading or active requests > 0
  const isGlobalLoading =
    bootTimedOut && !isAuthenticated
      ? false
      : isAuthLoading || (isAuthenticated && activeRequests > 0);

  return (
    <LoadingContext.Provider
      value={{
        isLoading: isGlobalLoading,
        message,
        showLoader,
        hideLoader,
        withLoader,
        triggerTransition,
      }}
    >
      <PageLoader
        isLoading={isGlobalLoading}
        message={isGlobalLoading ? message : undefined}
      />
      {children}
    </LoadingContext.Provider>
  );
}

export function usePageLoading(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('usePageLoading must be used within a LoadingProvider');
  }
  return context;
}
