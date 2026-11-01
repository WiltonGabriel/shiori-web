import { create } from "zustand";
import { AuthService } from "../services/auth.service";
import { CatalogService } from "../services/catalog.service";
import type { AuthenticatedUser, LoginRequest, RegistroRequest } from "../types/auth.types";
import { LocalProfileRepository } from "../services/storage/localProfileRepository";

export const getLocalReaderUser = (): AuthenticatedUser => {
  const profile = LocalProfileRepository.getProfile();
  return {
    id: 0,
    apelido: profile?.apelido || "Leitor Local",
    email: `${(profile?.apelido || "local").toLowerCase()}@conta.shiori.local`,
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
  activateLocalSession: (apelido?: string) => void;
  updateLocalProfile: (data: { apelido: string; biografia?: string; avatarUrl?: string }) => void;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegistroRequest) => Promise<void>;
  conectarConta: (data: { apelido: string; senha: string; email?: string }) => Promise<AuthenticatedUser>;
  updateUser: (partial: Partial<AuthenticatedUser>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthModalOpen: false,

  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => {
    // Só permite fechar se já tiver conta ativa
    if (get().isAuthenticated) {
      set({ isAuthModalOpen: false });
    }
  },

  activateLocalSession: (apelido?: string) => {
    const user = apelido
      ? AuthService.createLocalAccountSession(apelido)
      : getLocalReaderUser();
    set({ user, isAuthenticated: true, isLoading: false, isAuthModalOpen: false });
  },

  updateLocalProfile: (data) => {
    LocalProfileRepository.saveProfile(data);
    const current = get().user;
    if (current && current.id > 0) {
      AuthService.updateUserSession({
        apelido: data.apelido,
        bio: data.biografia,
        avatarUrl: data.avatarUrl,
      });
      set({
        user: {
          ...current,
          apelido: data.apelido,
          bio: data.biografia,
          avatarUrl: data.avatarUrl,
        },
      });
    } else {
      set({ user: getLocalReaderUser() });
    }
  },

  initAuth: () => {
    try {
      const stored = AuthService.getStoredUser();
      if (stored && stored.apelido) {
        set({ user: stored, isAuthenticated: true, isLoading: false, isAuthModalOpen: false });
        return;
      }
      const localProfile = LocalProfileRepository.getProfile();
      if (localProfile && localProfile.apelido) {
        const localUser = AuthService.createLocalAccountSession(localProfile.apelido);
        set({ user: localUser, isAuthenticated: true, isLoading: false, isAuthModalOpen: false });
        return;
      }
      set({ user: null, isAuthenticated: false, isLoading: false, isAuthModalOpen: true });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false, isAuthModalOpen: true });
    }
  },

  login: async (credentials: LoginRequest) => {
    const user = await AuthService.login(credentials);
    set({ user, isAuthenticated: true, isAuthModalOpen: false });
    await CatalogService.syncLocalShelfToRemote();
  },

  register: async (data: RegistroRequest) => {
    const user = await AuthService.register(data);
    set({ user, isAuthenticated: true, isAuthModalOpen: false });
    await CatalogService.syncLocalShelfToRemote();
  },

  conectarConta: async (data: { apelido: string; senha: string; email?: string }) => {
    const user = await AuthService.conectarOuRegistrarConta(data);
    set({ user, isAuthenticated: true, isAuthModalOpen: false });
    await CatalogService.syncLocalShelfToRemote();
    return user;
  },

  updateUser: (partial: Partial<AuthenticatedUser>) => {
    AuthService.updateUserSession(partial);
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    }));
  },

  logout: async () => {
    await AuthService.logout();
    LocalProfileRepository.clearProfile();
    set({ user: null, isAuthenticated: false, isAuthModalOpen: true });
  },
}));
