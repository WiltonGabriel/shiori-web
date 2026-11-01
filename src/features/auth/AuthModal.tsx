import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Button } from "../../components/ui/Button/Button";
import { useAuthStore } from "../../store/authStore";
import { useApiEndpointStore } from "../../store/apiEndpointStore";
import { toast } from "../../store/toastStore";
import { Lock, User, Server, ChevronDown, ChevronUp, Activity } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, conectarConta, activateLocalSession } = useAuthStore();
  const { currentEndpoint, saveEndpoint, testConnection, isTesting } = useApiEndpointStore();

  const [apelido, setApelido] = useState(user?.apelido || "");
  const [senha, setSenha] = useState("");
  const [conectarApiAgora, setConectarApiAgora] = useState(false);
  const [showServerSection, setShowServerSection] = useState(false);
  const [serverUrl, setServerUrl] = useState(currentEndpoint || "http://localhost:8080");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTestServer = async () => {
    if (!serverUrl.trim()) {
      toast.warning("Informe a URL da Shiori API para testar.");
      return;
    }
    const res = await testConnection(serverUrl.trim());
    if (res.ok) {
      toast.success(res.message, "Shiori API Acessível");
    } else {
      toast.error(res.message, "Servidor Indisponível");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanApelido = apelido.trim();
    if (!cleanApelido) {
      setErrorMsg("Informe um nome de usuário (apelido).");
      return;
    }
    if (!senha || senha.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      if (conectarApiAgora) {
        const cleanUrl = serverUrl.trim().replace(/\/+$/, "");
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
          setErrorMsg("A URL da Shiori API deve iniciar com http:// ou https://");
          setIsLoading(false);
          return;
        }
        saveEndpoint(cleanUrl);
        const connectedUser = await conectarConta({
          apelido: cleanApelido,
          senha,
        });
        toast.success(
          `Conta @${connectedUser.apelido} conectada e sincronizada com o servidor!`,
          "Conta Shiori Ativa"
        );
      } else {
        activateLocalSession(cleanApelido);
        toast.success(
          `Bem-vindo ao Shiori, @${cleanApelido}! Sua estante já está pronta.`,
          "Conta Ativa"
        );
      }
      onClose();
    } catch (err: any) {
      const msg =
        err.message ||
        "Não foi possível autenticar no servidor. Verifique sua senha ou escolha outro apelido.";
      setErrorMsg(msg);
      toast.error(msg, "Falha na Conexão da Conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isAuthenticated ? onClose : () => {}}
      title="Sua Conta no Shiori"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Defina seu <strong>nome de usuário</strong> e <strong>senha</strong> para acessar sua estante única no Shiori. Você pode usar apenas no dispositivo ou conectar a um servidor Shiori API quando quiser.
        </p>

        {errorMsg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--accent-rose-glow)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              borderRadius: "var(--radius-md)",
              color: "var(--accent-rose)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        <Input
          label="Nome de Usuário (Apelido)"
          placeholder="Ex: wiltongx, leitor_mangas..."
          leadingIcon={<User size={16} />}
          value={apelido}
          onChange={(e) => setApelido(e.target.value)}
          required
        />

        <Input
          label="Senha (mínimo 6 caracteres)"
          type="password"
          placeholder="Digite sua senha..."
          leadingIcon={<Lock size={16} />}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {/* Opção colapsada de conectar a uma Shiori API */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-elevated)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={() => setShowServerSection((prev) => !prev)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Server size={15} style={{ color: "var(--brand-primary)" }} />
              <span>Conectar a um servidor Shiori API (Opcional)</span>
            </span>
            {showServerSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showServerSection && (
            <div
              style={{
                padding: "0.75rem 1rem 1rem",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={conectarApiAgora}
                  onChange={(e) => setConectarApiAgora(e.target.checked)}
                  style={{ accentColor: "var(--brand-primary)", cursor: "pointer" }}
                />
                <span>Sincronizar minha conta com este servidor Shiori API agora</span>
              </label>

              {conectarApiAgora && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="URL do Servidor Shiori API"
                      placeholder="http://localhost:8080"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleTestServer}
                    isLoading={isTesting}
                  >
                    <Activity size={14} />
                    <span>Testar</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <Button type="submit" variant="primary" size="md" isLoading={isLoading} style={{ marginTop: "0.25rem" }}>
          {conectarApiAgora ? "Entrar e Sincronizar com Servidor" : "Entrar na Minha Estante"}
        </Button>
      </form>
    </Modal>
  );
};
