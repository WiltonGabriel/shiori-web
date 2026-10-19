import { api } from "./api";
import type { BroadcastResponse } from "../types/admin.types";

export class BroadcastService {
  public static async getActiveBroadcasts(): Promise<BroadcastResponse[]> {
    const response = await api.get<BroadcastResponse[]>("/api/broadcasts/ativos");
    return response.data;
  }
}
