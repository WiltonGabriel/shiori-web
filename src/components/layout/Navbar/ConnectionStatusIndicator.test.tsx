import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConnectionStatusIndicator } from "./ConnectionStatusIndicator";
import { useApiEndpointStore } from "../../../store/apiEndpointStore";

vi.mock("../../../store/apiEndpointStore");

describe("ConnectionStatusIndicator", () => {
  const mockOpenModal = vi.fn();
  const mockSetLocalMode = vi.fn();
  const mockTestConnection = vi.fn().mockResolvedValue({ ok: true, message: "OK" });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApiEndpointStore).mockReturnValue({
      currentEndpoint: "http://localhost:8080",
      operationMode: "connected",
      openModal: mockOpenModal,
      setLocalMode: mockSetLocalMode,
      testConnection: mockTestConnection,
    } as any);
  });

  it("renderiza o botão com estado de conexão no cabeçalho", () => {
    render(<ConnectionStatusIndicator />);
    expect(screen.getByRole("button", { name: /estado da conexão com o servidor/i })).toBeDefined();
  });

  it("abre o painel de conexão ao clicar no botão indicador", () => {
    render(<ConnectionStatusIndicator />);
    const trigger = screen.getByRole("button", { name: /estado da conexão com o servidor/i });
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: /painel de conexão/i })).toBeDefined();
    expect(screen.getByText("Conexão Shiori")).toBeDefined();
  });

  it("permite abrir o modal de configuração de servidor a partir do painel", () => {
    render(<ConnectionStatusIndicator />);
    const trigger = screen.getByRole("button", { name: /estado da conexão com o servidor/i });
    fireEvent.click(trigger);

    const configBtn = screen.getByRole("button", { name: /configurar servidor/i });
    fireEvent.click(configBtn);

    expect(mockOpenModal).toHaveBeenCalled();
  });
});
