import { create } from "zustand";
import { AuthService } from "../services/auth.service";
import type { AuthenticatedUser, LoginRequest, RegistroRequest } from "../types/auth.types";

interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
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
  isAuthModalOpen: false,

  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

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
    set({ user, isAuthenticated: true, isAuthModalOpen: false });
  },

  register: async (data: RegistroRequest) => {
    const user = await AuthService.register(data);
    set({ user, isAuthenticated: true, isAuthModalOpen: false });
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
