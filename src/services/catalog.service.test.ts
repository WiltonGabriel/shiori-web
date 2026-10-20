import { describe, it, expect, vi, beforeEach } from "vitest";
import { CatalogService } from "./catalog.service";
import { api } from "./api";
import {
  LocalShelfRepository,
  LOCAL_SHELF_STORAGE_KEY,
} from "./storage/localShelfRepository";
import * as httpClient from "./api/httpClient";
import type { ItemCatalogoResponse } from "../types/catalog.types";

vi.mock("./api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("CatalogService - Exclusão e Resiliência da Estante", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const mockItem: ItemCatalogoResponse = {
    id: 101,
    obraId: 50,
    obraTitulo: "Obra de Teste",
    titulo: "Obra de Teste",
    statusLeitura: "LENDO",
    visibilidade: "PRIVADO",
    tipoObra: "MANGA",
    progressoAtual: 5,
    totalCapitulos: 20,
    dataAdicao: new Date().toISOString(),
    ultimaAtualizacao: new Date().toISOString(),
    desvinculado: false,
    sincronizarMetadados: true,
    historicosLeitura: [],
  };

  const populateLocalShelf = (items: ItemCatalogoResponse[]) => {
    localStorage.setItem(LOCAL_SHELF_STORAGE_KEY, JSON.stringify(items));
  };

  it("remove item da estante no modo local sem chamar api.delete", async () => {
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(true);
    populateLocalShelf([mockItem]);
    expect(LocalShelfRepository.getById(101)).toBeDefined();

    await CatalogService.removeItemFromShelf(101);

    expect(LocalShelfRepository.getById(101)).toBeNull();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("remove item do repositório local e da API quando em modo conectado", async () => {
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(false);
    populateLocalShelf([mockItem]);
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    await CatalogService.removeItemFromShelf(101);

    expect(LocalShelfRepository.getById(101)).toBeNull();
    expect(api.delete).toHaveBeenCalledWith("/api/catalogo/101");
  });

  it("não quebra a exclusão local se a API estiver offline ou retornar erro de rede", async () => {
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(false);
    populateLocalShelf([mockItem]);
    vi.mocked(api.delete).mockRejectedValueOnce({
      code: "ERR_NETWORK",
      message: "Network Error",
    });

    await expect(CatalogService.removeItemFromShelf(101)).resolves.not.toThrow();
    expect(LocalShelfRepository.getById(101)).toBeNull();
  });

  it("não quebra se a API retornar 404 (já excluída no servidor)", async () => {
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(false);
    populateLocalShelf([mockItem]);
    vi.mocked(api.delete).mockRejectedValueOnce({
      status: 404,
      response: { status: 404 },
    });

    await expect(CatalogService.removeItemFromShelf(101)).resolves.not.toThrow();
    expect(LocalShelfRepository.getById(101)).toBeNull();
  });

  it("getMyShelf faz fallback para LocalShelfRepository se a API falhar", async () => {
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(false);
    populateLocalShelf([mockItem]);
    vi.mocked(api.get).mockRejectedValueOnce(new Error("API indisponível"));

    const items = await CatalogService.getMyShelf();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(101);
  });
});
