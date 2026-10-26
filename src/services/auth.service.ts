import { api, setHttpBearerToken } from "./api";
import type { LoginRequest, RegistroRequest, AuthResponse, AuthenticatedUser } from "../types/auth.types";
import { SessionManager } from "./storage/sessionManager";

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
      formatosPreferidos: data.formatosPreferidos,
      token: data.token,
    };

    setHttpBearerToken(user.token);
    const rememberMe = Boolean(credentials.lembrarDeMim);
    SessionManager.saveUserSession(user, rememberMe);
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
      formatosPreferidos: resData.formatosPreferidos,
      token: resData.token,
    };

    setHttpBearerToken(user.token);
    // Registro padrão mantém sessão ativa
    SessionManager.saveUserSession(user, true);
    return user;
  }

  public static getStoredUser(): AuthenticatedUser | null {
    const { user } = SessionManager.getStoredUserSession();
    if (user?.token) {
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
