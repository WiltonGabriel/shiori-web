import { api } from "./api";
import type {
  AdminDashboardResponse,
  ProvedorIntegracaoResponse,
  FeatureFlagResponse,
  BroadcastResponse,
  RegistroAuditoriaResponse,
  SugestaoEdicaoResponse,
  DenunciaComentarioResponse,
  MesclarObrasRequest,
  MesclarObrasResponse,
  GeneroResponse,
  CriarGeneroRequest,
  AdminUsuarioResponse,
} from "../types/admin.types";

export class AdminService {
  public static async getDashboard(): Promise<AdminDashboardResponse> {
    const response = await api.get<AdminDashboardResponse>("/api/admin/dashboard");
    return response.data;
  }

  public static async listPendingSuggestions(page = 0, size = 20): Promise<{ content: SugestaoEdicaoResponse[]; totalElements: number }> {
    const response = await api.get("/api/admin/sugestoes/pendentes", { params: { page, size } });
    return response.data;
  }

  public static async evaluateSuggestion(sugestaoId: number, aprovado: boolean, parecer?: string): Promise<SugestaoEdicaoResponse> {
    const response = await api.put<SugestaoEdicaoResponse>(`/api/admin/sugestoes/${sugestaoId}/avaliar`, {
      aprovado,
      parecer,
    });
    return response.data;
  }

  public static async listOpenReports(page = 0, size = 20): Promise<{ content: DenunciaComentarioResponse[]; totalElements: number }> {
    const response = await api.get("/api/admin/denuncias/abertas", { params: { page, size } });
    return response.data;
  }

  public static async acceptCommentReport(denunciaId: number, parecerModeracao?: string): Promise<void> {
    await api.put(`/api/admin/denuncias/comentarios/${denunciaId}/aceitar`, { parecerModeracao });
  }

  public static async rejectCommentReport(denunciaId: number, parecerModeracao?: string): Promise<void> {
    await api.put(`/api/admin/denuncias/comentarios/${denunciaId}/rejeitar`, { parecerModeracao });
  }

  public static async mergeWorks(data: MesclarObrasRequest): Promise<MesclarObrasResponse> {
    const response = await api.post<MesclarObrasResponse>("/api/admin/obras/mesclar", data);
    return response.data;
  }

  public static async listGenres(): Promise<GeneroResponse[]> {
    const response = await api.get<GeneroResponse[]>("/api/admin/generos");
    return response.data;
  }

  public static async createGenre(data: CriarGeneroRequest): Promise<GeneroResponse> {
    const response = await api.post<GeneroResponse>("/api/admin/generos", data);
    return response.data;
  }

  public static async listUsers(page = 0, size = 20): Promise<{ content: AdminUsuarioResponse[]; totalElements: number }> {
    const response = await api.get<{ content: AdminUsuarioResponse[]; totalElements: number }>("/api/admin/usuarios", { params: { page, size } });
    return response.data;
  }

  public static async applyStrike(usuarioId: number, motivo: string): Promise<AdminUsuarioResponse> {
    const response = await api.post<AdminUsuarioResponse>(`/api/admin/usuarios/${usuarioId}/strikes`, { motivo });
    return response.data;
  }

  public static async removeStrike(usuarioId: number, motivo: string): Promise<AdminUsuarioResponse> {
    const response = await api.delete<AdminUsuarioResponse>(`/api/admin/usuarios/${usuarioId}/strikes`, { params: { motivo } });
    return response.data;
  }

  public static async banUser(usuarioId: number, motivo: string): Promise<void> {
    await api.put(`/api/admin/usuarios/${usuarioId}/banir`, { motivo });
  }

  public static async listIntegrations(): Promise<ProvedorIntegracaoResponse[]> {
    const response = await api.get<ProvedorIntegracaoResponse[]>("/api/admin/integracoes");
    return response.data;
  }

  public static async toggleIntegrationStatus(id: number, ativo: boolean): Promise<ProvedorIntegracaoResponse> {
    const response = await api.put<ProvedorIntegracaoResponse>(`/api/admin/integracoes/${id}/status`, null, {
      params: { ativo },
    });
    return response.data;
  }

  public static async listFeatureFlags(): Promise<FeatureFlagResponse[]> {
    const response = await api.get<FeatureFlagResponse[]>("/api/admin/feature-flags");
    return response.data;
  }

  public static async toggleFeatureFlag(chave: string, ativado: boolean): Promise<FeatureFlagResponse> {
    const response = await api.put<FeatureFlagResponse>(`/api/admin/feature-flags/${chave}`, { ativado });
    return response.data;
  }

  public static async listBroadcasts(): Promise<{ content: BroadcastResponse[] }> {
    const response = await api.get("/api/admin/broadcasts");
    return response.data;
  }

  public static async createBroadcast(data: {
    titulo: string;
    mensagem: string;
    nivel: string;
    dataExpiracao?: string;
  }): Promise<BroadcastResponse> {
    const response = await api.post<BroadcastResponse>("/api/admin/broadcasts", data);
    return response.data;
  }

  public static async deactivateBroadcast(id: number): Promise<void> {
    await api.delete(`/api/admin/broadcasts/${id}`);
  }

  public static async listAuditLogs(page = 0, size = 30): Promise<{ content: RegistroAuditoriaResponse[] }> {
    const response = await api.get("/api/admin/auditoria", { params: { page, size } });
    return response.data;
  }
}
