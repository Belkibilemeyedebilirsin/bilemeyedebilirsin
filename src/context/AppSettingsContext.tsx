import React, { createContext, useContext, useMemo, useState } from "react";

type AppSettingsContextType = {
  notificationsEnabled: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
  dataSaver: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  setAnimationsEnabled: (value: boolean) => void;
  setCompactMode: (value: boolean) => void;
  setDataSaver: (value: boolean) => void;
  getMotionDuration: (duration: number) => number;
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined
);

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);

  const value = useMemo(
    () => ({
      notificationsEnabled,
      animationsEnabled,
      compactMode,
      dataSaver,
      setNotificationsEnabled,
      setAnimationsEnabled,
      setCompactMode,
      setDataSaver,
      getMotionDuration: (duration: number) =>
        animationsEnabled ? duration : 0,
    }),
    [notificationsEnabled, animationsEnabled, compactMode, dataSaver]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }

  return context;
}