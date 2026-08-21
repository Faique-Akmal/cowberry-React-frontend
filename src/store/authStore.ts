// store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  accessToken: string;
  allocatedarea: string;
  department: string;
  email: string;
  employee_code: string;
  full_name: string;
  isActiveEmployee: boolean;
  mobileNo: string;
  profileimg: string;
  refreshToken: string;
  rememberMe: boolean;
  token: string;
  userld: string;
  userRole: string;
  username: string;
}

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
