import { describe, it, expect, vi, beforeEach } from "vitest";
import { CatalogService } from "./catalog.service";
import { api } from "./api";
import {
  LocalShelfRepository,
  LOCAL_SHELF_STORAGE_KEY,
} from "./storage/localShelfRepository";
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

  it("remove item da estante pessoal soberana sem chamar api.delete", async () => {
    populateLocalShelf([mockItem]);
    expect(LocalShelfRepository.getById(101)).toBeDefined();

    await CatalogService.removeItemFromShelf(101);

    expect(LocalShelfRepository.getById(101)).toBeNull();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("não realiza exclusão remota silenciosa prevenindo divergência entre estante e API", async () => {
    populateLocalShelf([mockItem]);

    await CatalogService.removeItemFromShelf(101);

    expect(LocalShelfRepository.getById(101)).toBeNull();
    // Confirma que nenhuma chamada HTTP DELETE foi disparada para a API
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("getMyShelf obtém itens diretamente da persistência soberana do usuário", async () => {
    populateLocalShelf([mockItem]);

    const items = await CatalogService.getMyShelf();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(101);
    expect(api.get).not.toHaveBeenCalled();
  });
});
