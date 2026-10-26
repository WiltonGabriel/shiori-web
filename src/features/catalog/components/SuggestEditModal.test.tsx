import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildWork } from "../../../test/fixtures";
import { useToastStore } from "../../../store/toastStore";
import { SuggestEditModal } from "./SuggestEditModal";

describe("SuggestEditModal", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não renderiza quando fechado", () => {
    render(<SuggestEditModal work={buildWork()} isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("informa que o envio está indisponível e desabilita o botão de envio", () => {
    render(<SuggestEditModal work={buildWork()} isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent(/envio indisponível/i);
    expect(screen.getByRole("button", { name: /envio indisponível/i })).toBeDisabled();
  });

  it("regressão: submeter o formulário não declara sucesso nem registra proposta falsa", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SuggestEditModal work={buildWork({ tituloPrincipal: "Original" })} isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText(/mensagem de commit/i), "fix: corrigir título");
    fireEvent.submit(screen.getByRole("dialog").querySelector("form") as HTMLFormElement);

    expect(useToastStore.getState().toasts).toHaveLength(0);
    expect(console.info).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("descartar fecha o modal", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SuggestEditModal work={buildWork()} isOpen onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /descartar/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
