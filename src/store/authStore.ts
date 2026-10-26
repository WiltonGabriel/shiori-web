import { create } from "zustand";
import { AuthService } from "../services/auth.service";
import { isLocalMode } from "../services/api/httpClient";
import type { AuthenticatedUser, LoginRequest, RegistroRequest } from "../types/auth.types";

import { LocalProfileRepository } from "../services/storage/localProfileRepository";

export const getLocalReaderUser = (): AuthenticatedUser => {
  const profile = LocalProfileRepository.getProfile();
  return {
    id: 0,
    apelido: profile?.apelido || "Leitor Local",
    email: "local@shiori.app",
    role: "ROLE_USER",
    onboardingConcluido: true,
    avatarUrl: profile?.avatarUrl,
    bio: profile?.biografia,
    token: "shiori-local-session",
  };
};

export const LOCAL_READER_USER: AuthenticatedUser = {
  id: 0,
  apelido: "Leitor Local",
  email: "local@shiori.app",
  role: "ROLE_USER",
  onboardingConcluido: true,
  token: "shiori-local-session",
};

interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  initAuth: () => void;
  activateLocalSession: () => void;
  updateLocalProfile: (data: { apelido: string; biografia?: string; avatarUrl?: string }) => void;
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

  activateLocalSession: () => {
    set({ user: getLocalReaderUser(), isAuthenticated: true, isLoading: false });
  },

  updateLocalProfile: (data) => {
    LocalProfileRepository.saveProfile(data);
    set({ user: getLocalReaderUser() });
  },

  initAuth: () => {
    try {
      const stored = AuthService.getStoredUser();
      if (stored) {
        set({ user: stored, isAuthenticated: true, isLoading: false });
        return;
      }
      if (isLocalMode() || LocalProfileRepository.hasProfile()) {
        set({ user: getLocalReaderUser(), isAuthenticated: true, isLoading: false });
        return;
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
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
