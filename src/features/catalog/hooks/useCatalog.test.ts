import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildWork } from "../../../test/fixtures";
import { PAGE_SIZE, useCatalog } from "./useCatalog";

const service = vi.hoisted(() => ({
  listWorks: vi.fn(),
  searchWorksAssisted: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("../../../services/work.service", () => ({ WorkService: service }));
vi.mock("../../../store/toastStore", () => ({ toast: toastMock }));

describe("useCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("lista as obras ao abrir quando não há busca", async () => {
    service.listWorks.mockResolvedValue([buildWork(), buildWork()]);

    const { result } = renderHook(() => useCatalog());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.works).toHaveLength(2);
    expect(service.searchWorksAssisted).not.toHaveBeenCalled();
  });

  it("usa a busca assistida somente depois do debounce e com o termo aparado", async () => {
    service.listWorks.mockResolvedValue([]);
    service.searchWorksAssisted.mockResolvedValue({
      obras: [buildWork({ tituloPrincipal: "Frieren" })],
      correspondenciasEmOutrosFormatos: false,
      formatosDetectadosNaoPermitidos: [],
    });

    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearchInput("  Frieren  "));
    expect(service.searchWorksAssisted).not.toHaveBeenCalled();

    await waitFor(() => expect(service.searchWorksAssisted).toHaveBeenCalledWith("Frieren"));
    await waitFor(() => expect(result.current.works).toHaveLength(1));
    expect(result.current.assistedNotice).toBeNull();
  });

  it("avisa sobre outros formatos quando a busca não encontra obras permitidas", async () => {
    service.listWorks.mockResolvedValue([]);
    service.searchWorksAssisted.mockResolvedValue({
      obras: [],
      correspondenciasEmOutrosFormatos: true,
      formatosDetectadosNaoPermitidos: ["LIVRO"],
      mensagemContextual: "Existe em formato de livro",
    });

    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearchInput("algo"));

    await waitFor(() =>
      expect(result.current.assistedNotice).toEqual({
        formatos: ["LIVRO"],
        mensagem: "Existe em formato de livro",
      })
    );
  });

  it("limpa o aviso de formatos ao voltar para a listagem sem busca", async () => {
    service.listWorks.mockResolvedValue([buildWork()]);
    service.searchWorksAssisted.mockResolvedValue({
      obras: [],
      correspondenciasEmOutrosFormatos: true,
      formatosDetectadosNaoPermitidos: ["LIVRO"],
    });

    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearchInput("algo"));
    await waitFor(() => expect(result.current.assistedNotice).not.toBeNull());

    act(() => result.current.setSearchInput(""));
    await waitFor(() => expect(result.current.assistedNotice).toBeNull());
  });

  it("notifica o erro e encerra o carregamento quando a API falha", async () => {
    service.listWorks.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useCatalog());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(toastMock.error).toHaveBeenCalledOnce();
    expect(result.current.works).toEqual([]);
  });

  it("ordena por nota decrescente por padrão e por título quando solicitado", async () => {
    service.listWorks.mockResolvedValue([
      buildWork({ tituloPrincipal: "B", notaGeral: 7 }),
      buildWork({ tituloPrincipal: "A", notaGeral: 9 }),
      buildWork({ tituloPrincipal: "C", notaGeral: 8 }),
    ]);

    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.works).toHaveLength(3));

    expect(result.current.filteredWorks.map((w) => w.tituloPrincipal)).toEqual(["A", "C", "B"]);

    act(() => result.current.setSortBy("TITULO_ASC"));

    expect(result.current.filteredWorks.map((w) => w.tituloPrincipal)).toEqual(["A", "B", "C"]);
  });

  it("filtra por tipo e por status de publicação", async () => {
    service.listWorks.mockResolvedValue([
      buildWork({ tipoObra: "MANGA", statusPublicacao: "CONCLUIDO" }),
      buildWork({ tipoObra: "MANHWA", statusPublicacao: "CONCLUIDO" }),
      buildWork({ tipoObra: "MANHWA", statusPublicacao: "EM_HIATO" }),
    ]);

    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.works).toHaveLength(3));

    act(() => result.current.setSelectedType("MANHWA"));
    expect(result.current.filteredWorks).toHaveLength(2);

    act(() => result.current.setSelectedStatus("EM_HIATO"));
    expect(result.current.filteredWorks).toHaveLength(1);
  });

  it("pagina os resultados em páginas de PAGE_SIZE", async () => {
    service.listWorks.mockResolvedValue(Array.from({ length: PAGE_SIZE + 5 }, () => buildWork()));

    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.works).toHaveLength(PAGE_SIZE + 5));

    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginatedWorks).toHaveLength(PAGE_SIZE);

    act(() => result.current.setCurrentPage(2));
    expect(result.current.paginatedWorks).toHaveLength(5);
  });

  it("regressão: alterar um filtro volta para a primeira página em vez de mostrar página vazia", async () => {
    service.listWorks.mockResolvedValue([
      ...Array.from({ length: PAGE_SIZE + 5 }, () => buildWork({ tipoObra: "MANGA" })),
      buildWork({ tipoObra: "MANHWA" }),
    ]);

    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.works.length).toBeGreaterThan(PAGE_SIZE));

    act(() => result.current.setCurrentPage(2));
    act(() => result.current.setSelectedType("MANHWA"));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.paginatedWorks).toHaveLength(1);
  });

  it("restaura os filtros padrão ao resetar", async () => {
    service.listWorks.mockResolvedValue([buildWork()]);

    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.works).toHaveLength(1));

    act(() => {
      result.current.setSelectedType("LIVRO");
      result.current.setSelectedStatus("CONCLUIDO");
      result.current.setSortBy("RECENTES");
    });
    act(() => result.current.handleResetFilters());

    expect(result.current.selectedType).toBe("TODOS");
    expect(result.current.selectedStatus).toBe("TODOS");
    expect(result.current.sortBy).toBe("NOTA_DESC");
    expect(result.current.currentPage).toBe(1);
  });
});
