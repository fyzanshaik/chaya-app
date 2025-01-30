import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}

const isLocalStorageAvailable =
  typeof window !== "undefined" && window.localStorage;

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,
      hydrated: false,
      setUser: user => set({ user }),
      setIsAuthenticated: isAuthenticated => set({ isAuthenticated }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setHydrated: hydrated => set({ hydrated }),
    }),
    {
      name: "auth-storage",
      storage: isLocalStorageAvailable
        ? createJSONStorage(() => localStorage)
        : undefined,
      onRehydrateStorage: () => state => {
        state?.setHydrated(true);
      },
    }
  )
);
