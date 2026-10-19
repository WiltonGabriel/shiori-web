import { api, setHttpBearerToken } from "./api";
import type { LoginRequest, RegistroRequest, AuthResponse, AuthenticatedUser } from "../types/auth.types";

const AUTH_USER_STORAGE_KEY = "auth_session_user";

export class AuthService {
  public static async login(credentials: LoginRequest): Promise<AuthenticatedUser> {
    const response = await api.post<AuthResponse>("/api/auth/login", credentials);
    const data = response.data;
    const user: AuthenticatedUser = {
      id: data.usuarioId,
      email: data.email,
      apelido: data.apelido,
      role: data.role,
      onboardingConcluido: data.onboardingConcluido,
      token: data.token,
    };

    setHttpBearerToken(user.token);
    try {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Falha ao salvar sessão de usuário no localStorage:", e);
    }
    return user;
  }

  public static async register(data: RegistroRequest): Promise<AuthenticatedUser> {
    const response = await api.post<AuthResponse>("/api/auth/registrar", data);
    const resData = response.data;
    const user: AuthenticatedUser = {
      id: resData.usuarioId,
      email: resData.email,
      apelido: resData.apelido,
      role: resData.role,
      onboardingConcluido: resData.onboardingConcluido,
      token: resData.token,
    };

    setHttpBearerToken(user.token);
    try {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Falha ao salvar sessão de usuário no localStorage:", e);
    }
    return user;
  }

  public static getStoredUser(): AuthenticatedUser | null {
    try {
      const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw) as AuthenticatedUser;
      if (user?.token) {
        setHttpBearerToken(user.token);
      }
      return user;
    } catch (e) {
      console.warn("Falha ao recuperar sessão do localStorage:", e);
      return null;
    }
  }

  public static updateUserSession(partial: Partial<AuthenticatedUser>): void {
    const current = AuthService.getStoredUser();
    if (current) {
      const updated = { ...current, ...partial };
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  public static clearSession(): void {
    setHttpBearerToken(null);
    try {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch {
      // Ignora erro ao limpar
    }
  }

  public static async logout(): Promise<void> {
    AuthService.clearSession();
  }
}
