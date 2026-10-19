import { api } from "./api";
import type {
  AdminDashboardResponse,
  ProvedorIntegracaoResponse,
  FeatureFlagResponse,
  BroadcastResponse,
  RegistroAuditoriaResponse,
} from "../types/admin.types";

export class AdminService {
  public static async getDashboard(): Promise<AdminDashboardResponse> {
    const response = await api.get<AdminDashboardResponse>("/api/admin/dashboard");
    return response.data;
  }

  public static async listUsers(page = 0, size = 20): Promise<{ content: any[]; totalElements: number }> {
    const response = await api.get("/api/admin/usuarios", { params: { page, size } });
    return response.data;
  }

  public static async applyStrike(usuarioId: number, motivo: string): Promise<any> {
    const response = await api.post(`/api/admin/usuarios/${usuarioId}/strikes`, { motivo });
    return response.data;
  }

  public static async removeStrike(usuarioId: number, motivo: string): Promise<any> {
    const response = await api.delete(`/api/admin/usuarios/${usuarioId}/strikes`, { data: { motivo } });
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
