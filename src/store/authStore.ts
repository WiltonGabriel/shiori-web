import { create } from "zustand";
import { AuthService } from "../services/auth.service";
import type { AuthenticatedUser, LoginRequest, RegistroRequest } from "../types/auth.types";

interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => void;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegistroRequest) => Promise<void>;
  updateUser: (partial: Partial<AuthenticatedUser>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: () => {
    try {
      const stored = AuthService.getStoredUser();
      if (stored) {
        set({ user: stored, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials: LoginRequest) => {
    const user = await AuthService.login(credentials);
    set({ user, isAuthenticated: true });
  },

  register: async (data: RegistroRequest) => {
    const user = await AuthService.register(data);
    set({ user, isAuthenticated: true });
  },

  updateUser: (partial: Partial<AuthenticatedUser>) => {
    AuthService.updateUserSession(partial);
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    }));
  },

  logout: async () => {
    await AuthService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));
