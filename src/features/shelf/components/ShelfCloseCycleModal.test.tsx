import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildShelfItem } from "../../../test/fixtures";
import type { ItemCatalogoResponse } from "../../../types/catalog.types";
import { ShelfCloseCycleModal } from "./ShelfCloseCycleModal";

const service = vi.hoisted(() => ({
  updateProgress: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("../../../services/catalog.service", () => ({ CatalogService: service }));
vi.mock("../../../store/toastStore", () => ({ toast: toastMock }));

function setup(item: ItemCatalogoResponse | null) {
  const onClose = vi.fn();
  const onCycleClosed = vi.fn();
  const view = render(<ShelfCloseCycleModal item={item} isOpen onClose={onClose} onCycleClosed={onCycleClosed} />);
  return { ...view, onClose, onCycleClosed, user: userEvent.setup() };
}

describe("ShelfCloseCycleModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza sem item", () => {
    const { container } = setup(null);

    expect(container).toBeEmptyDOMElement();
  });

  it("encerra o ciclo como TERMINOU no total de capítulos da obra, com nota padrão 10", async () => {
    const item = buildShelfItem({ id: 9, progressoAtual: 40, totalCapitulos: 50, statusLeitura: "LENDO" });
    const concluido = { ...item, statusLeitura: "TERMINOU" as const };
    service.updateProgress.mockResolvedValue(concluido);
    const { user, onCycleClosed, onClose } = setup(item);

    await user.click(screen.getByRole("button", { name: /confirmar conclusão/i }));

    await waitFor(() => expect(onCycleClosed).toHaveBeenCalledWith(concluido));
    expect(service.updateProgress).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ capituloAtual: 50, statusLeitura: "TERMINOU", nota: 10 })
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(toastMock.success).toHaveBeenCalledOnce();
  });

  it("usa o progresso atual quando a obra não tem total definido", async () => {
    const item = buildShelfItem({ id: 9, progressoAtual: 33, totalCapitulos: undefined, obraTotalCapitulos: undefined });
    service.updateProgress.mockResolvedValue(item);
    const { user } = setup(item);

    await user.click(screen.getByRole("button", { name: /confirmar conclusão/i }));

    await waitFor(() => expect(service.updateProgress).toHaveBeenCalled());
    expect(service.updateProgress.mock.calls[0][1].capituloAtual).toBe(33);
  });

  it("parte da avaliação pessoal existente e envia a nota ajustada", async () => {
    const item = buildShelfItem({ id: 9, avaliacaoPessoal: 7.5, totalCapitulos: 10 });
    service.updateProgress.mockResolvedValue(item);
    const { user } = setup(item);

    const nota = screen.getByLabelText(/avaliação final/i);
    expect(nota).toHaveValue(7.5);
    await user.clear(nota);
    await user.type(nota, "9");
    await user.click(screen.getByRole("button", { name: /confirmar conclusão/i }));

    await waitFor(() => expect(service.updateProgress).toHaveBeenCalled());
    expect(service.updateProgress.mock.calls[0][1].nota).toBe(9);
  });

  it("grava a reflexão aparada; sem reflexão registra a data de conclusão escolhida", async () => {
    const item = buildShelfItem({ id: 9, totalCapitulos: 10 });
    service.updateProgress.mockResolvedValue(item);
    const { user } = setup(item);

    fireEvent.change(screen.getByLabelText(/data da conclusão/i), { target: { value: "2026-03-15" } });
    await user.click(screen.getByRole("button", { name: /confirmar conclusão/i }));

    await waitFor(() => expect(service.updateProgress).toHaveBeenCalled());
    expect(service.updateProgress.mock.calls[0][1].anotacao).toBe("Ciclo concluído em 2026-03-15");
  });

  it("envia a reflexão digitada sem espaços nas pontas", async () => {
    const item = buildShelfItem({ id: 9, totalCapitulos: 10 });
    service.updateProgress.mockResolvedValue(item);
    const { user } = setup(item);

    await user.type(screen.getByPlaceholderText(/qual foi o impacto/i), "  Obra marcante  ");
    await user.click(screen.getByRole("button", { name: /confirmar conclusão/i }));

    await waitFor(() => expect(service.updateProgress).toHaveBeenCalled());
    expect(service.updateProgress.mock.calls[0][1].anotacao).toBe("Obra marcante");
  });

  it("mantém o ciclo aberto e não declara sucesso quando a API falha", async () => {
    const item = buildShelfItem({ id: 9, totalCapitulos: 10 });
    service.updateProgress.mockRejectedValue(new Error("offline"));
    const { user, onCycleClosed, onClose } = setup(item);

    await user.click(screen.getByRole("button", { name: /confirmar conclusão/i }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledOnce());
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(onCycleClosed).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /confirmar conclusão/i })).toBeEnabled();
  });

  it("bloqueia confirmação duplicada enquanto registra", async () => {
    const item = buildShelfItem({ id: 9, totalCapitulos: 10 });
    service.updateProgress.mockReturnValue(new Promise(() => {}));
    const { user } = setup(item);

    await user.click(screen.getByRole("button", { name: /confirmar conclusão/i }));

    expect(await screen.findByRole("button", { name: /registrando/i })).toBeDisabled();
    expect(service.updateProgress).toHaveBeenCalledOnce();
  });

  it("cancelar não registra ciclo", async () => {
    const { user, onClose } = setup(buildShelfItem({ id: 9 }));

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(service.updateProgress).not.toHaveBeenCalled();
  });
});
