import { createContext, useContext, useCallback, ReactNode } from 'react';

interface SyncContextType {
  triggerConnectionSync: (connectionId: number, activityType: string) => void;
  registerSyncHandler: (handler: (connectionId: number, activityType: string) => void) => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

let syncHandler: ((connectionId: number, activityType: string) => void) | null = null;

export function SyncProvider({ children }: { children: ReactNode }) {
  const triggerConnectionSync = useCallback((connectionId: number, activityType: string) => {

    if (syncHandler) {
      syncHandler(connectionId, activityType);
    } else {

    }
  }, []);

  const registerSyncHandler = useCallback((handler: (connectionId: number, activityType: string) => void) => {

    syncHandler = handler;
  }, []);

  return (
    <SyncContext.Provider value={{ triggerConnectionSync, registerSyncHandler }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}