import { api } from "./api";
import type { ObraResponse, ObraCadastroRequest, StatusCatalogo } from "../types/work.types";

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
}
