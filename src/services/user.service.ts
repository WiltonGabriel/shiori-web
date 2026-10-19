import { api } from "./api";
import type {
  UsuarioPerfilResponse,
  UsuarioPerfilPublicoResponse,
  ConcluirOnboardingRequest,
  AtualizarPerfilRequest,
  AlterarEmailRequest,
  AlterarSenhaRequest,
} from "../types/user.types";

export class UserService {
  public static async getMe(): Promise<UsuarioPerfilResponse> {
    const response = await api.get<UsuarioPerfilResponse>("/api/usuarios/me");
    return response.data;
  }

  public static async uploadAvatar(file: File): Promise<UsuarioPerfilResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UsuarioPerfilResponse>("/api/usuarios/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  public static async completeOnboarding(data: ConcluirOnboardingRequest): Promise<UsuarioPerfilResponse> {
    const response = await api.put<UsuarioPerfilResponse>("/api/usuarios/me/onboarding", data);
    return response.data;
  }

  public static async updateProfile(data: AtualizarPerfilRequest): Promise<UsuarioPerfilResponse> {
    const response = await api.put<UsuarioPerfilResponse>("/api/usuarios/me/perfil", data);
    return response.data;
  }

  public static async updateEmail(data: AlterarEmailRequest): Promise<UsuarioPerfilResponse> {
    const response = await api.put<UsuarioPerfilResponse>("/api/usuarios/me/email", data);
    return response.data;
  }

  public static async updatePassword(data: AlterarSenhaRequest): Promise<void> {
    await api.put<void>("/api/usuarios/me/senha", data);
  }

  public static async exportUserData(): Promise<Blob> {
    const response = await api.get("/api/usuarios/me/exportar", {
      responseType: "blob",
    });
    return response.data;
  }

  public static async deleteAccountLGPD(): Promise<void> {
    await api.delete("/api/usuarios/me");
  }

  public static async getPublicProfile(username: string): Promise<UsuarioPerfilPublicoResponse> {
    const response = await api.get<UsuarioPerfilPublicoResponse>(`/api/usuarios/${username}/perfil`);
    return response.data;
  }
}
