import { api } from "./api";
import type {
  ObraResponse,
  ObraCadastroRequest,
  StatusCatalogo,
  ResultadoBuscaObrasResponse,
  IntegracaoMetadadosObra,
  ObraBuscaAvancadaFiltro,
  PaginatedResponse,
} from "../types/work.types";

export class WorkService {
  public static async listWorks(status?: StatusCatalogo): Promise<ObraResponse[]> {
    const params = status ? { status } : {};
    const response = await api.get<ObraResponse[]>("/obras", { params });
    return response.data;
  }

  public static async listHomeWorks(): Promise<ObraResponse[]> {
    const response = await api.get<ObraResponse[]>("/obras/home");
    return response.data;
  }

  public static async getWorkById(id: number): Promise<ObraResponse> {
    const response = await api.get<ObraResponse>(`/obras/${id}`);
    return response.data;
  }

  public static async createWork(data: ObraCadastroRequest): Promise<ObraResponse> {
    const response = await api.post<ObraResponse>("/obras", data);
    return response.data;
  }

  public static async submitToGlobalCatalog(id: number, usuarioId: number): Promise<ObraResponse> {
    const response = await api.put<ObraResponse>(`/obras/${id}/submeter`, null, {
      params: { usuarioId },
    });
    return response.data;
  }

  public static async searchWorksAssisted(termo: string): Promise<ResultadoBuscaObrasResponse> {
    const response = await api.get<ResultadoBuscaObrasResponse>("/obras/busca", {
      params: { termo },
    });
    return response.data;
  }

  public static async searchExternalWorks(termo: string, limite: number = 10): Promise<IntegracaoMetadadosObra[]> {
    const response = await api.get<IntegracaoMetadadosObra[]>("/obras/externas/pesquisar", {
      params: { termo, limite },
    });
    return response.data;
  }

  public static async getExternalWorkDetails(provedor: string, idExterno: string): Promise<IntegracaoMetadadosObra> {
    const response = await api.get<IntegracaoMetadadosObra>(`/obras/externas/${provedor}/obras/${idExterno}`);
    return response.data;
  }

  public static async searchWorksAdvanced(
    filtro: ObraBuscaAvancadaFiltro
  ): Promise<PaginatedResponse<ObraResponse>> {
    const params = new URLSearchParams();

    if (filtro.termo?.trim()) params.append("termo", filtro.termo.trim());
    filtro.tipos?.forEach((t) => params.append("tipos", t));
    filtro.status?.forEach((s) => params.append("status", s));
    if (filtro.minCapitulos !== undefined && filtro.minCapitulos > 0) {
      params.append("minCapitulos", String(filtro.minCapitulos));
    }
    if (filtro.maxCapitulos !== undefined && filtro.maxCapitulos > 0) {
      params.append("maxCapitulos", String(filtro.maxCapitulos));
    }
    if (filtro.minNota !== undefined && filtro.minNota > 0) {
      params.append("minNota", String(filtro.minNota));
    }
    if (filtro.maxNota !== undefined && filtro.maxNota > 0) {
      params.append("maxNota", String(filtro.maxNota));
    }
    filtro.generosIncluidos?.forEach((g) => params.append("generosIncluidos", g));
    filtro.generosExcluidos?.forEach((g) => params.append("generosExcluidos", g));
    if (filtro.generosModo) {
      params.append("generosModo", filtro.generosModo);
    }
    filtro.tagsIncluidas?.forEach((t) => params.append("tagsIncluidas", t));
    filtro.tagsExcluidas?.forEach((t) => params.append("tagsExcluidas", t));
    if (filtro.tagsModo) {
      params.append("tagsModo", filtro.tagsModo);
    }
    if (filtro.ordenacao) {
      params.append("ordenacao", filtro.ordenacao);
    }
    if (filtro.pagina !== undefined) {
      params.append("pagina", String(filtro.pagina));
    }
    if (filtro.itensPorPagina !== undefined) {
      params.append("itensPorPagina", String(filtro.itensPorPagina));
    }

    const response = await api.get<PaginatedResponse<ObraResponse>>("/obras/busca-avancada", {
      params,
    });
    return response.data;
  }
}
