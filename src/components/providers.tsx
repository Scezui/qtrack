"use client";

import React, { createContext, useContext } from 'react';
import useAppState from '@/hooks/use-app-state';
import { Toaster } from "@/components/ui/toaster"

type AppContextType = ReturnType<typeof useAppState>;

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const appState = useAppState();

  return (
    <AppContext.Provider value={appState}>
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
