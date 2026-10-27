import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildWork } from "../../../test/fixtures";
import { useToastStore } from "../../../store/toastStore";
import { SuggestEditModal } from "./SuggestEditModal";
import { WorkService } from "../../../services/work.service";
import * as httpClient from "../../../services/api/httpClient";
import { useAuthStore } from "../../../store/authStore";

vi.mock("../../../services/work.service", () => ({
  WorkService: {
    suggestEdit: vi.fn(),
  },
}));

describe("SuggestEditModal", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não renderiza quando fechado", () => {
    render(<SuggestEditModal work={buildWork()} isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("no modo local, informa que propostas ao catálogo global requerem API conectada", () => {
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(true);
    useAuthStore.setState({ isAuthenticated: false });

    render(<SuggestEditModal work={buildWork()} isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent(/modo local/i);
    expect(screen.getByRole("button", { name: /enviar sugestão/i })).toBeDisabled();
  });

  it("quando conectado mas não autenticado, solicita autenticação", () => {
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(false);
    useAuthStore.setState({ isAuthenticated: false });

    render(<SuggestEditModal work={buildWork()} isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent(/autenticação necessária/i);
    expect(screen.getByRole("button", { name: /entrar ou cadastrar/i })).toBeInTheDocument();
  });

  it("quando autenticado em modo online, envia sugestão de edição com sucesso", async () => {
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(false);
    useAuthStore.setState({ isAuthenticated: true });
    vi.mocked(WorkService.suggestEdit).mockResolvedValueOnce({ id: 10 });

    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SuggestEditModal work={buildWork({ id: 42, tituloPrincipal: "Original" })} isOpen onClose={onClose} />);

    expect(screen.getByRole("status")).toHaveTextContent(/governança colaborativa/i);

    await user.type(screen.getByLabelText(/mensagem de commit/i), "fix: atualizar título e capítulos");
    const submitBtn = screen.getByRole("button", { name: /enviar sugestão para moderação/i });
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    await waitFor(() => {
      expect(WorkService.suggestEdit).toHaveBeenCalledWith(42, expect.objectContaining({
        justificativa: "fix: atualizar título e capítulos",
      }));
      expect(useToastStore.getState().toasts[0].detail).toContain("sucesso");
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("descartar fecha o modal", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SuggestEditModal work={buildWork()} isOpen onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /descartar/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
