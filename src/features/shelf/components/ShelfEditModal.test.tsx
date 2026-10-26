import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildShelfItem } from "../../../test/fixtures";
import { ShelfEditModal } from "./ShelfEditModal";

const service = vi.hoisted(() => ({
  updateProgress: vi.fn(),
  updateVisibility: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("../../../services/catalog.service", () => ({ CatalogService: service }));
vi.mock("../../../store/toastStore", () => ({ toast: toastMock }));

function setup(itemOverrides = {}) {
  const item = buildShelfItem({
    id: 5,
    progressoAtual: 10,
    statusLeitura: "LENDO",
    visibilidade: "PRIVADO",
    ...itemOverrides,
  });
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<ShelfEditModal item={item} isOpen onClose={onClose} onSaved={onSaved} />);
  return { item, onClose, onSaved, user: userEvent.setup() };
}

describe("ShelfEditModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza sem item ou fechado", () => {
    const { container } = render(<ShelfEditModal item={null} isOpen onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("salva o novo progresso e status, devolve o item atualizado e fecha", async () => {
    const { item, onClose, onSaved, user } = setup();
    const atualizado = { ...item, progressoAtual: 25, statusLeitura: "TERMINOU" as const };
    service.updateProgress.mockResolvedValue(atualizado);

    const capitulo = screen.getByLabelText("Capítulo Atual");
    await user.clear(capitulo);
    await user.type(capitulo, "25");
    await user.selectOptions(screen.getAllByRole("combobox")[0], "TERMINOU");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(atualizado));
    expect(service.updateProgress).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ capituloAtual: 25, statusLeitura: "TERMINOU" })
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(toastMock.success).toHaveBeenCalledOnce();
  });

  it("não chama a API de visibilidade quando ela não foi alterada", async () => {
    const { item, user } = setup();
    service.updateProgress.mockResolvedValue(item);

    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(service.updateProgress).toHaveBeenCalled());
    expect(service.updateVisibility).not.toHaveBeenCalled();
  });

  it("atualiza a visibilidade quando alterada e reflete no item devolvido", async () => {
    const { item, onSaved, user } = setup({ visibilidade: "PRIVADO" });
    service.updateProgress.mockResolvedValue({ ...item });
    service.updateVisibility.mockResolvedValue(undefined);

    await user.selectOptions(screen.getAllByRole("combobox")[1], "PUBLICO");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(service.updateVisibility).toHaveBeenCalledWith(5, { visibilidade: "PUBLICO" });
    expect(onSaved.mock.calls[0][0].visibilidade).toBe("PUBLICO");
  });

  it("não envia nota nem anotação quando ficam vazias", async () => {
    const { item, user } = setup({ avaliacaoPessoal: undefined });
    service.updateProgress.mockResolvedValue(item);

    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(service.updateProgress).toHaveBeenCalled());
    const payload = service.updateProgress.mock.calls[0][1];
    expect(payload.nota).toBeUndefined();
    expect(payload.anotacao).toBeUndefined();
  });

  it("mantém o modal aberto e não declara sucesso quando a API falha", async () => {
    const { onClose, onSaved, user } = setup();
    service.updateProgress.mockRejectedValue(new Error("offline"));

    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledOnce());
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeEnabled();
  });

  it("falha parcial: se a visibilidade falhar após salvar o progresso, não declara sucesso nem fecha", async () => {
    const { item, onClose, user } = setup({ visibilidade: "PRIVADO" });
    service.updateProgress.mockResolvedValue({ ...item });
    service.updateVisibility.mockRejectedValue(new Error("falha"));

    await user.selectOptions(screen.getAllByRole("combobox")[1], "PUBLICO");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledOnce());
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("desabilita os botões enquanto salva para evitar envio duplicado", async () => {
    const { user } = setup();
    service.updateProgress.mockReturnValue(new Promise(() => {}));

    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    expect(await screen.findByRole("button", { name: /salvando/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
  });
});
