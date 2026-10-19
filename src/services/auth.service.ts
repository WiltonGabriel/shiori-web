import { api, setHttpBearerToken } from "./api";
import { SecureStorage } from "./crypto/secureStorage";
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
    await SecureStorage.setItem(AUTH_USER_STORAGE_KEY, user);
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
    await SecureStorage.setItem(AUTH_USER_STORAGE_KEY, user);
    return user;
  }

  public static async getStoredUser(): Promise<AuthenticatedUser | null> {
    const user = await SecureStorage.getItem<AuthenticatedUser>(AUTH_USER_STORAGE_KEY);
    if (user?.token) {
      setHttpBearerToken(user.token);
    }
    return user;
  }

  public static async logout(): Promise<void> {
    setHttpBearerToken(null);
    SecureStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }
}
