import { api, setHttpBearerToken } from "./api";
import type { LoginRequest, RegistroRequest, AuthResponse, AuthenticatedUser } from "../types/auth.types";
import { SessionManager } from "./storage/sessionManager";
import { LocalProfileRepository } from "./storage/localProfileRepository";

export class AuthService {
  public static async login(credentials: LoginRequest): Promise<AuthenticatedUser> {
    const payload = {
      email: credentials.email || credentials.apelido || "",
      apelido: credentials.apelido || credentials.email || "",
      senha: credentials.senha,
      lembrarDeMim: credentials.lembrarDeMim ?? true,
    };
    const response = await api.post<AuthResponse>("/api/auth/login", payload);
    const data = response.data;
    const user: AuthenticatedUser = {
      id: data.usuarioId,
      email: data.email,
      apelido: data.apelido,
      role: data.role,
      onboardingConcluido: data.onboardingConcluido,
      formatosPreferidos: data.formatosPreferidos,
      token: data.token,
    };

    setHttpBearerToken(user.token);
    LocalProfileRepository.saveProfile({ apelido: user.apelido });
    const rememberMe = Boolean(credentials.lembrarDeMim ?? true);
    SessionManager.saveUserSession(user, rememberMe);
    return user;
  }

  public static async register(data: RegistroRequest): Promise<AuthenticatedUser> {
    const payload = {
      apelido: data.apelido.trim(),
      email: data.email?.trim() || undefined,
      senha: data.senha,
    };
    const response = await api.post<AuthResponse>("/api/auth/registrar", payload);
    const resData = response.data;
    const user: AuthenticatedUser = {
      id: resData.usuarioId,
      email: resData.email,
      apelido: resData.apelido,
      role: resData.role,
      onboardingConcluido: resData.onboardingConcluido,
      formatosPreferidos: resData.formatosPreferidos,
      token: resData.token,
    };

    setHttpBearerToken(user.token);
    LocalProfileRepository.saveProfile({ apelido: user.apelido });
    SessionManager.saveUserSession(user, true);
    return user;
  }

  public static async conectarOuRegistrarConta(data: {
    apelido: string;
    senha: string;
    email?: string;
  }): Promise<AuthenticatedUser> {
    const response = await api.post<AuthResponse>("/api/auth/conectar-conta", {
      apelido: data.apelido.trim(),
      senha: data.senha,
      email: data.email?.trim() || undefined,
    });
    const resData = response.data;
    const user: AuthenticatedUser = {
      id: resData.usuarioId,
      email: resData.email,
      apelido: resData.apelido,
      role: resData.role,
      onboardingConcluido: resData.onboardingConcluido,
      formatosPreferidos: resData.formatosPreferidos,
      token: resData.token,
    };

    setHttpBearerToken(user.token);
    LocalProfileRepository.saveProfile({ apelido: user.apelido });
    SessionManager.saveUserSession(user, true);
    return user;
  }

  public static createLocalAccountSession(apelido: string): AuthenticatedUser {
    const cleanApelido = apelido.trim();
    const profile = LocalProfileRepository.saveProfile({ apelido: cleanApelido });
    const user: AuthenticatedUser = {
      id: 0,
      apelido: profile.apelido,
      email: `${profile.apelido.toLowerCase()}@conta.shiori.local`,
      role: "ROLE_USER",
      onboardingConcluido: true,
      avatarUrl: profile.avatarUrl,
      bio: profile.biografia,
      token: "shiori-local-session",
    };
    SessionManager.saveUserSession(user, true);
    return user;
  }

  public static getStoredUser(): AuthenticatedUser | null {
    const { user } = SessionManager.getStoredUserSession();
    if (user?.token && user.token !== "shiori-local-session") {
      setHttpBearerToken(user.token);
    }
    return user;
  }

  public static updateUserSession(partial: Partial<AuthenticatedUser>): void {
    SessionManager.updateUserSession(partial);
  }

  public static clearSession(): void {
    setHttpBearerToken(null);
    SessionManager.clearSession();
  }

  public static async logout(): Promise<void> {
    AuthService.clearSession();
  }
}
