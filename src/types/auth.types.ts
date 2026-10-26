import type { TipoObra } from "./work.types";

export type UserRole = "ROLE_USER" | "ROLE_ADMIN" | "ROLE_CURADOR";

export interface LoginRequest {
  email: string;
  senha: string;
  lembrarDeMim?: boolean;
}

export interface RegistroRequest {
  email: string;
  senha: string;
  apelido: string;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  usuarioId: number;
  email: string;
  apelido: string;
  role: UserRole;
  onboardingConcluido: boolean;
  formatosPreferidos?: TipoObra[];
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  apelido: string;
  role: UserRole;
  onboardingConcluido: boolean;
  formatosPreferidos?: TipoObra[];
  avatarUrl?: string;
  bio?: string;
  token: string;
}
