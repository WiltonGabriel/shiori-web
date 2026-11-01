import { describe, expect, it, vi, beforeEach } from "vitest";
import { IndexedDbShelf } from "./indexedDbShelf";
import type { ItemCatalogoResponse } from "../../types/catalog.types";

describe("IndexedDbShelf", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("identifica corretamente quando o IndexedDB não está disponível", () => {
    // No ambiente jsdom sem polyfill, isSupported deve retornar booleano válido
    const supported = IndexedDbShelf.isSupported();
    expect(typeof supported).toBe("boolean");
  });

  it("retorna lista vazia e contagem zero quando IndexedDB não está suportado", async () => {
    vi.spyOn(IndexedDbShelf, "isSupported").mockReturnValue(false);

    const items = await IndexedDbShelf.getAll();
    expect(items).toEqual([]);

    const count = await IndexedDbShelf.count();
    expect(count).toBe(0);

    const single = await IndexedDbShelf.getById(99);
    expect(single).toBeNull();
  });

  it("opera operações de mutação de forma segura sem lançar erro quando não suportado", async () => {
    vi.spyOn(IndexedDbShelf, "isSupported").mockReturnValue(false);

    const mockItem: ItemCatalogoResponse = {
      id: 1,
      obraTitulo: "Test",
      progressoAtual: 1,
      statusLeitura: "LENDO",
      visibilidade: "PRIVADO",
      dataAdicao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      desvinculado: true,
      sincronizarMetadados: false,
      historicosLeitura: [],
    };

    await expect(IndexedDbShelf.put(mockItem)).resolves.toBeUndefined();
    await expect(IndexedDbShelf.putBatch([mockItem])).resolves.toBeUndefined();
    await expect(IndexedDbShelf.delete(1)).resolves.toBeUndefined();
    await expect(IndexedDbShelf.clear()).resolves.toBeUndefined();
  });
});
