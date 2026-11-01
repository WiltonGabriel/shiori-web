import React, { useState } from "react";
import { Modal } from "../../ui/Modal/Modal";
import { Button } from "../../ui/Button/Button";
import { Input } from "../../ui/Input/Input";
import { useApiEndpointStore } from "../../../store/apiEndpointStore";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "../../../store/toastStore";
import { Server, Activity, CheckCircle2, AlertCircle, User, Lock } from "lucide-react";
import styles from "./ApiEndpointSetupModal.module.css";

export const ApiEndpointSetupModal: React.FC = () => {
  const { isModalOpen } = useApiEndpointStore();
  if (!isModalOpen) return null;
  return <ApiEndpointSetupModalContent />;
};

const ApiEndpointSetupModalContent: React.FC = () => {
  const {
    currentEndpoint,
    isModalOpen,
    isTesting,
    lastCheckResult,
    closeModal,
    saveEndpoint,
    testConnection,
  } = useApiEndpointStore();

  const { user, conectarConta } = useAuthStore();

  const [inputUrl, setInputUrl] = useState(currentEndpoint);
  const [apelidoNoServidor, setApelidoNoServidor] = useState(user?.apelido || "");
  const [senha, setSenha] = useState("");
  const [isConnectingAccount, setIsConnectingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");

  const handleTest = async () => {
    if (!inputUrl.trim()) {
      toast.warning("Informe uma URL antes de testar a conexão.");
      return;
    }
    const res = await testConnection(inputUrl.trim());
    if (res.ok) {
      toast.success(res.message, "Servidor Shiori Acessível");
    } else {
      toast.error(res.message, "Falha na Conexão");
    }
  };

  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");

    const cleanUrl = inputUrl.trim().replace(/\/+$/, "");
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      toast.warning("A URL do endpoint deve iniciar com http:// ou https://");
      return;
    }

    const cleanApelido = apelidoNoServidor.trim();
    if (!cleanApelido) {
      setAccountError("Informe qual apelido sua conta usará neste servidor.");
      return;
    }
    if (!senha || senha.length < 6) {
      setAccountError("Informe sua senha (mínimo 6 caracteres) para autenticar ou vincular sua conta neste servidor.");
      return;
    }

    try {
      setIsConnectingAccount(true);
      saveEndpoint(cleanUrl, false);
      const connectedUser = await conectarConta({
        apelido: cleanApelido,
        senha,
      });
      toast.success(
        `Conectado a ${cleanUrl} como @${connectedUser.apelido}! Sua estante foi sincronizada.`,
        "Servidor e Conta Sincronizados"
      );
      closeModal();
    } catch (err: any) {
      const msg =
        err.message ||
        "Falha ao vincular sua conta neste servidor. Se o apelido já estiver em uso por outra pessoa, escolha um apelido diferente abaixo.";
      setAccountError(msg);
      toast.error(msg, "Conflito ou Falha na Conta");
    } finally {
      setIsConnectingAccount(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    setInputUrl(preset);
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title="Conectar ao Servidor Shiori API"
    >
      <div className={styles.container}>
        <form onSubmit={handleSaveServer} className={styles.form}>
          <p className={styles.welcomeIntro}>
            Conecte sua conta única a um servidor <strong>Shiori API</strong> para acessar o Catálogo Global, o Feed Social e sincronizar sua estante automaticamente.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor="api-endpoint-input" className={styles.label}>
              1. URL da Shiori API
            </label>
            <div className={styles.urlRow}>
              <input
                id="api-endpoint-input"
                type="text"
                className={styles.urlInput}
                placeholder="http://localhost:8080 ou https://hub.shiori.app"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                isLoading={isTesting}
                title="Testar acessibilidade e latência deste endpoint"
              >
                <Activity size={14} />
                <span>Testar</span>
              </Button>
            </div>
          </div>

          <div className={styles.presetsSection}>
            <span className={styles.presetsLabel}>Sugestões rápidas:</span>
            <div className={styles.presetsRow}>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => handlePresetClick("http://localhost:8080")}
              >
                http://localhost:8080 (Dev Local)
              </button>
              {typeof window !== "undefined" && window.location.hostname !== "localhost" && (
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => handlePresetClick(window.location.origin)}
                >
                  {window.location.origin} (Origem Atual)
                </button>
              )}
            </div>
          </div>

          {lastCheckResult && (
            <div
              className={`${styles.resultBox} ${
                lastCheckResult.ok ? styles.resultSuccess : styles.resultError
              }`}
            >
              {lastCheckResult.ok ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{lastCheckResult.message}</span>
            </div>
          )}

          <div
            style={{
              padding: "0.85rem 1rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-primary)" }}>
              2. Seu Apelido e Senha nesta Conexão
            </span>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              Você pode manter seu apelido atual (<strong>@{user?.apelido || "leitor"}</strong>) ou informar outro apelido caso o seu já exista neste servidor.
            </p>

            {accountError && (
              <div
                style={{
                  padding: "0.6rem 0.85rem",
                  background: "var(--accent-rose-glow)",
                  border: "1px solid rgba(244, 63, 94, 0.35)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--accent-rose)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {accountError}
              </div>
            )}

            <Input
              label="Apelido nesta conexão"
              placeholder="Seu apelido no servidor..."
              leadingIcon={<User size={15} />}
              value={apelidoNoServidor}
              onChange={(e) => setApelidoNoServidor(e.target.value)}
              required
            />

            <Input
              label="Senha da sua conta"
              type="password"
              placeholder="Digite sua senha (mín. 6 caracteres)..."
              leadingIcon={<Lock size={15} />}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeModal}
            >
              <span>Cancelar</span>
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isConnectingAccount}>
              <Server size={14} />
              <span>Conectar e Sincronizar Estante</span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
