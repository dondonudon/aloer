"use client";

import { createContext, useContext } from "react";

interface StoreContextValue {
  storeIconUrl?: string | null;
}

const StoreContext = createContext<StoreContextValue>({});

export function StoreProvider({
  children,
  storeIconUrl,
}: {
  children: React.ReactNode;
  storeIconUrl?: string | null;
}) {
  return (
    <StoreContext.Provider value={{ storeIconUrl }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
