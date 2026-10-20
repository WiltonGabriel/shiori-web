import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildShelfItem } from "../../../test/fixtures";
import { useAuthStore } from "../../../store/authStore";
import { useShelf } from "./useShelf";

const service = vi.hoisted(() => ({
  getMyShelf: vi.fn(),
  updateProgress: vi.fn(),
  removeItemFromShelf: vi.fn(),
  desvincularObra: vi.fn(),
  atualizarMetaCapitulos: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock("../../../services/catalog.service", () => ({ CatalogService: service }));
vi.mock("../../../store/toastStore", () => ({ toast: toastMock }));

describe("useShelf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    useAuthStore.setState({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carrega a estante quando autenticado", async () => {
    service.getMyShelf.mockResolvedValue([buildShelfItem({ id: 1 }), buildShelfItem({ id: 2 })]);

    const { result } = renderHook(() => useShelf());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.loadError).toBeNull();
  });

  it("não consulta a API quando não autenticado", () => {
    useAuthStore.setState({ isAuthenticated: false });

    const { result } = renderHook(() => useShelf());

    expect(result.current.isLoading).toBe(false);
    expect(service.getMyShelf).not.toHaveBeenCalled();
  });

  it("expõe erro de carregamento e notifica o usuário", async () => {
    service.getMyShelf.mockRejectedValue(new Error("falha"));

    const { result } = renderHook(() => useShelf());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toMatch(/não foi possível/i);
    expect(toastMock.error).toHaveBeenCalledOnce();
  });

  it("incrementa progresso de forma otimista e confirma com a resposta da API", async () => {
    const item = buildShelfItem({ id: 7, progressoAtual: 3, statusLeitura: "LENDO" });
    service.getMyShelf.mockResolvedValue([item]);
    service.updateProgress.mockResolvedValue({ ...item, progressoAtual: 4 });

    const { result } = renderHook(() => useShelf());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.handleQuickIncrement(item));

    expect(service.updateProgress).toHaveBeenCalledWith(7, expect.objectContaining({ capituloAtual: 4 }));
    expect(result.current.items[0].progressoAtual).toBe(4);
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("regressão: reverte o progresso otimista quando a API falha, sem declarar sucesso", async () => {
    const item = buildShelfItem({ id: 7, progressoAtual: 3, statusLeitura: "LENDO" });
    service.getMyShelf.mockResolvedValue([item]);
    service.updateProgress.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useShelf());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.handleQuickIncrement(item));

    expect(result.current.items[0].progressoAtual).toBe(3);
    expect(toastMock.error).toHaveBeenCalledOnce();
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("não remove a obra quando o usuário cancela a confirmação", async () => {
    service.getMyShelf.mockResolvedValue([buildShelfItem({ id: 1 })]);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const { result } = renderHook(() => useShelf());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.handleRemove(1));

    expect(service.removeItemFromShelf).not.toHaveBeenCalled();
    expect(result.current.items).toHaveLength(1);
  });

  it("remove a obra da lista apenas após a API confirmar", async () => {
    service.getMyShelf.mockResolvedValue([buildShelfItem({ id: 1 })]);
    service.removeItemFromShelf.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { result } = renderHook(() => useShelf());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.handleRemove(1));

    expect(result.current.items).toHaveLength(0);
  });

  it("mantém a obra na lista se a remoção falhar", async () => {
    service.getMyShelf.mockResolvedValue([buildShelfItem({ id: 1 })]);
    service.removeItemFromShelf.mockRejectedValue(new Error("erro"));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { result } = renderHook(() => useShelf());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.handleRemove(1));

    expect(result.current.items).toHaveLength(1);
    expect(toastMock.error).toHaveBeenCalledOnce();
  });

  it("desvincular recarrega a estante e preserva o item pessoal", async () => {
    const item = buildShelfItem({ id: 1, progressoAtual: 9 });
    service.getMyShelf.mockResolvedValueOnce([item]).mockResolvedValueOnce([{ ...item, desvinculado: true, obraId: null }]);
    service.desvincularObra.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { result } = renderHook(() => useShelf());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.handleUnlink(1));

    await waitFor(() => expect(result.current.items[0].desvinculado).toBe(true));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].progressoAtual).toBe(9);
  });

  it("filtra por aba ativa", async () => {
    service.getMyShelf.mockResolvedValue([
      buildShelfItem({ statusLeitura: "LENDO" }),
      buildShelfItem({ statusLeitura: "TERMINOU" }),
    ]);

    const { result } = renderHook(() => useShelf());
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => result.current.setActiveTab("LENDO"));

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.tabCounts.TODOS).toBe(2);
  });
});
