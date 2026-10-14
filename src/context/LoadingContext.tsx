import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  withLoader: <T>(action: () => Promise<T>, message?: React.ReactNode) => Promise<T>;
  /** Trigger a smooth route / tab transition */
  triggerTransition: (callback?: () => void, durationMs?: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { isLoading: isAuthLoading } = useAuth();
  const [activeRequests, setActiveRequests] = useState<number>(0);
  const [message, setMessage] = useState<React.ReactNode>('در حال بررسی امنیت و بارگذاری سامانه...');

  const showLoader = useCallback((msg?: React.ReactNode) => {
    if (msg) setMessage(msg);
    setActiveRequests((prev) => prev + 1);
  }, []);

  const hideLoader = useCallback(() => {
    setActiveRequests((prev) => Math.max(0, prev - 1));
  }, []);

  const withLoader = useCallback(
    async <T,>(action: () => Promise<T>, msg?: React.ReactNode): Promise<T> => {
      showLoader(msg);
      try {
        return await action();
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  const triggerTransition = useCallback((callback?: () => void, durationMs = 150) => {
    setActiveRequests((prev) => prev + 1);
    setTimeout(() => {
      if (callback) callback();
      setActiveRequests((prev) => Math.max(0, prev - 1));
    }, durationMs);
  }, []);

  const isGlobalLoading = isAuthLoading || activeRequests > 0;

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
