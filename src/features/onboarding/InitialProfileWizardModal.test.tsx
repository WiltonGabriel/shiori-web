import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { InitialProfileWizardModal } from "./InitialProfileWizardModal";
import { useAuthStore } from "../../store/authStore";
import { useApiEndpointStore } from "../../store/apiEndpointStore";
import { SessionManager } from "../../services/storage/sessionManager";

vi.mock("../../store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../store/apiEndpointStore", () => ({
  useApiEndpointStore: vi.fn(),
}));

vi.mock("../../services/storage/sessionManager", () => ({
  SessionManager: {
    setInstanceMasterPassword: vi.fn().mockResolvedValue(undefined),
    unlockInstanceSession: vi.fn(),
  },
}));

vi.mock("../../store/toastStore", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("InitialProfileWizardModal", () => {
  const updateLocalProfile = vi.fn();
  const activateLocalSession = vi.fn();
  const saveEndpoint = vi.fn();
  const setLocalMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      updateLocalProfile,
      activateLocalSession,
    });
    (useApiEndpointStore as any).mockReturnValue({
      currentEndpoint: "http://localhost:8080",
      saveEndpoint,
      setLocalMode,
      testConnection: vi.fn().mockResolvedValue({ ok: true }),
      isTesting: false,
    });
  });

  it("não renderiza quando isOpen é falso", () => {
    render(<InitialProfileWizardModal isOpen={false} />);
    expect(screen.queryByText(/Bem-vindo ao Shiori/i)).not.toBeInTheDocument();
  });

  it("exige senha com mínimo de 4 caracteres no primeiro passo", async () => {
    const user = userEvent.setup();
    render(<InitialProfileWizardModal isOpen={true} />);

    const nicknameInput = screen.getByPlaceholderText(/Como você deseja ser chamado/i);
    const passwordInput = screen.getByPlaceholderText(/Crie sua senha de acesso/i);
    const continueBtn = screen.getByRole("button", { name: /continuar para preferências/i });

    // Botão deve iniciar desabilitado
    expect(continueBtn).toBeDisabled();

    // Apelido preenchido, mas senha < 4 caracteres
    await user.type(nicknameInput, "Wilton");
    await user.type(passwordInput, "123");
    expect(continueBtn).toBeDisabled();

    // Senha com 4 caracteres válida habilita o botão
    await user.type(passwordInput, "4");
    expect(continueBtn).toBeEnabled();

    // Clica para ir para o passo 2
    await user.click(continueBtn);

    expect(screen.getByText("Preferências de Leitura")).toBeInTheDocument();
    expect(screen.getByText(/Formatos Literários que você Acompanha/i)).toBeInTheDocument();
  });

  it("permite habilitar conexão opcional com Shiori API com pergunta amigável", async () => {
    const user = userEvent.setup();
    render(<InitialProfileWizardModal isOpen={true} />);

    const connectionToggle = screen.getByRole("checkbox", {
      name: /gostaria de já conectar a uma shiori api\?/i,
    });

    expect(connectionToggle).not.toBeChecked();
    expect(screen.queryByPlaceholderText("http://localhost:8080")).not.toBeInTheDocument();

    await user.click(connectionToggle);
    expect(screen.getByPlaceholderText("http://localhost:8080")).toBeInTheDocument();
  });

  it("conclui o assistente salvando perfil, senha e ativando sessão", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InitialProfileWizardModal isOpen={true} onClose={onClose} />);

    // Passo 1: Preenche apelido e senha
    await user.type(screen.getByPlaceholderText(/Como você deseja ser chamado/i), "Wilton");
    await user.type(screen.getByPlaceholderText(/Crie sua senha de acesso/i), "senha123");
    await user.click(screen.getByRole("button", { name: /continuar para preferências/i }));

    // Passo 2: Conclui
    const finishBtn = screen.getByRole("button", { name: /concluir e ir para a estante/i });
    await user.click(finishBtn);

    await waitFor(() => {
      expect(updateLocalProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          apelido: "Wilton",
        })
      );
      expect(SessionManager.setInstanceMasterPassword).toHaveBeenCalledWith("senha123");
      expect(SessionManager.unlockInstanceSession).toHaveBeenCalledWith(true);
      expect(activateLocalSession).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
