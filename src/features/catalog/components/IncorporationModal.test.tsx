import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildWork } from "../../../test/fixtures";
import type { AdicionarItemCatalogoRequest } from "../../../types/catalog.types";
import { IncorporationModal } from "./IncorporationModal";

type ConfirmMock = ReturnType<typeof vi.fn<(payload: AdicionarItemCatalogoRequest) => Promise<void>>>;

function setup(overrides: Partial<React.ComponentProps<typeof IncorporationModal>> = {}) {
  const onConfirm: ConfirmMock = vi.fn<(payload: AdicionarItemCatalogoRequest) => Promise<void>>().mockResolvedValue(undefined);
  const props = {
    work: buildWork({ id: 42, tituloPrincipal: "Frieren", tipoObra: "MANGA", capaUrl: "https://img/capa.jpg" }),
    isOpen: true,
    onClose: vi.fn(),
    isSubmitting: false,
    ...overrides,
    onConfirm,
  };
  render(<IncorporationModal {...props} />);
  return { ...props, user: userEvent.setup() };
}

function lastPayload(onConfirm: ConfirmMock): AdicionarItemCatalogoRequest {
  return onConfirm.mock.calls[0][0];
}

describe("IncorporationModal", () => {
  it("não renderiza nada sem obra selecionada", () => {
    setup({ work: null });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("incorpora com os padrões: vincula à obra, status LENDO e visibilidade RESTRITO", async () => {
    const { user, onConfirm } = setup();

    await user.click(screen.getByRole("button", { name: /incorporar à estante/i }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(lastPayload(onConfirm)).toMatchObject({
      obraId: 42,
      titulo: "Frieren",
      tipoObra: "MANGA",
      statusLeitura: "LENDO",
      visibilidade: "RESTRITO",
      sincronizarMetadados: true,
    });
  });

  it("não envia progresso nem link quando os campos ficam vazios", async () => {
    const { user, onConfirm } = setup();

    await user.click(screen.getByRole("button", { name: /incorporar à estante/i }));

    const payload = lastPayload(onConfirm);
    expect(payload.capituloAtual).toBeUndefined();
    expect(payload.volumeAtual).toBeUndefined();
    expect(payload.urlLeitura).toBeUndefined();
  });

  it("envia título personalizado, status, visibilidade privada e o link de leitura aparado", async () => {
    const { user, onConfirm } = setup();

    const titulo = screen.getByPlaceholderText("Nome da obra na sua estante");
    await user.clear(titulo);
    await user.type(titulo, "Meu Frieren");
    await user.type(screen.getByPlaceholderText(/link de leitura privado/i), "  https://leitor.exemplo/obra  ");
    const [status, visibilidade] = screen.getAllByRole("combobox");
    await user.selectOptions(status, "PLANEJADO");
    await user.selectOptions(visibilidade, "PRIVADO");
    await user.click(screen.getByRole("button", { name: /incorporar à estante/i }));

    expect(lastPayload(onConfirm)).toMatchObject({
      titulo: "Meu Frieren",
      statusLeitura: "PLANEJADO",
      visibilidade: "PRIVADO",
      urlLeitura: "https://leitor.exemplo/obra",
    });
  });

  it("respeita o desligamento da sincronização de metadados com o catálogo global", async () => {
    const { user, onConfirm } = setup();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /incorporar à estante/i }));

    expect(lastPayload(onConfirm).sincronizarMetadados).toBe(false);
  });

  it("volta ao título oficial se o título personalizado for apagado", async () => {
    const { user, onConfirm } = setup();

    // O campo é obrigatório no navegador; aqui validamos a regra de fallback do payload.
    const titulo = screen.getByPlaceholderText("Nome da obra na sua estante");
    await user.clear(titulo);
    await user.type(titulo, "   ");
    screen.getByRole("button", { name: /incorporar à estante/i }).closest("form")?.requestSubmit();

    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(lastPayload(onConfirm).titulo).toBe("Frieren");
  });

  it("bloqueia envio duplicado enquanto a incorporação está em andamento", () => {
    setup({ isSubmitting: true });

    expect(screen.getByRole("button", { name: /incorporando/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
  });

  it("cancelar fecha o modal sem incorporar", async () => {
    const { user, onClose, onConfirm } = setup();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
